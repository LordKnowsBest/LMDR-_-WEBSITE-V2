import { query, getTableName } from '@lmdr/db';

const CARRIERS_TABLE = getTableName('carriers');
const PREFERENCES_TABLE = getTableName('carrierHiringPreferences');
const JOBS_TABLE = getTableName('jobPostings');

export async function getActiveCarrierCount() {
  const result = await query(
    `SELECT COUNT(*) as count FROM "${CARRIERS_TABLE}" WHERE data->>'status' = 'active'`
  );
  return Number(result.rows[0].count);
}

export async function getCarriersByState(state: string, limit = 50) {
  const result = await query(
    `SELECT _id, data FROM "${CARRIERS_TABLE}"
     WHERE data->>'state' = $1 AND data->>'status' = 'active'
     ORDER BY _created_at DESC
     LIMIT $2`,
    [state, limit]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}

export async function getCarriersWithPreferences(limit = 50) {
  const result = await query(
    `SELECT c._id, c.data as carrier_data, p.data as preferences_data
     FROM "${CARRIERS_TABLE}" c
     LEFT JOIN "${PREFERENCES_TABLE}" p ON p.data->>'carrierId' = c._id
     WHERE c.data->>'status' = 'active'
     ORDER BY c._created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(r => ({
    _id: r._id,
    ...r.carrier_data as Record<string, unknown>,
    preferences: r.preferences_data as Record<string, unknown> | null,
  }));
}

export async function getOpenJobsByFreightType(freightType: string, limit = 50) {
  const result = await query(
    `SELECT _id, data FROM "${JOBS_TABLE}"
     WHERE data->>'freightType' = $1 AND data->>'status' = 'open'
     ORDER BY _created_at DESC
     LIMIT $2`,
    [freightType, limit]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}

export async function getCarrierJobStats(carrierId: string) {
  const result = await query(
    `SELECT
       data->>'status' as status,
       COUNT(*) as count
     FROM "${JOBS_TABLE}"
     WHERE data->>'carrierId' = $1
     GROUP BY data->>'status'`,
    [carrierId]
  );
  return result.rows.reduce((acc: Record<string, number>, r) => {
    acc[r.status as string] = Number(r.count);
    return acc;
  }, {});
}
