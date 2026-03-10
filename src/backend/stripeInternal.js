import * as dataAccess from 'backend/dataAccess';
import {
  CONFIG,
  getStripeSecrets,
  getSubscriptionByCarrier,
  getApiSubscriptionByPartner,
  resolveApiTierFromSubscription,
  recordBillingEvent // Imported now
} from 'backend/stripeCommon';

// ============================================================================
// SUBSCRIPTION MANAGEMENT (INTERNAL)
// ============================================================================

export async function upsertSubscription(stripeSubscription, customerId) {
  try {
    const carrierDot = stripeSubscription.metadata?.carrier_dot;
    if (!carrierDot) return { success: false, error: 'Missing carrier_dot' };

    const secrets = await getStripeSecrets();
    const priceId = stripeSubscription.items?.data[0]?.price?.id;
    let planType = 'pro';
    if (priceId === secrets.priceEnterprise || priceId === secrets.priceEnterprise6Month) planType = 'enterprise';

    const existing = await getSubscriptionByCarrier(carrierDot);
    const subscriptionData = {
      carrier_dot: carrierDot, stripe_subscription_id: stripeSubscription.id, stripe_customer_id: customerId, plan_type: planType,
      status: stripeSubscription.status, current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000), monthly_view_quota: CONFIG.plans[planType].monthlyQuota,
      views_used_this_month: existing?.views_used_this_month || 0, is_active: stripeSubscription.status === 'active'
    };

    const result = existing
      ? await dataAccess.updateRecord(CONFIG.subscriptionsKey, { ...existing, ...subscriptionData }, { suppressAuth: true })
      : await dataAccess.insertRecord(CONFIG.subscriptionsKey, subscriptionData, { suppressAuth: true });

    return { success: true, subscriptionId: result.record._id };
  } catch (error) { return { success: false, error: error.message }; }
}

export async function resetQuota(carrierDot, periodStart, periodEnd) {
  try {
    const subscription = await getSubscriptionByCarrier(carrierDot);
    if (!subscription) return { success: false, error: 'Not found' };
    await dataAccess.updateRecord(CONFIG.subscriptionsKey, { ...subscription, views_used_this_month: 0, current_period_start: periodStart, current_period_end: periodEnd }, { suppressAuth: true });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

export async function updateSubscriptionStatus(stripeSubscriptionId, status) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.subscriptionsKey, { filters: { stripe_subscription_id: stripeSubscriptionId }, limit: 1, suppressAuth: true });
    if (!result.items?.length) return { success: false, error: 'Not found' };
    await dataAccess.updateRecord(CONFIG.subscriptionsKey, { ...result.items[0], status, is_active: status === 'active' }, { suppressAuth: true });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

// ============================================================================
// BILLING HISTORY & EVENT LOGGING (INTERNAL)
// ============================================================================

// recordBillingEvent is imported from stripeCommon

export async function isEventProcessed(eventId) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.stripeEventsKey, { filters: { event_id: eventId }, limit: 1, suppressAuth: true });
    return (result.items?.length || 0) > 0;
  } catch (e) { return false; }
}

export async function logStripeEvent(eventId, eventType, data = {}) {
  try {
    await dataAccess.insertRecord(CONFIG.stripeEventsKey, { event_id: eventId, event_type: eventType, processed_at: new Date() }, { suppressAuth: true });
  } catch (e) { }
}

export async function updatePaymentStatus(sessionId, status, paymentData = {}) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.carrierPaymentsKey, { filters: { stripe_session_id: sessionId }, limit: 1, suppressAuth: true });
    if (!result.items?.length) return { success: false, error: 'Not found' };
    await dataAccess.updateRecord(CONFIG.carrierPaymentsKey, { ...result.items[0], status, completed_at: new Date() }, { suppressAuth: true });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

// ============================================================================
// API PLATFORM SUBSCRIPTION MANAGEMENT (INTERNAL)
// ============================================================================

export async function upsertApiSubscriptionFromStripe(stripeSubscription, customerId) {
  try {
    const partnerId = stripeSubscription?.metadata?.partner_id;
    if (!partnerId) return { success: false, error: 'Missing partner_id metadata' };

    const tier = await resolveApiTierFromSubscription(stripeSubscription);
    const tierConfig = CONFIG.apiPlans[tier] || CONFIG.apiPlans.starter;

    const existing = await getApiSubscriptionByPartner(partnerId);
    const payload = {
      partner_id: partnerId,
      tier,
      plan_type: stripeSubscription?.metadata?.billing_cycle || 'monthly',
      price_monthly: tierConfig.monthlyPrice,
      api_products: tierConfig.apiProducts,
      rate_limits: {
        requests_per_minute: tierConfig.requestsPerMinute,
        requests_per_month: tierConfig.requestsPerMonth
      },
      quotas: {
        driver_searches_monthly: tierConfig.driverSearchesMonthly,
        document_extractions_monthly: tierConfig.documentExtractionsMonthly
      },
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: customerId || existing?.stripe_customer_id || null,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      status: stripeSubscription.status === 'active' ? 'active' : stripeSubscription.status
    };

    if (existing?._id) {
      const updated = await dataAccess.updateRecord(CONFIG.apiSubscriptionsKey, {
        ...existing,
        ...payload
      }, { suppressAuth: true });
      return { success: true, record: updated?.record || updated };
    }

    const inserted = await dataAccess.insertRecord(CONFIG.apiSubscriptionsKey, payload, { suppressAuth: true });
    return { success: true, record: inserted?.record || inserted };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateApiSubscriptionStatus(stripeSubscriptionId, status) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.apiSubscriptionsKey, {
      filters: { stripe_subscription_id: stripeSubscriptionId },
      limit: 1,
      suppressAuth: true
    });
    if (!result?.items?.length) return { success: false, error: 'Not found' };

    await dataAccess.updateRecord(CONFIG.apiSubscriptionsKey, {
      ...result.items[0],
      status
    }, { suppressAuth: true });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
