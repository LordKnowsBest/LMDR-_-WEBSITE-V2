import { getSecret } from 'wix-secrets-backend';
import * as dataAccess from 'backend/dataAccess';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const CONFIG = {
  // Collection keys for dataAccess routing
  subscriptionsKey: 'carrierSubscriptions',
  apiSubscriptionsKey: 'apiSubscriptions',
  apiUsageKey: 'apiUsage',
  apiPartnersKey: 'apiPartners',
  stripeEventsKey: 'stripeEvents',
  billingHistoryKey: 'billingHistory',
  carrierPaymentsKey: 'carrierPayments',

  // Stripe API base URL
  stripeApiBase: 'https://api.stripe.com/v1',

  // Plan configurations
  plans: {
    pro: { name: 'LMDR Pro', monthlyQuota: 25, features: ['driver_search', 'profile_view', 'messaging'] },
    enterprise: { name: 'LMDR Enterprise', monthlyQuota: -1, features: ['driver_search', 'profile_view', 'messaging', 'api_access', 'priority_support'] }
  },
  apiPlans: {
    starter: {
      monthlyPrice: 99,
      annualPrice: 990,
      requestsPerMinute: 10,
      requestsPerMonth: 5000,
      driverSearchesMonthly: 0,
      documentExtractionsMonthly: 0,
      overagePricePerCall: 0.005,
      apiProducts: ['safety_suite']
    },
    growth: {
      monthlyPrice: 499,
      annualPrice: 4990,
      requestsPerMinute: 60,
      requestsPerMonth: 50000,
      driverSearchesMonthly: 100,
      documentExtractionsMonthly: 50,
      overagePricePerCall: 0.005,
      apiProducts: ['safety_suite', 'intelligence_suite', 'operations_suite', 'document_suite']
    },
    enterprise: {
      monthlyPrice: 999,
      annualPrice: 9990,
      requestsPerMinute: 300,
      requestsPerMonth: Number.MAX_SAFE_INTEGER,
      driverSearchesMonthly: Number.MAX_SAFE_INTEGER,
      documentExtractionsMonthly: 500,
      overagePricePerCall: 0.003,
      apiProducts: ['safety_suite', 'intelligence_suite', 'operations_suite', 'matching_suite', 'document_suite', 'engagement_suite']
    }
  }
};

// ============================================================================
// STRIPE CLIENT HELPERS
// ============================================================================

let cachedSecrets = null;

export async function getStripeSecrets() {
  if (cachedSecrets) return cachedSecrets;
  try {
    const [
      secretKey,
      publishableKey,
      pricePro,
      priceEnterprise,
      pricePlacementDeposit,
      webhookSecret,
      priceProMonthly,
      pricePro6Month,
      priceEnterprise6Month,
      priceApiStarterMonthly,
      priceApiStarterAnnual,
      priceApiGrowthMonthly,
      priceApiGrowthAnnual,
      priceApiEnterpriseMonthly,
      priceApiEnterpriseAnnual
    ] = await Promise.all([
      getSecret('SECRET_KEY_STRIPE'), getSecret('PUBLISHABLE_STRIPE'), getSecret('STRIPE_PRICE_PRO').catch(() => null),
      getSecret('STRIPE_PRICE_ENTERPRISE').catch(() => null), getSecret('STRIPE_PRICE_PLACEMENT_DEPOSIT').catch(() => null),
      getSecret('STRIPE_WEBHOOK_SECRET').catch(() => null), getSecret('STRIPE_PRICE_PRO_MONTHLY').catch(() => null),
      getSecret('STRIPE_PRICE_PRO_6MONTH').catch(() => null), getSecret('STRIPE_PRICE_ENTERPRISE_6MONTH').catch(() => null),
      getSecret('STRIPE_PRICE_API_STARTER_MONTHLY').catch(() => null),
      getSecret('STRIPE_PRICE_API_STARTER_ANNUAL').catch(() => null),
      getSecret('STRIPE_PRICE_API_GROWTH_MONTHLY').catch(() => null),
      getSecret('STRIPE_PRICE_API_GROWTH_ANNUAL').catch(() => null),
      getSecret('STRIPE_PRICE_API_ENTERPRISE_MONTHLY').catch(() => null),
      getSecret('STRIPE_PRICE_API_ENTERPRISE_ANNUAL').catch(() => null)
    ]);
    cachedSecrets = {
      secretKey,
      publishableKey,
      pricePro,
      priceEnterprise,
      pricePlacementDeposit,
      webhookSecret,
      priceProMonthly,
      pricePro6Month,
      priceEnterprise6Month,
      priceApiStarterMonthly,
      priceApiStarterAnnual,
      priceApiGrowthMonthly,
      priceApiGrowthAnnual,
      priceApiEnterpriseMonthly,
      priceApiEnterpriseAnnual
    };
    return cachedSecrets;
  } catch (error) {
    throw new Error('Stripe configuration error');
  }
}

export async function stripeRequest(endpoint, method = 'GET', body = null) {
  const secrets = await getStripeSecrets();
  const options = { method, headers: { 'Authorization': `Bearer ${secrets.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' } };
  if (body) options.body = new URLSearchParams(body).toString();
  const response = await fetch(`${CONFIG.stripeApiBase}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Stripe API error');
  return data;
}

// ============================================================================
// SUBSCRIPTION QUERIES (Internal)
// ============================================================================

export async function getSubscriptionByCarrier(carrierDot) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.subscriptionsKey, {
      filters: { carrier_dot: String(carrierDot).trim() },
      sort: [{ field: '_createdDate', direction: 'desc' }],
      limit: 1, suppressAuth: true
    });
    return result.items?.[0] || null;
  } catch (error) { return null; }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT (Sensitive)
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
// BILLING HISTORY & EVENT LOGGING (Sensitive/Internal)
// ============================================================================

export async function recordBillingEvent(carrierDot, eventType, details = {}) {
  try {
    await dataAccess.insertRecord(CONFIG.billingHistoryKey, { carrier_dot: carrierDot, event_type: eventType, amount: details.amount || 0, timestamp: new Date() }, { suppressAuth: true });
  } catch (e) { }
}

export async function getBillingHistory(carrierDot, limit = 50) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.billingHistoryKey, { filters: { carrier_dot: String(carrierDot) }, sort: [{ field: 'timestamp', direction: 'desc' }], limit, suppressAuth: true });
    return { success: true, history: result.items || [] };
  } catch (error) { return { success: false, history: [] }; }
}

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

export async function getCheckoutSession(sessionId) {
  try {
    const session = await stripeRequest(`/checkout/sessions/${sessionId}`, 'GET');
    return { success: true, session: { id: session.id, customerEmail: session.customer_email, paymentStatus: session.payment_status, metadata: session.metadata || {} } };
  } catch (error) { return { success: false, error: error.message }; }
}

export async function createPlacementDepositCheckout(carrierDot, email, driverCount, successUrl, cancelUrl, formData = {}) {
  try {
    const secrets = await getStripeSecrets();
    const sessionData = await stripeRequest('/checkout/sessions', 'POST', {
      'mode': 'payment', 'payment_method_types[0]': 'card', 'line_items[0][price]': secrets.pricePlacementDeposit, 'line_items[0][quantity]': String(driverCount), 'customer_email': email,
      'success_url': successUrl || 'https://www.lastmiledr.app/placement-success?session_id={CHECKOUT_SESSION_ID}',
      'cancel_url': cancelUrl || 'https://www.lastmiledr.app/pricing',
      'metadata[carrier_dot]': carrierDot, 'metadata[service_type]': 'placement_deposit'
    });
    await dataAccess.insertRecord(CONFIG.carrierPaymentsKey, { carrier_dot: carrierDot, stripe_session_id: sessionData.id, amount: secrets.pricePlacementDeposit * driverCount, status: 'pending' }, { suppressAuth: true });
    return { success: true, checkoutUrl: sessionData.url, sessionId: sessionData.id };
  } catch (error) { return { success: false, error: error.message }; }
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
// API PLATFORM BILLING (Internal/Sensitive)
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

export async function getApiBillingSummary(partnerId, periodKey = null) {
  try {
    const subscription = await getApiSubscriptionByPartner(partnerId);
    if (!subscription) {
      return { success: false, error: 'No active API subscription found' };
    }

    const targetPeriod = periodKey || new Date().toISOString().slice(0, 7);
    const usageResult = await dataAccess.queryRecords(CONFIG.apiUsageKey, {
      filters: { partner_id: partnerId, period_key: targetPeriod },
      limit: 1,
      suppressAuth: true
    });
    const usageRecord = usageResult?.items?.[0] || null;

    const used = Number(usageRecord?.usage?.total_requests || 0);
    const included = Number(subscription?.rate_limits?.requests_per_month || 0);
    const unlimited = included === Number.MAX_SAFE_INTEGER || included < 0;
    const overageRequests = unlimited ? 0 : Math.max(0, used - included);
    const tierConfig = CONFIG.apiPlans[String(subscription.tier || 'starter').toLowerCase()] || CONFIG.apiPlans.starter;
    const overageRate = Number(subscription?.overage_price_per_call || tierConfig.overagePricePerCall || 0.005);
    const overageAmount = Number((overageRequests * overageRate).toFixed(2));
    const baseAmount = Number(subscription?.price_monthly || tierConfig.monthlyPrice || 0);

    return {
      success: true,
      period_key: targetPeriod,
      tier: subscription.tier,
      base_amount: baseAmount,
      usage: {
        total_requests: used,
        included_requests: unlimited ? 'unlimited' : included,
        overage_requests: overageRequests
      },
      overage_price_per_call: overageRate,
      overage_amount: overageAmount,
      estimated_total: Number((baseAmount + overageAmount).toFixed(2))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getApiPriceId(tier, planType) {
  const secrets = await getStripeSecrets();
  const keyMap = {
    starter: {
      monthly: 'priceApiStarterMonthly',
      annual: 'priceApiStarterAnnual'
    },
    growth: {
      monthly: 'priceApiGrowthMonthly',
      annual: 'priceApiGrowthAnnual'
    },
    enterprise: {
      monthly: 'priceApiEnterpriseMonthly',
      annual: 'priceApiEnterpriseAnnual'
    }
  };

  const tierMap = keyMap[String(tier || 'starter').toLowerCase()] || keyMap.starter;
  const planKey = String(planType || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly';
  const secretKeyName = tierMap[planKey];
  return secrets?.[secretKeyName] || null;
}

export async function resolveApiTierFromSubscription(stripeSubscription) {
  const explicit = String(stripeSubscription?.metadata?.api_tier || '').toLowerCase();
  if (explicit && CONFIG.apiPlans[explicit]) return explicit;

  const secrets = await getStripeSecrets();
  const priceId = stripeSubscription?.items?.data?.[0]?.price?.id;
  if (!priceId) return 'starter';

  const byPrice = new Map([
    [secrets.priceApiStarterMonthly, 'starter'],
    [secrets.priceApiStarterAnnual, 'starter'],
    [secrets.priceApiGrowthMonthly, 'growth'],
    [secrets.priceApiGrowthAnnual, 'growth'],
    [secrets.priceApiEnterpriseMonthly, 'enterprise'],
    [secrets.priceApiEnterpriseAnnual, 'enterprise']
  ]);
  return byPrice.get(priceId) || 'starter';
}

export async function getApiPartner(partnerId) {
  const result = await dataAccess.queryRecords(CONFIG.apiPartnersKey, {
    filters: { partner_id: String(partnerId) },
    limit: 1,
    suppressAuth: true
  });
  return result?.items?.[0] || null;
}

export async function getApiSubscriptionByPartner(partnerId) {
  const result = await dataAccess.queryRecords(CONFIG.apiSubscriptionsKey, {
    filters: { partner_id: String(partnerId) },
    sort: [{ field: 'current_period_end', direction: 'desc' }],
    limit: 1,
    suppressAuth: true
  });
  return result?.items?.[0] || null;
}
