#!/usr/bin/env node
/**
 * local-mass-embed.js
 *
 * Runs on your LOCAL machine (residential IP bypasses FMCSA cloud blocks).
 * Scans FMCSA QC API for active carriers in a DOT range, then ships each
 * valid carrier to Railway /v1/embed/carrier to embed into Pinecone.
 *
 * Usage:
 *   node --env-file=../.env scripts/local-mass-embed.js [dot_start] [dot_end]
 *
 * Examples:
 *   node --env-file=../.env scripts/local-mass-embed.js 133000 135000
 *   node --env-file=../.env scripts/local-mass-embed.js 4270000 4280000
 *
 * Env vars required (in services/ai-intelligence/.env):
 *   FMCSA_WEB_KEY      — FMCSA QC API web key
 *   LMDR_INTERNAL_KEY  — Railway auth key
 *   RAILWAY_URL        — Railway service base URL (optional, has default)
 *
 * Progress is saved to ./scripts/.mass-embed-progress.json so you can
 * resume interrupted runs.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const FMCSA_KEY      = process.env.FMCSA_WEB_KEY;
const INTERNAL_KEY   = process.env.LMDR_INTERNAL_KEY;
const RAILWAY_URL    = process.env.RAILWAY_URL || 'https://lmdr-ai-intelligence-production.up.railway.app';
const PROGRESS_FILE  = path.join(__dirname, '.mass-embed-progress.json');

const FMCSA_RATE_MS  = 200;   // 5 req/sec — local IP can handle more
const CONCURRENT     = 5;     // parallel FMCSA calls per batch
const LOG_EVERY      = 50;    // print stats every N DOTs

// ── Args ──────────────────────────────────────────────────────────────────────

const [,, argStart, argEnd] = process.argv;
const DOT_START = Number(argStart) || loadProgress()?.next_dot || 1;
const DOT_END   = Number(argEnd)   || DOT_START + 10_000;

// ── Progress ──────────────────────────────────────────────────────────────────

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch { return null; }
}

function saveProgress(nextDot, stats) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ next_dot: nextDot, saved_at: new Date().toISOString(), stats }, null, 2));
}

// ── FMCSA ─────────────────────────────────────────────────────────────────────

async function fetchFmcsa(dot) {
  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dot}?webKey=${FMCSA_KEY}`;
  const res  = await fetch(url);

  if (res.status === 404) return null;
  if (res.status === 403) {
    // From local IP, 403 = restricted carrier (investigation hold)
    // From cloud IP, 403 = IP blocked — shouldn't happen locally
    return null;
  }
  if (!res.ok) throw new Error(`FMCSA ${res.status} for DOT ${dot}`);

  const data = await res.json();

  if (typeof data?.content === 'string') {
    if (data.content.toLowerCase().includes('webkey')) {
      throw new Error('FMCSA_WEB_KEY is invalid — check your .env file');
    }
    return null;
  }

  return data?.content?.carrier || data?.carrier || null;
}

// ── Embed via Railway ─────────────────────────────────────────────────────────

async function embedCarrier(dot, fmcsa) {
  const profile = {
    dot_number:     dot,
    legal_name:     fmcsa.legalName        || fmcsa.legal_name        || 'unknown',
    carrier_operation: fmcsa.carrierOperation || fmcsa.carrier_operation || 'unknown',
    nbr_power_unit: fmcsa.nbrPowerUnit  != null ? Number(fmcsa.nbrPowerUnit)  :
                    fmcsa.nbr_power_unit!= null ? Number(fmcsa.nbr_power_unit) : 0,
    total_drivers:  fmcsa.totalDrivers  != null ? Number(fmcsa.totalDrivers)  :
                    fmcsa.total_drivers != null ? Number(fmcsa.total_drivers)  : 0,
    safety_rating:  fmcsa.safetyRating     || fmcsa.safety_rating     || 'unknown',
    phy_state:      fmcsa.phyState         || fmcsa.phy_state         || 'unknown',
    phy_city:       fmcsa.phyCity          || fmcsa.phy_city          || 'unknown',
  };

  const res = await fetch(`${RAILWAY_URL}/v1/embed/carrier`, {
    method:  'POST',
    headers: {
      'x-lmdr-internal-key': INTERNAL_KEY,
      'x-lmdr-timestamp':    Date.now().toString(),
      'Content-Type':        'application/json',
    },
    body: JSON.stringify({
      carrierId:        `dot:${dot}`,
      dot_number:       String(dot),
      profileUpdatedAt: new Date().toISOString().split('T')[0],
      profile,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embed failed ${res.status}: ${body.slice(0, 120)}`);
  }

  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!FMCSA_KEY)    { console.error('❌  FMCSA_WEB_KEY not set'); process.exit(1); }
  if (!INTERNAL_KEY) { console.error('❌  LMDR_INTERNAL_KEY not set'); process.exit(1); }

  const stats = { scanned: 0, found: 0, embedded: 0, skipped: 0, failed: 0 };
  const startedAt = Date.now();

  console.log(`\n🚛  FMCSA Mass Embed — Local Runner`);
  console.log(`   DOT range : ${DOT_START.toLocaleString()} → ${DOT_END.toLocaleString()} (${(DOT_END - DOT_START + 1).toLocaleString()} DOTs)`);
  console.log(`   Railway   : ${RAILWAY_URL}`);
  console.log(`   Rate      : ${CONCURRENT} parallel × ${1000 / FMCSA_RATE_MS}/sec\n`);

  for (let dot = DOT_START; dot <= DOT_END; dot += CONCURRENT) {
    const batch = [];
    for (let i = 0; i < CONCURRENT && dot + i <= DOT_END; i++) {
      batch.push(dot + i);
    }

    await Promise.all(batch.map(async (d) => {
      stats.scanned++;
      try {
        const fmcsa = await fetchFmcsa(d);
        if (!fmcsa) return;

        stats.found++;

        const result = await embedCarrier(d, fmcsa);
        if (result?.status === 'skipped') {
          stats.skipped++;
        } else {
          stats.embedded++;
          const name = fmcsa.legalName || fmcsa.legal_name || '?';
          const state = fmcsa.phyState || fmcsa.phy_state || '?';
          console.log(`  ✓ DOT ${d} — ${name} (${state})`);
        }
      } catch (err) {
        stats.failed++;
        console.error(`  ✗ DOT ${d}: ${err.message}`);
        if (err.message.includes('FMCSA_WEB_KEY')) process.exit(1); // fatal
      }
    }));

    if (stats.scanned % LOG_EVERY === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      const rate    = (stats.scanned / elapsed).toFixed(1);
      console.log(`  📊 ${stats.scanned.toLocaleString()} scanned | ${stats.embedded} embedded | ${stats.failed} failed | ${rate} DOTs/sec`);
      saveProgress(dot + CONCURRENT, stats);
    }

    if (dot + CONCURRENT <= DOT_END) {
      await new Promise(r => setTimeout(r, FMCSA_RATE_MS));
    }
  }

  // Final save
  saveProgress(DOT_END + 1, stats);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n✅  Done in ${elapsed}s`);
  console.log(`   Scanned  : ${stats.scanned.toLocaleString()}`);
  console.log(`   Found    : ${stats.found}`);
  console.log(`   Embedded : ${stats.embedded}`);
  console.log(`   Skipped  : ${stats.skipped} (already current)`);
  console.log(`   Failed   : ${stats.failed}`);
  console.log(`   Next DOT : ${DOT_END + 1} (run: node scripts/local-mass-embed.js ${DOT_END + 1} ${DOT_END + 1 + (DOT_END - DOT_START)})\n`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
