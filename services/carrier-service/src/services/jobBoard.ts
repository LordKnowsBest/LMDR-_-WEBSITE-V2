import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('jobPostings');

export interface JobInput {
  title?: string;
  description?: string;
  freightType?: string;
  routeType?: string;
  origin?: string;
  destination?: string;
  payRate?: number;
  payType?: string;
  cdlClassRequired?: string;
  endorsementsRequired?: string;
  experienceRequired?: number;
  teamDriving?: boolean;
  homeTimePolicy?: string;
}

export async function getCarrierJobs(carrierId: string) {
  const result = await query(
    `SELECT _id, data, _created_at, _updated_at FROM "${TABLE}"
     WHERE data->>'carrierId' = $1
     ORDER BY _created_at DESC`,
    [carrierId]
  );
  return result.rows.map(r => ({
    _id: r._id,
    ...r.data as Record<string, unknown>,
    _createdAt: r._created_at,
    _updatedAt: r._updated_at,
  }));
}

export async function createJob(carrierId: string, input: JobInput) {
  const _id = crypto.randomUUID();
  const data = {
    carrierId,
    ...input,
    status: 'open',
    applicantCount: 0,
    createdAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function updateJobStatus(jobId: string, status: string) {
  const { sql, params } = buildUpdateQuery(TABLE, jobId, { status });
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}
