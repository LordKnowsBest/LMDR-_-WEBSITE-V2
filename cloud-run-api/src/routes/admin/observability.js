import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import crypto from 'crypto';

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
  console.error(`[admin/observability] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `observability/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /observability/logs ──
router.post('/logs', async (req, res) => {
  try {
    const { filters = [], limit = 100, skip = 0 } = req.body;
    const table = getTableName('systemLogs');
    const selectQ = buildSelectQuery(table, { filters, limit, skip, sort: [{ field: '_created_at', direction: 'desc' }] });
    const countQ = buildCountQuery(table, { filters });
    const [data, count] = await Promise.all([safeQuery(selectQ.sql, selectQ.params), safeQuery(countQ.sql, countQ.params)]);
    return res.json({ records: data.rows.map(formatRecord), total: parseInt(count.rows[0].count, 10), page: { limit, skip } });
  } catch (err) { return handleError(res, 'logs', err); }
});

// ── GET /observability/anomalies ──
router.get('/anomalies', async (req, res) => {
  try {
    const table = getTableName('anomalyAlerts');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE data->>'status' != 'resolved' ORDER BY _created_at DESC LIMIT 50`);
    return res.json({ anomalies: result.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'anomalies', err); }
});

// ── POST /observability/anomalies/:id/ack ──
router.post('/anomalies/:id/ack', async (req, res) => {
  try {
    const table = getTableName('anomalyAlerts');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: req.auth.uid })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ANOMALY_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_ACK_ANOMALY', resource_type: 'anomaly', resource_id: req.params.id });
    return res.json({ anomaly: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'ack-anomaly', err); }
});

// ── POST /observability/anomalies/:id/resolve ──
router.post('/anomalies/:id/resolve', async (req, res) => {
  try {
    const table = getTableName('anomalyAlerts');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: req.auth.uid, resolution: req.body.resolution })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ANOMALY_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_RESOLVE_ANOMALY', resource_type: 'anomaly', resource_id: req.params.id });
    return res.json({ anomaly: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'resolve-anomaly', err); }
});

// ── CRUD for anomaly rules ──
router.get('/rules', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const result = await safeQuery(`SELECT * FROM "${table}" ORDER BY _created_at DESC`);
    return res.json({ rules: result.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'get-rules', err); }
});

router.post('/rules', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const id = `rule_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW()) RETURNING *`,
      [id, JSON.stringify(req.body)]
    );
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CREATE_RULE', resource_type: 'anomaly_rule', resource_id: id });
    return res.status(201).json({ rule: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'create-rule', err); }
});

router.put('/rules/:id', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify(req.body)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'RULE_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_UPDATE_RULE', resource_type: 'anomaly_rule', resource_id: req.params.id });
    return res.json({ rule: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-rule', err); }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    const table = getTableName('anomalyRules');
    const result = await query(`DELETE FROM "${table}" WHERE _id = $1 RETURNING _id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RULE_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_DELETE_RULE', resource_type: 'anomaly_rule', resource_id: req.params.id });
    return res.json({ deleted: true, _id: req.params.id });
  } catch (err) { return handleError(res, 'delete-rule', err); }
});

export default router;
