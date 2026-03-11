import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

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
  console.error(`[driver/cockpit] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `cockpit/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /:id/dashboard ──
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    const matchesTable = getTableName('matchEvents');
    const interestsTable = getTableName('driverCarrierInterests');
    const savedTable = getTableName('savedJobs');

    const [matches, applications, saved] = await Promise.all([
      safeQuery(`SELECT COUNT(*) AS count FROM "${matchesTable}" WHERE data->>'driver_id' = $1`, [id]),
      safeQuery(`SELECT COUNT(*) AS count FROM "${interestsTable}" WHERE data->>'driver_id' = $1 AND data->>'status' = 'applied'`, [id]),
      safeQuery(`SELECT COUNT(*) AS count FROM "${savedTable}" WHERE data->>'driver_id' = $1`, [id]),
    ]);

    return res.json({
      matchCount: parseInt(matches.rows[0]?.count, 10) || 0,
      applicationCount: parseInt(applications.rows[0]?.count, 10) || 0,
      savedCount: parseInt(saved.rows[0]?.count, 10) || 0,
    });
  } catch (err) {
    return handleError(res, 'dashboard', err);
  }
});

// ── POST /:id/apply/:jobId ──
router.post('/:id/apply/:jobId', async (req, res) => {
  try {
    const { id, jobId } = req.params;
    const table = getTableName('driverCarrierInterests');
    const newId = uuidv4();
    const now = new Date().toISOString();
    const data = { driver_id: id, job_id: jobId, status: 'applied' };

    await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $3, $4)`,
      [newId, now, now, JSON.stringify(data)]
    );

    insertAuditEvent({
      actor_id: id,
      actor_role: 'driver',
      action: 'APPLICATION_SUBMITTED',
      resource_type: 'driverCarrierInterests',
      resource_id: newId,
    });

    insertLog({ service: 'driver', level: 'INFO', message: 'application_submitted', data: { driver_id: id, job_id: jobId } });

    return res.status(201).json({ _id: newId, ...data });
  } catch (err) {
    return handleError(res, 'apply', err);
  }
});

// ── POST /:id/withdraw/:appId ──
router.post('/:id/withdraw/:appId', async (req, res) => {
  try {
    const { id, appId } = req.params;
    const table = getTableName('driverCarrierInterests');
    const now = new Date().toISOString();

    const result = await query(
      `UPDATE "${table}" SET data = jsonb_set(data, '{status}', '"withdrawn"'), _updated_at = $1 WHERE _id = $2 AND data->>'driver_id' = $3 RETURNING *`,
      [now, appId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    insertAuditEvent({
      actor_id: id,
      actor_role: 'driver',
      action: 'APPLICATION_WITHDRAWN',
      resource_type: 'driverCarrierInterests',
      resource_id: appId,
    });

    return res.json(formatRecord(result.rows[0]));
  } catch (err) {
    return handleError(res, 'withdraw', err);
  }
});

// ── GET /:id/applications ──
router.get('/:id/applications', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit: rawLimit, skip: rawSkip } = req.query;
    const limit = Math.min(parseInt(rawLimit, 10) || 20, 100);
    const skip = parseInt(rawSkip, 10) || 0;
    const table = getTableName('driverCarrierInterests');

    let sql = `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1`;
    const params = [id];
    let paramIdx = 2;

    if (status) {
      sql += ` AND data->>'status' = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS count');
    sql += ` ORDER BY _created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(limit, skip);

    const [data, countResult] = await Promise.all([
      safeQuery(sql, params),
      safeQuery(countSql, params.slice(0, paramIdx - 1)),
    ]);

    return res.json({
      records: formatRecords(data.rows),
      total: parseInt(countResult.rows[0]?.count, 10) || 0,
      page: { limit, skip },
    });
  } catch (err) {
    return handleError(res, 'applications', err);
  }
});

// ── POST /:id/save-job/:jobId ──
router.post('/:id/save-job/:jobId', async (req, res) => {
  try {
    const { id, jobId } = req.params;
    const table = getTableName('savedJobs');

    // Check if already saved
    const existing = await safeQuery(
      `SELECT _id FROM "${table}" WHERE data->>'driver_id' = $1 AND data->>'job_id' = $2`,
      [id, jobId]
    );

    if (existing.rows.length > 0) {
      return res.json({ _id: existing.rows[0]._id, already_saved: true });
    }

    const newId = uuidv4();
    const now = new Date().toISOString();
    const data = { driver_id: id, job_id: jobId };

    await query(
      `INSERT INTO "${table}" (_id, _created_at, _updated_at, data) VALUES ($1, $2, $3, $4)`,
      [newId, now, now, JSON.stringify(data)]
    );

    insertLog({ service: 'driver', level: 'INFO', message: 'job_saved', data: { driver_id: id, job_id: jobId } });

    return res.status(201).json({ _id: newId, ...data });
  } catch (err) {
    return handleError(res, 'save-job', err);
  }
});

// ── GET /:id/saved-jobs ──
router.get('/:id/saved-jobs', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit: rawLimit, skip: rawSkip } = req.query;
    const limit = Math.min(parseInt(rawLimit, 10) || 20, 100);
    const skip = parseInt(rawSkip, 10) || 0;
    const table = getTableName('savedJobs');

    const [data, countResult] = await Promise.all([
      safeQuery(
        `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT $2 OFFSET $3`,
        [id, limit, skip]
      ),
      safeQuery(
        `SELECT COUNT(*) AS count FROM "${table}" WHERE data->>'driver_id' = $1`,
        [id]
      ),
    ]);

    return res.json({
      records: formatRecords(data.rows),
      total: parseInt(countResult.rows[0]?.count, 10) || 0,
      page: { limit, skip },
    });
  } catch (err) {
    return handleError(res, 'saved-jobs', err);
  }
});

// ── DELETE /:id/saved-job/:jobId ──
router.delete('/:id/saved-job/:jobId', async (req, res) => {
  try {
    const { id, jobId } = req.params;
    const table = getTableName('savedJobs');

    const result = await query(
      `DELETE FROM "${table}" WHERE data->>'driver_id' = $1 AND data->>'job_id' = $2 RETURNING _id`,
      [id, jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    return res.json({ deleted: true, _id: result.rows[0]._id });
  } catch (err) {
    return handleError(res, 'delete-saved-job', err);
  }
});

// ── GET /:id/notifications ──
router.get('/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('driverNotifications');

    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 20`,
      [id]
    );

    return res.json({ records: formatRecords(result.rows) });
  } catch (err) {
    return handleError(res, 'notifications', err);
  }
});

// ── PUT /:id/notification/:notifId/read ──
router.put('/:id/notification/:notifId/read', async (req, res) => {
  try {
    const { id, notifId } = req.params;
    const table = getTableName('driverNotifications');
    const now = new Date().toISOString();

    const result = await query(
      `UPDATE "${table}" SET data = jsonb_set(data, '{read}', 'true'), _updated_at = $1 WHERE _id = $2 AND data->>'driver_id' = $3 RETURNING *`,
      [now, notifId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(formatRecord(result.rows[0]));
  } catch (err) {
    return handleError(res, 'mark-read', err);
  }
});

// ── POST /:id/notifications/mark-all-read ──
router.post('/:id/notifications/mark-all-read', async (req, res) => {
  try {
    const { id } = req.params;
    const table = getTableName('driverNotifications');
    const now = new Date().toISOString();

    const result = await query(
      `UPDATE "${table}" SET data = jsonb_set(data, '{read}', 'true'), _updated_at = $1 WHERE data->>'driver_id' = $2 AND (data->>'read' IS NULL OR data->>'read' != 'true') RETURNING _id`,
      [now, id]
    );

    return res.json({ updated: result.rows.length });
  } catch (err) {
    return handleError(res, 'mark-all-read', err);
  }
});

// ── GET /:id/recommended ──
router.get('/:id/recommended', async (req, res) => {
  try {
    const table = getTableName('jobPostings');

    const result = await safeQuery(
      `SELECT * FROM "${table}" ORDER BY _created_at DESC LIMIT 10`
    );

    return res.json({ records: formatRecords(result.rows) });
  } catch (err) {
    return handleError(res, 'recommended', err);
  }
});

export default router;
