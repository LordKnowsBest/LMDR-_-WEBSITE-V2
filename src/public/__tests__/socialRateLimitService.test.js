jest.mock('backend/socialSecretService', () => ({
  getIGUserToken: jest.fn().mockResolvedValue('ig-token')
}));

describe('socialRateLimitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('checkIGQuota returns can_post true under limit', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        quota_usage: 12,
        config: { quota_total: 50, quota_duration: 86400 }
      })
    });

    const service = require('backend/socialRateLimitService');
    service.__resetSocialRateLimitCacheForTests();
    const result = await service.checkIGQuota('ig_1');

    expect(result.success).toBe(true);
    expect(result.can_post).toBe(true);
    expect(result.quota_used).toBe(12);
    expect(result.quota_total).toBe(50);
  });

  test('checkFBUsage returns warning when usage > 75%', () => {
    const service = require('backend/socialRateLimitService');
    const result = service.checkFBUsage('page_1', '{"call_count":80,"total_time":65,"total_cputime":70}');
    expect(result.success).toBe(true);
    expect(result.alert).toBe(true);
    expect(result.severity).toBe('warning');
  });
});
