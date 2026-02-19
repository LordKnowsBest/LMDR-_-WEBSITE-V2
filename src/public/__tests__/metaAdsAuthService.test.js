jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const metaAdsAuth = require('backend/metaAdsAuthService');

describe('metaAdsAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('syncAdAccounts persists ad_account_id and ad_accounts[] rows', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [{
        _id: 'rec_1',
        integration_id: 'int_1',
        status: 'active',
        ad_account_id: 'act_100',
        ad_accounts: [
          { ad_account_id: 'act_200', name: 'Recruiting - East', currency: 'USD' },
          'act_300'
        ]
      }]
    });
    dataAccess.upsertRecord.mockResolvedValue({ success: true, record: {} });
    dataAccess.insertRecord.mockResolvedValue({ success: true });

    const result = await metaAdsAuth.syncAdAccounts();

    expect(result.success).toBe(true);
    expect(result.adAccountsSynced).toBe(3);
    expect(dataAccess.upsertRecord).toHaveBeenCalledTimes(3);
  });

  test('runTokenHealthChecks proactively refreshes eligible expiring integration', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{
          _id: 'rec_2',
          integration_id: 'int_2',
          status: 'active',
          auto_refresh_enabled: true,
          next_token_expires_at: '2030-01-01T00:00:00.000Z',
          token_expires_at: '2026-02-20T00:00:00.000Z'
        }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{
          _id: 'rec_2',
          integration_id: 'int_2',
          status: 'active',
          auto_refresh_enabled: true,
          next_token_expires_at: '2030-01-01T00:00:00.000Z',
          token_expires_at: '2026-02-20T00:00:00.000Z'
        }]
      });

    dataAccess.updateRecord.mockResolvedValue({ success: true, record: {} });
    dataAccess.insertRecord.mockResolvedValue({ success: true });

    const result = await metaAdsAuth.runTokenHealthChecks({ refreshThresholdHours: 99999 });

    expect(result.success).toBe(true);
    expect(result.refreshed).toBe(1);
    expect(dataAccess.updateRecord).toHaveBeenCalled();
  });
});
