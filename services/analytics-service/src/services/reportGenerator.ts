import crypto from 'crypto';
import { query, getTableName, buildInsertQuery } from '@lmdr/db';

const REPORTS_TABLE = getTableName('complianceReports');
const SCHEDULED_TABLE = getTableName('scheduledReports');

export interface Report {
  _id: string;
  templateId: string;
  status: 'pending' | 'completed' | 'failed';
  params?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export async function generateReport(
  templateId: string,
  params?: Record<string, unknown>
): Promise<Report> {
  const _id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Create report with status 'pending'
  const pendingData = { templateId, status: 'pending', params: params || {}, createdAt };
  const { sql: insertSql, params: insertParams } = buildInsertQuery(REPORTS_TABLE, {
    _id,
    data: pendingData,
  });
  await query(insertSql, insertParams);

  // Simulate report generation — mark as completed
  const completedAt = new Date().toISOString();
  await query(
    `UPDATE "${REPORTS_TABLE}"
     SET data = data || $1::jsonb, _updated_at = NOW()
     WHERE _id = $2`,
    [JSON.stringify({ status: 'completed', completedAt }), _id]
  );

  return {
    _id,
    templateId,
    status: 'completed',
    params: params || {},
    createdAt,
    completedAt,
  };
}

export async function getReport(reportId: string): Promise<Report | null> {
  const result = await query(
    `SELECT _id, data FROM "${REPORTS_TABLE}" WHERE _id = $1 LIMIT 1`,
    [reportId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...(row.data as Record<string, unknown>) } as Report;
}

export async function listReports(limit = 50): Promise<Report[]> {
  const result = await query(
    `SELECT _id, data FROM "${REPORTS_TABLE}" ORDER BY _created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    _id: row._id,
    ...(row.data as Record<string, unknown>),
  })) as Report[];
}
