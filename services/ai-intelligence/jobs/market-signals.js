/**
 * POST /v1/jobs/market-signals
 *
 * Reads the latest diesel prices (RAW_Diesel_Prices) and freight PPI data
 * (RAW_FRED_EconomicData) from the VelocityMatch DataLake, computes derived
 * market intelligence metrics, and upserts a signal record to v2_Market Signals
 * in the LMDR base.
 *
 * Computed fields:
 *   diesel_price_current   — most recent weekly price
 *   diesel_price_4wk_avg   — rolling 4-week average
 *   diesel_price_12wk_avg  — rolling 12-week average
 *   diesel_trend_pct       — % change vs 4-week avg (positive = rising)
 *   freight_ppi_current    — latest WPU3012 truck PPI value
 *   freight_ppi_trend_pct  — month-over-month % change
 *   overall_ppi_current    — latest PPIACO value
 *   market_condition       — HOT | NEUTRAL | SOFT
 *   driver_leverage        — HIGH | MEDIUM | LOW
 *   pay_adjustment_factor  — multiplier (0.85–1.15) fed into driverScoring.js
 *   market_summary         — single human-readable sentence
 *
 * The pay_adjustment_factor is the critical output: it tells the matching engine
 * how much more (or less) competitive carrier pay needs to be given current
 * diesel prices and freight market conditions.
 */

import { Hono } from 'hono';

export const marketSignalsRouter = new Hono();

const DATALAKE_BASE = 'appt00rHHBOiKx9xl';
const LMDR_BASE     = 'app9N1YCJ3gdhExA0';

// ── Airtable helpers ──────────────────────────────────────────────────────────

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
    'Content-Type':  'application/json',
  };
}

async function airtableFetch(url) {
  const res = await fetch(url, { headers: airtableHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ── DataLake readers ──────────────────────────────────────────────────────────

/**
 * Fetch the most recent N diesel price records, sorted newest-first.
 */
async function fetchDieselPrices(limit = 12) {
  const params = new URLSearchParams({
    pageSize: String(limit),
    view: 'Grid view',
    'sort[0][field]': 'price_date',
    'sort[0][direction]': 'desc',
  });
  const data = await airtableFetch(
    `https://api.airtable.com/v0/${DATALAKE_BASE}/${encodeURIComponent('RAW_Diesel_Prices')}?${params}`
  );
  return (data.records || []).map(r => ({
    date:  r.fields.price_date,
    price: Number(r.fields.price_value) || null,
  })).filter(r => r.price !== null);
}

/**
 * Fetch the most recent 4 observations for a FRED series from the DataLake.
 */
async function fetchFredSeries(seriesId, limit = 4) {
  const params = new URLSearchParams({
    pageSize: String(limit),
    view: 'Grid view',
    filterByFormula: `series_id = "${seriesId}"`,
    'sort[0][field]': 'observation_date',
    'sort[0][direction]': 'desc',
  });
  const data = await airtableFetch(
    `https://api.airtable.com/v0/${DATALAKE_BASE}/${encodeURIComponent('RAW_FRED_EconomicData')}?${params}`
  );
  return (data.records || []).map(r => ({
    date:  r.fields.observation_date,
    value: Number(r.fields.observation_value) || null,
  })).filter(r => r.value !== null);
}

// ── Signal computation ────────────────────────────────────────────────────────

function avg(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pctChange(current, base) {
  if (!base || base === 0) return null;
  return Math.round(((current - base) / Math.abs(base)) * 10_000) / 100;
}

/**
 * Core computation: takes raw price arrays, returns the full signal object.
 */
function computeSignal(dieselPrices, freightPpi, overallPpi) {
  // ── Diesel ────────────────────────────────────────────────────────────────
  const dieselCurrent   = dieselPrices[0]?.price   ?? null;
  const diesel4wkAvg    = avg(dieselPrices.slice(0, 4).map(r => r.price));
  const diesel12wkAvg   = avg(dieselPrices.slice(0, 12).map(r => r.price));
  const dieselTrendPct  = dieselCurrent !== null && diesel4wkAvg !== null
    ? pctChange(dieselCurrent, diesel4wkAvg) : null;

  // ── Freight PPI ───────────────────────────────────────────────────────────
  const freightCurrent   = freightPpi[0]?.value   ?? null;
  const freightPrev      = freightPpi[1]?.value   ?? null;
  const freightTrendPct  = freightCurrent !== null && freightPrev !== null
    ? pctChange(freightCurrent, freightPrev) : null;

  // ── Overall PPI ───────────────────────────────────────────────────────────
  const overallCurrent = overallPpi[0]?.value ?? null;

  // ── Market condition ──────────────────────────────────────────────────────
  // HOT  = diesel up AND freight up   → drivers have leverage, pay expectations rise
  // SOFT = diesel down AND freight down → carriers have more leverage
  // NEUTRAL = mixed or insufficient data
  let market_condition = 'NEUTRAL';
  if (dieselTrendPct !== null && freightTrendPct !== null) {
    const dieselUp   = dieselTrendPct  > 2;
    const dieselDown = dieselTrendPct  < -1;
    const freightUp  = freightTrendPct > 1;
    const freightDown= freightTrendPct < -1;

    if (dieselUp && freightUp)      market_condition = 'HOT';
    else if (dieselDown && freightDown) market_condition = 'SOFT';
  }

  // ── Driver leverage ───────────────────────────────────────────────────────
  const driver_leverage =
    market_condition === 'HOT'  ? 'HIGH'   :
    market_condition === 'SOFT' ? 'LOW'    : 'MEDIUM';

  // ── Pay adjustment factor ─────────────────────────────────────────────────
  // This number multiplies the compensation score in driverScoring.js.
  // 1.0 = neutral market, >1.0 = drivers should expect/require more pay,
  // <1.0 = soft market, carriers have leverage on pay.
  let pay_adjustment_factor = 1.0;

  // Diesel premium: each 5% rise above 12wk avg adds 0.04
  if (dieselCurrent !== null && diesel12wkAvg !== null) {
    const vsBaseline = pctChange(dieselCurrent, diesel12wkAvg);
    if (vsBaseline > 10)     pay_adjustment_factor += 0.08;
    else if (vsBaseline > 5) pay_adjustment_factor += 0.04;
    else if (vsBaseline < -5) pay_adjustment_factor -= 0.04;
  }

  // Freight market premium
  if (freightTrendPct !== null) {
    if (freightTrendPct > 3)      pay_adjustment_factor += 0.05;
    else if (freightTrendPct > 1) pay_adjustment_factor += 0.02;
    else if (freightTrendPct < -3) pay_adjustment_factor -= 0.05;
    else if (freightTrendPct < -1) pay_adjustment_factor -= 0.02;
  }

  // Clamp between 0.85 and 1.15
  pay_adjustment_factor = Math.max(0.85, Math.min(1.15, pay_adjustment_factor));
  pay_adjustment_factor = Math.round(pay_adjustment_factor * 1000) / 1000;

  // ── Human-readable summary ────────────────────────────────────────────────
  const dieselStr   = dieselCurrent  ? `Diesel $${dieselCurrent.toFixed(3)}/gal` : 'Diesel data pending';
  const freightStr  = freightTrendPct !== null
    ? `freight PPI ${freightTrendPct > 0 ? '+' : ''}${freightTrendPct.toFixed(1)}% MoM`
    : 'freight data pending';
  const leverageStr = driver_leverage === 'HIGH'   ? 'drivers hold leverage — expect pay pressure upward'
                    : driver_leverage === 'LOW'    ? 'carriers hold leverage — pay pressure stable'
                    :                               'mixed market — neutral pay environment';
  const market_summary = `${dieselStr}, ${freightStr} → ${leverageStr}.`;

  return {
    signal_date:           new Date().toISOString().split('T')[0],
    diesel_price_current:  dieselCurrent,
    diesel_price_4wk_avg:  diesel4wkAvg  !== null ? Math.round(diesel4wkAvg  * 1000) / 1000 : null,
    diesel_price_12wk_avg: diesel12wkAvg !== null ? Math.round(diesel12wkAvg * 1000) / 1000 : null,
    diesel_trend_pct:      dieselTrendPct,
    freight_ppi_current:   freightCurrent,
    freight_ppi_trend_pct: freightTrendPct,
    overall_ppi_current:   overallCurrent,
    market_condition,
    driver_leverage,
    pay_adjustment_factor,
    market_summary,
    computed_at:           new Date().toISOString(),
  };
}

// ── Airtable upsert ───────────────────────────────────────────────────────────

/**
 * Check for an existing signal record for today's date and upsert.
 * We keep one record per day (overwrite if re-run).
 */
async function upsertSignal(fields) {
  const today = fields.signal_date;
  const params = new URLSearchParams({
    pageSize: '1',
    filterByFormula: `signal_date = "${today}"`,
  });
  const existing = await airtableFetch(
    `https://api.airtable.com/v0/${LMDR_BASE}/${encodeURIComponent('v2_Market Signals')}?${params}`
  );

  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== null && v !== undefined)
  );

  if (existing.records?.length > 0) {
    // Update
    const recordId = existing.records[0].id;
    const res = await fetch(
      `https://api.airtable.com/v0/${LMDR_BASE}/${encodeURIComponent('v2_Market Signals')}/${recordId}`,
      { method: 'PATCH', headers: airtableHeaders(), body: JSON.stringify({ fields: cleanFields }) }
    );
    if (!res.ok) throw new Error(`Update failed ${res.status}: ${await res.text()}`);
    return { action: 'updated', recordId };
  }

  // Create
  const res = await fetch(
    `https://api.airtable.com/v0/${LMDR_BASE}/${encodeURIComponent('v2_Market Signals')}`,
    { method: 'POST', headers: airtableHeaders(), body: JSON.stringify({ fields: cleanFields }) }
  );
  if (!res.ok) throw new Error(`Create failed ${res.status}: ${await res.text()}`);
  const created = await res.json();
  return { action: 'created', recordId: created.id };
}

// ── Route ──────────────────────────────────────────────────────────────────────

marketSignalsRouter.post('/', async (c) => {
  const startedAt = new Date().toISOString();

  try {
    // Fetch all raw data in parallel
    const [dieselPrices, freightPpi, overallPpi] = await Promise.all([
      fetchDieselPrices(12),
      fetchFredSeries('WPU3012', 4),
      fetchFredSeries('PPIACO',  4),
    ]);

    if (dieselPrices.length === 0) {
      return c.json({ error: { code: 'NO_DIESEL_DATA', message: 'No diesel price records in DataLake — run eia-fuel job first' } }, 422);
    }

    const signal = computeSignal(dieselPrices, freightPpi, overallPpi);
    const result = await upsertSignal(signal);

    console.log(`[market-signals] ${result.action} signal for ${signal.signal_date} — condition: ${signal.market_condition}, factor: ${signal.pay_adjustment_factor}`);

    return c.json({
      ...result,
      signal,
      startedAt,
      completedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[market-signals] Error:', err.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
  }
});
