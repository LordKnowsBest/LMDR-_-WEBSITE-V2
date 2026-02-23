#!/usr/bin/env node
/**
 * bulk-embed-drivers.js
 *
 * Bulk-embeds drivers from three Airtable tables into the Pinecone lmdr-drivers
 * index via the Railway AI microservice. Bypasses Wix entirely.
 *
 * Tables processed (in order):
 *   1. v2_Driver Profiles  — active V2 platform drivers
 *   2. Applications        — job application form submissions
 *   3. Scored Drivers      — pre-scored applicants
 *
 * Usage:
 *   node --env-file=services/ai-intelligence/.env scripts/bulk-embed-drivers.js
 *
 * Required env vars:
 *   AIRTABLE_PAT       — Airtable personal access token
 *   LMDR_INTERNAL_KEY  — Railway microservice auth key
 *
 * Optional env vars:
 *   RAILWAY_URL        — defaults to production Railway URL
 *   AIRTABLE_BASE_ID   — defaults to app9N1YCJ3gdhExA0
 *   DRY_RUN            — set to "true" to fetch and log without embedding
 */

const RAILWAY_URL   = process.env.RAILWAY_URL      || 'https://lmdr-ai-intelligence-production.up.railway.app';
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'app9N1YCJ3gdhExA0';
const AIRTABLE_PAT  = process.env.AIRTABLE_PAT;
const INTERNAL_KEY  = process.env.LMDR_INTERNAL_KEY;
const DRY_RUN       = process.env.DRY_RUN === 'true';

const CHUNK_SIZE     = 5;
const CHUNK_DELAY_MS = 600;
const PAGE_SIZE      = 100;
const TODAY          = new Date().toISOString().split('T')[0];

// ── Validation ────────────────────────────────────────────────────────────────

if (!AIRTABLE_PAT) {
  console.error('ERROR: AIRTABLE_PAT is required.');
  process.exit(1);
}
if (!INTERNAL_KEY) {
  console.error('ERROR: LMDR_INTERNAL_KEY is required.');
  process.exit(1);
}

// ── Field normalizers ─────────────────────────────────────────────────────────

/** "Class A" / "cdl_a" / "A" → "A" */
function normalizeCdlClass(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s.includes('A')) return 'A';
  if (s.includes('B')) return 'B';
  if (s.includes('C')) return 'C';
  return null;
}

/** "More than 10 years" / "5-9 years" / numeric → integer */
function normalizeExperience(raw) {
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const s = String(raw).toLowerCase();
  if (s.includes('10') || s.includes('more than 10')) return 10;
  if (s.includes('5') || s.includes('5-9')) return 7;
  if (s.includes('3') || s.includes('less') || s.includes('3 year')) return 2;
  if (s.includes('1') || s.includes('1-4')) return 2;
  if (s.includes('less than 1') || s.includes('under')) return 0;
  const n = parseInt(s);
  return isNaN(n) ? 0 : n;
}

/** Combine route type fields into a comma-separated string */
function normalizeHaulTypes(...routeFields) {
  const seen = new Set();
  const out = [];
  for (const f of routeFields) {
    if (!f) continue;
    const items = Array.isArray(f) ? f : [f];
    for (const item of items) {
      const v = String(item).trim();
      if (v && !seen.has(v)) { seen.add(v); out.push(v); }
    }
  }
  return out.length ? out.join(', ') : null;
}

/** State: "Texas" → "TX" (also handles abbreviations already) */
const STATE_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
  'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
  'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
  'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM',
  'New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
  'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
};
function normalizeState(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.length === 2) return s.toUpperCase();
  return STATE_ABBR[s] || s;
}

// ── Profile builders per table ────────────────────────────────────────────────

function profileFromV2(f) {
  return {
    cdl_class:        normalizeCdlClass(f['CDL Class']),
    home_state:       normalizeState(f['Home State'] || f['State']),
    experience_years: normalizeExperience(f['Years Experience'] || f['years_experience']),
    endorsements:     f['Endorsements'] || null,
    haul_types:       f['Preferred Operation Type'] || null,
    pay_min:          f['Min CPM'] || null,
    is_discoverable:  f['Is Discoverable'] || 'No',
    bio:              f['Bio'] || null,
  };
}

function profileFromApplication(f) {
  return {
    cdl_class:        normalizeCdlClass(f['CDL Class']),
    home_state:       normalizeState(f['State of Issue']),
    experience_years: normalizeExperience(f['Years of Experience']),
    endorsements:     f['Endorsements?'] !== 'None' ? f['Endorsements?'] : null,
    haul_types:       normalizeHaulTypes(
                        f['Route Types - First Option'],
                        f['Route Types - Second Option'],
                        f['Route Types - Third Option']
                      ),
    pay_min:          null,
    is_discoverable:  'Yes',
    bio:              null,
  };
}

function profileFromScored(f) {
  return {
    cdl_class:        normalizeCdlClass(f['cdl_class']),
    home_state:       normalizeState(f['State of Issue']),
    experience_years: normalizeExperience(f['years_experience']),
    endorsements:     f['endorsements'] !== 'None' ? f['endorsements'] : null,
    haul_types:       normalizeHaulTypes(
                        f['Route Types - First Option'],
                        f['Route Types - Second Option'],
                        f['Route Types - Third Option']
                      ),
    pay_min:          null,
    is_discoverable:  'Yes',
    bio:              null,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Airtable fetcher ──────────────────────────────────────────────────────────

async function fetchPage(table, offset) {
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`);
  url.searchParams.set('pageSize', PAGE_SIZE);
  if (offset) url.searchParams.set('offset', offset);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable fetch failed ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Railway embed ─────────────────────────────────────────────────────────────

async function embedDriver(record, profile) {
  if (DRY_RUN) {
    const name = record.fields['Display Name'] || record.fields['First Name'] || record.id;
    console.log(`  [DRY RUN] Would embed ${record.id} — ${name}`);
    return { status: 'dry_run' };
  }

  const res = await fetch(`${RAILWAY_URL}/v1/embed/driver`, {
    method: 'POST',
    headers: {
      'x-lmdr-internal-key': INTERNAL_KEY,
      'x-lmdr-timestamp':    Date.now().toString(),
      'Content-Type':        'application/json',
    },
    body: JSON.stringify({
      driverId:         record.id,
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

// ── Per-table processor ───────────────────────────────────────────────────────

async function processTable(tableName, profileBuilder, stats) {
  console.log(`\n📋 Table: ${tableName}`);
  let pageNum = 0;
  let nextOffset;

  do {
    pageNum++;
    process.stdout.write(`  Fetching page ${pageNum}...`);

    let page;
    try {
      page = await fetchPage(tableName, nextOffset);
    } catch (err) {
      console.error(`\n  FATAL: ${err.message}`);
      break;
    }

    const records = page.records || [];
    nextOffset = page.offset;
    console.log(` ${records.length} records`);

    const chunks = chunk(records, CHUNK_SIZE);
    for (const batch of chunks) {
      await Promise.all(batch.map(async (record) => {
        try {
          const profile = profileBuilder(record.fields);
          const result  = await embedDriver(record, profile);
          if (result.status === 'skipped') stats.skipped++;
          else stats.processed++;
        } catch (err) {
          stats.failed++;
          const name = record.fields['Display Name'] || record.fields['First Name'] || record.id;
          stats.errors.push({ id: record.id, name, error: err.message });
        }
      }));
      await sleep(CHUNK_DELAY_MS);
    }

    console.log(`  → embedded: ${stats.processed} | skipped: ${stats.skipped} | failed: ${stats.failed}`);
  } while (nextOffset);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚛 LMDR Driver Bulk Embed`);
  console.log(`   Railway: ${RAILWAY_URL}`);
  console.log(`   Base:    ${AIRTABLE_BASE}`);
  console.log(`   Date:    ${TODAY}`);
  console.log(`   Dry run: ${DRY_RUN}`);

  const stats = { processed: 0, skipped: 0, failed: 0, errors: [] };

  await processTable('v2_Driver Profiles', profileFromV2,          stats);
  await processTable('Applications',       profileFromApplication,  stats);
  await processTable('Scored Drivers',     profileFromScored,       stats);
  await processTable('Quick APP- JOTFORM', profileFromApplication,  stats); // same field structure as Applications

  console.log('\n─────────────────────────────────');
  console.log('✅ Driver bulk embed complete');
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
