import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildWhereClause } from '../../db/query.js';
import { insertLog } from '../../db/bigquery.js';

const router = Router();

/** Query that returns empty rows if table doesn't exist yet */
async function safeQuery(sql, params) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      return { rows: [{ total: 0, count: 0 }] };
    }
    throw err;
  }
}

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/matches] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `matches/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /matches/query ──
router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [] } = req.body;
    const table = getTableName('matchEvents');
    const selectQ = buildSelectQuery(table, { filters, limit, skip, sort });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'query', err); }
});

// ── POST /matches/interests ──
router.post('/interests', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0 } = req.body;
    const table = getTableName('driverCarrierInterests');
    const selectQ = buildSelectQuery(table, { filters, limit, skip });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'interests', err); }
});

// ── GET /matches/stats ──
router.get('/stats', async (req, res) => {
  try {
    const matchTable = getTableName('matchEvents');
    const interestTable = getTableName('driverCarrierInterests');
    const [weeklyMatches, totalMatches, totalInterests] = await Promise.all([
      safeQuery(`SELECT COUNT(*) AS cnt FROM "${matchTable}" WHERE _created_at >= NOW() - INTERVAL '7 days'`),
      safeQuery(`SELECT COUNT(*) AS cnt FROM "${matchTable}"`),
      safeQuery(`SELECT COUNT(*) AS cnt FROM "${interestTable}"`),
    ]);
    const weekly = parseInt(weeklyMatches.rows[0].cnt, 10);
    const total = parseInt(totalMatches.rows[0].cnt, 10);
    const interests = parseInt(totalInterests.rows[0].cnt, 10);
    return res.json({
      weeklyMatches: weekly, totalMatches: total, totalInterests: interests,
      conversionRate: total > 0 ? Math.round((interests / total) * 100) : 0,
      dailyAverage: Math.round(weekly / 7),
    });
  } catch (err) { return handleError(res, 'stats', err); }
});

// ── GET /matches/export ──
router.get('/export', async (req, res) => {
  try {
    const table = getTableName('matchEvents');
    const result = await safeQuery(`SELECT _id, data, _created_at FROM "${table}" ORDER BY _created_at DESC LIMIT 10000`);
    const rows = result.rows.map(r => ({
      id: r._id, driver_id: r.data?.driver_id || '', carrier_id: r.data?.carrier_id || '',
      score: r.data?.score || '', action: r.data?.action || '', date: r._created_at,
    }));
    const header = 'id,driver_id,carrier_id,score,action,date';
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="matches_export.csv"');
    return res.send(csv);
  } catch (err) { return handleError(res, 'export', err); }
});

// ── GET /matches/:id ──
router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('matchEvents');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'MATCH_NOT_FOUND' });

    const match = formatRecord(result.rows[0]);
    const driverId = match.driver_id;
    const carrierId = match.carrier_id;

    const [driver, carrier] = await Promise.all([
      driverId ? safeQuery(`SELECT * FROM "${getTableName('driverProfiles')}" WHERE _id = $1`, [driverId]) : { rows: [] },
      carrierId ? safeQuery(`SELECT * FROM "${getTableName('carriers')}" WHERE _id = $1`, [carrierId]) : { rows: [] },
    ]);

    return res.json({
      match,
      driver: formatRecord(driver.rows[0]),
      carrier: formatRecord(carrier.rows[0]),
    });
  } catch (err) { return handleError(res, 'detail', err); }
});

export default router;
