/**
 * POST /v1/jobs/fmcsa-roster-sync
 *
 * Monthly job: discovers NEW carriers not yet in Carriers (Master).
 *
 * Strategy:
 *   1. Query Airtable for the highest DOT_NUMBER currently stored.
 *   2. Scan DOT numbers sequentially from max+1 upward.
 *   3. For each DOT, call the FMCSA QC API.
 *      - 404 / inactive → skip.
 *      - Valid carrier not yet in Airtable → insert + queue Pinecone embed.
 *   4. Stop after SCAN_WINDOW consecutive DOTs or MAX_INSERTS new carriers.
 *
 * Rate limit: 1 req/sec between FMCSA calls.
 *
 * Returns: { scanned, new_carriers_found, inserted, embed_queued, failed }
 */

import { Hono } from 'hono';

export const fmcsaRosterSyncRouter = new Hono();

const AIRTABLE_BASE  = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE = 'Carriers (Master)';
const RAILWAY_URL    = process.env.RAILWAY_URL || 'https://lmdr-ai-intelligence-production.up.railway.app';

// How many sequential DOTs to probe before stopping (prevents runaway)
const SCAN_WINDOW   = 500;
// Cap new inserts per run to avoid overwhelming Airtable
const MAX_INSERTS   = 100;
// 1 req/sec — FMCSA QC API is rate-limited
const FMCSA_RATE_MS = 1_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Airtable: find current max DOT_NUMBER ─────────────────────────────────────

/**
 * Returns the highest DOT_NUMBER value stored in Carriers (Master).
 * Uses Airtable's sort + pageSize=1 trick.
 */
async function fetchMaxDotNumber() {
  const params = new URLSearchParams({
    pageSize: '1',
    'fields[]': 'DOT_NUMBER',
    'sort[0][field]': 'DOT_NUMBER',
    'sort[0][direction]': 'desc',
    filterByFormula: 'DOT_NUMBER != ""',
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: airtableHeaders() });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable max-DOT query failed ${res.status}: ${body}`);
  }

  const data = await res.json();
  const topRecord = data.records?.[0];
  if (!topRecord) throw new Error('No carriers found in Airtable — cannot determine scan start');

  const raw = topRecord.fields?.DOT_NUMBER;
  const num = parseInt(String(raw).trim(), 10);
  if (isNaN(num)) throw new Error(`Invalid max DOT value: ${raw}`);

  return num;
}

// ── Airtable: check if DOT already exists ─────────────────────────────────────

async function dotExistsInAirtable(dotNumber) {
  const params = new URLSearchParams({
    pageSize: '1',
    'fields[]': 'DOT_NUMBER',
    filterByFormula: `DOT_NUMBER = ${dotNumber}`,
  });

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: airtableHeaders() });

  if (!res.ok) return false; // Treat as non-existent on error to avoid blocking scans
  const data = await res.json();
  return (data.records?.length ?? 0) > 0;
}

// ── Airtable: insert new carrier ──────────────────────────────────────────────

async function insertCarrier(fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable insert failed ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.id; // Airtable record ID
}

// ── FMCSA helper ──────────────────────────────────────────────────────────────

/**
 * Fetch carrier data from the FMCSA QC API.
 * Returns the carrier object or null if not found / inactive.
 */
async function fetchFmcsaCarrier(dotNumber) {
  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${process.env.FMCSA_WEB_KEY}`;
  const res = await fetch(url);

  if (res.status === 404) return null;
  if (res.status === 403) return null; // Restricted record (investigation hold, revocation pending) — skip silently
  if (!res.ok) throw new Error(`FMCSA API ${res.status} for DOT ${dotNumber}`);

  const data = await res.json();

  // Detect invalid web key — FMCSA returns HTTP 200 with string content "Webkey not found"
  if (typeof data?.content === 'string' && data.content.toLowerCase().includes('webkey')) {
    throw new Error(`FMCSA web key invalid or not set (FMCSA_WEB_KEY env var missing)`);
  }

  return data?.content?.carrier || data?.carrier || null;
}

/**
 * Map FMCSA carrier object to Airtable Carriers (Master) fields.
 */
function buildAirtableFields(dotNumber, fmcsa) {
  return {
    DOT_NUMBER:        dotNumber,
    LEGAL_NAME:        fmcsa.legalName        || fmcsa.legal_name        || null,
    DBA_NAME:          fmcsa.dbaName          || fmcsa.dba_name          || null,
    CARRIER_OPERATION: fmcsa.carrierOperation || fmcsa.carrier_operation || null,
    NBR_POWER_UNIT:    fmcsa.nbrPowerUnit  != null ? Number(fmcsa.nbrPowerUnit)  : (fmcsa.nbr_power_unit  != null ? Number(fmcsa.nbr_power_unit)  : null),
    TOTAL_DRIVERS:     fmcsa.totalDrivers  != null ? Number(fmcsa.totalDrivers)  : (fmcsa.total_drivers  != null ? Number(fmcsa.total_drivers)  : null),
    SAFETY_RATING:     fmcsa.safetyRating     || fmcsa.safety_rating     || null,
    PHY_CITY:          fmcsa.phyCity          || fmcsa.phy_city          || null,
    PHY_STATE:         fmcsa.phyState         || fmcsa.phy_state         || null,
    PHY_ZIP:           fmcsa.phyZip           || fmcsa.phy_zip           || null,
    TELEPHONE:         fmcsa.telephone        || null,
  };
}

// ── Pinecone embed via Railway ─────────────────────────────────────────────────

async function embedCarrier(airtableRecordId, fields) {
  const profile = {
    dot_number:        String(fields.DOT_NUMBER || ''),
    legal_name:        fields.LEGAL_NAME        || 'unknown',
    carrier_operation: fields.CARRIER_OPERATION || 'unknown',
    nbr_power_unit:    fields.NBR_POWER_UNIT    || 0,
    total_drivers:     fields.TOTAL_DRIVERS     || 0,
    safety_rating:     fields.SAFETY_RATING     || 'unknown',
    phy_state:         fields.PHY_STATE         || 'unknown',
  };

  const res = await fetch(`${RAILWAY_URL}/v1/embed/carrier`, {
    method: 'POST',
    headers: {
      'x-lmdr-internal-key': process.env.LMDR_INTERNAL_KEY,
      'x-lmdr-timestamp':    Date.now().toString(),
      'Content-Type':        'application/json',
    },
    body: JSON.stringify({
      carrierId:        airtableRecordId,
      dot_number:       String(fields.DOT_NUMBER || ''),
      profileUpdatedAt: new Date().toISOString().split('T')[0],
      profile,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embed failed ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

// ── Route ──────────────────────────────────────────────────────────────────────

fmcsaRosterSyncRouter.post('/', async (c) => {
  const startedAt = new Date().toISOString();
  const stats = { scanned: 0, new_carriers_found: 0, inserted: 0, embed_queued: 0, failed: 0 };
  const errors = [];

  try {
    // 1. Find the current highest DOT in Airtable
    let maxDot;
    try {
      maxDot = await fetchMaxDotNumber();
    } catch (err) {
      return c.json({ error: { code: 'AIRTABLE_ERROR', message: err.message } }, 502);
    }

    console.log(`[fmcsa-roster-sync] Starting scan from DOT ${maxDot + 1} (window: ${SCAN_WINDOW})`);

    // 2. Sequential scan above max DOT
    for (let dot = maxDot + 1; dot <= maxDot + SCAN_WINDOW; dot++) {
      if (stats.inserted >= MAX_INSERTS) {
        console.log(`[fmcsa-roster-sync] Reached MAX_INSERTS (${MAX_INSERTS}), stopping early`);
        break;
      }

      stats.scanned++;

      try {
        // Check FMCSA first (cheaper than Airtable query if DOT is invalid)
        const fmcsa = await fetchFmcsaCarrier(dot);

        if (!fmcsa) {
          // DOT not found or inactive — skip silently
          await sleep(FMCSA_RATE_MS);
          continue;
        }

        stats.new_carriers_found++;

        // Double-check Airtable in case DOTs aren't strictly sequential in our dataset
        const alreadyExists = await dotExistsInAirtable(dot);
        if (alreadyExists) {
          console.log(`[fmcsa-roster-sync] DOT ${dot} already in Airtable, skipping`);
          await sleep(FMCSA_RATE_MS);
          continue;
        }

        // Build field map and insert
        const fields = buildAirtableFields(dot, fmcsa);
        // Remove null fields — Airtable rejects explicit nulls on create
        const cleanFields = Object.fromEntries(
          Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
        );

        const recordId = await insertCarrier(cleanFields);
        stats.inserted++;
        console.log(`[fmcsa-roster-sync] Inserted DOT ${dot} → ${recordId} (${fields.LEGAL_NAME})`);

        // Queue Pinecone embed (non-fatal if it fails)
        try {
          await embedCarrier(recordId, cleanFields);
          stats.embed_queued++;
        } catch (embedErr) {
          console.warn(`[fmcsa-roster-sync] Embed failed for DOT ${dot}: ${embedErr.message}`);
          // Don't count as a hard failure — carrier is in Airtable, backfill will retry
        }

      } catch (err) {
        stats.failed++;
        const msg = `DOT ${dot}: ${err.message}`;
        errors.push(msg);
        console.error(`[fmcsa-roster-sync] ${msg}`);
      }

      await sleep(FMCSA_RATE_MS);
    }

    return c.json({
      ...stats,
      scan_start: maxDot + 1,
      scan_end:   maxDot + stats.scanned,
      startedAt,
      completedAt: new Date().toISOString(),
      ...(errors.length > 0 ? { errors: errors.slice(0, 20) } : {}),
    });

  } catch (err) {
    console.error('[fmcsa-roster-sync] Unexpected error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
      ...stats,
    }, 500);
  }
});
