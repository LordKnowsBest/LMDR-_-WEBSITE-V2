/**
 * Semantic search routes — Phase 2
 *
 * POST /v1/embed/driver    — embed + upsert driver profile
 * POST /v1/embed/carrier   — embed + upsert carrier profile
 * POST /v1/search/drivers  — query lmdr-drivers index
 * POST /v1/search/carriers — query lmdr-carriers index
 */

import { Hono } from 'hono';
import crypto from 'node:crypto';
import { embed, buildDriverText, buildCarrierText } from '../lib/embeddings.js';
import { upsertVector, queryVectors, fetchVector } from '../lib/pinecone.js';
import { enrichCarriersBatch } from '../lib/perplexity.js';

export const semanticRouter = new Hono();

const EMBED_TIMEOUT_MS  = 5_000;
const SEARCH_TIMEOUT_MS = 3_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Remove undefined/null fields — Pinecone rejects null metadata values. */
function stripNulls(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), ms)),
  ]);
}

// ── POST /embed/driver ────────────────────────────────────────────────────────

semanticRouter.post('/embed/driver', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { driverId, profileUpdatedAt, profile } = body;
  if (!driverId || !profileUpdatedAt || !profile) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'driverId, profileUpdatedAt, profile required', requestId } }, 400);
  }

  // Idempotency: skip if embedding is current
  try {
    const existing = await fetchVector('drivers', driverId);
    if (existing?.metadata?.profileUpdatedAt === profileUpdatedAt) {
      return c.json({ driverId, status: 'skipped', reason: 'embedding_current', requestId });
    }
  } catch { /* non-fatal — proceed to embed */ }

  try {
    const text   = buildDriverText(profile);
    const vector = await withTimeout(embed(text), EMBED_TIMEOUT_MS);

    const metadata = {
      profileUpdatedAt,
      cdl_class:        profile.cdl_class        || 'unknown',
      home_state:       profile.home_state        || 'unknown',
      experience_years: profile.experience_years  || 0,
      is_discoverable:  profile.is_discoverable   || 'No',
      last_active:      new Date().toISOString(),
    };

    await upsertVector('drivers', driverId, vector, metadata);

    return c.json({
      driverId,
      status: 'upserted',
      embeddedAt: new Date().toISOString(),
      indexVersion: 1,
      requestId,
    });
  } catch (err) {
    console.error('[embed/driver]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});

// ── POST /embed/carrier ───────────────────────────────────────────────────────

semanticRouter.post('/embed/carrier', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { carrierId, profileUpdatedAt, profile } = body;
  if (!carrierId || !profileUpdatedAt || !profile) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'carrierId, profileUpdatedAt, profile required', requestId } }, 400);
  }

  try {
    const existing = await fetchVector('carriers', carrierId);
    if (existing?.metadata?.profileUpdatedAt === profileUpdatedAt) {
      return c.json({ carrierId, status: 'skipped', reason: 'embedding_current', requestId });
    }
  } catch { /* non-fatal */ }

  try {
    const text   = buildCarrierText(profile);
    const vector = await withTimeout(embed(text), EMBED_TIMEOUT_MS);

    const metadata = {
      profileUpdatedAt,
      dot_number:     profile.dot_number     || 0,
      legal_name:     profile.legal_name     || 'unknown',
      operation_type: profile.operation_type || 'unknown',
      state:          profile.state          || 'unknown',
      fleet_size:     profile.fleet_size     || 0,
      driver_count:   profile.driver_count   || 0,
      pay_cpm:        profile.pay_cpm        || profile.pay_range_min || 0,
      turnover_pct:   profile.turnover_pct   ?? 0,
      accident_rate:  profile.accident_rate  ?? 0,
      priority_score: profile.priority_score || 0,
      last_active:    new Date().toISOString(),
    };

    await upsertVector('carriers', carrierId, vector, metadata);

    return c.json({
      carrierId,
      status: 'upserted',
      embeddedAt: new Date().toISOString(),
      indexVersion: 1,
      requestId,
    });
  } catch (err) {
    console.error('[embed/carrier]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});

// ── POST /search/drivers ──────────────────────────────────────────────────────

semanticRouter.post('/search/drivers', async (c) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { query, filters = {}, topK = 50, includeMetadata = true } = body;
  if (!query) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'query required', requestId } }, 400);
  }

  try {
    const queryVector = await withTimeout(embed(query), SEARCH_TIMEOUT_MS);
    const matches     = await queryVectors('drivers', queryVector, Math.min(topK, 200), filters, includeMetadata);

    const now = Date.now();
    const results = matches.map(m => ({
      driverId: m.id,
      score:    Math.round(m.score * 1000) / 1000,
      stale:    m.metadata?.last_active
        ? (now - new Date(m.metadata.last_active).getTime()) > 86_400_000
        : false,
      metadata: includeMetadata ? m.metadata : undefined,
    }));

    return c.json({
      results,
      totalReturned:  results.length,
      queryLatencyMs: Date.now() - start,
      requestId,
    });
  } catch (err) {
    console.error('[search/drivers]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});

// ── POST /search/carriers-async ───────────────────────────────────────────────
//
// Option B full-universe async search.
// Accepts { jobId, driverPrefs, isPremiumUser, callbackUrl }.
// Does NOT hold the HTTP connection — responds 202 immediately,
// runs the pipeline in the background, then POSTs results to callbackUrl.

semanticRouter.post('/search/carriers-async', async (c) => {
  const requestId = crypto.randomUUID();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { jobId, driverPrefs, isPremiumUser, callbackUrl } = body;
  if (!jobId || !driverPrefs || !callbackUrl) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'jobId, driverPrefs, callbackUrl required', requestId } }, 400);
  }

  // Respond 202 immediately — pipeline runs in background (once only)
  const pipeline = _runAsyncCarrierSearch(jobId, driverPrefs, isPremiumUser, callbackUrl, requestId)
    .catch(err => console.error(`[search/carriers-async] Background error for ${jobId}:`, err.message));
  // On Cloudflare Workers, waitUntil keeps the VM alive past response; on Node.js/Railway it's a no-op
  if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(pipeline);

  return c.json({ jobId, status: 'PROCESSING', requestId }, 202);
});

const AIRTABLE_BASE    = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE   = 'Carriers (Master)';
const AIRTABLE_FIELDS  = ['DOT_NUMBER', 'LEGAL_NAME', 'DBA_NAME', 'CARRIER_OPERATION',
                          'NBR_POWER_UNIT', 'TOTAL_DRIVERS', 'SAFETY_RATING',
                          'PHY_CITY', 'PHY_STATE', 'PHY_ZIP', 'TELEPHONE',
                          'PAY_CPM', 'TURNOVER_PERCENT', 'AVG_TRUCK_AGE', 'combined_score'];
const TOP_K_PINECONE   = 75;
const MAX_RESULTS      = 10; // cap per-tier; total up to 20

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

/** Build a query string from driver preferences for Voyage embedding. */
function buildDriverQuery(prefs) {
  const cdl  = prefs.cdl_class  || prefs.cdlClass  || '';
  const ops  = Array.isArray(prefs.operation_types)
    ? prefs.operation_types.join(', ')
    : (prefs.operationType || prefs.operation_type || '');
  const state = prefs.home_state || prefs.homeState || '';
  const pay   = (prefs.pay_range_min || prefs.minPay)
    ? `seeking minimum $${prefs.pay_range_min || prefs.minPay}/mi` : '';
  const fleet = prefs.fleet_size_preference ? `fleet size ${prefs.fleet_size_preference}` : '';

  return [
    cdl   && `CDL-${cdl} driver`,
    ops   && `looking for ${ops} freight`,
    state && `based in or near ${state}`,
    pay,
    fleet,
  ].filter(Boolean).join(', ') || 'CDL truck driver carrier match';
}

/**
 * Batch-fetch Airtable records by their record IDs.
 * Uses RECORD_ID() formula filter.
 */
async function fetchAirtableByRecordIds(recordIds) {
  if (recordIds.length === 0) return {};

  // Airtable filterByFormula: OR(RECORD_ID()='rec1', RECORD_ID()='rec2', ...)
  const formula = recordIds.length === 1
    ? `RECORD_ID()='${recordIds[0]}'`
    : `OR(${recordIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;

  const params = new URLSearchParams({ filterByFormula: formula });
  AIRTABLE_FIELDS.forEach(f => params.append('fields[]', f));

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: airtableHeaders() });

  if (!res.ok) {
    console.warn(`[search/carriers-async] Airtable batch fetch failed ${res.status}`);
    return {};
  }

  const data = await res.json();
  const map = {};
  for (const record of (data.records || [])) {
    map[record.id] = record.fields;
  }
  return map;
}

/**
 * Full Option B pipeline — runs in the background after 202 response.
 */
async function _runAsyncCarrierSearch(jobId, driverPrefs, isPremiumUser, callbackUrl, requestId) {
  const started = Date.now();
  console.log(`[search/carriers-async] Starting job ${jobId}`);

  try {
    // 1. Build query text and embed via Voyage
    const queryText   = buildDriverQuery(driverPrefs);
    const queryVector = await withTimeout(embed(queryText), 6_000);

    // 2. Query Pinecone lmdr-carriers top-75
    const pineconeMatches = await queryVectors('carriers', queryVector, TOP_K_PINECONE, {}, true);

    // 3. Split by vector ID prefix
    const recMatches = pineconeMatches.filter(m => m.id.startsWith('rec'));
    const dotMatches = pineconeMatches.filter(m => m.id.startsWith('dot:'));

    console.log(`[search/carriers-async] ${jobId}: ${recMatches.length} Airtable + ${dotMatches.length} FMCSA-only from Pinecone`);

    // 4. Enrich Airtable-backed carriers via batch fetch
    const recIds    = recMatches.map(m => m.id);
    const airtableMap = await fetchAirtableByRecordIds(recIds);

    // 5. Build unified result set
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Airtable-backed carriers (Tier 1 — full data)
    for (const m of recMatches.slice(0, MAX_RESULTS)) {
      const fields = airtableMap[m.id];
      if (!fields) continue; // record may have been deleted

      results.push({
        carrier: {
          // Use uppercase keys to match existing renderer expectations
          DOT_NUMBER:         fields.DOT_NUMBER        || m.metadata?.dot_number || '',
          LEGAL_NAME:         fields.LEGAL_NAME        || m.metadata?.legal_name || 'Unknown Carrier',
          DBA_NAME:           fields.DBA_NAME          || null,
          CARRIER_OPERATION:  fields.CARRIER_OPERATION || m.metadata?.operation_type || null,
          NBR_POWER_UNIT:     fields.NBR_POWER_UNIT    || m.metadata?.fleet_size    || null,
          TOTAL_DRIVERS:      fields.TOTAL_DRIVERS     || m.metadata?.driver_count  || null,
          SAFETY_RATING:      fields.SAFETY_RATING     || m.metadata?.safety_rating || null,
          PHY_CITY:           fields.PHY_CITY          || null,
          PHY_STATE:          fields.PHY_STATE         || m.metadata?.state         || null,
          PHY_ZIP:            fields.PHY_ZIP           || null,
          TELEPHONE:          fields.TELEPHONE         || null,
          PAY_CPM:            fields.PAY_CPM           || null,
          TURNOVER_PERCENT:   fields.TURNOVER_PERCENT  || null,
          AVG_TRUCK_AGE:      fields.AVG_TRUCK_AGE     || null,
        },
        overallScore:    Math.round(m.score * 100),
        semanticScore:   m.score,
        scores:          {},
        enrichment:      null,
        needsEnrichment: true,
        fromCache:       false,
        fmcsaOnly:       false,
        source:          'airtable',
        vectorId:        m.id,
      });
    }

    // FMCSA-only carriers (Tier 2 — Pinecone metadata only)
    for (const m of dotMatches.slice(0, MAX_RESULTS)) {
      const meta = m.metadata || {};
      if (!meta.legal_name || meta.source === 'progress-tracker') continue;

      results.push({
        carrier: {
          DOT_NUMBER:        meta.dot_number     || m.id.replace('dot:', ''),
          LEGAL_NAME:        meta.legal_name     || 'Unknown Carrier',
          DBA_NAME:          null,
          CARRIER_OPERATION: meta.operation_type || null,
          NBR_POWER_UNIT:    meta.fleet_size     || null,
          TOTAL_DRIVERS:     meta.driver_count   || null,
          SAFETY_RATING:     meta.safety_rating  || null,
          PHY_CITY:          meta.city           || null,
          PHY_STATE:         meta.state          || null,
          PHY_ZIP:           null,
          TELEPHONE:         null,
          PAY_CPM:           null,
          TURNOVER_PERCENT:  null,
          AVG_TRUCK_AGE:     null,
        },
        overallScore:    Math.round(m.score * 100),
        semanticScore:   m.score,
        scores:          {},
        enrichment:      null,
        needsEnrichment: false,  // FMCSA-only carriers skip AI enrichment (no DOT safety data on Railway)
        fromCache:       false,
        fmcsaOnly:       true,
        source:          'fmcsa-mass-embed',
        vectorId:        m.id,
      });
    }

    // Sort combined set by semantic score descending
    results.sort((a, b) => b.overallScore - a.overallScore);

    const maxResults = isPremiumUser ? 10 : 2;
    const finalResults = results.slice(0, maxResults);

    // 6. Fire callback immediately with raw results so Wix renders cards fast.
    //    All carriers get needsEnrichment=true — the Wix aiEnrichment.jsw handles
    //    lazy per-card enrichment after the results view is visible.
    const elapsed = Date.now() - started;
    console.log(`[search/carriers-async] ${jobId}: returning ${finalResults.length} raw results in ${elapsed}ms`);

    const rawResults = finalResults.map(r => ({
      ...r,
      enrichment:      null,
      needsEnrichment: !r.fmcsaOnly, // Wix triggers lazy enrichment on Airtable-backed carriers
    }));

    await _postCallback(callbackUrl, {
      jobId,
      status:      'COMPLETE',
      results:     rawResults,
      totalFound:  results.length,
      totalScored: pineconeMatches.length,
      elapsedMs:   elapsed,
      requestId,
    });

  } catch (err) {
    console.error(`[search/carriers-async] ${jobId} pipeline error:`, err.message);
    await _postCallback(callbackUrl, {
      jobId,
      status:  'FAILED',
      error:   err.message,
      results: [],
      requestId,
    }).catch(() => {});
  }
}

async function _postCallback(callbackUrl, payload) {
  const res = await fetch(callbackUrl, {
    method:  'POST',
    headers: {
      'Content-Type':        'application/json',
      'x-lmdr-internal-key': process.env.LMDR_INTERNAL_KEY,
      'x-lmdr-timestamp':    String(Date.now()),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[search/carriers-async] Callback failed ${res.status}: ${body.slice(0, 200)}`);
  }
}

// ── POST /search/carriers ─────────────────────────────────────────────────────

semanticRouter.post('/search/carriers', async (c) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  let body;

  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { query, filters = {}, topK = 20, includeMetadata = true } = body;
  if (!query) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'query required', requestId } }, 400);
  }

  try {
    const queryVector = await withTimeout(embed(query), SEARCH_TIMEOUT_MS);
    const matches     = await queryVectors('carriers', queryVector, Math.min(topK, 200), filters, includeMetadata);

    const results = matches.map(m => ({
      carrierId: m.id,
      score:     Math.round(m.score * 1000) / 1000,
      stale:     false,
      metadata:  includeMetadata ? m.metadata : undefined,
    }));

    return c.json({
      results,
      totalReturned:  results.length,
      queryLatencyMs: Date.now() - start,
      requestId,
    });
  } catch (err) {
    console.error('[search/carriers]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});
