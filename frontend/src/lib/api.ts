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

// ═══════════════════════════════════════════════════════
// Driver Service (9 endpoints)
// ═══════════════════════════════════════════════════════
export const driverApi = {
  create: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), '/drivers', { method: 'POST', body: JSON.stringify(data), token }),
  getProfile: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}`, { token }),
  updateProfile: (driverId: string, data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}`, { method: 'PUT', body: JSON.stringify(data), token }),
  advanceOnboarding: (driverId: string, step: string, data?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/onboarding-step`, { method: 'PUT', body: JSON.stringify({ step, ...data }), token }),
  getOnboardingStatus: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/onboarding-status`, { token }),
  updateVisibility: (driverId: string, visible: boolean, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/visibility`, { method: 'PUT', body: JSON.stringify({ visible }), token }),
  getDocuments: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/documents`, { token }),
  registerDocument: (driverId: string, doc: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/documents`, { method: 'POST', body: JSON.stringify(doc), token }),
  updateDocumentStatus: (driverId: string, docId: string, status: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.driver(), `/drivers/${driverId}/documents/${docId}/status`, { method: 'PUT', body: JSON.stringify({ status }), token }),
};

// ═══════════════════════════════════════════════════════
// Carrier Service (10 endpoints)
// ═══════════════════════════════════════════════════════
export const carrierApi = {
  create: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), '/carriers', { method: 'POST', body: JSON.stringify(data), token }),
  getCarrier: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}`, { token }),
  updateCarrier: (carrierId: string, data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}`, { method: 'PUT', body: JSON.stringify(data), token }),
  getJobs: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}/jobs`, { token }),
  createJob: (carrierId: string, job: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}/jobs`, { method: 'POST', body: JSON.stringify(job), token }),
  updatePreferences: (carrierId: string, prefs: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/${carrierId}/preferences`, { method: 'PUT', body: JSON.stringify(prefs), token }),
  lookupByDot: (dotNumber: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/carriers/dot/${dotNumber}`, { token }),
  getDispatchQueue: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), '/dispatch/queue', { token }),
  assignDispatch: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), '/dispatch/assign', { method: 'POST', body: JSON.stringify(data), token }),
  getAssignments: (jobId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.carrier(), `/dispatch/assignments/${jobId}`, { token }),
};

// ═══════════════════════════════════════════════════════
// Matching Engine (5 endpoints)
// ═══════════════════════════════════════════════════════
export const matchingApi = {
  findJobsForDriver: (driverId: string, filters?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), '/match/find-jobs', { method: 'POST', body: JSON.stringify({ driverId, ...filters }), token }),
  findDriversForJob: (jobId: string, filters?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), '/match/find-drivers', { method: 'POST', body: JSON.stringify({ jobId, ...filters }), token }),
  getMatchExplanation: (driverId: string, carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), `/match/explain/${driverId}/${carrierId}`, { token }),
  searchJobs: (filters: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), '/search/jobs', { method: 'GET', token }),
  searchDrivers: (filters: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.matching(), '/search/drivers', { method: 'GET', token }),
};

// ═══════════════════════════════════════════════════════
// Compliance Service (7 endpoints)
// ═══════════════════════════════════════════════════════
export const complianceApi = {
  triggerMvrCheck: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), '/compliance/mvr-check', { method: 'POST', body: JSON.stringify({ driverId }), token }),
  triggerBackgroundCheck: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), '/compliance/background-check', { method: 'POST', body: JSON.stringify({ driverId }), token }),
  getStatus: (driverId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), `/compliance/status/${driverId}`, { token }),
  getCheckResult: (checkId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), `/compliance/checks/${checkId}`, { token }),
  logAuditEvent: (event: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), '/audit/events', { method: 'POST', body: JSON.stringify(event), token }),
  queryAuditEvents: (filters?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), '/audit/events', { token }),
  getAuditEvent: (eventId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.compliance(), `/audit/events/${eventId}`, { token }),
};

// ═══════════════════════════════════════════════════════
// Billing Service (7 endpoints)
// ═══════════════════════════════════════════════════════
export const billingApi = {
  createInvoice: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), '/billing/invoices', { method: 'POST', body: JSON.stringify(data), token }),
  getInvoice: (invoiceId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), `/billing/invoices/${invoiceId}`, { token }),
  listInvoices: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), `/billing/invoices?carrierId=${carrierId}`, { token }),
  updateInvoiceStatus: (invoiceId: string, status: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), `/billing/invoices/${invoiceId}/status`, { method: 'PUT', body: JSON.stringify({ status }), token }),
  getRateCards: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), '/billing/rate-cards', { token }),
  createRateCard: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), '/billing/rate-cards', { method: 'POST', body: JSON.stringify(data), token }),
  getSubscription: (carrierId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.billing(), `/billing/subscriptions/${carrierId}`, { token }),
};

// ═══════════════════════════════════════════════════════
// Notifications Service (5 endpoints)
// ═══════════════════════════════════════════════════════
export const notificationsApi = {
  sendEmail: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.notifications(), '/notify/email', { method: 'POST', body: JSON.stringify(data), token }),
  sendSms: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.notifications(), '/notify/sms', { method: 'POST', body: JSON.stringify(data), token }),
  sendPush: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.notifications(), '/notify/push', { method: 'POST', body: JSON.stringify(data), token }),
  getHistory: (recipientId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.notifications(), `/notifications/${recipientId}`, { token }),
  markRead: (notificationId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.notifications(), `/notifications/${notificationId}/read`, { method: 'PUT', token }),
};

// ═══════════════════════════════════════════════════════
// AI Service (11 endpoints)
// ═══════════════════════════════════════════════════════
export const aiApi = {
  agentTurn: (role: string, userId: string, message: string, context?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/agent/turn', { method: 'POST', body: JSON.stringify({ role, userId, message, context }), token }),
  listConversations: (userId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), `/ai/agent/conversations/${userId}`, { token }),
  getConversationTurns: (conversationId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), `/ai/agent/conversations/${conversationId}/turns`, { token }),
  recommendJobs: (profile: Record<string, unknown>, limit?: number, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/recommend/jobs', { method: 'POST', body: JSON.stringify({ ...profile, limit }), token }),
  recommendDrivers: (job: Record<string, unknown>, limit?: number, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/recommend/drivers', { method: 'POST', body: JSON.stringify({ ...job, limit }), token }),
  ragQuery: (query: string, context?: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/rag/query', { method: 'POST', body: JSON.stringify({ query, ...context }), token }),
  ragIndex: (document: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/rag/index', { method: 'POST', body: JSON.stringify(document), token }),
  embed: (text: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/vectors/embed', { method: 'POST', body: JSON.stringify({ text }), token }),
  vectorSearch: (query: string, limit?: number, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/vectors/search', { method: 'POST', body: JSON.stringify({ query, limit }), token }),
  routerComplete: (data: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/router/complete', { method: 'POST', body: JSON.stringify(data), token }),
  getProviders: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.ai(), '/ai/router/providers', { token }),
};

// ═══════════════════════════════════════════════════════
// Analytics Service (7 endpoints)
// ═══════════════════════════════════════════════════════
export const analyticsApi = {
  getDashboard: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/dashboard', { token }),
  getFeatureAdoption: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/feature-adoption', { token }),
  getFeatureById: (featureId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), `/analytics/feature-adoption/${featureId}`, { token }),
  logFeatureInteraction: (featureId: string, action: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/feature-adoption/log', { method: 'POST', body: JSON.stringify({ featureId, action }), token }),
  listReports: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/reports', { token }),
  generateReport: (config: Record<string, unknown>, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/analytics/reports/generate', { method: 'POST', body: JSON.stringify(config), token }),
  getReport: (reportId: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), `/analytics/reports/${reportId}`, { token }),
};

// ═══════════════════════════════════════════════════════
// Auth / Roles (4 endpoints — on analytics service)
// ═══════════════════════════════════════════════════════
export const authApi = {
  getUserRoles: (uid: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), `/auth/roles/${uid}`, { token }),
  assignRole: (uid: string, role: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/auth/roles', { method: 'POST', body: JSON.stringify({ uid, role }), token }),
  removeRole: (uid: string, role: string, token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), `/auth/roles/${uid}/${role}`, { method: 'DELETE', token }),
  listAllRoles: (token?: string) =>
    apiFetch<{ data: unknown }>(urls.analytics(), '/auth/roles', { token }),
};
