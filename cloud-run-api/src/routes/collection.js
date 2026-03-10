import { Router } from 'express';
import { getTableName } from '../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildInsertQuery, buildUpdateQuery } from '../db/query.js';
import { query } from '../db/pool.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Resolve collection param to a SQL table name.
 * Returns null and sends 400 if unknown.
 */
function resolveTable(collectionKey, res) {
  try {
    return getTableName(collectionKey);
  } catch {
    res.status(400).json({ error: `Unknown collection: "${collectionKey}"` });
    return null;
  }
}

/**
 * Format a row from the DB into the API response shape.
 */
function formatRecord(row) {
  return {
    _id: row._id,
    airtable_id: row.airtable_id,
    _createdAt: row._created_at,
    _updatedAt: row._updated_at,
    ...row.data,
  };
}

// ─── POST /v1/:collection/query ─────────────────────────────────────────────
router.post('/:collection/query', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const { filters = [], limit = 50, skip = 0, sort = [] } = req.body;

    const selectQ = buildSelectQuery(tableName, { filters, limit, skip, sort });
    const countQ = buildCountQuery(tableName, { filters });

    const [dataResult, countResult] = await Promise.all([
      query(selectQ.sql, selectQ.params),
      query(countQ.sql, countQ.params),
    ]);

    res.json({
      records: dataResult.rows.map(formatRecord),
      total: Number(countResult.rows[0].count),
      page: { limit: parseInt(limit) || 50, skip: parseInt(skip) || 0 },
    });
  } catch (err) {
    console.error(`[query ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Query failed', detail: err.message });
  }
});

// ─── GET /v1/:collection/count ──────────────────────────────────────────────
router.get('/:collection/count', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const { sql, params } = buildCountQuery(tableName);
    const result = await query(sql, params);
    res.json({ count: Number(result.rows[0].count) });
  } catch (err) {
    console.error(`[count ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Count failed', detail: err.message });
  }
});

// ─── GET /v1/:collection/field/:field/:value ────────────────────────────────
router.get('/:collection/field/:field/:value', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const selectQ = buildSelectQuery(tableName, {
      filters: [{ field: req.params.field, operator: 'eq', value: req.params.value }],
      limit: 50,
    });
    const result = await query(selectQ.sql, selectQ.params);
    res.json({ records: result.rows.map(formatRecord) });
  } catch (err) {
    console.error(`[findByField ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Query failed', detail: err.message });
  }
});

// ─── GET /v1/:collection/:id ────────────────────────────────────────────────
router.get('/:collection/:id', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const result = await query(
      `SELECT _id, airtable_id, _created_at, _updated_at, data FROM "${tableName}" WHERE _id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ record: formatRecord(result.rows[0]) });
  } catch (err) {
    console.error(`[get ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Get failed', detail: err.message });
  }
});

// ─── POST /v1/:collection ───────────────────────────────────────────────────
router.post('/:collection', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const _id = req.body._id || uuidv4();
    const airtable_id = req.body.airtable_id || _id;
    const data = req.body.data || req.body;
    // Remove meta fields from data
    delete data._id;
    delete data.airtable_id;

    const { sql, params } = buildInsertQuery(tableName, { _id, airtable_id, data });
    const result = await query(sql, params);
    res.status(201).json({ record: formatRecord(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Record already exists' });
    }
    console.error(`[insert ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Insert failed', detail: err.message });
  }
});

// ─── PUT /v1/:collection/:id ────────────────────────────────────────────────
router.put('/:collection/:id', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const data = req.body.data || req.body;
    delete data._id;
    delete data.airtable_id;

    const { sql, params } = buildUpdateQuery(tableName, req.params.id, data);
    const result = await query(sql, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ record: formatRecord(result.rows[0]) });
  } catch (err) {
    console.error(`[update ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
});

// ─── POST /v1/:collection/bulk ──────────────────────────────────────────────
router.post('/:collection/bulk', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const { records: inputRecords = [], operation = 'insert' } = req.body;
    if (!Array.isArray(inputRecords) || inputRecords.length === 0) {
      return res.status(400).json({ error: 'records array is required' });
    }
    if (inputRecords.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 records per bulk request' });
    }

    const results = [];
    const errors = [];

    for (const record of inputRecords) {
      try {
        if (operation === 'update') {
          if (!record._id) { errors.push({ error: '_id required for update' }); continue; }
          const data = record.data || record;
          delete data._id; delete data.airtable_id;
          const { sql, params } = buildUpdateQuery(tableName, record._id, data);
          const r = await query(sql, params);
          if (r.rows.length) results.push(formatRecord(r.rows[0]));
          else errors.push({ _id: record._id, error: 'Not found' });
        } else if (operation === 'delete') {
          if (!record._id) { errors.push({ error: '_id required for delete' }); continue; }
          const r = await query(`DELETE FROM "${tableName}" WHERE _id = $1 RETURNING _id`, [record._id]);
          if (r.rows.length) results.push({ _id: r.rows[0]._id, deleted: true });
          else errors.push({ _id: record._id, error: 'Not found' });
        } else {
          const _id = record._id || uuidv4();
          const airtable_id = record.airtable_id || _id;
          const data = record.data || record;
          delete data._id; delete data.airtable_id;
          const { sql, params } = buildInsertQuery(tableName, { _id, airtable_id, data });
          const r = await query(sql, params);
          results.push(formatRecord(r.rows[0]));
        }
      } catch (err) {
        errors.push({ _id: record._id, error: err.message });
      }
    }

    res.json({ success: errors.length === 0, records: results, errors });
  } catch (err) {
    console.error(`[bulk ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Bulk operation failed', detail: err.message });
  }
});

// ─── DELETE /v1/:collection/:id ─────────────────────────────────────────────
router.delete('/:collection/:id', async (req, res) => {
  const tableName = resolveTable(req.params.collection, res);
  if (!tableName) return;

  try {
    const result = await query(
      `DELETE FROM "${tableName}" WHERE _id = $1 RETURNING _id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ deleted: true, _id: result.rows[0]._id });
  } catch (err) {
    console.error(`[delete ${req.params.collection}]`, err.message);
    res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
});

export default router;
