#!/usr/bin/env node
/**
 * local-airtable-backfill.js
 *
 * Force re-embeds ALL Airtable-backed carriers into Pinecone with full metadata.
 * Runs locally (no Railway timeout constraint). Progress saved to .airtable-backfill-progress.json.
 *
 * Usage:
 *   node --env-file=../.env scripts/local-airtable-backfill.js [--reset]
 *
 * Env vars (in services/ai-intelligence/.env):
 *   AIRTABLE_PAT       — Airtable personal access token
 *   LMDR_INTERNAL_KEY  — Railway auth key
 *   RAILWAY_URL        — Railway service base URL (optional)
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AIRTABLE_BASE  = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE = 'Carriers (Master)';
const AIRTABLE_PAT   = process.env.AIRTABLE_PAT;
const INTERNAL_KEY   = process.env.LMDR_INTERNAL_KEY;
const RAILWAY_URL    = process.env.RAILWAY_URL || 'https://lmdr-ai-intelligence-production.up.railway.app';
const PROGRESS_FILE  = path.join(__dirname, '.airtable-backfill-progress.json');

const CONCURRENT     = 8;    // parallel Railway embed calls
const BATCH_DELAY_MS = 200;  // ms between batches (rate limiting)
const LOG_EVERY      = 500;  // print stats every N carriers

const FIELDS = [
  'DOT_NUMBER', 'LEGAL_NAME', 'CARRIER_OPERATION',
  'PHY_CITY', 'PHY_STATE', 'NBR_POWER_UNIT', 'DRIVER_TOTAL',
  'PAY_CPM', 'TURNOVER_PERCENT', 'ACCIDENT_RATE', 'AVG_TRUCK_AGE',
  'PRIORITY_SCORE',
];

const TODAY = new Date().toISOString().split('T')[0];
const RESET = process.argv.includes('--reset');

// ── Progress ──────────────────────────────────────────────────────────────────

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch { return null; }
}

function saveProgress(offset, stats) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    airtable_offset: offset || null,
    saved_at: new Date().toISOString(),
    stats,
  }, null, 2));
}

// ── Airtable ──────────────────────────────────────────────────────────────────

async function fetchAirtablePage(offset) {
  const params = new URLSearchParams({ pageSize: '100' });
  FIELDS.forEach(f => params.append('fields[]', f));
  if (offset) params.set('offset', offset);

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable fetch failed ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`Airtable error: ${JSON.stringify(data.error)}`);
  return { records: data.records || [], offset: data.offset };
}

// ── Railway embed ─────────────────────────────────────────────────────────────

async function embedCarrier(recordId, f) {
  const profile = {
    dot_number:        String(f.DOT_NUMBER        || ''),
    legal_name:        f.LEGAL_NAME               || 'unknown',
    carrier_operation: f.CARRIER_OPERATION        || 'unknown',
    phy_city:          f.PHY_CITY                 || 'unknown',
    phy_state:         f.PHY_STATE                || 'unknown',
    nbr_power_unit:    Number(f.NBR_POWER_UNIT)   || 0,
    driver_count:      Number(f.DRIVER_TOTAL)      || 0,
    pay_cpm:           Number(f.PAY_CPM)           || 0,
    turnover_pct:      Number(f.TURNOVER_PERCENT)  || 0,
    accident_rate:     Number(f.ACCIDENT_RATE)     || 0,
    avg_truck_age:     Number(f.AVG_TRUCK_AGE)     || 0,
    priority_score:    Number(f.PRIORITY_SCORE)    || 0,
  };

  const res = await fetch(`${RAILWAY_URL}/v1/embed/carrier`, {
    method: 'POST',
    headers: {
      'x-lmdr-internal-key': INTERNAL_KEY,
      'x-lmdr-timestamp':    Date.now().toString(),
      'Content-Type':        'application/json',
    },
    body: JSON.stringify({
      carrierId:        recordId,
      profileUpdatedAt: TODAY,       // fresh date forces re-embed
      profile,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embed ${res.status}: ${body.slice(0, 150)}`);
  }
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!AIRTABLE_PAT)   { console.error('❌  AIRTABLE_PAT not set');       process.exit(1); }
  if (!INTERNAL_KEY)   { console.error('❌  LMDR_INTERNAL_KEY not set');   process.exit(1); }

  const prior     = RESET ? null : loadProgress();
  let offset      = prior?.airtable_offset || null;
  const stats     = prior?.stats ? { ...prior.stats, embedded: 0, skipped: 0, failed: 0 } : { total: 0, embedded: 0, skipped: 0, failed: 0 };
  const startedAt = Date.now();

  console.log(`\n📦  Airtable → Pinecone Full Backfill`);
  console.log(`   Railway  : ${RAILWAY_URL}`);
  console.log(`   Resuming : ${offset ? offset.slice(0, 20) + '...' : '(from beginning)'}`);
  console.log(`   Mode     : force re-embed (profileUpdatedAt=${TODAY})\n`);

  let page = 0;

  while (true) {
    let records, nextOffset;

    try {
      ({ records, offset: nextOffset } = await fetchAirtablePage(offset));
    } catch (err) {
      console.error(`\n❌  Airtable page error: ${err.message}`);
      saveProgress(offset, stats);
      process.exit(1);
    }

    if (records.length === 0) {
      console.log('\n✅  Airtable exhausted — all carriers processed.');
      break;
    }

    page++;

    // Embed in parallel batches
    for (let i = 0; i < records.length; i += CONCURRENT) {
      const chunk = records.slice(i, i + CONCURRENT);

      await Promise.all(chunk.map(async (rec) => {
        stats.total++;
        try {
          const result = await embedCarrier(rec.id, rec.fields);
          if (result?.status === 'skipped') {
            stats.skipped++;
          } else {
            stats.embedded++;
          }
        } catch (err) {
          stats.failed++;
          if (stats.failed <= 3) console.error(`  ❌  ${rec.id}: ${err.message}`);
        }
      }));

      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }

    offset = nextOffset;

    // Progress log
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
    const rate    = (stats.embedded / (elapsed || 1)).toFixed(1);
    if (page % 5 === 0 || !nextOffset) {
      console.log(`  📊  page ${page} | total:${stats.total} embedded:${stats.embedded} skip:${stats.skipped} fail:${stats.failed} | ${rate}/s | ${elapsed}s elapsed`);
      saveProgress(offset, stats);
    }

    if (!nextOffset) {
      console.log('\n✅  All pages complete.');
      break;
    }
  }

  saveProgress(null, stats);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n🏁  Backfill complete in ${elapsed}s`);
  console.log(`   Total checked : ${stats.total}`);
  console.log(`   Re-embedded   : ${stats.embedded}`);
  console.log(`   Skipped       : ${stats.skipped}`);
  console.log(`   Failed        : ${stats.failed}`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
