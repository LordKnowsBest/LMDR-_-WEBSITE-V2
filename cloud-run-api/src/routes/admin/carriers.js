import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
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
  console.error(`[admin/carriers] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `carriers/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /carriers/query ──
router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [], search } = req.body;
    const table = getTableName('carriers');
    const allFilters = [...filters];
    if (search) allFilters.push({ field: 'company_name', operator: 'contains', value: search });

    const selectQ = buildSelectQuery(table, { filters: allFilters, limit, skip, sort });
    const countQ = buildCountQuery(table, { filters: allFilters });

    const [data, count] = await Promise.all([
      safeQuery(selectQ.sql, selectQ.params),
      safeQuery(countQ.sql, countQ.params),
    ]);

    return res.json({
      records: data.rows.map(formatRecord),
      total: parseInt(count.rows[0].count, 10),
      page: { limit, skip },
    });
  } catch (err) {
    return handleError(res, 'query', err);
  }
});

// ── GET /carriers/stats ──
router.get('/stats', async (req, res) => {
  try {
    const carriersTable = getTableName('carriers');
    const enrichTable = getTableName('carrierEnrichments');

    const [carriers, enrichments] = await Promise.all([
      safeQuery(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
        COUNT(*) FILTER (WHERE data->>'flagged' = 'true') AS flagged
        FROM "${carriersTable}"`),
      safeQuery(`SELECT COUNT(*) AS total FROM "${enrichTable}"`),
    ]);

    const c = carriers.rows[0];
    const total = parseInt(c.total, 10) || 1;
    const enrichCount = parseInt(enrichments.rows[0]?.total, 10) || 0;

    return res.json({
      total: parseInt(c.total, 10),
      active: parseInt(c.active, 10),
      flagged: parseInt(c.flagged, 10),
      enrichmentCoverage: Math.round((enrichCount / total) * 100),
    });
  } catch (err) {
    return handleError(res, 'stats', err);
  }
});

// ── GET /carriers/:id ──
router.get('/:id', async (req, res) => {
  try {
    const carriersTable = getTableName('carriers');
    const safetyTable = getTableName('carrierSafetyData');
    const enrichTable = getTableName('carrierEnrichments');
    const matchesTable = getTableName('matchEvents');
    const interestsTable = getTableName('driverCarrierInterests');

    const [carrier, safety, enrichment, matches, interests] = await Promise.all([
      safeQuery(`SELECT * FROM "${carriersTable}" WHERE _id = $1`, [req.params.id]),
      safeQuery(`SELECT * FROM "${safetyTable}" WHERE data->>'carrier_id' = $1 LIMIT 1`, [req.params.id]),
      safeQuery(`SELECT * FROM "${enrichTable}" WHERE data->>'carrier_id' = $1 LIMIT 1`, [req.params.id]),
      safeQuery(`SELECT _id, data, _created_at FROM "${matchesTable}" WHERE data->>'carrier_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
      safeQuery(`SELECT _id, data, _created_at FROM "${interestsTable}" WHERE data->>'carrier_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
    ]);

    if (carrier.rows.length === 0) {
      return res.status(404).json({ error: 'CARRIER_NOT_FOUND', message: `No carrier with id ${req.params.id}` });
    }

    return res.json({
      carrier: formatRecord(carrier.rows[0]),
      safety: formatRecord(safety.rows[0]),
      enrichment: formatRecord(enrichment.rows[0]),
      recentMatches: matches.rows.map(formatRecord),
      driverInterests: interests.rows.map(formatRecord),
    });
  } catch (err) {
    return handleError(res, 'detail', err);
  }
});

export default router;
