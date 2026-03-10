import { query, getTableName } from '@lmdr/db';

const PROFILES_TABLE = getTableName('driverProfiles');
const PREFERENCES_TABLE = getTableName('driverJobPreferences');

export async function getDriverPreferences(driverId: string) {
  const result = await query(
    `SELECT _id, data FROM "${PREFERENCES_TABLE}" WHERE data->>'driverId' = $1 LIMIT 1`,
    [driverId]
  );
  if (result.rows.length === 0) return null;
  return { _id: result.rows[0]._id, ...result.rows[0].data as Record<string, unknown> };
}

export async function getActiveDriverCount() {
  const result = await query(
    `SELECT COUNT(*) as count FROM "${PROFILES_TABLE}" WHERE data->>'onboardingComplete' = 'true'`
  );
  return Number(result.rows[0].count);
}

export async function getDriversByState(state: string, limit = 50) {
  const result = await query(
    `SELECT _id, data FROM "${PROFILES_TABLE}"
     WHERE data->>'homeState' = $1 AND data->>'isSearchable' = 'true'
     ORDER BY _created_at DESC
     LIMIT $2`,
    [state, limit]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}
