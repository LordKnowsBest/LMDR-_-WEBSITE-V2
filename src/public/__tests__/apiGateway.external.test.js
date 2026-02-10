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
const { getExternalMarketIntelligence } = require('backend/externalIntelligenceApi');
const { authorizeProductAccess } = require('backend/apiProductAccessService');

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
});
