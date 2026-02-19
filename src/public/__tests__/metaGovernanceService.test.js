jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  upsertRecord: jest.fn(),
  updateRecord: jest.fn(),
  insertRecord: jest.fn()
}));

jest.mock('backend/metaAdsAuthService', () => ({
  getTokenHealth: jest.fn().mockResolvedValue({ success: true, status: 'healthy' }),
  refreshSystemUserToken: jest.fn().mockResolvedValue({ success: true }),
  rotateCredentials: jest.fn().mockResolvedValue({ success: true }),
  rebindAdAccount: jest.fn().mockResolvedValue({ success: true }),
  disableIntegration: jest.fn().mockResolvedValue({ success: true }),
  syncAdAccounts: jest.fn().mockResolvedValue({ success: true, adAccountsSynced: 2 }),
  runTokenHealthChecks: jest.fn().mockResolvedValue({ success: true, scanned: 2 })
}));

const dataAccess = require('backend/dataAccess');
const metaAuth = require('backend/metaAdsAuthService');
const governance = require('backend/metaGovernanceService');

describe('metaGovernanceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setApprovalThresholds upserts policy by policy_key', async () => {
    dataAccess.upsertRecord.mockResolvedValue({ success: true, record: { policy_key: 'approval_thresholds' } });

    const result = await governance.setApprovalThresholds({ launch_budget_threshold: 2500 }, 'admin_1');

    expect(result.success).toBe(true);
    expect(dataAccess.upsertRecord).toHaveBeenCalledWith(
      'metaGovernancePolicies',
      'policy_key',
      'approval_thresholds',
      expect.objectContaining({ launch_budget_threshold: 2500, updated_by: 'admin_1' }),
      expect.any(Object)
    );
  });

  test('syncMetaAdAccounts delegates to auth service', async () => {
    const result = await governance.syncMetaAdAccounts('int_77');
    expect(result.success).toBe(true);
    expect(metaAuth.syncAdAccounts).toHaveBeenCalledWith('int_77');
  });

  test('runMetaTokenHealthChecks delegates to auth service', async () => {
    const result = await governance.runMetaTokenHealthChecks({ refreshThresholdHours: 48 });
    expect(result.success).toBe(true);
    expect(metaAuth.runTokenHealthChecks).toHaveBeenCalledWith({ refreshThresholdHours: 48 });
  });

  test('getMetaGovernanceSummary returns status and token rollups', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [
        {
          integration_id: 'int_1',
          status: 'active',
          token_health_status: 'healthy',
          ad_account_id: 'act_1'
        },
        {
          integration_id: 'int_2',
          status: 'active',
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          integration_id: 'int_3',
          status: 'quarantined'
        }
      ],
      totalCount: 3
    });

    const result = await governance.getMetaGovernanceSummary();

    expect(result.success).toBe(true);
    expect(result.totals.integrations).toBe(3);
    expect(result.statusCounts).toMatchObject({ active: 2, quarantined: 1 });
    expect(result.tokenHealthCounts.healthy).toBe(1);
    expect(result.tokenHealthCounts.expiring_soon).toBe(1);
    expect(result.tokenHealthCounts.quarantined).toBe(1);
    expect(result.posture).toBe('critical');
  });
});
