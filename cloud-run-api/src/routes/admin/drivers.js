import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildWhereClause } from '../../db/query.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';

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
  console.error(`[admin/drivers] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `drivers/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /drivers/query ──
router.post('/query', async (req, res) => {
  try {
    const { filters = [], limit = 50, skip = 0, sort = [], search } = req.body;

    const table = getTableName('driverProfiles');
    const allFilters = [...filters];
    if (search) {
      allFilters.push({ field: 'full_name', operator: 'contains', value: search });
    }

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

// ── GET /drivers/stats ──
router.get('/stats', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await safeQuery(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE data->>'status' = 'active') AS active,
      COUNT(*) FILTER (WHERE data->>'status' = 'pending') AS pending,
      COUNT(*) FILTER (WHERE data->>'cdl_expiry' IS NOT NULL AND (data->>'cdl_expiry')::date < NOW()) AS expired,
      COUNT(*) FILTER (WHERE _created_at >= NOW() - INTERVAL '7 days') AS new_this_week
      FROM "${table}"`);

    const r = result.rows[0];
    return res.json({
      total: parseInt(r.total, 10),
      active: parseInt(r.active, 10),
      pending: parseInt(r.pending, 10),
      expired: parseInt(r.expired, 10),
      newThisWeek: parseInt(r.new_this_week, 10),
    });
  } catch (err) {
    return handleError(res, 'stats', err);
  }
});

// ── GET /drivers/analytics?period=30d ──
router.get('/analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.period) || 30;
    const table = getTableName('driverProfiles');
    const result = await safeQuery(
      `SELECT DATE(_created_at) AS day, COUNT(*) AS registrations
       FROM "${table}"
       WHERE _created_at >= NOW() - make_interval(days => $1)
       GROUP BY DATE(_created_at)
       ORDER BY day`,
      [days]
    );

    return res.json({
      period: `${days}d`,
      daily: result.rows.map(r => ({ date: r.day, count: parseInt(r.registrations, 10) })),
    });
  } catch (err) {
    return handleError(res, 'analytics', err);
  }
});

// ── GET /drivers/export?status=active ──
router.get('/export', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const filters = [];
    if (req.query.status) filters.push({ field: 'status', operator: 'eq', value: req.query.status });

    const { sql: whereSql, params } = buildWhereClause(filters);
    let sql = `SELECT _id, data FROM "${table}"`;
    if (whereSql) sql += ` WHERE ${whereSql}`;
    sql += ' ORDER BY _created_at DESC LIMIT 10000';

    const result = await safeQuery(sql, params);
    const rows = result.rows.map(r => ({
      id: r._id,
      name: r.data?.full_name || '',
      email: r.data?.email || '',
      phone: r.data?.phone || '',
      cdl_class: r.data?.cdl_class || '',
      status: r.data?.status || '',
      state: r.data?.state || '',
      experience_years: r.data?.years_experience || '',
    }));

    const header = 'id,name,email,phone,cdl_class,status,state,experience_years';
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="drivers_export.csv"');
    return res.send(csv);
  } catch (err) {
    return handleError(res, 'export', err);
  }
});

// ── GET /drivers/:id ──
router.get('/:id', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const interestsTable = getTableName('driverCarrierInterests');
    const matchesTable = getTableName('matchEvents');

    const [driver, apps, matches] = await Promise.all([
      safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]),
      safeQuery(`SELECT _id, data, _created_at FROM "${interestsTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
      safeQuery(`SELECT _id, data, _created_at FROM "${matchesTable}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.id]),
    ]);

    if (driver.rows.length === 0) {
      return res.status(404).json({ error: 'DRIVER_NOT_FOUND', message: `No driver with id ${req.params.id}` });
    }

    return res.json({
      driver: formatRecord(driver.rows[0]),
      applications: apps.rows.map(formatRecord),
      matchHistory: matches.rows.map(formatRecord),
    });
  } catch (err) {
    return handleError(res, 'detail', err);
  }
});

// ── PUT /drivers/:id/status ──
router.put('/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const table = getTableName('driverProfiles');
    const before = await safeQuery(`SELECT data FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (before.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });

    const oldStatus = before.rows[0].data?.status;
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status, status_reason: reason, status_changed_at: new Date().toISOString() })]
    );

    insertAuditEvent({
      actor_id: req.auth.uid,
      actor_role: req.auth.role || 'admin',
      action: 'ADMIN_UPDATE_DRIVER_STATUS',
      resource_type: 'driver',
      resource_id: req.params.id,
      before_state: { status: oldStatus },
      after_state: { status, reason },
    });

    return res.json({ driver: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'update-status', err);
  }
});

// ── POST /drivers/:id/verify ──
router.post('/:id/verify', async (req, res) => {
  try {
    const table = getTableName('driverProfiles');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'active', verification_status: 'verified', verified_at: new Date().toISOString() })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });

    insertAuditEvent({
      actor_id: req.auth.uid, actor_role: 'admin',
      action: 'ADMIN_VERIFY_DRIVER', resource_type: 'driver', resource_id: req.params.id,
      after_state: { status: 'active', verification_status: 'verified' },
    });

    return res.json({ driver: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'verify', err);
  }
});

// ── POST /drivers/:id/suspend ──
router.post('/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const table = getTableName('driverProfiles');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'suspended', suspension_reason: reason, suspended_at: new Date().toISOString() })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRIVER_NOT_FOUND' });

    insertAuditEvent({
      actor_id: req.auth.uid, actor_role: 'admin',
      action: 'ADMIN_SUSPEND_DRIVER', resource_type: 'driver', resource_id: req.params.id,
      after_state: { status: 'suspended', reason },
    });

    return res.json({ driver: formatRecord(result.rows[0]) });
  } catch (err) {
    return handleError(res, 'suspend', err);
  }
});

// ── POST /drivers/bulk ──
router.post('/bulk', async (req, res) => {
  try {
    const { driverIds, action } = req.body;
    if (!Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({ error: 'driverIds array required' });
    }
    if (!['verify', 'suspend', 'activate'].includes(action)) {
      return res.status(400).json({ error: 'action must be verify, suspend, or activate' });
    }

    const table = getTableName('driverProfiles');
    const statusMap = { verify: 'active', suspend: 'suspended', activate: 'active' };
    const newStatus = statusMap[action];
    const extraFields = action === 'verify'
      ? { verification_status: 'verified', verified_at: new Date().toISOString() }
      : {};

    const results = [];
    for (const id of driverIds.slice(0, 100)) {
      try {
        await query(
          `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1`,
          [id, JSON.stringify({ status: newStatus, ...extraFields })]
        );
        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }

    insertAuditEvent({
      actor_id: req.auth.uid, actor_role: 'admin',
      action: `ADMIN_BULK_${action.toUpperCase()}`,
      resource_type: 'driver',
      after_state: { driverIds, action, results: results.length },
    });

    return res.json({ processed: results.length, results });
  } catch (err) {
    return handleError(res, 'bulk', err);
  }
});

export default router;
