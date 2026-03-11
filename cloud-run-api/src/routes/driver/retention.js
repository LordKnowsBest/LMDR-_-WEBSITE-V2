import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog } from '../../db/bigquery.js';

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
  console.error(`[driver/retention] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `retention/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── Risk calculation constants ──
const RISK_WEIGHTS = { dnps: 0.3, activityDrop: 0.25, safetyIncidents: 0.2, payVolatility: 0.15, homeTime: 0.1 };
const RISK_LEVELS = [
  { name: 'CRITICAL', min: 80 },
  { name: 'HIGH', min: 60 },
  { name: 'MEDIUM', min: 40 },
  { name: 'LOW', min: 0 },
];

function getRiskLevel(score) {
  return RISK_LEVELS.find(l => score >= l.min)?.name || 'LOW';
}

function generateRecommendations(factors, riskLevel) {
  const recommendations = [];
  if (factors.dnps >= 70) recommendations.push('Conduct immediate driver satisfaction survey');
  if (factors.activityDrop >= 60) recommendations.push('Schedule check-in call to discuss engagement');
  if (factors.safetyIncidents >= 50) recommendations.push('Enroll in safety refresher training');
  if (factors.payVolatility >= 60) recommendations.push('Review pay consistency and offer guaranteed minimums');
  if (factors.homeTime >= 50) recommendations.push('Evaluate route assignments for better home time');
  if (riskLevel === 'CRITICAL') recommendations.push('Escalate to retention specialist immediately');
  if (recommendations.length === 0) recommendations.push('Continue current engagement — driver appears satisfied');
  return recommendations;
}

// ── GET /:id/risk — Calculate retention risk score ──
router.get('/:id/risk', async (req, res) => {
  try {
    const { id } = req.params;
    const perfTable = getTableName('driverPerformance');

    const perfResult = await safeQuery(
      `SELECT * FROM "${perfTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 1`,
      [id]
    );

    const perf = perfResult.rows[0]?.data || {};

    // Normalize each factor to 0-100 (higher = worse / more risk)
    const factors = {
      dnps: Math.min(100, Math.max(0, 100 - (parseFloat(perf.dnps_score) || 50))),
      activityDrop: Math.min(100, Math.max(0, parseFloat(perf.activity_drop_pct) || 0)),
      safetyIncidents: Math.min(100, Math.max(0, (parseInt(perf.safety_incidents, 10) || 0) * 20)),
      payVolatility: Math.min(100, Math.max(0, parseFloat(perf.pay_volatility_pct) || 0)),
      homeTime: Math.min(100, Math.max(0, 100 - (parseFloat(perf.home_time_pct) || 50))),
    };

    const riskScore = Math.round(
      factors.dnps * RISK_WEIGHTS.dnps +
      factors.activityDrop * RISK_WEIGHTS.activityDrop +
      factors.safetyIncidents * RISK_WEIGHTS.safetyIncidents +
      factors.payVolatility * RISK_WEIGHTS.payVolatility +
      factors.homeTime * RISK_WEIGHTS.homeTime
    );

    const riskLevel = getRiskLevel(riskScore);
    const recommendations = generateRecommendations(factors, riskLevel);

    insertLog({ service: 'driver', level: 'INFO', message: 'risk_assessed', data: { driver_id: id, riskScore, riskLevel } });

    return res.json({ riskScore, riskLevel, factors, recommendations });
  } catch (err) {
    return handleError(res, 'risk', err);
  }
});

// ── GET /:id/risk/history — Risk log history ──
router.get('/:id/risk/history', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);
    const table = getTableName('retentionRiskLogs');

    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT $2`,
      [id, limit]
    );

    return res.json({ records: formatRecords(result.rows) });
  } catch (err) {
    return handleError(res, 'risk-history', err);
  }
});

// ── GET /:id/performance — Latest performance record ──
router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('driverPerformance');

    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No performance data found' });
    }

    return res.json(formatRecord(result.rows[0]));
  } catch (err) {
    return handleError(res, 'performance', err);
  }
});

// ── GET /:id/carrier-comparison — Compare driver's carrier to industry averages ──
router.get('/:id/carrier-comparison', async (req, res) => {
  try {
    const { id } = req.params;
    const profileTable = getTableName('driverProfiles');
    const carrierTable = getTableName('carriers');

    // Get driver's carrier_dot
    const profileResult = await safeQuery(
      `SELECT data->>'carrier_dot' AS carrier_dot FROM "${profileTable}" WHERE _id = $1 OR data->>'driver_id' = $1 LIMIT 1`,
      [id]
    );

    const carrierDot = profileResult.rows[0]?.carrier_dot;
    if (!carrierDot) {
      return res.status(404).json({ error: 'Driver profile or carrier assignment not found' });
    }

    // Get carrier data
    const carrierResult = await safeQuery(
      `SELECT * FROM "${carrierTable}" WHERE data->>'dot_number' = $1 LIMIT 1`,
      [carrierDot]
    );

    const carrier = carrierResult.rows[0]?.data || {};

    const carrierMetrics = {
      dot_number: carrierDot,
      name: carrier.name || carrier.legal_name || 'Unknown',
      avg_pay_per_mile: parseFloat(carrier.avg_pay_per_mile) || 0,
      safety_rating: carrier.safety_rating || 'N/A',
      driver_satisfaction: parseFloat(carrier.driver_satisfaction) || 0,
      home_time_pct: parseFloat(carrier.home_time_pct) || 0,
      turnover_rate: parseFloat(carrier.turnover_rate) || 0,
    };

    const industryAverage = {
      avg_pay_per_mile: 0.55,
      safety_rating: 'Satisfactory',
      driver_satisfaction: 65,
      home_time_pct: 45,
      turnover_rate: 90,
    };

    return res.json({ carrierMetrics, industryAverage });
  } catch (err) {
    return handleError(res, 'carrier-comparison', err);
  }
});

export default router;
