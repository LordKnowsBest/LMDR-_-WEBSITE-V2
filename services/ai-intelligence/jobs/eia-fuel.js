/**
 * POST /v1/jobs/eia-fuel
 *
 * Fetches weekly diesel fuel price data from the EIA API and writes records
 * to the VelocityMatch DataLake Airtable base (table: RAW_Fuel Prices).
 *
 * EIA series: DPF (Diesel Price, US Average)
 * Fetches the 10 most recent weekly observations.
 *
 * Fields written: period, region, price_per_gallon, fetched_at
 */

import { Hono } from 'hono';

export const eiaFuelRouter = new Hono();

const DATALAKE_BASE  = 'appt00rHHBOiKx9xl';
const DATALAKE_TABLE = 'RAW_Fuel Prices';

const EIA_URL = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/'
  + '?frequency=weekly'
  + '&data[]=value'
  + '&facets[product][]=DPF'
  + '&sort[0][column]=period'
  + '&sort[0][direction]=desc'
  + '&length=10';

// ── Airtable helpers ─────────────────────────────────────────────────────────

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

async function upsertFuelRecord(fields) {
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

// ── Route ─────────────────────────────────────────────────────────────────────

eiaFuelRouter.post('/', async (c) => {
  const fetchedAt = new Date().toISOString();

  // Fetch EIA data
  let eiaData;
  try {
    const url = `${EIA_URL}&api_key=${process.env.EIA_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      return c.json({ error: { code: 'EIA_ERROR', message: `EIA API ${res.status}: ${body}` } }, 502);
    }

    eiaData = await res.json();
  } catch (err) {
    console.error('[eia-fuel] Fetch failed:', err.message);
    return c.json({ error: { code: 'EIA_FETCH_ERROR', message: err.message } }, 502);
  }

  const observations = eiaData?.response?.data || [];

  if (observations.length === 0) {
    return c.json({ records_written: 0, message: 'No EIA observations returned', fetchedAt });
  }

  // Write each observation to Airtable
  let records_written = 0;
  let records_failed  = 0;
  const errors = [];

  for (const obs of observations) {
    try {
      await upsertFuelRecord({
        period:           obs.period || null,
        region:           obs.area_name || obs['area-name'] || 'US',
        price_per_gallon: obs.value !== undefined ? Number(obs.value) : null,
        fetched_at:       fetchedAt,
      });
      records_written++;
    } catch (err) {
      records_failed++;
      errors.push(`period ${obs.period}: ${err.message}`);
      console.error('[eia-fuel] Insert failed:', err.message);
    }
  }

  return c.json({
    records_written,
    records_failed,
    fetchedAt,
    ...(errors.length > 0 ? { errors } : {}),
  });
});
