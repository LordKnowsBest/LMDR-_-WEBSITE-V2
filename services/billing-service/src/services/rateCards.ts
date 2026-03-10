import { query, getTableName, buildInsertQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('pricingTiers');

export interface RateCardInput {
  carrierId?: string;
  name: string;
  description?: string;
  tier: string;
  pricePerHire: number;
  pricePerMonth?: number;
  features?: string[];
  isActive?: boolean;
}

export interface RateCardRecord {
  _id: string;
  carrierId?: string;
  name: string;
  description?: string;
  tier: string;
  pricePerHire: number;
  pricePerMonth?: number;
  features?: string[];
  isActive: boolean;
  createdAt: string;
}

export async function listRateCards(carrierId?: string): Promise<RateCardRecord[]> {
  let sql: string;
  let params: unknown[];

  if (carrierId) {
    sql = `SELECT _id, data FROM "${TABLE}"
           WHERE (data->>'carrierId' = $1 OR data->>'carrierId' IS NULL)
             AND data->>'isActive' = 'true'
           ORDER BY _created_at DESC`;
    params = [carrierId];
  } else {
    sql = `SELECT _id, data FROM "${TABLE}"
           WHERE data->>'isActive' = 'true'
           ORDER BY _created_at DESC`;
    params = [];
  }

  const result = await query(sql, params);
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> } as RateCardRecord));
}

export async function createRateCard(input: RateCardInput): Promise<RateCardRecord> {
  const _id = crypto.randomUUID();
  const data = {
    ...input,
    isActive: input.isActive !== false,
    createdAt: new Date().toISOString(),
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> } as RateCardRecord;
}
