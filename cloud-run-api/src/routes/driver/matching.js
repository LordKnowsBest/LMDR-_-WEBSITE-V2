import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog } from '../../db/bigquery.js';
import { scoreMatch, rankMatches, DEFAULT_WEIGHTS } from '../../lib/driver-scoring.js';

const router = Router();

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function formatRecords(rows) { return (rows || []).map(formatRecord); }

async function safeQuery(sql, params) {
  try { return await query(sql, params); }
  catch (err) { if (err.message?.includes('does not exist')) return { rows: [] }; throw err; }
}

function handleError(res, context, err) {
  console.error(`[driver/matching] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `matching/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

/** Load active weights from matching_model_weights table, fall back to defaults */
async function getActiveWeights() {
  try {
    const result = await query(`SELECT weights FROM "matching_model_weights" WHERE is_active = true LIMIT 1`);
    if (result.rows.length > 0) return result.rows[0].weights;
  } catch { /* table may not exist yet */ }
  return DEFAULT_WEIGHTS;
}

// ── POST /matching/find-jobs ──
router.post('/find-jobs', async (req, res) => {
  try {
    const { driverId, filters, limit = 20 } = req.body;
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');
    const enrichTable = getTableName('carrierEnrichments');

    // Get driver profile
    const driverResult = await safeQuery(`SELECT * FROM "${driversTable}" WHERE _id = $1`, [driverId]);
    if (driverResult.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    const driver = driverResult.rows[0].data || {};

    // Get carriers (with optional filters)
    let carrierSql = `SELECT c.*, e.data AS enrichment_data FROM "${carriersTable}" c LEFT JOIN "${enrichTable}" e ON c.data->>'dot_number' = e.data->>'dot_number'`;
    const carrierResult = await safeQuery(`${carrierSql} LIMIT $1`, [Math.min(parseInt(limit) * 5, 500)]);

    // Score and rank
    const weights = await getActiveWeights();
    const carriers = carrierResult.rows.map(row => {
      const data = row.data || {};
      const enrichment = row.enrichment_data || {};
      return { ...data, ...enrichment, _id: row._id };
    });

    const ranked = rankMatches(driver, carriers, weights).slice(0, parseInt(limit));

    return res.json({
      matches: ranked.map((r, i) => ({
        position: i + 1,
        carrierId: r.carrier._id,
        carrierName: r.carrier.legal_name || r.carrier.carrier_name || 'Unknown',
        score: r.score,
        factors: r.factors,
        dotNumber: r.carrier.dot_number,
        state: r.carrier.state,
        fleetSize: r.carrier.fleet_size || r.carrier.power_units,
      })),
      totalScored: carriers.length,
      modelVersion: 'default',
    });
  } catch (err) { return handleError(res, 'find-jobs', err); }
});

// ── POST /matching/find-drivers ──
router.post('/find-drivers', async (req, res) => {
  try {
    const { carrierDot, filters, limit = 20 } = req.body;
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');

    const carrierResult = await safeQuery(`SELECT * FROM "${carriersTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [String(carrierDot)]);
    if (carrierResult.rows.length === 0) return res.status(404).json({ error: 'CARRIER_NOT_FOUND' });
    const carrier = carrierResult.rows[0].data || {};

    const driversResult = await safeQuery(`SELECT * FROM "${driversTable}" WHERE data->>'is_discoverable' = 'Yes' LIMIT $1`, [Math.min(parseInt(limit) * 3, 300)]);
    const weights = await getActiveWeights();
    const drivers = driversResult.rows.map(r => ({ ...(r.data || {}), _id: r._id }));

    const ranked = drivers.map(d => ({ driver: d, ...scoreMatch(d, carrier, weights) })).sort((a, b) => b.score - a.score).slice(0, parseInt(limit));

    return res.json({
      drivers: ranked.map((r, i) => ({
        position: i + 1,
        driverId: r.driver._id,
        name: `${r.driver.first_name || ''} ${r.driver.last_name || ''}`.trim() || 'Driver',
        score: r.score,
        factors: r.factors,
        cdlClass: r.driver.cdl_class,
        yearsExperience: r.driver.years_experience,
        state: r.driver.home_state,
      })),
      totalScored: drivers.length,
    });
  } catch (err) { return handleError(res, 'find-drivers', err); }
});

// ── GET /matching/explain/:driverId/:carrierDot ──
router.get('/explain/:driverId/:carrierDot', async (req, res) => {
  try {
    const { driverId, carrierDot } = req.params;
    const driversTable = getTableName('driverProfiles');
    const carriersTable = getTableName('carriers');
    const enrichTable = getTableName('carrierEnrichments');

    const [driverR, carrierR, enrichR] = await Promise.all([
      safeQuery(`SELECT * FROM "${driversTable}" WHERE _id = $1`, [driverId]),
      safeQuery(`SELECT * FROM "${carriersTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [carrierDot]),
      safeQuery(`SELECT * FROM "${enrichTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [carrierDot]),
    ]);

    if (driverR.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });
    if (carrierR.rows.length === 0) return res.status(404).json({ error: 'CARRIER_NOT_FOUND' });

    const driver = driverR.rows[0].data || {};
    const carrier = { ...(carrierR.rows[0].data || {}), ...(enrichR.rows[0]?.data || {}) };
    const weights = await getActiveWeights();
    const { score, factors } = scoreMatch(driver, carrier, weights);

    const categories = [
      { key: 'location', label: 'Location', score: Math.round(factors.location * 100), status: factors.location >= 0.8 ? 'good' : factors.location >= 0.5 ? 'average' : 'poor' },
      { key: 'pay', label: 'Pay Match', score: Math.round(factors.pay * 100), status: factors.pay >= 0.8 ? 'good' : 'average' },
      { key: 'safety', label: 'Safety Record', score: Math.round(factors.safety * 100), status: factors.safety >= 0.8 ? 'good' : factors.safety >= 0.5 ? 'average' : 'poor' },
      { key: 'culture', label: 'Culture Fit', score: Math.round(factors.culture * 100), status: factors.culture >= 0.7 ? 'good' : 'average' },
      { key: 'routeType', label: 'Route Type', score: Math.round(factors.routeType * 100), status: factors.routeType >= 0.8 ? 'perfect' : 'partial' },
      { key: 'fleetAge', label: 'Fleet Quality', score: Math.round(factors.fleetAge * 100), status: factors.fleetAge >= 0.8 ? 'good' : 'average' },
    ];

    const tier = score >= 85 ? 'Strong' : score >= 70 ? 'Good' : score >= 50 ? 'Potential' : 'Partial';

    return res.json({
      overallScore: score,
      summary: `You are a ${tier} match for ${carrier.legal_name || 'this carrier'} (${score}%)`,
      categories,
      carrierDot,
      carrierName: carrier.legal_name || carrier.carrier_name,
    });
  } catch (err) { return handleError(res, 'explain', err); }
});

// ── GET /matching/weights ──
router.get('/weights', async (req, res) => {
  try {
    const weights = await getActiveWeights();
    return res.json({ weights, isDefault: weights === DEFAULT_WEIGHTS });
  } catch (err) { return handleError(res, 'get-weights', err); }
});

// ── GET /matching/search/jobs ──
router.get('/search/jobs', async (req, res) => {
  try {
    const table = getTableName('jobPostings');
    const { cdlClass, jobType, state, payType, limit = 20, skip = 0 } = req.query;
    const filters = [];
    if (cdlClass) filters.push({ field: 'cdl_class', operator: 'eq', value: cdlClass });
    if (jobType) filters.push({ field: 'job_type', operator: 'eq', value: jobType });
    if (state) filters.push({ field: 'state', operator: 'eq', value: state });
    if (payType) filters.push({ field: 'pay_type', operator: 'eq', value: payType });
    const selectQ = buildSelectQuery(table, { filters, limit: parseInt(limit), skip: parseInt(skip) });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ items: formatRecords(data.rows), totalCount: parseInt(count.rows[0]?.count) || 0 });
  } catch (err) { return handleError(res, 'search-jobs', err); }
});

// ── GET /matching/search/drivers ──
router.get('/search/drivers', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const { cdlClass, state, endorsements, limit = 20, skip = 0 } = req.query;
    const filters = [{ field: 'is_discoverable', operator: 'eq', value: 'Yes' }];
    if (cdlClass) filters.push({ field: 'cdl_class', operator: 'eq', value: cdlClass });
    if (state) filters.push({ field: 'home_state', operator: 'eq', value: state });
    const selectQ = buildSelectQuery(table, { filters, limit: parseInt(limit), skip: parseInt(skip) });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ items: formatRecords(data.rows), totalCount: parseInt(count.rows[0]?.count) || 0 });
  } catch (err) { return handleError(res, 'search-drivers', err); }
});

// ── POST /matching/detect-mutual ──
router.post('/detect-mutual', async (req, res) => {
  try {
    const { driverId, carrierDot } = req.body;
    const interestsTable = getTableName('driverCarrierInterests');
    const viewsTable = getTableName('carrierDriverViews');
    const [driverInterest, carrierView] = await Promise.all([
      safeQuery(`SELECT * FROM "${interestsTable}" WHERE data->>'driver_id' = $1 AND data->>'carrier_dot' = $2 LIMIT 1`, [driverId, carrierDot]),
      safeQuery(`SELECT * FROM "${viewsTable}" WHERE data->>'driver_id' = $1 AND data->>'carrier_dot' = $2 LIMIT 1`, [driverId, carrierDot]),
    ]);
    return res.json({ isMutualMatch: driverInterest.rows.length > 0 && carrierView.rows.length > 0, driverInterested: driverInterest.rows.length > 0, carrierViewed: carrierView.rows.length > 0 });
  } catch (err) { return handleError(res, 'detect-mutual', err); }
});

// ── GET /matching/model-info ──
router.get('/model-info', async (req, res) => {
  try {
    const result = await safeQuery(`SELECT model_version, weights, training_metrics, promoted_at, created_at FROM "matching_model_weights" WHERE is_active = true LIMIT 1`);
    if (result.rows.length === 0) return res.json({ modelVersion: 'default', weights: DEFAULT_WEIGHTS, trainingMetrics: null });
    const row = result.rows[0];
    return res.json({ modelVersion: row.model_version, weights: row.weights, trainingMetrics: row.training_metrics, promotedAt: row.promoted_at });
  } catch (err) { return handleError(res, 'model-info', err); }
});

export default router;
