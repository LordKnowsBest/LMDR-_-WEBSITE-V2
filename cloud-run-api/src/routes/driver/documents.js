import { Router } from 'express';
import { query } from '../../db/pool.js';
import { getTableName } from '../../db/schema.js';
import { insertLog, insertAuditEvent } from '../../db/bigquery.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const VALID_DOC_TYPES = ['cdl', 'medical_card', 'mvr', 'employment_history', 'drug_test', 'training_cert', 'background_check', 'w9'];

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
  console.error(`[driver/documents] ${context}:`, err.message);
  insertLog({ service: 'driver', level: 'ERROR', message: `documents/${context} failed`, data: { error: err.message }, is_error: true });
  return res.status(500).json({ error: `${context} failed`, detail: err.message });
}

// ── GET /:id/list — Get all documents for a driver ──
router.get('/:id/list', async (req, res) => {
  try {
    const table = getTableName('qualificationFiles');
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1 ORDER BY _created_at DESC`,
      [req.params.id]
    );
    const now = new Date();
    const documents = formatRecords(result.rows).map(doc => {
      const expired = doc.expiration_date ? new Date(doc.expiration_date) < now : false;
      return { ...doc, is_expired: expired };
    });
    return res.json({ items: documents, totalCount: documents.length });
  } catch (err) { return handleError(res, 'list-documents', err); }
});

// ── POST /:id/upload — Record a document upload ──
router.post('/:id/upload', async (req, res) => {
  try {
    const { docType, fileName, fileUrl, expirationDate } = req.body;
    if (!docType || !VALID_DOC_TYPES.includes(docType)) {
      return res.status(400).json({ error: 'INVALID_DOC_TYPE', message: `docType must be one of: ${VALID_DOC_TYPES.join(', ')}` });
    }
    if (!fileName) {
      return res.status(400).json({ error: 'MISSING_FILE_NAME', message: 'fileName is required' });
    }

    const docTable = getTableName('qualificationFiles');
    const docId = uuidv4();
    const data = {
      driver_id: req.params.id,
      doc_type: docType,
      file_name: fileName,
      file_url: fileUrl || '',
      expiration_date: expirationDate || null,
      status: 'pending_review',
      uploaded_at: new Date().toISOString(),
    };
    await query(
      `INSERT INTO "${docTable}" (_id, airtable_id, _created_at, _updated_at, data) VALUES ($1, $1, NOW(), NOW(), $2)`,
      [docId, JSON.stringify(data)]
    );

    // Increment documents_uploaded count on driver profile
    const profileTable = getTableName('driverProfiles');
    await safeQuery(
      `UPDATE "${profileTable}" SET data = jsonb_set(data, '{documents_uploaded}', to_jsonb(COALESCE((data->>'documents_uploaded')::int, 0) + 1)), _updated_at = NOW() WHERE _id = $1`,
      [req.params.id]
    );

    insertAuditEvent({ actor_id: req.auth?.uid, action: 'DOCUMENT_UPLOADED', resource_type: 'document', resource_id: docId, after_state: { doc_type: docType, driver_id: req.params.id } });
    insertLog({ service: 'driver', level: 'INFO', message: 'document_uploaded', data: { driver_id: req.params.id, doc_type: docType, doc_id: docId } });

    return res.status(201).json({ success: true, document: { _id: docId, ...data } });
  } catch (err) { return handleError(res, 'upload-document', err); }
});

// ── GET /:id/status — Get document compliance status ──
router.get('/:id/status', async (req, res) => {
  try {
    const table = getTableName('qualificationFiles');
    const result = await safeQuery(
      `SELECT * FROM "${table}" WHERE data->>'driver_id' = $1`,
      [req.params.id]
    );
    const docs = formatRecords(result.rows);
    const now = new Date();

    const complete = [];
    const expired = [];
    const pendingReview = [];
    const seenTypes = new Set();

    for (const doc of docs) {
      const type = doc.doc_type;
      const isExpired = doc.expiration_date ? new Date(doc.expiration_date) < now : false;
      if (isExpired) {
        expired.push(type);
      } else if (doc.status === 'pending_review') {
        pendingReview.push(type);
      } else {
        complete.push(type);
      }
      seenTypes.add(type);
    }

    const missing = VALID_DOC_TYPES.filter(t => !seenTypes.has(t));

    return res.json({ complete, missing, expired, pendingReview });
  } catch (err) { return handleError(res, 'document-status', err); }
});

// ── PUT /:id/doc/:docId — Update document metadata ──
router.put('/:id/doc/:docId', async (req, res) => {
  try {
    const table = getTableName('qualificationFiles');

    // Validate ownership
    const existing = await safeQuery(
      `SELECT * FROM "${table}" WHERE _id = $1 AND data->>'driver_id' = $2`,
      [req.params.docId, req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found or does not belong to this driver' });
    }

    const { status, expirationDate, notes } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (expirationDate !== undefined) updates.expiration_date = expirationDate;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await query(
      `UPDATE "${table}" SET data = data || $2, _updated_at = NOW() WHERE _id = $1 RETURNING *`,
      [req.params.docId, JSON.stringify(updates)]
    );
    insertAuditEvent({ actor_id: req.auth?.uid, action: 'DOCUMENT_UPDATED', resource_type: 'document', resource_id: req.params.docId, after_state: updates });
    return res.json({ success: true, document: formatRecord(result.rows[0]) });
  } catch (err) { return handleError(res, 'update-document', err); }
});

// ── DELETE /:id/doc/:docId — Delete document record ──
router.delete('/:id/doc/:docId', async (req, res) => {
  try {
    const table = getTableName('qualificationFiles');

    // Validate ownership
    const existing = await safeQuery(
      `SELECT * FROM "${table}" WHERE _id = $1 AND data->>'driver_id' = $2`,
      [req.params.docId, req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found or does not belong to this driver' });
    }

    await query(`DELETE FROM "${table}" WHERE _id = $1`, [req.params.docId]);

    // Decrement documents_uploaded count on driver profile
    const profileTable = getTableName('driverProfiles');
    await safeQuery(
      `UPDATE "${profileTable}" SET data = jsonb_set(data, '{documents_uploaded}', to_jsonb(GREATEST(COALESCE((data->>'documents_uploaded')::int, 0) - 1, 0))), _updated_at = NOW() WHERE _id = $1`,
      [req.params.id]
    );

    insertAuditEvent({ actor_id: req.auth?.uid, action: 'DOCUMENT_DELETED', resource_type: 'document', resource_id: req.params.docId });
    return res.json({ success: true });
  } catch (err) { return handleError(res, 'delete-document', err); }
});

export default router;
