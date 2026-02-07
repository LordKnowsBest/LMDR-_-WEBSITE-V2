import { checkAndTrackUsage } from '../../backend/rateLimitService.jsw';

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');

describe('rateLimitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('applies endpoint-specific rate limit override from apiProducts', async () => {
    dataAccess.queryRecords.mockImplementation(async (collection, options = {}) => {
      if (collection === 'apiProducts' && options.filters?.is_active === true) {
        return {
          success: true,
          items: [{
            product_id: 'safety_suite',
            endpoints: [{
              path: '/v1/safety/carriers/batch',
              rate_limit_override: 7
            }]
          }]
        };
      }
      if (collection === 'apiUsage') {
        return {
          success: true,
          items: [{
            _id: 'usage_1',
            usage: { total_requests: 0, requests_by_endpoint: {}, requests_by_day: [], errors: 0, avg_latency_ms: 0 }
          }]
        };
      }
      return { success: true, items: [] };
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true });

    const result = await checkAndTrackUsage({
      partnerId: 'ptn_override_1',
      tier: 'enterprise',
      endpoint: '/v1/safety/carriers/batch',
      statusCode: 200,
      latencyMs: 40
    });

    expect(result.allowed).toBe(true);
    expect(result.headers['X-RateLimit-Limit']).toBe('7');
    expect(dataAccess.updateRecord).toHaveBeenCalled();
  });

  test('returns quota_exceeded when monthly usage reaches limit', async () => {
    dataAccess.queryRecords.mockImplementation(async (collection, options = {}) => {
      if (collection === 'apiProducts') {
        return { success: true, items: [] };
      }
      if (collection === 'apiUsage') {
        return {
          success: true,
          items: [{
            _id: 'usage_2',
            usage: { total_requests: 5, requests_by_endpoint: {}, requests_by_day: [], errors: 0, avg_latency_ms: 0 }
          }]
        };
      }
      return { success: true, items: [] };
    });
    dataAccess.updateRecord.mockResolvedValue({ success: true });

    const result = await checkAndTrackUsage({
      partnerId: 'ptn_quota_1',
      tier: 'starter',
      endpoint: '/v1/intelligence/market',
      subscription: {
        rate_limits: {
          requests_per_minute: 100,
          requests_per_month: 5
        }
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('quota_exceeded');
    expect(dataAccess.updateRecord).not.toHaveBeenCalled();
  });
});
