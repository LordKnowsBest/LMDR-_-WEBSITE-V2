/**
 * POST /v1/jobs/fmcsa-mass-embed
 *
 * Backfills Airtable carriers that are missing from Pinecone.
 *
 * Strategy:
 *   1. Page through Carriers (Master) in Airtable (up to PAGE_LIMIT records per run).
 *   2. For each carrier batch, fetch their Pinecone vectors in bulk.
 *   3. Any carrier whose Airtable record ID is NOT in Pinecone gets embedded.
 *   4. Embedding calls go to /v1/embed/carrier (Voyage + Pinecone upsert handled there).
 *   5. Save the last Airtable offset token to a Pinecone progress sentinel so runs
 *      can continue where they left off.
 *
 * Why not call FMCSA directly?
 *   Railway's cloud IP is blocked by the FMCSA QC API (HTTP 403 for all DOTs).
 *   This job only needs Airtable → Pinecone — no FMCSA calls required.
 *
 * Vector IDs:
 *   Airtable-backed carriers — Airtable record ID (recXXXXX)   ← this job
 *   FMCSA mass-embedded      — `dot:{dotNumber}`                ← local-mass-embed.js
 *
 * Progress:
 *   Pinecone sentinel ID: `airtable-backfill:progress`
 *   metadata.offset — Airtable pagination offset token (empty string = start over)
 *
 * Throughput:
 *   100 records/page × BATCH_SIZE=10 parallel embeds → ~10–15 sec per page.
 *   PAGE_LIMIT = 3 pages per invocation = 300 carriers per cron run.
 *   Daily cron covers ~300/day; trigger manually with higher page_limit for bulk runs.
 *
 * Override via POST body:
 *   { page_limit, batch_size, reset_progress }
 */

import { Hono } from 'hono';
import { fetchVector, upsertVector } from '../lib/pinecone.js';
import { EMBEDDING_DIMENSION }        from '../lib/embeddings.js';

export const fmcsaMassEmbedRouter = new Hono();

// ── Constants ──────────────────────────────────────────────────────────────────

const AIRTABLE_BASE  = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE = 'Carriers (Master)';
const AIRTABLE_PAGE  = 100;   // records per Airtable page (max 100)

const DEFAULT_PAGE_LIMIT  = 3;    // Airtable pages per invocation
const DEFAULT_BATCH_SIZE  = 10;   // parallel embed calls per mini-batch
const EMBED_DELAY_MS      = 150;  // delay between mini-batches (ms)
const EMBED_TIMEOUT_MS    = 12_000;

const PROGRESS_ID = 'airtable-backfill:progress';

// Sentinel vector: unit vector in dim-0 (valid for cosine; won't collide with real embeddings)
const SENTINEL_VECTOR = Array.from({ length: EMBEDDING_DIMENSION }, (_, i) => (i === 0 ? 1.0 : 0.0));

// ── Airtable helpers ───────────────────────────────────────────────────────────

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

/**
 * Fetch one page of carriers from Airtable.
 * Returns { records, offset } where offset is undefined when exhausted.
 */
async function fetchAirtablePage(offset) {
  const fields = ['DOT_NUMBER', 'LEGAL_NAME', 'CARRIER_OPERATION', 'NBR_POWER_UNIT',
                  'TOTAL_DRIVERS', 'SAFETY_RATING', 'PHY_STATE', 'PHY_CITY'];

  const params = new URLSearchParams({ pageSize: String(AIRTABLE_PAGE) });
  fields.forEach(f => params.append('fields[]', f));
  if (offset) params.set('offset', offset);

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: airtableHeaders() });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable page fetch failed ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return { records: data.records || [], offset: data.offset };
}

// ── Progress helpers ───────────────────────────────────────────────────────────

async function getProgress() {
  try {
    const vec = await fetchVector('carriers', PROGRESS_ID);
    return vec?.metadata?.offset ?? '';   // '' = start from beginning
  } catch {
    return '';
  }
}

async function saveProgress(offset) {
  try {
    await upsertVector('carriers', PROGRESS_ID, SENTINEL_VECTOR, {
      offset:     offset || '',
      updated_at: new Date().toISOString(),
      source:     'airtable-backfill',
    });
  } catch (err) {
    console.warn(`[fmcsa-mass-embed] Progress save failed: ${err.message}`);
  }
}

// ── Pinecone batch-fetch ───────────────────────────────────────────────────────

/**
 * Fetch up to 1000 vectors by ID to check existence.
 * Returns a Set of IDs that ARE present in Pinecone.
 */
async function fetchExistingIds(ids) {
  if (ids.length === 0) return new Set();

  const host = 'https://lmdr-carriers-hmmwwf9.svc.aped-4627-b74a.pinecone.io';
  const qs = ids.map(id => `ids=${encodeURIComponent(id)}`).join('&');
  const res = await fetch(`${host}/vectors/fetch?${qs}`, {
    headers: {
      'Api-Key':      process.env.PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    // Non-fatal — fall back to embedding all (idempotent upsert)
    console.warn(`[fmcsa-mass-embed] Pinecone batch-fetch failed ${res.status} — will embed all`);
    return new Set();
  }

  const data = await res.json();
  return new Set(Object.keys(data.vectors || {}));
}

// ── Embed single carrier ───────────────────────────────────────────────────────

async function embedCarrier(recordId, fields) {
  const url = process.env.RAILWAY_URL
    ? `${process.env.RAILWAY_URL}/v1/embed/carrier`
    : 'http://localhost:3000/v1/embed/carrier';

  const profile = {
    dot_number:        String(fields.DOT_NUMBER        || ''),
    legal_name:        fields.LEGAL_NAME               || 'unknown',
    carrier_operation: fields.CARRIER_OPERATION        || 'unknown',
    nbr_power_unit:    Number(fields.NBR_POWER_UNIT)   || 0,
    total_drivers:     Number(fields.TOTAL_DRIVERS)    || 0,
    safety_rating:     fields.SAFETY_RATING            || 'unknown',
    phy_state:         fields.PHY_STATE                || 'unknown',
    phy_city:          fields.PHY_CITY                 || 'unknown',
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'x-lmdr-internal-key': process.env.LMDR_INTERNAL_KEY,
        'x-lmdr-timestamp':    Date.now().toString(),
        'Content-Type':        'application/json',
      },
      body: JSON.stringify({
        carrierId:        recordId,
        dot_number:       profile.dot_number,
        profileUpdatedAt: new Date().toISOString().split('T')[0],
        profile,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Embed ${res.status}: ${body.slice(0, 120)}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────

fmcsaMassEmbedRouter.post('/', async (c) => {
  const startedAt = new Date().toISOString();

  let body = {};
  try { body = await c.req.json(); } catch { /* no body is fine */ }

  const pageLimit     = Math.min(Number(body.page_limit)  || DEFAULT_PAGE_LIMIT,  50);
  const batchSize     = Math.min(Number(body.batch_size)  || DEFAULT_BATCH_SIZE,  20);
  const resetProgress = Boolean(body.reset_progress);

  const stats = { pages: 0, checked: 0, already_embedded: 0, embedded: 0, failed: 0 };
  const errors = [];

  // Determine pagination start
  let offset = resetProgress ? '' : await getProgress();
  const startOffset = offset;

  console.log(`[fmcsa-mass-embed] Starting backfill — page_limit=${pageLimit} batch_size=${batchSize} offset=${offset || '(start)'}`);

  let exhausted = false;

  for (let page = 0; page < pageLimit; page++) {
    let records, nextOffset;

    try {
      ({ records, offset: nextOffset } = await fetchAirtablePage(offset || undefined));
    } catch (err) {
      console.error(`[fmcsa-mass-embed] Airtable page error: ${err.message}`);
      errors.push(`Page ${page}: ${err.message}`);
      break;
    }

    if (records.length === 0) {
      exhausted = true;
      break;
    }

    stats.pages++;
    stats.checked += records.length;

    // Bulk-check which IDs are already in Pinecone
    const recordIds = records.map(r => r.id);
    const existing  = await fetchExistingIds(recordIds);
    stats.already_embedded += existing.size;

    const missing = records.filter(r => !existing.has(r.id));

    // Process missing in mini-batches
    for (let i = 0; i < missing.length; i += batchSize) {
      const chunk = missing.slice(i, i + batchSize);

      await Promise.all(chunk.map(async (record) => {
        try {
          const result = await embedCarrier(record.id, record.fields);
          if (result?.status === 'skipped') {
            stats.already_embedded++;
          } else {
            stats.embedded++;
            const name = record.fields.LEGAL_NAME || record.id;
            const state = record.fields.PHY_STATE || '?';
            console.log(`[fmcsa-mass-embed] ✓ ${record.id} — ${name} (${state})`);
          }
        } catch (err) {
          stats.failed++;
          const msg = `${record.id}: ${err.message}`;
          errors.push(msg);
          console.error(`[fmcsa-mass-embed] ✗ ${msg}`);
        }
      }));

      if (i + batchSize < missing.length) {
        await new Promise(r => setTimeout(r, EMBED_DELAY_MS));
      }
    }

    offset = nextOffset;

    if (!nextOffset) {
      exhausted = true;
      break;
    }
  }

  // Save progress (reset to '' if exhausted so next run starts over)
  const savedOffset = exhausted ? '' : (offset || '');
  await saveProgress(savedOffset);

  return c.json({
    ...stats,
    exhausted,
    start_offset:   startOffset || '(beginning)',
    next_offset:    savedOffset || '(beginning — will restart)',
    startedAt,
    completedAt:    new Date().toISOString(),
    ...(errors.length > 0 ? { errors: errors.slice(0, 20) } : {}),
  });
});
