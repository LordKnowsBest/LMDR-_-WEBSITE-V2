/**
 * POST /v1/jobs/freight-signals
 *
 * Fetches freight cost signal data from the St. Louis Fed FRED API and writes
 * records to the VelocityMatch DataLake Airtable base (table: RAW_Freight Signals).
 *
 * Series fetched:
 *   WPU3012 — Truck transportation Producer Price Index (freight)
 *   PPIACO  — Overall Producer Price Index (all commodities)
 *
 * Fetches 4 most-recent observations per series to allow change_pct calculation.
 *
 * Fields written: period, series_id, value, change_pct, fetched_at
 */

import { Hono } from 'hono';

export const freightSignalsRouter = new Hono();

const DATALAKE_BASE  = 'appt00rHHBOiKx9xl';
const DATALAKE_TABLE = 'RAW_Freight Signals';

const FRED_SERIES = ['WPU3012', 'PPIACO'];

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

// ── Airtable helpers ─────────────────────────────────────────────────────────

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

async function insertSignalRecord(fields) {
  const url = `https://api.airtable.com/v0/${DATALAKE_BASE}/${encodeURIComponent(DATALAKE_TABLE)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable insert failed ${res.status}: ${body}`);
  }

  return await res.json();
}

// ── FRED helper ───────────────────────────────────────────────────────────────

/**
 * Fetch the 4 most recent observations for a FRED series.
 * Returns an array of { date, value } ordered newest-first.
 */
async function fetchFredSeries(seriesId) {
  const params = new URLSearchParams({
    series_id:  seriesId,
    api_key:    process.env.FRED_API_KEY,
    sort_order: 'desc',
    limit:      '4',
    file_type:  'json',
  });

  const res = await fetch(`${FRED_BASE_URL}?${params}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FRED API ${res.status} for ${seriesId}: ${body}`);
  }

  const data = await res.json();
  return (data.observations || []).map(o => ({
    date:  o.date,
    value: o.value === '.' ? null : Number(o.value),
  }));
}

/**
 * Calculate the percentage change between two consecutive values.
 * Returns null if either value is missing/zero.
 */
function calcChangePct(current, previous) {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 10_000) / 100; // 2 decimal places
}

// ── Route ─────────────────────────────────────────────────────────────────────

freightSignalsRouter.post('/', async (c) => {
  const fetchedAt = new Date().toISOString();
  let records_written = 0;
  let records_failed  = 0;
  const errors = [];

  for (const seriesId of FRED_SERIES) {
    let observations;
    try {
      observations = await fetchFredSeries(seriesId);
    } catch (err) {
      console.error(`[freight-signals] FRED fetch failed for ${seriesId}:`, err.message);
      errors.push(`${seriesId}: ${err.message}`);
      records_failed++;
      continue;
    }

    // observations are newest-first; write up to 4 records
    // change_pct for index i = change from observations[i+1] to observations[i]
    for (let i = 0; i < observations.length; i++) {
      const obs      = observations[i];
      const prevObs  = observations[i + 1] || null;
      const changePct = prevObs ? calcChangePct(obs.value, prevObs.value) : null;

      try {
        await insertSignalRecord({
          period:     obs.date,
          series_id:  seriesId,
          value:      obs.value,
          change_pct: changePct,
          fetched_at: fetchedAt,
        });
        records_written++;
      } catch (err) {
        records_failed++;
        errors.push(`${seriesId} ${obs.date}: ${err.message}`);
        console.error('[freight-signals] Insert failed:', err.message);
      }
    }
  }

  return c.json({
    records_written,
    records_failed,
    series_fetched: FRED_SERIES,
    fetchedAt,
    ...(errors.length > 0 ? { errors } : {}),
  });
});
