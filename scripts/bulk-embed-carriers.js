#!/usr/bin/env node
/**
 * bulk-embed-carriers.js
 *
 * Bulk-embeds all carriers from Airtable Carriers (Master) directly into
 * the Pinecone lmdr-carriers index via the Railway AI microservice.
 * Completely bypasses Wix — no execution timeouts, full progress visibility.
 *
 * Usage:
 *   node --env-file=services/ai-intelligence/.env scripts/bulk-embed-carriers.js
 *
 * Required env vars (add to services/ai-intelligence/.env):
 *   AIRTABLE_PAT       — Airtable personal access token (patXXXXX...)
 *   LMDR_INTERNAL_KEY  — Railway microservice auth key
 *
 * Optional env vars:
 *   RAILWAY_URL        — defaults to production Railway URL
 *   AIRTABLE_BASE_ID   — defaults to app9N1YCJ3gdhExA0
 *   START_OFFSET       — Airtable offset token to resume a partial run
 *   DRY_RUN            — set to "true" to fetch and log without embedding
 */

const RAILWAY_URL    = process.env.RAILWAY_URL        || 'https://lmdr-ai-intelligence-production.up.railway.app';
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID   || 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE = 'Carriers (Master)';
const AIRTABLE_PAT   = process.env.AIRTABLE_PAT;
const INTERNAL_KEY   = process.env.LMDR_INTERNAL_KEY;
const DRY_RUN        = process.env.DRY_RUN === 'true';

const CHUNK_SIZE     = 5;
const CHUNK_DELAY_MS = 600;
const PAGE_SIZE      = 100;
const TODAY          = new Date().toISOString().split('T')[0];

// ── Validation ────────────────────────────────────────────────────────────────

if (!AIRTABLE_PAT) {
  console.error('ERROR: AIRTABLE_PAT is required. Add it to services/ai-intelligence/.env');
  process.exit(1);
}
if (!INTERNAL_KEY) {
  console.error('ERROR: LMDR_INTERNAL_KEY is required.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Airtable fetcher ──────────────────────────────────────────────────────────

async function fetchPage(offset) {
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`);
  url.searchParams.set('pageSize', PAGE_SIZE);
  if (offset) url.searchParams.set('offset', offset);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable fetch failed ${res.status}: ${body}`);
  }

  return res.json(); // { records: [...], offset?: string }
}

// ── Railway embed call ────────────────────────────────────────────────────────

async function embedCarrier(record) {
  const f = record.fields;

  const profile = {
    dot_number:     f.DOT_NUMBER      || 0,
    legal_name:     f.LEGAL_NAME      || 'unknown',
    operation_type: f.CARRIER_OPERATION || 'unknown',
    state:          f.PHY_STATE       || 'unknown',
    city:           f.PHY_CITY        || 'unknown',
    fleet_size:     f.NBR_POWER_UNIT  || 0,
    driver_count:   f.DRIVER_TOTAL    || 0,
    pay_cpm:        f.PAY_CPM         || 0,
    turnover_pct:   f.TURNOVER_PERCENT ?? 0,
    accident_rate:  f.ACCIDENT_RATE   ?? 0,
    avg_truck_age:  f.AVG_TRUCK_AGE   ?? 0,
    priority_score: f.PRIORITY_SCORE  || 0,
  };

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would embed ${record.id} — ${f.LEGAL_NAME} (DOT ${f.DOT_NUMBER})`);
    return { status: 'dry_run' };
  }

  const res = await fetch(`${RAILWAY_URL}/v1/embed/carrier`, {
    method: 'POST',
    headers: {
      'x-lmdr-internal-key': INTERNAL_KEY,
      'x-lmdr-timestamp':    Date.now().toString(),
      'Content-Type':        'application/json',
    },
    body: JSON.stringify({
      carrierId:        record.id,
      profileUpdatedAt: TODAY,
      profile,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚛 LMDR Carrier Bulk Embed`);
  console.log(`   Railway:  ${RAILWAY_URL}`);
  console.log(`   Base:     ${AIRTABLE_BASE} / ${AIRTABLE_TABLE}`);
  console.log(`   Date:     ${TODAY}`);
  console.log(`   Dry run:  ${DRY_RUN}`);
  console.log('');

  const stats = { processed: 0, skipped: 0, failed: 0, errors: [] };
  let pageNum   = 0;
  let nextOffset = process.env.START_OFFSET || undefined;

  do {
    pageNum++;
    process.stdout.write(`Fetching page ${pageNum}...`);

    let page;
    try {
      page = await fetchPage(nextOffset);
    } catch (err) {
      console.error(`\nFATAL: ${err.message}`);
      break;
    }

    const records = page.records || [];
    nextOffset = page.offset;
    console.log(` ${records.length} records (total so far: ${stats.processed + records.length})`);

    if (process.env.START_OFFSET && pageNum === 1) {
      console.log(`  Resuming from offset: ${process.env.START_OFFSET}`);
    }

    const chunks = chunk(records, CHUNK_SIZE);

    for (const batch of chunks) {
      const results = await Promise.all(batch.map(async (record) => {
        try {
          const result = await embedCarrier(record);
          if (result.status === 'skipped') {
            stats.skipped++;
          } else {
            stats.processed++;
          }
          return { ok: true, id: record.id, status: result.status };
        } catch (err) {
          stats.failed++;
          stats.errors.push({ id: record.id, name: record.fields.LEGAL_NAME, error: err.message });
          return { ok: false, id: record.id };
        }
      }));

      const failed = results.filter(r => !r.ok);
      if (failed.length) {
        console.log(`  ⚠ ${failed.length} failed in batch`);
      }

      await sleep(CHUNK_DELAY_MS);
    }

    // Progress line after each Airtable page
    console.log(`  → embedded: ${stats.processed} | skipped: ${stats.skipped} | failed: ${stats.failed}`);
    if (nextOffset) {
      console.log(`  → next offset: ${nextOffset}`);
    }

  } while (nextOffset);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────');
  console.log('✅ Bulk embed complete');
  console.log(`   Processed : ${stats.processed}`);
  console.log(`   Skipped   : ${stats.skipped} (already current)`);
  console.log(`   Failed    : ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log('\nFailed records (first 20):');
    stats.errors.slice(0, 20).forEach(e => {
      console.log(`  ${e.id} (${e.name}): ${e.error}`);
    });
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
