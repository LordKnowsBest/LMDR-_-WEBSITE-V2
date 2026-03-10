import { query, getTableName } from '@lmdr/db';

const MATCH_EVENTS_TABLE = getTableName('matchEvents');
const INTERESTS_TABLE = getTableName('driverCarrierInterests');

export async function getMatchHistory(driverId: string, limit = 50) {
  const { rows } = await query(
    `SELECT _id, data, _created_at FROM "${MATCH_EVENTS_TABLE}"
     WHERE data->>'driverId' = $1
     ORDER BY _created_at DESC
     LIMIT $2`,
    [driverId, limit]
  );
  return rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown>, createdAt: r._created_at }));
}

export async function getDriverInterests(driverId: string) {
  const { rows } = await query(
    `SELECT _id, data FROM "${INTERESTS_TABLE}"
     WHERE data->>'driver_id' = $1
     ORDER BY data->>'createdAt' DESC`,
    [driverId]
  );
  return rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}

export async function getCarrierInterests(carrierId: string) {
  const { rows } = await query(
    `SELECT _id, data FROM "${INTERESTS_TABLE}"
     WHERE data->>'carrier_dot' = $1
     ORDER BY data->>'createdAt' DESC`,
    [carrierId]
  );
  return rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}
