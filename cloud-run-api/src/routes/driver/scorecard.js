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
  console.error(`[driver/scorecard] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `scorecard/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /:id/current ── Get current scores for driver
router.get('/:id/current', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('driverScores');

    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No scores found for driver' });
    }

    const record = formatRecord(result.rows[0]);
    return res.json({
      _id: record._id,
      driver_id: record.driver_id,
      overall_score: record.overall_score || 0,
      safety_score: record.safety_score || 0,
      efficiency_score: record.efficiency_score || 0,
      service_score: record.service_score || 0,
      compliance_score: record.compliance_score || 0,
      period_type: record.period_type,
      _createdAt: record._createdAt,
      _updatedAt: record._updatedAt,
    });
  } catch (err) {
    return handleError(res, 'current', err);
  }
});

// ── GET /:id/history ── Get score history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'monthly', limit: rawLimit } = req.query;
    const limit = Math.min(parseInt(rawLimit, 10) || 12, 100);
    const table = getTableName('driverScores');

    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 AND data->>'period_type' = $2 ORDER BY _created_at DESC LIMIT $3`,
      [id, period, limit]
    );

    return res.json({ records: formatRecords(result.rows), period, total: result.rows.length });
  } catch (err) {
    return handleError(res, 'history', err);
  }
});

// ── GET /:id/rank ── Get driver's rank among all drivers
router.get('/:id/rank', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('driverScores');

    // Get the driver's latest score
    const driverResult = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 1`,
      [id]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'No scores found for driver' });
    }

    const driverScore = parseFloat(driverResult.rows[0].data?.overall_score) || 0;

    // Get latest score per driver using DISTINCT ON, then count those with higher scores
    const [higherResult, totalResult] = await Promise.all([
      safeQuery(
        `SELECT COUNT(*) AS count FROM (SELECT DISTINCT ON (data->>'driver_id') data->>'overall_score' AS score FROM "${table}" ORDER BY data->>'driver_id', _created_at DESC) AS latest WHERE CAST(score AS NUMERIC) > $1`,
        [driverScore]
      ),
      safeQuery(
        `SELECT COUNT(DISTINCT data->>'driver_id') AS count FROM "${table}"`,
        []
      ),
    ]);

    const driversAbove = parseInt(higherResult.rows[0]?.count, 10) || 0;
    const totalDrivers = parseInt(totalResult.rows[0]?.count, 10) || 1;
    const rank = driversAbove + 1;
    const percentile = Math.round(((totalDrivers - rank) / totalDrivers) * 100);

    return res.json({ rank, totalDrivers, percentile });
  } catch (err) {
    return handleError(res, 'rank', err);
  }
});

// ── GET /:id/fleet-comparison ── Compare driver to fleet average
router.get('/:id/fleet-comparison', async (req, res) => {
  try {
    const { id } = req.params;
    const scoresTable = getTableName('driverScores');
    const fleetTable = getTableName('fleetDrivers');

    // Get driver's fleet assignment
    const fleetResult = await safeQuery(
      `SELECT * FROM "${fleetTable}" WHERE data->>'driver_id' = $1 LIMIT 1`,
      [id]
    );

    if (fleetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not assigned to a fleet' });
    }

    const fleetId = fleetResult.rows[0].data?.fleet_id;

    // Get all fleet member IDs
    const membersResult = await safeQuery(
      `SELECT data->>'driver_id' AS driver_id FROM "${fleetTable}" WHERE data->>'fleet_id' = $1`,
      [fleetId]
    );

    const memberIds = membersResult.rows.map(r => r.driver_id).filter(Boolean);

    if (memberIds.length === 0) {
      return res.status(404).json({ error: 'No fleet members found' });
    }

    // Get latest scores for all fleet members
    const placeholders = memberIds.map((_, i) => `$${i + 1}`).join(', ');
    const fleetScoresResult = await safeQuery(
      `SELECT DISTINCT ON (data->>'driver_id') * FROM "${scoresTable}" WHERE data->>'driver_id' IN (${placeholders}) ORDER BY data->>'driver_id', _created_at DESC`,
      memberIds
    );

    const fleetScores = fleetScoresResult.rows.map(r => r.data || {});
    const categories = ['overall_score', 'safety_score', 'efficiency_score', 'service_score', 'compliance_score'];

    // Calculate fleet averages
    const fleetAverage = {};
    for (const cat of categories) {
      const values = fleetScores.map(s => parseFloat(s[cat]) || 0);
      fleetAverage[cat] = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0;
    }

    // Get driver's own scores
    const driverScoreResult = await safeQuery(
      `SELECT * FROM "${scoresTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 1`,
      [id]
    );

    const driverData = driverScoreResult.rows[0]?.data || {};
    const driverScores = {};
    const comparison = {};
    for (const cat of categories) {
      driverScores[cat] = parseFloat(driverData[cat]) || 0;
      comparison[cat] = Math.round((driverScores[cat] - fleetAverage[cat]) * 100) / 100;
    }

    return res.json({
      fleetId,
      fleetSize: memberIds.length,
      driverScores,
      fleetAverage,
      comparison,
    });
  } catch (err) {
    return handleError(res, 'fleet-comparison', err);
  }
});

export default router;
