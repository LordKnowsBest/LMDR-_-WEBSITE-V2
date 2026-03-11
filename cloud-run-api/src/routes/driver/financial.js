import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const VALID_CATEGORIES = [
  'fuel', 'tolls', 'lumper', 'scales', 'meals', 'lodging',
  'maintenance', 'insurance', 'equipment', 'communications', 'medical', 'other'
];

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
  console.error(`[driver/financial] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `financial/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── POST /:id/expenses — Log an expense ──
router.post('/:id/expenses', async (req, res) => {
  try {
    const { amount, category, description, date, receiptUrl } = req.body;
    if (!amount || !category) {
      return res.status(400).json({ error: 'amount and category are required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const table = getTableName('driverExpenses', { strict: false });
    const id = uuidv4();
    const data = {
      driver_id: req.params.id,
      amount: Number(amount),
      category,
      description: description || '',
      date: date || new Date().toISOString().slice(0, 10),
      receipt_url: receiptUrl || null
    };

    await query(
      `INSERT INTO "${table}" (_id, airtable_id, _created_at, _updated_at, data) VALUES ($1, $1, NOW(), NOW(), $2)`,
      [id, JSON.stringify(data)]
    );

    insertLog({ service: 'driver', level: 'INFO', message: 'expense created', data: { driver_id: req.params.id, category, amount: data.amount } });
    return res.status(201).json({ success: true, expense: { _id: id, ...data } });
  } catch (err) { return handleError(res, 'create-expense', err); }
});

// ── GET /:id/expenses — List expenses for driver ──
router.get('/:id/expenses', async (req, res) => {
  try {
    const table = getTableName('driverExpenses', { strict: false });
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    const { category, startDate, endDate } = req.query;

    let sql = `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1`;
    const params = [req.params.id];
    let paramIdx = 2;

    if (category) {
      sql += ` AND data->>'category' = $${paramIdx++}`;
      params.push(category);
    }
    if (startDate) {
      sql += ` AND _created_at >= $${paramIdx++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND _created_at <= $${paramIdx++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY _created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, skip);

    const [data, count] = await Promise.all([
      safeQuery(sql, params),
      safeQuery(
        `SELECT COUNT(*) AS total FROM "${table}" WHERE data->>'driver_id' = $1`,
        [req.params.id]
      ),
    ]);

    return res.json({ items: formatRecords(data.rows), totalCount: parseInt(count.rows[0]?.total) || 0 });
  } catch (err) { return handleError(res, 'list-expenses', err); }
});

// ── GET /:id/expenses/summary — Aggregate summary ──
router.get('/:id/expenses/summary', async (req, res) => {
  try {
    const table = getTableName('driverExpenses', { strict: false });
    const period = req.query.period || 'month';
    const days = period === 'week' ? 7 : period === 'year' ? 365 : 30;

    const [totalResult, byCategoryResult] = await Promise.all([
      safeQuery(
        `SELECT COALESCE(SUM((data->>'amount')::numeric), 0) AS total_spend
         FROM "${table}"
         WHERE data->>'driver_id' = $1
           AND _created_at >= NOW() - INTERVAL '${days} days'`,
        [req.params.id]
      ),
      safeQuery(
        `SELECT data->>'category' AS category,
                SUM((data->>'amount')::numeric) AS total,
                COUNT(*) AS count
         FROM "${table}"
         WHERE data->>'driver_id' = $1
           AND _created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY data->>'category'
         ORDER BY total DESC`,
        [req.params.id]
      ),
    ]);

    const totalSpend = parseFloat(totalResult.rows[0]?.total_spend) || 0;
    const byCategory = (byCategoryResult.rows || []).map(r => ({
      category: r.category,
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count) || 0,
    }));
    const averagePerDay = days > 0 ? Math.round((totalSpend / days) * 100) / 100 : 0;

    return res.json({ totalSpend, byCategory, averagePerDay, period, days });
  } catch (err) { return handleError(res, 'expense-summary', err); }
});

// ── PUT /:id/expense/:expenseId — Update expense ──
router.put('/:id/expense/:expenseId', async (req, res) => {
  try {
    const table = getTableName('driverExpenses', { strict: false });

    // Validate ownership
    const existing = await safeQuery(
      `SELECT * FROM "${table}" WHERE _id = $1 AND data->>'driver_id' = $2`,
      [req.params.expenseId, req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'EXPENSE_NOT_FOUND', message: 'Expense not found or does not belong to this driver' });
    }

    const { amount, category, description } = req.body;
    const updates = {};
    if (amount !== undefined) updates.amount = Number(amount);
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }
      updates.category = category;
    }
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.expenseId, JSON.stringify(updates)]
    );

    return res.json({ success: true, expense: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-expense', err); }
});

// ── DELETE /:id/expense/:expenseId — Delete expense ──
router.delete('/:id/expense/:expenseId', async (req, res) => {
  try {
    const table = getTableName('driverExpenses', { strict: false });

    // Validate ownership
    const existing = await safeQuery(
      `SELECT _id FROM "${table}" WHERE _id = $1 AND data->>'driver_id' = $2`,
      [req.params.expenseId, req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'EXPENSE_NOT_FOUND', message: 'Expense not found or does not belong to this driver' });
    }

    await query(`DELETE FROM "${table}" WHERE _id = $1`, [req.params.expenseId]);

    insertLog({ service: 'driver', level: 'INFO', message: 'expense deleted', data: { driver_id: req.params.id, expense_id: req.params.expenseId } });
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'delete-expense', err); }
});

export default router;
