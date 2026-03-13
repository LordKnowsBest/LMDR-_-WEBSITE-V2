/**
 * POST /v1/jobs/fmcsa-sync
 *
 * Reads Carriers (Master) from Airtable in pages of 100, calls the FMCSA QC API
 * for each carrier with a DOT_NUMBER, and updates fields if changed.
 *
 * Fields updated: SAFETY_RATING, TOTAL_DRIVERS, NBR_POWER_UNIT, CARRIER_OPERATION
 *
 * Rate limit: 1 req/sec between FMCSA calls
 * Max carriers per run: 500
 *
 * Returns: { carriers_checked, carriers_updated, carriers_failed }
 */

import { Hono } from 'hono';

export const fmcsaSyncRouter = new Hono();

const AIRTABLE_BASE    = 'app9N1YCJ3gdhExA0';
const AIRTABLE_TABLE   = 'Carriers (Master)';
const PAGE_SIZE        = 100;
const MAX_CARRIERS     = 500;
const FMCSA_RATE_MS    = 1_000;

// ── Airtable helpers ─────────────────────────────────────────────────────────

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

/**
 * Fetch one page of carriers from Airtable.
 * Returns { records, offset } where offset is undefined on last page.
 */
async function fetchCarrierPage(offset) {
  const params = new URLSearchParams({
    pageSize: String(PAGE_SIZE),
    'fields[]': ['DOT_NUMBER', 'SAFETY_RATING', 'TOTAL_DRIVERS', 'NBR_POWER_UNIT', 'CARRIER_OPERATION'],
  });
  if (offset) params.set('offset', offset);

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`;
  const res = await fetch(url, { headers: airtableHeaders() });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable list failed ${res.status}: ${body}`);
  }

  const data = await res.json();
  return { records: data.records || [], offset: data.offset };
}

/**
 * PATCH a carrier record in Airtable with the given field updates.
 */
async function updateCarrierRecord(recordId, fields) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}/${recordId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable update failed ${res.status}: ${body}`);
  }
}

// ── FMCSA helper ─────────────────────────────────────────────────────────────

/**
 * Fetch carrier data from the FMCSA QC API.
 * Returns the carrier object or null on failure.
 */
async function fetchFmcsaCarrier(dotNumber) {
  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${process.env.FMCSA_WEB_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`FMCSA API ${res.status} for DOT ${dotNumber}`);
  }

  const data = await res.json();
  // FMCSA wraps the result in a "content" object
  return data?.content?.carrier || data?.carrier || null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Route ─────────────────────────────────────────────────────────────────────

fmcsaSyncRouter.post('/', async (c) => {
  const startedAt = new Date().toISOString();
  let carriers_checked = 0;
  let carriers_updated  = 0;
  let carriers_failed   = 0;

  const errors = [];

  try {
    let offset;
    let done = false;

    while (!done && carriers_checked < MAX_CARRIERS) {
      let page;
      try {
        page = await fetchCarrierPage(offset);
      } catch (err) {
        console.error('[fmcsa-sync] Airtable page fetch failed:', err.message);
        return c.json({
          error: { code: 'AIRTABLE_ERROR', message: err.message },
          carriers_checked,
          carriers_updated,
          carriers_failed,
        }, 502);
      }

      for (const record of page.records) {
        if (carriers_checked >= MAX_CARRIERS) { done = true; break; }

        const dotNumber = record.fields?.DOT_NUMBER;
        if (!dotNumber) continue;

        carriers_checked++;

        try {
          const fmcsa = await fetchFmcsaCarrier(String(dotNumber).trim());

          if (fmcsa) {
            const updates = {};

            const safetyRating = fmcsa.safetyRating || fmcsa.safety_rating || null;
            const totalDrivers  = fmcsa.totalDrivers  ?? fmcsa.total_drivers  ?? null;
            const nbrPowerUnit  = fmcsa.nbrPowerUnit  ?? fmcsa.nbr_power_unit ?? null;
            const carrierOp     = fmcsa.carrierOperation || fmcsa.carrier_operation || null;

            if (safetyRating !== null && safetyRating !== record.fields.SAFETY_RATING) {
              updates.SAFETY_RATING = safetyRating;
            }
            if (totalDrivers !== null && totalDrivers !== record.fields.TOTAL_DRIVERS) {
              updates.TOTAL_DRIVERS = Number(totalDrivers);
            }
            if (nbrPowerUnit !== null && nbrPowerUnit !== record.fields.NBR_POWER_UNIT) {
              updates.NBR_POWER_UNIT = Number(nbrPowerUnit);
            }
            if (carrierOp !== null && carrierOp !== record.fields.CARRIER_OPERATION) {
              updates.CARRIER_OPERATION = carrierOp;
            }

            if (Object.keys(updates).length > 0) {
              await updateCarrierRecord(record.id, updates);
              carriers_updated++;
              console.log(`[fmcsa-sync] Updated DOT ${dotNumber}: ${JSON.stringify(Object.keys(updates))}`);
            }
          }
        } catch (err) {
          carriers_failed++;
          const msg = `DOT ${dotNumber}: ${err.message}`;
          errors.push(msg);
          console.error(`[fmcsa-sync] ${msg}`);
        }

        // 1 req/sec rate limit between FMCSA calls
        await sleep(FMCSA_RATE_MS);
      }

      offset = page.offset;
      if (!offset) done = true;
    }

    return c.json({
      carriers_checked,
      carriers_updated,
      carriers_failed,
      startedAt,
      completedAt: new Date().toISOString(),
      ...(errors.length > 0 ? { errors: errors.slice(0, 20) } : {}),
    });
  } catch (err) {
    console.error('[fmcsa-sync] Unexpected error:', err);
    return c.json({
      error: { code: 'INTERNAL_ERROR', message: err.message },
      carriers_checked,
      carriers_updated,
      carriers_failed,
    }, 500);
  }
});
