'use strict';
/**
 * dataAccess-firestore.js
 *
 * Drop-in Node.js replacement for src/backend/dataAccess.jsw backed by Firestore.
 * Implements the exact API surface used by 321 backend .jsw files:
 *
 *   queryRecords(collectionName, { filters, limit, offset, sort })
 *   getRecord(collectionName, recordId)
 *   insertRecord(collectionName, data, opts)
 *   updateRecord(collectionName, data, opts)
 *   deleteRecord(collectionName, recordId)
 *   bulkInsert(collectionName, items)
 *   bulkUpdate(collectionName, items)
 *   getAllRecords(collectionName, opts)
 *   upsertRecord(collectionName, data, matchField)
 *   countRecords(collectionName, filters)
 *   findByField(collectionName, field, value)
 *
 * Setup:
 *   npm install @google-cloud/firestore
 *   Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   (or use Application Default Credentials on GCP)
 *
 * Collection naming:
 *   The collectionName argument matches the camelCase keys from AIRTABLE_TABLE_NAMES
 *   (e.g. 'carriers', 'searchJobs', 'driverProfiles').
 *   The same keys used in migrate-to-firestore.js — one collection per table.
 *
 * Record shape:
 *   Firestore documents mirror the Airtable field structure. The _id field is
 *   the Firestore document ID. When data was migrated from Airtable the document
 *   ID is 'at_<airtableRecordId>' and _airtableId holds the raw rec* string.
 */

const { Firestore } = require('@google-cloud/firestore');

// ── Firestore client ──────────────────────────────────────────────────────────

const db = new Firestore({
  // projectId inferred from GCLOUD_PROJECT / GOOGLE_CLOUD_PROJECT env var,
  // or from the service account JSON pointed to by GOOGLE_APPLICATION_CREDENTIALS.
  // Override explicitly if needed:
  // projectId: process.env.FIRESTORE_PROJECT_ID,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a CollectionReference for the given collection name.
 */
function coll(collectionName) {
  return db.collection(collectionName);
}

/**
 * Converts a Firestore DocumentSnapshot to a plain record object.
 * The _id field is always set to the document ID.
 */
function snapToRecord(snap) {
  if (!snap || !snap.exists) return null;
  const data = snap.data();
  return { _id: snap.id, ...data };
}

/**
 * Generate a random 20-character document ID (compatible with Wix CMS ID format).
 */
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Map operator strings to Firestore comparison operator strings.
 *
 *   eq  →  ==      ne  →  !=
 *   gt  →   >      lt  →   <
 *   gte →  >=      lte →  <=
 *   in  →  in      contains → array-contains
 */
function mapOp(op) {
  const MAP = {
    eq: '==',   '==': '==',
    ne: '!=',   '!=': '!=',
    gt: '>',    '>':  '>',
    lt: '<',    '<':  '<',
    gte: '>=',  '>=': '>=',
    lte: '<=',  '<=': '<=',
    in: 'in',
    contains: 'array-contains',
    arrayContains: 'array-contains',
    'array-contains': 'array-contains',
    hasSome: 'array-contains-any',
    'array-contains-any': 'array-contains-any',
  };
  return MAP[op] || '==';
}

/**
 * Apply filters to a Firestore Query and return the narrowed query.
 *
 * Accepted filter shapes:
 *
 *   1. Simple object  { field: value }               — equality
 *   2. Operator obj   { field: { $gt: value } }      — operator-based ($eq/$ne/$gt/$lt/$gte/$lte/$in/$contains)
 *   3. Array          [{ field, operator, value }]    — explicit array form
 */
function applyFilters(query, filters) {
  if (!filters) return query;

  // Array form: [{ field, operator, value }, ...]
  if (Array.isArray(filters)) {
    for (const f of filters) {
      const op = mapOp(f.operator || f.op || 'eq');
      query = query.where(f.field, op, f.value);
    }
    return query;
  }

  // Object form
  for (const [field, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      // Operator form: { $gt: 10 } or { gt: 10 }
      for (const [rawOp, opVal] of Object.entries(value)) {
        const op = mapOp(rawOp.replace(/^\$/, ''));
        query = query.where(field, op, opVal);
      }
    } else {
      // Simple equality: { field: value }
      query = query.where(field, '==', value);
    }
  }

  return query;
}

/**
 * Apply sort to a Firestore Query.
 * sort can be:
 *   - string               → field name, ascending
 *   - { field, direction } → explicit
 *   - { fieldName, order } → alternate naming (matches some Wix patterns)
 */
function applySort(query, sort) {
  if (!sort) return query;
  if (typeof sort === 'string') {
    return query.orderBy(sort, 'asc');
  }
  const field = sort.field || sort.fieldName || sort.by;
  const dir   = (sort.direction || sort.order || 'asc').toLowerCase();
  return query.orderBy(field, dir === 'desc' ? 'desc' : 'asc');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Query records from a Firestore collection.
 *
 * @param {string} collectionName
 * @param {{ filters?, limit?, offset?, sort? }} [opts]
 * @returns {Promise<{ items: object[], totalCount: number }>}
 */
async function queryRecords(collectionName, opts = {}) {
  const { filters, limit = 100, offset = 0, sort } = opts;

  let q = coll(collectionName);
  q = applyFilters(q, filters);
  q = applySort(q, sort);

  // Firestore has no native integer offset — for small offsets we fetch extra and slice.
  // For large-scale paginated reads, prefer cursor-based pagination using startAfter.
  if (offset > 0) {
    const snap = await q.limit(offset + limit).get();
    const all  = snap.docs.slice(offset).map(snapToRecord);
    return { items: all, totalCount: snap.size };
  }

  const snap  = await q.limit(limit).get();
  const items = snap.docs.map(snapToRecord);
  return { items, totalCount: items.length };
}

/**
 * Get a single record by its document ID.
 *
 * @param {string} collectionName
 * @param {string} recordId
 * @returns {Promise<object|null>}
 */
async function getRecord(collectionName, recordId) {
  const snap = await coll(collectionName).doc(recordId).get();
  return snapToRecord(snap);
}

/**
 * Insert a new record. If data._id is provided it is used as the document ID;
 * otherwise a random ID is generated.
 *
 * @param {string} collectionName
 * @param {object} data
 * @param {{ suppressAuth?: boolean }} [opts]  — opts.suppressAuth is ignored (GCP has no Wix auth)
 * @returns {Promise<object>}  The inserted record (including _id, _createdDate, _updatedDate)
 */
async function insertRecord(collectionName, data, _opts = {}) {
  const id  = data._id || generateId();
  const now = new Date().toISOString();

  const record = {
    ...data,
    _id:          id,
    _createdDate: data._createdDate || now,
    _updatedDate: data._updatedDate || now,
  };

  await coll(collectionName).doc(id).set(record);
  return record;
}

/**
 * Update an existing record. data._id is required.
 * Only the provided fields are updated (merge behaviour).
 *
 * @param {string} collectionName
 * @param {object} data  Must include _id
 * @param {{ suppressAuth?: boolean }} [opts]
 * @returns {Promise<object>}  The full updated record
 */
async function updateRecord(collectionName, data, _opts = {}) {
  const { _id, ...fields } = data;
  if (!_id) throw new Error('[dataAccess-firestore] updateRecord: data._id is required');

  const now    = new Date().toISOString();
  const update = { ...fields, _updatedDate: now };

  await coll(collectionName).doc(_id).update(update);

  // Re-fetch and return the full updated document
  const snap = await coll(collectionName).doc(_id).get();
  return snapToRecord(snap);
}

/**
 * Delete a record by its document ID.
 *
 * @param {string} collectionName
 * @param {string} recordId
 * @returns {Promise<void>}
 */
async function deleteRecord(collectionName, recordId) {
  await coll(collectionName).doc(recordId).delete();
}

/**
 * Bulk-insert multiple records using Firestore batch writes.
 * Batches of 400 (Firestore limit is 500).
 *
 * @param {string} collectionName
 * @param {object[]} items
 * @returns {Promise<object[]>}  Inserted records with generated _ids
 */
async function bulkInsert(collectionName, items) {
  if (!items || items.length === 0) return [];

  const now     = new Date().toISOString();
  const results = [];
  const BATCH   = 400;

  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const batch = db.batch();

    for (const item of chunk) {
      const id     = item._id || generateId();
      const record = {
        ...item,
        _id:          id,
        _createdDate: item._createdDate || now,
        _updatedDate: item._updatedDate || now,
      };
      batch.set(coll(collectionName).doc(id), record);
      results.push(record);
    }

    await batch.commit();
  }

  return results;
}

/**
 * Bulk-update multiple records using Firestore batch writes.
 * Each item must have _id.
 *
 * @param {string} collectionName
 * @param {object[]} items  Each must include _id
 * @returns {Promise<object[]>}  Items with _updatedDate stamped
 */
async function bulkUpdate(collectionName, items) {
  if (!items || items.length === 0) return [];

  const now     = new Date().toISOString();
  const results = [];
  const BATCH   = 400;

  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const batch = db.batch();

    for (const item of chunk) {
      if (!item._id) throw new Error('[dataAccess-firestore] bulkUpdate: every item must have _id');
      const { _id, ...fields } = item;
      const update = { ...fields, _updatedDate: now };
      batch.update(coll(collectionName).doc(_id), update);
      results.push({ ...item, _updatedDate: now });
    }

    await batch.commit();
  }

  return results;
}

/**
 * Fetch all records from a collection.
 * Warning: can be slow on large collections. Prefer queryRecords with a limit.
 *
 * @param {string} collectionName
 * @param {{ filters?, sort?, limit? }} [opts]
 * @returns {Promise<object[]>}
 */
async function getAllRecords(collectionName, opts = {}) {
  const { filters, sort, limit } = opts;

  let q = coll(collectionName);
  q = applyFilters(q, filters);
  q = applySort(q, sort);
  if (limit) q = q.limit(limit);

  const snap = await q.get();
  return snap.docs.map(snapToRecord);
}

/**
 * Upsert a record: update if a document matching matchField=data[matchField]
 * already exists; otherwise insert.
 *
 * @param {string} collectionName
 * @param {object} data
 * @param {string} matchField  Field to match on (e.g. 'job_id', 'dot_number')
 * @returns {Promise<object>}  The upserted record
 */
async function upsertRecord(collectionName, data, matchField) {
  const matchValue = data[matchField];
  if (matchValue === undefined || matchValue === null) {
    throw new Error(`[dataAccess-firestore] upsertRecord: data.${matchField} is required`);
  }

  const snap = await coll(collectionName)
    .where(matchField, '==', matchValue)
    .limit(1)
    .get();

  if (!snap.empty) {
    const existing = snap.docs[0];
    const now = new Date().toISOString();
    await existing.ref.set({ ...data, _updatedDate: now }, { merge: true });
    const updated = await existing.ref.get();
    return snapToRecord(updated);
  }

  return insertRecord(collectionName, data);
}

/**
 * Count records matching optional filters.
 * Uses Firestore's native count() aggregation when available (SDK ≥ 6.5),
 * falls back to fetching all matching document references.
 *
 * @param {string} collectionName
 * @param {object} [filters]
 * @returns {Promise<number>}
 */
async function countRecords(collectionName, filters) {
  let q = coll(collectionName);
  q = applyFilters(q, filters);

  try {
    // Firestore native count() — available since @google-cloud/firestore 6.5
    const countSnap = await q.count().get();
    return countSnap.data().count;
  } catch (_) {
    // Fallback: fetch only document references (cheaper than full docs)
    const snap = await q.select('_id').get();
    return snap.size;
  }
}

/**
 * Find the first record where field === value.
 *
 * @param {string} collectionName
 * @param {string} field
 * @param {*} value
 * @returns {Promise<object|null>}
 */
async function findByField(collectionName, field, value) {
  const snap = await coll(collectionName)
    .where(field, '==', value)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snapToRecord(snap.docs[0]);
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  queryRecords,
  getRecord,
  insertRecord,
  updateRecord,
  deleteRecord,
  bulkInsert,
  bulkUpdate,
  getAllRecords,
  upsertRecord,
  countRecords,
  findByField,

  // Exposed for advanced use (custom queries, transactions, etc.)
  _db: db,
};
