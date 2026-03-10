import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('qualificationFiles');

export interface DocumentInput {
  docType: string;
  fileName: string;
  storageUrl?: string;
  mimeType?: string;
}

export async function getDocuments(driverId: string) {
  const result = await query(
    `SELECT _id, data, _created_at FROM "${TABLE}"
     WHERE data->>'driverId' = $1
     ORDER BY _created_at DESC`,
    [driverId]
  );
  return result.rows.map(r => ({
    _id: r._id,
    ...r.data as Record<string, unknown>,
    createdAt: r._created_at,
  }));
}

export async function registerDocument(driverId: string, input: DocumentInput) {
  const _id = crypto.randomUUID();
  const data = {
    driverId,
    docType: input.docType,
    fileName: input.fileName,
    storageUrl: input.storageUrl || '',
    mimeType: input.mimeType || 'application/pdf',
    status: 'pending_review',
    uploadedAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function updateDocumentStatus(docId: string, status: string) {
  const validStatuses = ['pending_review', 'approved', 'rejected', 'expired'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const { sql, params } = buildUpdateQuery(TABLE, docId, {
    status,
    reviewedAt: new Date().toISOString(),
  });
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}
