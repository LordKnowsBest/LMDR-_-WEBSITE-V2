type RequestOptions = {
  token?: string;
  revalidate?: number | false;
};

async function apiFetch<T>(
  serviceUrl: string,
  path: string,
  options: RequestInit & RequestOptions = {}
): Promise<T> {
  const { token, revalidate, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${serviceUrl}${path}`, {
    ...fetchOptions,
    headers,
    next: revalidate !== undefined ? { revalidate } : { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status} from ${serviceUrl}${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

const urls = {
  driver: () => process.env.LMDR_DRIVER_SERVICE_URL || 'https://lmdr-driver-service-140035137711.us-central1.run.app',
  carrier: () => process.env.LMDR_CARRIER_SERVICE_URL || 'https://lmdr-carrier-service-140035137711.us-central1.run.app',
  matching: () => process.env.LMDR_MATCHING_SERVICE_URL || 'https://lmdr-matching-engine-140035137711.us-central1.run.app',
  compliance: () => process.env.LMDR_COMPLIANCE_SERVICE_URL || 'https://lmdr-compliance-service-140035137711.us-central1.run.app',
  billing: () => process.env.LMDR_BILLING_SERVICE_URL || 'https://lmdr-billing-service-140035137711.us-central1.run.app',
  notifications: () => process.env.LMDR_NOTIFICATION_SERVICE_URL || 'https://lmdr-notifications-service-140035137711.us-central1.run.app',
  ai: () => process.env.LMDR_AI_SERVICE_URL || 'https://lmdr-ai-service-140035137711.us-central1.run.app',
  analytics: () => process.env.LMDR_ANALYTICS_SERVICE_URL || 'https://lmdr-analytics-service-140035137711.us-central1.run.app',
};

// Driver Service
export const driverApi = {
  getProfile: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}`, { token }),
  updateProfile: (driverId: string, data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}`, { method: 'PUT', body: JSON.stringify(data), token }),
  getOnboardingStatus: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/onboarding`, { token }),
  getDocuments: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/documents`, { token }),
};

// Carrier Service
export const carrierApi = {
  getCarrier: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}`, { token }),
  getJobs: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}/jobs`, { token }),
  getDispatchQueue: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/dispatch/queue/${carrierId}`, { token }),
};

// Matching Engine
export const matchingApi = {
  matchDriver: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), `/match/driver/${driverId}`, { token }),
  matchJob: (jobId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), `/match/job/${jobId}`, { token }),
  searchJobs: (filters: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), '/search/jobs', { method: 'POST', body: JSON.stringify(filters), token }),
  searchDrivers: (filters: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), '/search/drivers', { method: 'POST', body: JSON.stringify(filters), token }),
};

// AI Service
export const aiApi = {
  agentTurn: (role: string, userId: string, message: string, context?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/agent/turn', { method: 'POST', body: JSON.stringify({ role, userId, message, context }), token }),
  recommend: (type: 'jobs' | 'drivers', profileOrJob: Record<string, unknown>, limit?: number, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), `/ai/recommend/${type}`, { method: 'POST', body: JSON.stringify({ ...profileOrJob, limit }), token }),
};

// Billing Service
export const billingApi = {
  getInvoices: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), `/billing/invoices/${carrierId}`, { token }),
  getSubscription: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), `/billing/subscriptions/${carrierId}`, { token }),
};

// Analytics Service
export const analyticsApi = {
  getDashboard: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/dashboard', { token }),
  getFeatureAdoption: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/features', { token }),
};
