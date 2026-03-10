import { query, getTableName, buildInsertQuery, buildUpdateQuery } from '@lmdr/db';
import Stripe from 'stripe';
import crypto from 'crypto';

const TABLE = getTableName('carrierSubscriptions');

export interface SubscriptionRecord {
  _id: string;
  carrierId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getCarrierSubscription(carrierId: string): Promise<SubscriptionRecord | null> {
  const result = await query(
    `SELECT _id, data FROM "${TABLE}" WHERE data->>'carrierId' = $1 LIMIT 1`,
    [carrierId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { _id: row._id, ...row.data as Record<string, unknown> } as SubscriptionRecord;
}

export async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const carrierId = paymentIntent.metadata?.carrierId;
  if (!carrierId) {
    console.warn('[subscriptions] payment_intent.succeeded missing carrierId in metadata');
    return;
  }

  const existing = await getCarrierSubscription(carrierId);
  const now = new Date().toISOString();

  if (existing) {
    const { sql, params } = buildUpdateQuery(TABLE, existing._id, {
      status: 'active',
      updatedAt: now,
    });
    await query(sql, params);
  } else {
    const _id = crypto.randomUUID();
    const data = {
      carrierId,
      stripeCustomerId: paymentIntent.customer as string || undefined,
      plan: paymentIntent.metadata?.plan || 'standard',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    const { sql, params } = buildInsertQuery(TABLE, { _id, data });
    await query(sql, params);
  }

  console.log(`[subscriptions] Payment succeeded for carrier ${carrierId}`);
}

export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const carrierId = invoice.metadata?.carrierId;
  if (!carrierId) {
    console.warn('[subscriptions] invoice.paid missing carrierId in metadata');
    return;
  }

  const existing = await getCarrierSubscription(carrierId);
  if (existing) {
    const { sql, params } = buildUpdateQuery(TABLE, existing._id, {
      status: 'active',
      updatedAt: new Date().toISOString(),
    });
    await query(sql, params);
  }

  console.log(`[subscriptions] Invoice paid for carrier ${carrierId}`);
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const carrierId = subscription.metadata?.carrierId;
  if (!carrierId) {
    console.warn('[subscriptions] subscription event missing carrierId in metadata');
    return;
  }

  const existing = await getCarrierSubscription(carrierId);
  const now = new Date().toISOString();

  const fields = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: now,
  };

  if (existing) {
    const { sql, params } = buildUpdateQuery(TABLE, existing._id, fields);
    await query(sql, params);
  } else {
    const _id = crypto.randomUUID();
    const data = {
      carrierId,
      plan: subscription.metadata?.plan || 'standard',
      createdAt: now,
      ...fields,
    };
    const { sql, params } = buildInsertQuery(TABLE, { _id, data });
    await query(sql, params);
  }

  console.log(`[subscriptions] Subscription ${subscription.status} for carrier ${carrierId}`);
}
