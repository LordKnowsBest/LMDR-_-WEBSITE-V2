import { query, getTableName } from '@lmdr/db';

const BILLING_TABLE = getTableName('billingHistory');
const SUBSCRIPTIONS_TABLE = getTableName('carrierSubscriptions');
const PRICING_TABLE = getTableName('pricingTiers');

export async function getInvoicesByStatus(status: string, limit = 50) {
  const result = await query(
    `SELECT _id, data FROM "${BILLING_TABLE}"
     WHERE data->>'status' = $1
     ORDER BY _created_at DESC
     LIMIT $2`,
    [status, limit]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}

export async function getOverdueInvoices(beforeDate: string) {
  const result = await query(
    `SELECT _id, data FROM "${BILLING_TABLE}"
     WHERE data->>'status' = 'sent'
       AND data->>'dueDate' < $1
     ORDER BY data->>'dueDate' ASC`,
    [beforeDate]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}

export async function getActiveSubscriptionCount() {
  const result = await query(
    `SELECT COUNT(*) as count FROM "${SUBSCRIPTIONS_TABLE}"
     WHERE data->>'status' = 'active'`
  );
  return Number(result.rows[0].count);
}

export async function getSubscriptionsByPlan(plan: string) {
  const result = await query(
    `SELECT _id, data FROM "${SUBSCRIPTIONS_TABLE}"
     WHERE data->>'plan' = $1 AND data->>'status' = 'active'
     ORDER BY _created_at DESC`,
    [plan]
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}

export async function getRevenueByCarrier(carrierId: string) {
  const result = await query(
    `SELECT COALESCE(SUM((data->>'total')::numeric), 0) as total_revenue,
            COUNT(*) as invoice_count
     FROM "${BILLING_TABLE}"
     WHERE data->>'carrierId' = $1 AND data->>'status' = 'paid'`,
    [carrierId]
  );
  return {
    totalRevenue: Number(result.rows[0].total_revenue),
    invoiceCount: Number(result.rows[0].invoice_count),
  };
}

export async function getActivePricingTiers() {
  const result = await query(
    `SELECT _id, data FROM "${PRICING_TABLE}"
     WHERE data->>'isActive' = 'true' AND data->>'carrierId' IS NULL
     ORDER BY (data->>'pricePerHire')::numeric ASC`
  );
  return result.rows.map(r => ({ _id: r._id, ...r.data as Record<string, unknown> }));
}
