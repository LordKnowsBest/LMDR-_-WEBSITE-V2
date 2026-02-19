jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  deleteRecord: jest.fn(),
  insertRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const compliance = require('backend/metaComplianceService');

describe('metaComplianceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('validateMetaAuditTrailCompleteness reports incomplete audit records', async () => {
    dataAccess.queryRecords.mockResolvedValue({
      success: true,
      items: [
        {
          _id: 'audit_1',
          action: 'create_campaign',
          risk_level: 'execute_high',
          actor_id: 'rec_1',
          correlation_id: 'corr_1',
          created_at: '2026-02-19T00:00:00.000Z'
        },
        {
          _id: 'audit_2',
          action: 'update_campaign',
          risk_level: 'execute_low',
          actor_id: '',
          correlation_id: '',
          created_at: '2026-02-19T00:05:00.000Z'
        }
      ]
    });

    const result = await compliance.validateMetaAuditTrailCompleteness({ windowHours: 24 });

    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
    expect(result.incomplete).toBe(1);
    expect(result.completenessPct).toBe(50);
    expect(result.incompleteRecords[0].auditId).toBe('audit_2');
  });

  test('enforceMetaEventRetentionPolicies deletes aged records when dryRun is false', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [{ _id: 'a1' }] })
      .mockResolvedValueOnce({ success: true, items: [{ _id: 'e1' }] })
      .mockResolvedValueOnce({ success: true, items: [] })
      .mockResolvedValueOnce({ success: true, items: [{ _id: 'o1' }] })
      .mockResolvedValueOnce({ success: true, items: [{ _id: 'r1' }] });
    dataAccess.deleteRecord.mockResolvedValue({ success: true });
    dataAccess.insertRecord.mockResolvedValue({ success: true });

    const result = await compliance.enforceMetaEventRetentionPolicies({ dryRun: false, limitPerCollection: 50 });

    expect(result.success).toBe(true);
    expect(result.totalCandidates).toBe(4);
    expect(result.totalDeleted).toBe(4);
    expect(dataAccess.deleteRecord).toHaveBeenCalledTimes(4);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'metaErrorEvents',
      expect.objectContaining({ error_code: 'meta_retention_enforcement' }),
      { suppressAuth: true }
    );
  });

  test('runbook and incident playbook expose required operational sections', () => {
    const runbook = compliance.getMetaTokenPermissionVersionRunbook();
    const playbook = compliance.getMetaCampaignDeliveryIncidentPlaybook();

    expect(runbook.success).toBe(true);
    expect(runbook.runbook.tokenExpiry.length).toBeGreaterThan(0);
    expect(runbook.runbook.permissionDrift.length).toBeGreaterThan(0);
    expect(runbook.runbook.versionRollovers.length).toBeGreaterThan(0);

    expect(playbook.success).toBe(true);
    expect(playbook.playbook.triggerConditions.length).toBeGreaterThan(0);
    expect(playbook.playbook.triageSteps.length).toBeGreaterThan(0);
    expect(playbook.playbook.mitigationActions.length).toBeGreaterThan(0);
    expect(playbook.playbook.closureChecklist.length).toBeGreaterThan(0);
  });
});
