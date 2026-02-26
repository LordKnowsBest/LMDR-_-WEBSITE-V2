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

// ============================================================================
// DATA HELPERS (Shared between Public and Internal services)
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

export async function recordBillingEvent(carrierDot, eventType, details = {}) {
  try {
    await dataAccess.insertRecord(CONFIG.billingHistoryKey, { carrier_dot: carrierDot, event_type: eventType, amount: details.amount || 0, timestamp: new Date() }, { suppressAuth: true });
  } catch (e) { }
}
