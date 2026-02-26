#!/usr/bin/env node
/**
 * local-legacy-drivers-embed.js
 *
 * Imports all 3,394 legacy driver leads from Airtable → Pinecone lmdr-drivers index.
 * These are drivers with only name/email/phone — no CDL profile yet.
 *
 * They become searchable by recruiters with driver_type='legacy' metadata so
 * recruiters can initiate outreach. When a legacy driver re-engages and fills
 * the full application, their v2_Driver Profiles record is created/enriched
 * and their Pinecone vector is updated with full data.
 *
 * Usage:
 *   node --env-file=../.env scripts/local-legacy-drivers-embed.js [--reset]
 *
 * Env vars (services/ai-intelligence/.env):
 *   AIRTABLE_PAT       — Airtable personal access token
 *   LMDR_INTERNAL_KEY  — Railway auth key
 *   RAILWAY_URL        — Railway base URL (optional)
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AIRTABLE_BASE  = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE = 'Legacy Driver Leads';
const AIRTABLE_PAT   = process.env.AIRTABLE_PAT;
const INTERNAL_KEY   = process.env.LMDR_INTERNAL_KEY;
const RAILWAY_URL    = process.env.RAILWAY_URL || 'https://lmdr-ai-intelligence-production.up.railway.app';
const PROGRESS_FILE  = path.join(__dirname, '.legacy-drivers-progress.json');

const CONCURRENT     = 8;
const BATCH_DELAY_MS = 200;
const TODAY          = new Date().toISOString().split('T')[0];
const RESET          = process.argv.includes('--reset');

const FIELDS = ['First Name', 'Last Name', 'Email 1', 'Formatted Phone Number 1'];

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

async function fetchPage(offset) {
  const params = new URLSearchParams({ pageSize: '100' });
  FIELDS.forEach(f => params.append('fields[]', f));
  if (offset) params.set('offset', offset);

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable fetch failed ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`Airtable error: ${JSON.stringify(data.error)}`);
  return { records: data.records || [], offset: data.offset };
}

// ── Railway embed ─────────────────────────────────────────────────────────────

async function embedLegacyDriver(recordId, f) {
  const firstName = f['First Name']  || '';
  const lastName  = f['Last Name']   || '';
  const email     = f['Email 1']     || '';
  const phone     = f['Formatted Phone Number 1'] || '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ');

  // Minimal bio so the embedding isn't completely generic
  const bio = `CDL driver lead. ${fullName ? `Name: ${fullName}.` : ''} Seeking trucking opportunities. Available for outreach and re-engagement.`;

  const profile = {
    driver_type:  'legacy',
    first_name:   firstName,
    last_name:    lastName,
    email,
    phone,
    bio,
    // No CDL class / state / experience — will embed as generic driver lead
    is_discoverable: 'Yes',
  };

  const res = await fetch(`${RAILWAY_URL}/v1/embed/driver`, {
    method: 'POST',
    headers: {
      'x-lmdr-internal-key': INTERNAL_KEY,
      'x-lmdr-timestamp':    Date.now().toString(),
      'Content-Type':        'application/json',
    },
    body: JSON.stringify({
      driverId:        recordId,
      profileUpdatedAt: TODAY,
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
  if (!AIRTABLE_PAT) { console.error('❌  AIRTABLE_PAT not set'); process.exit(1); }
  if (!INTERNAL_KEY) { console.error('❌  LMDR_INTERNAL_KEY not set'); process.exit(1); }

  const prior  = RESET ? null : loadProgress();
  let offset   = prior?.airtable_offset || null;
  const stats  = { total: 0, embedded: 0, skipped: 0, failed: 0 };
  const startedAt = Date.now();

  console.log(`\n👤  Legacy Driver Leads → Pinecone`);
  console.log(`   Railway  : ${RAILWAY_URL}`);
  console.log(`   Resuming : ${offset ? offset.slice(0, 20) + '...' : '(from beginning)'}`);
  console.log(`   Total    : ~3,394 legacy drivers\n`);

  let page = 0;

  while (true) {
    let records, nextOffset;

    try {
      ({ records, offset: nextOffset } = await fetchPage(offset));
    } catch (err) {
      console.error(`\n❌  Airtable error: ${err.message}`);
      saveProgress(offset, stats);
      process.exit(1);
    }

    if (records.length === 0) {
      console.log('\n✅  All legacy drivers processed.');
      break;
    }

    page++;

    for (let i = 0; i < records.length; i += CONCURRENT) {
      const chunk = records.slice(i, i + CONCURRENT);

      await Promise.all(chunk.map(async (rec) => {
        stats.total++;
        try {
          const result = await embedLegacyDriver(rec.id, rec.fields);
          if (result?.status === 'skipped') {
            stats.skipped++;
          } else {
            stats.embedded++;
            if (stats.embedded <= 5 || stats.embedded % 500 === 0) {
              const name = [rec.fields['First Name'], rec.fields['Last Name']].filter(Boolean).join(' ');
              console.log(`  ✅  ${rec.id} — ${name || '(no name)'}`);
            }
          }
        } catch (err) {
          stats.failed++;
          if (stats.failed <= 3) console.error(`  ❌  ${rec.id}: ${err.message}`);
        }
      }));

      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }

    offset = nextOffset;

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
    if (page % 5 === 0 || !nextOffset) {
      console.log(`  📊  page ${page} | total:${stats.total} embedded:${stats.embedded} skip:${stats.skipped} fail:${stats.failed} | ${elapsed}s elapsed`);
      saveProgress(offset, stats);
    }

    if (!nextOffset) break;
  }

  saveProgress(null, stats);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n🏁  Legacy driver import complete in ${elapsed}s`);
  console.log(`   Total    : ${stats.total}`);
  console.log(`   Embedded : ${stats.embedded}`);
  console.log(`   Skipped  : ${stats.skipped}`);
  console.log(`   Failed   : ${stats.failed}`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
