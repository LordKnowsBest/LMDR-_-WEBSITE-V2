import { query } from '@lmdr/db';
import crypto from 'crypto';

const INTERESTS_TABLE = 'airtable_driver_carrier_interests';
const JOB_POSTINGS_TABLE = 'airtable_job_postings';

export async function assignDriverToJob(driverId: string, jobId: string, assignedBy: string) {
  const _id = crypto.randomUUID();
  const now = new Date().toISOString();

  const result = await query(
    `INSERT INTO "${INTERESTS_TABLE}" (_id, data, _created_at, _updated_at)
     VALUES ($1, $2::jsonb, NOW(), NOW())
     RETURNING _id, data, _created_at, _updated_at`,
    [
      _id,
      JSON.stringify({
        driverId,
        jobId,
        assignedBy,
        status: 'assigned',
        assignedAt: now,
      }),
    ]
  );

  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function getDispatchQueue() {
  const result = await query(
    `SELECT j._id, j.data, j._created_at
     FROM "${JOB_POSTINGS_TABLE}" j
     WHERE j.data->>'status' = 'open'
     ORDER BY j._created_at ASC`
  );
  return result.rows.map(r => ({
    _id: r._id,
    ...r.data as Record<string, unknown>,
    _createdAt: r._created_at,
  }));
}

export async function getAssignmentsForJob(jobId: string) {
  const result = await query(
    `SELECT _id, data, _created_at FROM "${INTERESTS_TABLE}"
     WHERE data->>'jobId' = $1
     ORDER BY _created_at DESC`,
    [jobId]
  );
  return result.rows.map(r => ({
    _id: r._id,
    ...r.data as Record<string, unknown>,
    _createdAt: r._created_at,
  }));
}
