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
import { enrichCarriersBatch, enrichCarrierWithPerplexity } from '../lib/perplexity.js';

export const semanticRouter = new Hono();

const EMBED_TIMEOUT_MS  = 5_000;
const SEARCH_TIMEOUT_MS = 3_000;

// ── FMCSA lookup (used for Pinecone-only carriers missing city/fleet data) ────

async function fetchFmcsaCarrier(dotNumber) {
  const key = process.env.FMCSA_WEB_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${key}`,
      { signal: AbortSignal.timeout(4_000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.carrier || data?.carrier || null;
  } catch {
    return null;
  }
}

/**
 * Batch-fetch FMCSA data for a list of DOT numbers in parallel.
 * Returns a map of { [dotNumber]: carrierObj | null }
 */
async function fetchFmcsaBatch(dotNumbers) {
  const pairs = await Promise.all(
    dotNumbers.map(async dot => {
      const carrier = await fetchFmcsaCarrier(dot);
      return [dot, carrier];
    })
  );
  return Object.fromEntries(pairs);
}

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
      // driver_type: 'legacy' for leads imported from Legacy Driver Leads (name/phone/email only)
      // driver_type: 'active' (default) for drivers with full profiles
      driver_type:      profile.driver_type       || 'active',
      // Contact fields stored for legacy leads so recruiters can reach out directly from search results
      first_name:       profile.first_name        || '',
      last_name:        profile.last_name         || '',
      phone:            profile.phone             || '',
      email:            profile.email             || '',
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
      // Accept both canonical (state/city) and FMCSA-style (phy_state/phy_city) field names
      // carrier_operation may arrive as an object {carrierOperationCode,carrierOperationDesc} — extract the code string
      operation_type: profile.operation_type
                   || (typeof profile.carrier_operation === 'object' ? profile.carrier_operation?.carrierOperationCode : profile.carrier_operation)
                   || 'unknown',
      state:          profile.state          || profile.phy_state          || 'unknown',
      city:           profile.city           || profile.phy_city           || 'unknown',
      fleet_size:     profile.fleet_size     || profile.nbr_power_unit     || 0,
      driver_count:   profile.driver_count   || profile.total_drivers      || 0,
      pay_cpm:        profile.pay_cpm        || profile.pay_range_min      || 0,
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
  // On Cloudflare Workers, waitUntil keeps the VM alive past response.
  // On Node.js/Railway, c.executionCtx is a getter that THROWS — guard with try-catch.
  try {
    if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(pipeline);
  } catch { /* Node.js has no ExecutionContext — pipeline runs as detached microtask */ }

  return c.json({ jobId, status: 'PROCESSING', requestId }, 202);
});

const AIRTABLE_BASE    = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE   = 'Carriers (Master)';
const AIRTABLE_FIELDS  = ['DOT_NUMBER', 'LEGAL_NAME', 'CARRIER_OPERATION',
                          'NBR_POWER_UNIT', 'DRIVER_TOTAL', 'ACCIDENT_RATE',
                          'PHY_CITY', 'PHY_STATE', 'PHY_ZIP', 'TELEPHONE',
                          'PAY_CPM', 'TURNOVER_PERCENT', 'AVG_TRUCK_AGE',
                          'COMBINED_SCORE', 'PRIORITY_SCORE', 'RECRUITMENT_SCORE'];
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
  const zip   = prefs.homeZip   || prefs.home_zip   || '';
  const pay   = (prefs.pay_range_min || prefs.minPay)
    ? `seeking minimum $${prefs.pay_range_min || prefs.minPay}/mi` : '';
  const fleet = prefs.fleet_size_preference ? `fleet size ${prefs.fleet_size_preference}` : '';

  // Prefer explicit state; fall back to zip code as a location signal for Voyage AI
  const location = state
    ? `based in or near ${state}`
    : zip ? `based near zip code ${zip}` : '';

  return [
    cdl   && `CDL-${cdl} driver`,
    ops   && `looking for ${ops} freight`,
    location,
    pay,
    fleet,
  ].filter(Boolean).join(', ') || 'CDL truck driver carrier match';
}

const OP_TYPE_LABEL = { A: 'For-Hire', B: 'For-Hire / Private', C: 'Private' };
function inferOpType(code) {
  if (!code) return null;
  return OP_TYPE_LABEL[code] || code;
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

    // 4. Enrich Airtable-backed carriers via batch fetch — only top MAX_RESULTS needed
    const recIds    = recMatches.slice(0, MAX_RESULTS).map(m => m.id);
    const airtableMap = await fetchAirtableByRecordIds(recIds);

    // 5. Build unified result set
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Airtable-backed carriers (Tier 1 — full data)
    for (const m of recMatches.slice(0, MAX_RESULTS)) {
      const fields = airtableMap[m.id];
      if (!fields) continue; // record may have been deleted

      const _opCode = fields.CARRIER_OPERATION || m.metadata?.operation_type || null;
      results.push({
        carrier: {
          // Use uppercase keys to match existing renderer expectations
          DOT_NUMBER:         fields.DOT_NUMBER        || m.metadata?.dot_number || '',
          LEGAL_NAME:         fields.LEGAL_NAME        || m.metadata?.legal_name || 'Unknown Carrier',
          CARRIER_OPERATION:  _opCode,
          NBR_POWER_UNIT:     fields.NBR_POWER_UNIT    || m.metadata?.fleet_size    || null,
          DRIVER_TOTAL:       fields.DRIVER_TOTAL      || m.metadata?.driver_count  || null,
          ACCIDENT_RATE:      fields.ACCIDENT_RATE     || m.metadata?.accident_rate || null,
          PHY_CITY:           fields.PHY_CITY          || null,
          PHY_STATE:          fields.PHY_STATE         || m.metadata?.state         || null,
          PHY_ZIP:            fields.PHY_ZIP           || null,
          TELEPHONE:          fields.TELEPHONE         || null,
          PAY_CPM:            fields.PAY_CPM           || m.metadata?.pay_cpm       || null,
          TURNOVER_PERCENT:   fields.TURNOVER_PERCENT  || m.metadata?.turnover_pct  || null,
          AVG_TRUCK_AGE:      fields.AVG_TRUCK_AGE     || null,
          COMBINED_SCORE:     fields.COMBINED_SCORE    || null,
          PRIORITY_SCORE:     fields.PRIORITY_SCORE    || m.metadata?.priority_score || null,
          SAFETY_RATING:      fields.SAFETY_RATING     || m.metadata?.safety_rating || null,
        },
        // Minimal fmcsa stub so the FMCSA section renders; hydrated below with live FMCSA data
        fmcsa: {
          safety_rating:    fields.SAFETY_RATING    || m.metadata?.safety_rating || null,
          dot_number:       fields.DOT_NUMBER        || m.metadata?.dot_number    || '',
          is_authorized:    true,
          operating_status: 'AUTHORIZED',
          inspections_24mo: {},
          crashes_24mo:     {},
          basics:           {},
        },
        inferredOpType:  inferOpType(_opCode),
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

      // Build a partial fmcsa object from Pinecone metadata so the safety badge renders immediately.
      // Full inspection/crash/BASIC data is fetched on-demand when driver clicks "Get AI Profile".
      const partialFmcsa = {
        safety_rating:    meta.safety_rating    || null,
        dot_number:       meta.dot_number       || m.id.replace('dot:', ''),
        is_authorized:    true,   // mass-embed only ingests active/authorized carriers
        operating_status: 'AUTHORIZED',
        inspections_24mo: {},
        crashes_24mo:     {},
        basics:           {},
      };

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
          PHY_STREET:        null,
          PHY_ZIP:           null,
          TELEPHONE:         null,
          PAY_CPM:           null,
          TURNOVER_PERCENT:  null,
          AVG_TRUCK_AGE:     null,
        },
        fmcsa:           partialFmcsa,
        inferredOpType:  inferOpType(meta.operation_type),
        overallScore:    Math.round(m.score * 100),
        semanticScore:   m.score,
        scores:          {},
        enrichment:      null,
        needsEnrichment: true,   // Show "Get AI Profile" button — enrichCarrier works for any DOT
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
    // Fill in FMCSA data for Pinecone-only carriers (city, fleet size, etc. missing from metadata).
    const fmcsaOnlyResults = finalResults.filter(r => r.fmcsaOnly);
    if (fmcsaOnlyResults.length > 0) {
      const dots = fmcsaOnlyResults.map(r => String(r.carrier.DOT_NUMBER)).filter(Boolean);
      try {
        const fmcsaMap = await fetchFmcsaBatch(dots);
        for (const r of fmcsaOnlyResults) {
          const dot = String(r.carrier.DOT_NUMBER);
          const f   = fmcsaMap[dot];
          if (!f) continue;

          r.carrier.LEGAL_NAME        = f.legalName        || f.legal_name        || r.carrier.LEGAL_NAME;
          r.carrier.PHY_CITY          = f.phyCity          || f.phy_city          || r.carrier.PHY_CITY;
          r.carrier.PHY_STATE         = f.phyState         || f.phy_state         || r.carrier.PHY_STATE;
          r.carrier.PHY_STREET        = f.phyStreet        || f.phy_street        || r.carrier.PHY_STREET;
          r.carrier.PHY_ZIP           = f.phyZip           || f.phy_zip           || r.carrier.PHY_ZIP;
          r.carrier.TELEPHONE         = f.telephone        || f.TELEPHONE         || r.carrier.TELEPHONE;
          r.carrier.NBR_POWER_UNIT    = f.nbrPowerUnit     ?? f.nbr_power_unit    ?? r.carrier.NBR_POWER_UNIT;
          r.carrier.TOTAL_DRIVERS     = f.totalDrivers     ?? f.total_drivers     ?? r.carrier.TOTAL_DRIVERS;
          r.carrier.CARRIER_OPERATION = f.carrierOperation || f.carrier_operation || r.carrier.CARRIER_OPERATION;
          r.carrier.SAFETY_RATING     = f.safetyRating     || f.safety_rating     || r.carrier.SAFETY_RATING;
          // Update the fmcsa object too so the FMCSA safety section renders correctly
          if (r.fmcsa) {
            r.fmcsa.safety_rating   = r.carrier.SAFETY_RATING || r.fmcsa.safety_rating;
            r.fmcsa.dot_number      = r.carrier.DOT_NUMBER;
            // Full FMCSA stats hydration for Pinecone-only carriers
            r.fmcsa.is_authorized   = f.allowedToOperate === 'Y' || f.operatingStatus === 'AUTHORIZED' || r.fmcsa.is_authorized;
            r.fmcsa.operating_status = f.operatingStatus || f.operating_status || 'AUTHORIZED';
            r.fmcsa.inspections_24mo = {
              total:                f.inspTotal          ?? f.totalInspections  ?? 0,
              driver_oos_rate:      f.driverOosRate      ?? f.driverOOSRate     ?? null,
              vehicle_oos_rate:     f.vehicleOosRate     ?? f.vehicleOOSRate    ?? null,
              national_avg_driver_oos:  5.51,
              national_avg_vehicle_oos: 20.72,
            };
            r.fmcsa.crashes_24mo = {
              total: f.crashTotal ?? f.totalCrashes ?? 0,
              fatal: f.fatalCrash ?? f.fatalCrashes ?? 0,
            };
            r.fmcsa.basics = {}; // BASIC data requires separate SAFER endpoint
          }
        }
        console.log(`[search/carriers-async] ${jobId}: FMCSA hydrated ${fmcsaOnlyResults.length} Pinecone-only carriers`);
      } catch (fmcsaErr) {
        console.warn(`[search/carriers-async] ${jobId}: FMCSA batch hydration failed (non-blocking):`, fmcsaErr.message);
      }
    }

    // Hydrate Airtable-backed carriers with live FMCSA data for OOS rates, crash counts, etc.
    const airtableResults = finalResults.filter(r => !r.fmcsaOnly && r.carrier.DOT_NUMBER);
    if (airtableResults.length > 0) {
      const dots = airtableResults.map(r => String(r.carrier.DOT_NUMBER)).filter(Boolean);
      try {
        const fmcsaMap = await fetchFmcsaBatch(dots);
        for (const r of airtableResults) {
          const dot = String(r.carrier.DOT_NUMBER);
          const f   = fmcsaMap[dot];
          if (!f) continue;
          // Fill in missing carrier fields with live FMCSA data
          r.carrier.NBR_POWER_UNIT    = r.carrier.NBR_POWER_UNIT    || f.nbrPowerUnit     ?? f.nbr_power_unit    ?? null;
          r.carrier.TOTAL_DRIVERS     = r.carrier.TOTAL_DRIVERS     || f.totalDrivers     ?? f.total_drivers     ?? null;
          r.carrier.SAFETY_RATING     = r.carrier.SAFETY_RATING     || f.safetyRating     || f.safety_rating     || null;
          r.carrier.PHY_CITY          = r.carrier.PHY_CITY          || f.phyCity          || f.phy_city          || null;
          r.carrier.PHY_STATE         = r.carrier.PHY_STATE         || f.phyState         || f.phy_state         || null;
          r.carrier.PHY_STREET        = r.carrier.PHY_STREET        || f.phyStreet        || f.phy_street        || null;
          r.carrier.PHY_ZIP           = r.carrier.PHY_ZIP           || f.phyZip           || f.phy_zip           || null;
          r.carrier.TELEPHONE         = r.carrier.TELEPHONE         || f.telephone        || f.TELEPHONE         || null;
          r.carrier.CARRIER_OPERATION = r.carrier.CARRIER_OPERATION || f.carrierOperation || f.carrier_operation || null;
          // Hydrate fmcsa stats object
          if (r.fmcsa) {
            r.fmcsa.safety_rating    = r.carrier.SAFETY_RATING;
            r.fmcsa.is_authorized    = f.allowedToOperate === 'Y' || f.operatingStatus === 'AUTHORIZED' || true;
            r.fmcsa.operating_status = f.operatingStatus || f.operating_status || 'AUTHORIZED';
            r.fmcsa.inspections_24mo = {
              total:               f.inspTotal      ?? f.totalInspections  ?? 0,
              driver_oos_rate:     f.driverOosRate  ?? f.driverOOSRate     ?? null,
              vehicle_oos_rate:    f.vehicleOosRate ?? f.vehicleOOSRate    ?? null,
              national_avg_driver_oos:  5.51,
              national_avg_vehicle_oos: 20.72,
            };
            r.fmcsa.crashes_24mo = {
              total: f.crashTotal ?? f.totalCrashes ?? 0,
              fatal: f.fatalCrash ?? f.fatalCrashes ?? 0,
            };
          }
          // Update inferredOpType if now resolved
          if (!r.inferredOpType && r.carrier.CARRIER_OPERATION) {
            r.inferredOpType = inferOpType(r.carrier.CARRIER_OPERATION);
          }
        }
        console.log(`[search/carriers-async] ${jobId}: FMCSA hydrated ${airtableResults.length} Airtable-backed carriers`);
      } catch (airtableFmcsaErr) {
        console.warn(`[search/carriers-async] ${jobId}: FMCSA hydration for Airtable carriers failed (non-blocking):`, airtableFmcsaErr.message);
      }
    }

    const elapsed = Date.now() - started;
    console.log(`[search/carriers-async] ${jobId}: returning ${finalResults.length} raw results in ${elapsed}ms`);

    // Pre-enrich top carriers with Perplexity before sending callback.
    // Non-blocking — failure falls through to needsEnrichment=true (on-demand fallback).
    const carriersToEnrich = finalResults
      .filter(r => r.carrier.LEGAL_NAME && r.carrier.LEGAL_NAME !== 'Unknown Carrier')
      .slice(0, 5)
      .map(r => ({
        name:      r.carrier.LEGAL_NAME,
        dotNumber: String(r.carrier.DOT_NUMBER),
        knownData: {
          city:              r.carrier.PHY_CITY,
          state:             r.carrier.PHY_STATE,
          fleet_size:        r.carrier.NBR_POWER_UNIT,
          safety_rating:     r.fmcsa?.safety_rating || r.carrier.SAFETY_RATING,
          carrier_operation: r.carrier.CARRIER_OPERATION,
        },
      }));

    let enrichmentMap = {};
    if (carriersToEnrich.length > 0) {
      try {
        console.log(`[search/carriers-async] ${jobId}: Perplexity enriching ${carriersToEnrich.length} carriers`);
        enrichmentMap = await enrichCarriersBatch(carriersToEnrich, { maxConcurrent: 5 });
        console.log(`[search/carriers-async] ${jobId}: Perplexity enrichment complete`);
      } catch (enrichErr) {
        console.warn(`[search/carriers-async] ${jobId}: Perplexity enrichment failed (non-blocking):`, enrichErr.message);
      }
    }

    const rawResults = finalResults.map(r => {
      const dot            = String(r.carrier.DOT_NUMBER);
      const enrichment     = enrichmentMap[dot] || null;
      const hasEnrichment  = enrichment && !enrichment.error;
      return {
        ...r,
        enrichment:      hasEnrichment ? enrichment : null,
        needsEnrichment: !hasEnrichment,
      };
    });

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

// ── POST /v1/enrich/carrier/async ────────────────────────────────────────────
// Async variant: returns 202 immediately, processes in background, then POSTs
// to callbackUrl with the enrichment result.
// Avoids the Wix 14s web-method timeout — same pattern as /v1/search/carriers-async.

semanticRouter.post('/enrich/carrier/async', async (c) => {
  const requestId = crypto.randomUUID();
  let body;
  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { jobId, dotNumber, carrierName, knownData = {}, callbackUrl } = body;
  if (!jobId || !dotNumber || !carrierName || !callbackUrl) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'jobId, dotNumber, carrierName, callbackUrl required', requestId } }, 400);
  }

  // Fire background processing — do NOT await
  _runEnrichmentAsync(jobId, dotNumber, carrierName, knownData, callbackUrl).catch(err => {
    console.error(`[enrich/async] Unhandled background error for DOT ${dotNumber}:`, err.message);
  });

  return c.json({ jobId, status: 'processing', requestId }, 202);
});

async function _runEnrichmentAsync(jobId, dotNumber, carrierName, knownData, callbackUrl) {
  const key = process.env.LMDR_INTERNAL_KEY;

  const _callback = async (payload) => {
    try {
      await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type':        'application/json',
          'x-lmdr-internal-key': key || '',
          'x-lmdr-timestamp':    String(Date.now()),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8_000),
      });
    } catch (cbErr) {
      console.error(`[enrich/async] Callback failed for job ${jobId}:`, cbErr.message);
    }
  };

  try {
    // Hydrate with live FMCSA data if we're missing city/state
    let enrichKnownData = { ...knownData };
    if (!enrichKnownData.city || !enrichKnownData.state) {
      const fmcsa = await fetchFmcsaCarrier(String(dotNumber));
      if (fmcsa) {
        enrichKnownData.city          = enrichKnownData.city          || fmcsa.phyCity   || fmcsa.phy_city;
        enrichKnownData.state         = enrichKnownData.state         || fmcsa.phyState  || fmcsa.phy_state;
        enrichKnownData.fleet_size    = enrichKnownData.fleet_size    ?? fmcsa.nbrPowerUnit ?? fmcsa.nbr_power_unit;
        enrichKnownData.safety_rating = enrichKnownData.safety_rating || fmcsa.safetyRating || fmcsa.safety_rating;
      }
    }

    const enrichment = await enrichCarrierWithPerplexity(carrierName, String(dotNumber), enrichKnownData);
    await _callback({ jobId, dotNumber, status: 'COMPLETE', enrichment });
  } catch (err) {
    console.error(`[enrich/async] Failed for DOT ${dotNumber}:`, err.message);
    await _callback({ jobId, dotNumber, status: 'FAILED', error: err.message });
  }
}

// ── POST /v1/enrich/carrier ───────────────────────────────────────────────────
// Synchronous variant (kept for internal use / testing).
// NOTE: Too slow for direct Wix calls — use /async from Wix page code.

semanticRouter.post('/enrich/carrier', async (c) => {
  const requestId = crypto.randomUUID();
  let body;
  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Invalid JSON', requestId } }, 400);
  }

  const { dotNumber, carrierName, knownData = {} } = body;
  if (!dotNumber || !carrierName) {
    return c.json({ error: { code: 'MISSING_FIELD', message: 'dotNumber and carrierName required', requestId } }, 400);
  }

  try {
    // If we don't have city/state from the caller, try a live FMCSA lookup first
    // so Perplexity gets better context (location helps narrow web search results)
    let enrichKnownData = { ...knownData };
    if (!enrichKnownData.city || !enrichKnownData.state) {
      const fmcsa = await fetchFmcsaCarrier(String(dotNumber));
      if (fmcsa) {
        enrichKnownData.city          = enrichKnownData.city  || fmcsa.phyCity  || fmcsa.phy_city;
        enrichKnownData.state         = enrichKnownData.state || fmcsa.phyState || fmcsa.phy_state;
        enrichKnownData.fleet_size    = enrichKnownData.fleet_size    ?? fmcsa.nbrPowerUnit ?? fmcsa.nbr_power_unit;
        enrichKnownData.safety_rating = enrichKnownData.safety_rating || fmcsa.safetyRating || fmcsa.safety_rating;
      }
    }

    const enrichment = await enrichCarrierWithPerplexity(carrierName, String(dotNumber), enrichKnownData);
    return c.json({ enrichment, requestId });
  } catch (err) {
    console.error('[enrich/carrier]', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, requestId } }, 500);
  }
});
