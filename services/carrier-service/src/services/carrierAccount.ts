import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('carriers');

export interface CarrierInput {
  companyName?: string;
  dotNumber?: string;
  mcNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  fleetSize?: number;
  freightTypes?: string[];
  operatingRadius?: string;
}

export async function createCarrier(input: CarrierInput) {
  const _id = crypto.randomUUID();
  const data = {
    ...input,
    status: 'active',
    verified: false,
    createdAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function getCarrier(carrierId: string) {
  const result = await query(
    `SELECT _id, data, _created_at, _updated_at FROM "${TABLE}" WHERE _id = $1 LIMIT 1`,
    [carrierId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown>, _createdAt: row._created_at, _updatedAt: row._updated_at };
}

export async function updateCarrier(carrierId: string, fields: Record<string, unknown>) {
  const { sql, params } = buildUpdateQuery(TABLE, carrierId, fields);
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> };
}

export async function getCarrierByDot(dotNumber: string) {
  const result = await query(
    `SELECT _id, data, _created_at, _updated_at FROM "${TABLE}" WHERE data->>'dotNumber' = $1 LIMIT 1`,
    [dotNumber]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown>, _createdAt: row._created_at, _updatedAt: row._updated_at };
}
