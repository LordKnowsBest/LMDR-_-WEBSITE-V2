import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('driverProfiles');

export interface DriverProfileInput {
  memberId?: string;
  cdlClass?: string;
  yearsExperience?: number;
  homeState?: string;
  freightPreference?: string[];
  endorsements?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export async function createDriverProfile(input: DriverProfileInput) {
  const _id = crypto.randomUUID();
  const data = {
    ...input,
    isSearchable: false,
    visibilityLevel: 'private',
    onboardingStep: 1,
    onboardingComplete: false,
    docsSubmitted: false,
    createdAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function getDriverProfile(driverId: string) {
  const result = await query(
    `SELECT _id, data, _created_at, _updated_at FROM "${TABLE}" WHERE _id = $1 LIMIT 1`,
    [driverId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown>, _createdAt: row._created_at, _updatedAt: row._updated_at };
}

export async function updateDriverProfile(driverId: string, fields: Record<string, unknown>) {
  const { sql, params } = buildUpdateQuery(TABLE, driverId, fields);
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function getDriverByMemberId(memberId: string) {
  const result = await query(
    `SELECT _id, data FROM "${TABLE}" WHERE data->>'memberId' = $1 LIMIT 1`,
    [memberId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}
