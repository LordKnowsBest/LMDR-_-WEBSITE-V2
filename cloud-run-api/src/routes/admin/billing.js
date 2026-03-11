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

const TIER_PRICES = { free: 0, pro: 249, enterprise: 749 };

function formatRecord(row) {
  if (!row) return null;
  const { _id, airtable_id, _created_at, _updated_at, data } = row;
  return { _id, airtable_id, _createdAt: _created_at, _updatedAt: _updated_at, ...data };
}

function handleError(res, context, err) {
  console.error(`[admin/billing] ${context}:`, err.message);
  insertLog({ service: 'admin', level: 'ERROR', message: `billing/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

let revenueCache = null;
let revenueCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// ── Revenue endpoints ──
router.get('/revenue/snapshot', async (req, res) => {
  try {
    const now = Date.now();
    if (revenueCache && (now - revenueCacheTime) < CACHE_TTL) return res.json(revenueCache);

    const subsTable = getTableName('carrierSubscriptions');
    const result = await safeQuery(`SELECT data->>'tier' AS tier, COUNT(*) AS cnt FROM "${subsTable}" WHERE data->>'status' = 'active' GROUP BY data->>'tier'`);

    let mrr = 0;
    const planMix = [];
    for (const r of result.rows) {
      const tier = r.tier || 'free';
      const count = parseInt(r.cnt, 10);
      mrr += (TIER_PRICES[tier] || 0) * count;
      planMix.push({ tier, count, price: TIER_PRICES[tier] || 0 });
    }

    const totalActive = planMix.reduce((s, p) => s + p.count, 0) || 1;
    const snapshot = { mrr, arr: mrr * 12, arpu: Math.round(mrr / totalActive), planMix };
    revenueCache = snapshot;
    revenueCacheTime = now;
    return res.json(snapshot);
  } catch (err) { return handleError(res, 'revenue-snapshot', err); }
});

router.get('/revenue/trend', async (req, res) => {
  try {
    const metricsTable = getTableName('revenueMetrics');
    const result = await safeQuery(`SELECT data, _created_at FROM "${metricsTable}" ORDER BY _created_at DESC LIMIT 90`);
    return res.json({ trend: result.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'revenue-trend', err); }
});

router.get('/revenue/churn', async (req, res) => {
  try {
    const subsTable = getTableName('carrierSubscriptions');
    const result = await safeQuery(
      `SELECT data->>'tier' AS tier,
        COUNT(*) FILTER (WHERE data->>'status' = 'cancelled' AND _updated_at >= NOW() - INTERVAL '30 days') AS churned,
        COUNT(*) AS total
      FROM "${subsTable}" GROUP BY data->>'tier'`
    );
    return res.json({
      byTier: result.rows.map(r => ({
        tier: r.tier, churned: parseInt(r.churned, 10), total: parseInt(r.total, 10),
        rate: parseInt(r.total, 10) > 0 ? Math.round((parseInt(r.churned, 10) / parseInt(r.total, 10)) * 100) : 0,
      })),
    });
  } catch (err) { return handleError(res, 'churn', err); }
});

router.get('/revenue/forecast', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const subsTable = getTableName('carrierSubscriptions');
    const result = await safeQuery(`SELECT data->>'tier' AS tier, COUNT(*) AS cnt FROM "${subsTable}" WHERE data->>'status' = 'active' GROUP BY data->>'tier'`);
    let currentMrr = 0;
    for (const r of result.rows) currentMrr += (TIER_PRICES[r.tier] || 0) * parseInt(r.cnt, 10);

    const forecast = [];
    for (let i = 1; i <= months; i++) {
      const projected = Math.round(currentMrr * (1 + 0.05 * i)); // 5% monthly growth assumption
      forecast.push({ month: i, mrr: projected, arr: projected * 12 });
    }
    return res.json({ currentMrr, forecast });
  } catch (err) { return handleError(res, 'forecast', err); }
});

// ── Billing customer ──
router.get('/customer/:dot', async (req, res) => {
  try {
    const carriersTable = getTableName('carriers');
    const subsTable = getTableName('carrierSubscriptions');
    const billingTable = getTableName('billingHistory');

    const [carrier, sub, history] = await Promise.all([
      safeQuery(`SELECT * FROM "${carriersTable}" WHERE data->>'dot_number' = $1 LIMIT 1`, [req.params.dot]),
      safeQuery(`SELECT * FROM "${subsTable}" WHERE data->>'carrier_dot' = $1 LIMIT 1`, [req.params.dot]),
      safeQuery(`SELECT _id, data, _created_at FROM "${billingTable}" WHERE data->>'carrier_dot' = $1 ORDER BY _created_at DESC LIMIT 20`, [req.params.dot]),
    ]);

    if (carrier.rows.length === 0) return res.status(404).json({ error: 'CARRIER_NOT_FOUND' });
    return res.json({ carrier: formatRecord(carrier.rows[0]), subscription: formatRecord(sub.rows[0]), history: history.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'customer', err); }
});

// ── Adjustments ──
router.post('/adjustments', async (req, res) => {
  try {
    const { carrierDot, type, amount, reason } = req.body;
    if (!carrierDot || !type || !amount) return res.status(400).json({ error: 'carrierDot, type, amount required' });

    const table = getTableName('billingHistory');
    const id = `adj_${crypto.randomUUID()}`;
    const result = await query(
      `INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW()) RETURNING *`,
      [id, JSON.stringify({ carrier_dot: carrierDot, type, amount, reason, created_by: req.auth.uid })]
    );

    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CREATE_ADJUSTMENT', resource_type: 'billing', resource_id: id, after_state: { carrierDot, type, amount } });
    return res.status(201).json({ adjustment: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'create-adjustment', err); }
});

// ── Invoices ──
router.post('/invoices', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const id = `inv_${crypto.randomUUID()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const data = { ...req.body, invoice_number: invoiceNumber, status: 'draft', created_by: req.auth.uid };
    const result = await query(
      `INSERT INTO "${table}" (_id, airtable_id, data, _created_at, _updated_at) VALUES ($1, $1, $2, NOW(), NOW()) RETURNING *`,
      [id, JSON.stringify(data)]
    );
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CREATE_INVOICE', resource_type: 'invoice', resource_id: id });
    return res.status(201).json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'create-invoice', err); }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const result = await safeQuery(`SELECT * FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    return res.json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'get-invoice', err); }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const existing = await safeQuery(`SELECT data FROM "${table}" WHERE _id = $1`, [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    if (existing.rows[0].data?.status !== 'draft') return res.status(400).json({ error: 'Only draft invoices can be edited' });

    const result = await query(`UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`, [req.params.id, JSON.stringify(req.body)]);
    return res.json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-invoice', err); }
});

router.post('/invoices/:id/send', async (req, res) => {
  try {
    const table = getTableName('invoices');
    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.id, JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() })]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_SEND_INVOICE', resource_type: 'invoice', resource_id: req.params.id });
    return res.json({ invoice: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'send-invoice', err); }
});

// ── Commissions ──
router.get('/commissions', async (req, res) => {
  try {
    const rulesTable = getTableName('commissionRules');
    const repsTable = getTableName('salesReps');
    const [rules, reps] = await Promise.all([
      safeQuery(`SELECT * FROM "${rulesTable}" ORDER BY _created_at`),
      safeQuery(`SELECT * FROM "${repsTable}" ORDER BY _created_at`),
    ]);
    return res.json({ rules: rules.rows.map(formatRecord), reps: reps.rows.map(formatRecord) });
  } catch (err) { return handleError(res, 'commissions', err); }
});

router.post('/commissions/calculate', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const subsTable = getTableName('carrierSubscriptions');
    const result = await safeQuery(
      `SELECT COUNT(*) AS cnt, SUM(COALESCE((data->>'monthly_amount')::numeric, 0)) AS revenue
       FROM "${subsTable}"
       WHERE _created_at >= $1 AND _created_at <= $2 AND data->>'status' = 'active'`,
      [startDate, endDate]
    );
    const subs = parseInt(result.rows[0].cnt, 10);
    const revenue = parseFloat(result.rows[0].revenue) || 0;

    insertAuditEvent({ actor_id: req.auth.uid, actor_role: 'admin', action: 'ADMIN_CALCULATE_COMMISSIONS', resource_type: 'commission', after_state: { startDate, endDate, subs, revenue } });
    return res.json({ period: { startDate, endDate }, subscriptions: subs, revenue, estimatedCommission: Math.round(revenue * 0.1) });
  } catch (err) { return handleError(res, 'calculate-commissions', err); }
});

export default router;
