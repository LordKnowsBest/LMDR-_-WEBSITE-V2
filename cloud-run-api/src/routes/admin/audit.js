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
  console.error(`[admin/audit] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `audit/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [] } = req.body;
    const table = getTableName('auditLog');
    const selectQ = buildSelectQuery(table, { filters, limit, skip, sort: sort.length ? sort : [{ field: '_created_at', direction: 'desc' }] });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'query', err); }
});

router.get('/stats', async (req, res) => {
  try {
    const table = getTableName('auditLog');
    const [today, week, month, topAdmins, topActions] = await Promise.all([
      safeQuery(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= CURRENT_DATE`),
      safeQuery(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '7 days'`),
      safeQuery(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '30 days'`),
      safeQuery(`SELECT data->>'admin_email' AS admin, COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '30 days' GROUP BY data->>'admin_email' ORDER BY cnt DESC LIMIT 5`),
      safeQuery(`SELECT data->>'action' AS action, COUNT(*) AS cnt FROM "${table}" WHERE _created_at >= NOW() - INTERVAL '30 days' GROUP BY data->>'action' ORDER BY cnt DESC LIMIT 5`),
    ]);
    return res.json({
      today: parseInt(today.rows[0].cnt, 10),
      thisWeek: parseInt(week.rows[0].cnt, 10),
      thisMonth: parseInt(month.rows[0].cnt, 10),
      topAdmins: topAdmins.rows.map(r => ({ admin: r.admin, count: parseInt(r.cnt, 10) })),
      topActions: topActions.rows.map(r => ({ action: r.action, count: parseInt(r.cnt, 10) })),
    });
  } catch (err) { return handleError(res, 'stats', err); }
});

router.get('/export', async (req, res) => {
  try {
    const table = getTableName('auditLog');
    const result = await safeQuery(`SELECT _id, data, _created_at FROM "${table}" ORDER BY _created_at DESC LIMIT 10000`);
    const rows = result.rows.map(r => ({
      id: r._id, action: r.data?.action || '', admin: r.data?.admin_email || '',
      target_type: r.data?.target_type || '', target_id: r.data?.target_id || '', date: r._created_at,
    }));
    const header = 'id,action,admin,target_type,target_id,date';
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_export.csv"');
    return res.send(csv);
  } catch (err) { return handleError(res, 'export', err); }
});

router.post('/reports/generate', async (req, res) => {
  try {
    const { type = 'full_audit', startDate, endDate } = req.body;
    const table = getTableName('auditLog');
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    const result = await safeQuery(
      `SELECT data->>'action' AS action, COUNT(*) AS cnt
       FROM "${table}"
       WHERE _created_at >= $1 AND _created_at <= $2
       GROUP BY data->>'action'
       ORDER BY cnt DESC`,
      [start, end]
    );

    return res.json({
      type, period: { start, end },
      summary: result.rows.map(r => ({ action: r.action, count: parseInt(r.cnt, 10) })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) { return handleError(res, 'generate-report', err); }
});

router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('auditLog');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AUDIT_ENTRY_NOT_FOUND' });
    return res.json({ entry: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'detail', err); }
});

export default router;
