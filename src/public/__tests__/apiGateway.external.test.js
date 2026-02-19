/* eslint-disable */
import { handleGatewayRequest } from '../../backend/apiGateway.jsw';

jest.mock('backend/apiAuthService', () => ({
  validateApiKey: jest.fn()
}));
jest.mock('backend/rateLimitService', () => ({
  checkAndTrackUsage: jest.fn()
}));
jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn().mockResolvedValue({ success: true }),
  queryRecords: jest.fn().mockResolvedValue({ success: true, items: [] }),
  updateRecord: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('backend/externalFmcsaApi', () => ({
  getExternalCarrierSafety: jest.fn(),
  batchExternalCarrierSafety: jest.fn()
}));
jest.mock('backend/externalCsaApi', () => ({
  getExternalCurrentCSA: jest.fn(),
  getExternalCSAHistory: jest.fn()
}));
jest.mock('backend/externalIntelligenceApi', () => ({
  getExternalCarrierIntelligence: jest.fn(),
  getExternalSentiment: jest.fn(),
  getExternalMarketIntelligence: jest.fn(),
  searchExternalCarriers: jest.fn()
}));
jest.mock('backend/externalParkingApi', () => ({
  searchExternalParking: jest.fn(),
  getExternalParkingLocation: jest.fn()
}));
jest.mock('backend/externalFuelApi', () => ({
  searchExternalFuelPrices: jest.fn(),
  planExternalRouteFuel: jest.fn(),
  getExternalFuelStation: jest.fn()
}));
jest.mock('backend/externalMatchingApi', () => ({
  searchExternalDrivers: jest.fn(),
  getExternalDriverProfile: jest.fn(),
  matchExternalCarriers: jest.fn(),
  checkExternalQualification: jest.fn()
}));
jest.mock('backend/externalDocumentApi', () => ({
  extractExternalCDL: jest.fn(),
  extractExternalMedCert: jest.fn(),
  verifyExternalDocument: jest.fn(),
  processExternalDocumentBatch: jest.fn(),
  getExternalBatchStatus: jest.fn()
}));
jest.mock('backend/externalEngagementApi', () => ({
  getExternalUserProgress: jest.fn(),
  awardExternalXP: jest.fn(),
  checkExternalAchievements: jest.fn(),
  getExternalLeaderboard: jest.fn(),
  subscribeExternalEngagementWebhook: jest.fn()
}));
jest.mock('backend/apiProductAccessService', () => ({
  authorizeProductAccess: jest.fn()
}));

const { validateApiKey } = require('backend/apiAuthService');
const { checkAndTrackUsage } = require('backend/rateLimitService');
const { getExternalCarrierSafety, batchExternalCarrierSafety } = require('backend/externalFmcsaApi');
const { getExternalCurrentCSA, getExternalCSAHistory } = require('backend/externalCsaApi');
const { getExternalMarketIntelligence, getExternalSentiment } = require('backend/externalIntelligenceApi');
const { authorizeProductAccess } = require('backend/apiProductAccessService');
const dataAccess = require('backend/dataAccess');

function makeRequest(path, method = 'GET', query = {}) {
  return {
    method,
    path,
    query,
    headers: {
      authorization: 'Bearer test_key'
    },
    body: {
      json: async () => ({}),
      text: async () => '{}'
    }
  };
}

describe('apiGateway external routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateApiKey.mockResolvedValue({
      success: true,
      tier: 'growth',
      partner: { partner_id: 'ptn_1' },
      subscription: { tier: 'growth' },
      apiKey: { key_id: 'key_1' }
    });
    checkAndTrackUsage.mockResolvedValue({
      allowed: true,
      headers: {}
    });
    authorizeProductAccess.mockResolvedValue({
      allowed: true
    });
  });

  test('serves intelligence market endpoint', async () => {
    getExternalMarketIntelligence.mockResolvedValue({
      success: true,
      data: { market_data: { avg_cpm: 0.61 } }
    });

    const res = await handleGatewayRequest(
      makeRequest('/v1/intelligence/market')
    );

    expect(res.status).toBe(200);
    expect(res.body.data.market_data.avg_cpm).toBe(0.61);
  });

  test('blocks enterprise-only engagement endpoint for growth tier', async () => {
    const res = await handleGatewayRequest(
      makeRequest('/v1/engagement/user/u1/progress')
    );

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden_tier');
  });

  test('blocks sentiment endpoint for starter tier', async () => {
    validateApiKey.mockResolvedValueOnce({
      success: true,
      tier: 'starter',
      partner: { partner_id: 'ptn_1' },
      subscription: { tier: 'starter' },
      apiKey: { key_id: 'key_1' }
    });

    const res = await handleGatewayRequest(
      makeRequest('/v1/intelligence/sentiment/123456')
    );

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden_tier');
    expect(getExternalSentiment).not.toHaveBeenCalled();
  });

  test('blocks when product authorization denies access', async () => {
    authorizeProductAccess.mockResolvedValueOnce({
      allowed: false,
      reason: 'subscription_product_not_enabled'
    });
    getExternalMarketIntelligence.mockResolvedValue({
      success: true,
      data: {}
    });

    const res = await handleGatewayRequest(
      makeRequest('/v1/intelligence/market')
    );

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden_product');
  });

  test('serves safety carrier lookup endpoint', async () => {
    getExternalCarrierSafety.mockResolvedValueOnce({
      success: true,
      data: { dot_number: 1234567, legal_name: 'Acme Carrier' }
    });

    const res = await handleGatewayRequest(
      makeRequest('/v1/safety/carrier/1234567')
    );

    expect(res.status).toBe(200);
    expect(res.body.data.dot_number).toBe(1234567);
    expect(getExternalCarrierSafety).toHaveBeenCalledWith('1234567');
  });

  test('serves csa current and csa history endpoints', async () => {
    getExternalCurrentCSA.mockResolvedValueOnce({
      success: true,
      data: { dot_number: 1234567, current_scores: { unsafe_driving: { percentile: 50 } } }
    });
    getExternalCSAHistory.mockResolvedValueOnce({
      success: true,
      data: { dot_number: 1234567, history: [{ snapshot_date: '2026-01-01' }] }
    });

    const current = await handleGatewayRequest(
      makeRequest('/v1/safety/csa/1234567')
    );
    const history = await handleGatewayRequest(
      makeRequest('/v1/safety/csa/1234567/history', 'GET', { months: 6 })
    );

    expect(current.status).toBe(200);
    expect(history.status).toBe(200);
    expect(getExternalCurrentCSA).toHaveBeenCalledWith('1234567');
    expect(getExternalCSAHistory).toHaveBeenCalledWith('1234567', 6);
  });

  test('handles safety batch lookup edge case (max 100)', async () => {
    batchExternalCarrierSafety.mockResolvedValueOnce({
      success: false,
      errorCode: 'invalid_request',
      message: 'Maximum 100 DOT numbers per batch'
    });

    const dots = Array.from({ length: 101 }, (_v, i) => i + 1);
    const req = makeRequest('/v1/safety/carriers/batch', 'POST');
    req.body.json = async () => ({ dot_numbers: dots });
    req.body.text = async () => JSON.stringify({ dot_numbers: dots });

    const res = await handleGatewayRequest(req);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(res.body.error.message).toContain('Maximum 100 DOT numbers');
  });

  test('creates and lists safety alert subscriptions', async () => {
    dataAccess.insertRecord.mockResolvedValueOnce({
      success: true,
      record: {
        _id: 'sub_1',
        dot_numbers: [1234567],
        alert_types: ['csa_change'],
        webhook_url: 'https://partner.example/webhooks/lmdr',
        webhook_secret: 'whsec_test'
      }
    });
    dataAccess.queryRecords.mockImplementation(async (collection, options = {}) => {
      if (collection === 'apiAlertSubscriptions' && options.filters?.is_active === true) {
        return {
          success: true,
          items: [{
            _id: 'sub_1',
            dot_numbers: [1234567],
            alert_types: ['csa_change'],
            webhook_url: 'https://partner.example/webhooks/lmdr',
            created_at: '2026-02-19T00:00:00.000Z'
          }]
        };
      }
      return { success: true, items: [] };
    });

    const subscribeReq = makeRequest('/v1/safety/alerts/subscribe', 'POST');
    subscribeReq.body.json = async () => ({
      dot_numbers: [1234567],
      alert_types: ['csa_change'],
      webhook_url: 'https://partner.example/webhooks/lmdr'
    });
    subscribeReq.body.text = async () => JSON.stringify({
      dot_numbers: [1234567],
      alert_types: ['csa_change'],
      webhook_url: 'https://partner.example/webhooks/lmdr'
    });

    const subscribeRes = await handleGatewayRequest(subscribeReq);
    const listRes = await handleGatewayRequest(makeRequest('/v1/safety/alerts/subscriptions', 'GET'));

    expect(subscribeRes.status).toBe(201);
    expect(subscribeRes.body.data.subscription_id).toBe('sub_1');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);
  });

  test('authentication flow end-to-end returns standardized 401 payload', async () => {
    validateApiKey.mockResolvedValueOnce({
      success: false,
      errorCode: 'invalid_api_key',
      message: 'Invalid API key'
    });

    const res = await handleGatewayRequest(
      makeRequest('/v1/intelligence/market')
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_api_key');
    expect(res.body.error.message).toBe('Invalid API key');
    expect(typeof res.body.request_id).toBe('string');
  });

  test('rate limiting with burst traffic returns 429 and retry metadata', async () => {
    checkAndTrackUsage
      .mockResolvedValueOnce({ allowed: true, headers: {} })
      .mockResolvedValueOnce({
        allowed: false,
        errorCode: 'rate_limit_exceeded',
        retryAfter: 30,
        headers: { 'Retry-After': '30' }
      });

    getExternalMarketIntelligence.mockResolvedValue({
      success: true,
      data: { market_data: { avg_cpm: 0.7 } }
    });

    const first = await handleGatewayRequest(
      makeRequest('/v1/intelligence/market')
    );
    const second = await handleGatewayRequest(
      makeRequest('/v1/intelligence/market')
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('rate_limit_exceeded');
    expect(second.body.error.retry_after).toBe(30);
    expect(second.headers['Retry-After']).toBe('30');
  });

  test('error response formatting stays standardized for route failures', async () => {
    const res = await handleGatewayRequest(
      makeRequest('/v1/does/not/exist')
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'resource_not_found');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body).toHaveProperty('request_id');
  });
});
