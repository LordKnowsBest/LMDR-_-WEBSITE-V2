import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import crypto from 'crypto';

const TABLE = getTableName('billingHistory');

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceRecord {
  _id: string;
  carrierId: string;
  lineItems: LineItem[];
  subtotal: number;
  total: number;
  status: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export async function createInvoice(
  carrierId: string,
  lineItems: LineItem[],
  dueDate: string
): Promise<InvoiceRecord> {
  const _id = crypto.randomUUID();
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const now = new Date().toISOString();

  const data = {
    carrierId,
    lineItems,
    subtotal,
    total: subtotal,
    status: 'draft',
    dueDate,
    createdAt: now,
    updatedAt: now,
  };

  const { sql, params } = buildInsertQuery(TABLE, { _id, data });
  const result = await query(sql, params);
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> } as InvoiceRecord;
}

export async function getInvoice(id: string): Promise<InvoiceRecord | null> {
  const result = await query(
    `SELECT _id, data FROM "${TABLE}" WHERE _id = $1 LIMIT 1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> } as InvoiceRecord;
}

export async function listInvoices(
  carrierId: string,
  limit = 50
): Promise<InvoiceRecord[]> {
  const result = await query(
    `SELECT _id, data FROM "${TABLE}"
     WHERE data->>'carrierId' = $1
     ORDER BY _created_at DESC
     LIMIT $2`,
    [carrierId, limit]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> } as InvoiceRecord));
}

export async function updateInvoiceStatus(
  id: string,
  status: string
): Promise<InvoiceRecord | null> {
  const { sql, params } = buildUpdateQuery(TABLE, id, {
    status,
    updatedAt: new Date().toISOString(),
  });
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> } as InvoiceRecord;
}
