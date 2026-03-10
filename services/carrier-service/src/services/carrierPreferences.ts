import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('carrierHiringPreferences');

export interface CarrierPreferencesInput {
  minExperience?: number;
  requiredCdlClass?: string;
  requiredEndorsements?: string[];
  preferredStates?: string[];
  maxMvrPoints?: number;
  petFriendly?: boolean;
  teamDriving?: boolean;
  freightTypes?: string[];
  payRangeMin?: number;
  payRangeMax?: number;
  homeTimePolicy?: string;
}

export async function getPreferences(carrierId: string) {
  const result = await query(
    `SELECT _id, data FROM "${TABLE}" WHERE data->>'carrierId' = $1 LIMIT 1`,
    [carrierId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function updatePreferences(carrierId: string, prefs: CarrierPreferencesInput) {
  // Check if preferences exist for this carrier
  const existing = await getPreferences(carrierId);

  if (existing) {
    const { sql, params } = buildUpdateQuery(TABLE, existing._id, prefs as Record<string, unknown>);
    const result = await query(sql, params);
    const row = result.rows[0];
    return { _id: row._id, ...row.data as Record<string, unknown> };
  }

  // Create new preferences record
  const _id = crypto.randomUUID();
  const data = {
    carrierId,
    ...prefs,
    createdAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}
