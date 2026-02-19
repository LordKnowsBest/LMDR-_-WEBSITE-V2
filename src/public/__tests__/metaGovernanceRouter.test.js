jest.mock('backend/aiRouterService', () => ({
  routeAIRequest: jest.fn()
}));

jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(),
  addTurn: jest.fn(),
  getRecentContext: jest.fn()
}));

jest.mock('backend/dataAccess', () => ({}));

jest.mock('backend/agentRunLedgerService', () => ({
  startRun: jest.fn(),
  logStep: jest.fn().mockResolvedValue({ stepId: 'step-meta-1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate-meta-1' }),
  resolveGate: jest.fn(),
  completeRun: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('backend/metaGovernanceService', () => ({
  listMetaIntegrations: jest.fn().mockResolvedValue({ success: true, items: [] }),
  getTokenHealth: jest.fn().mockResolvedValue({ success: true, status: 'healthy' }),
  getMetaApiErrorDigest: jest.fn().mockResolvedValue({ success: true, totalEvents: 0, digest: {} }),
  getRateLimitPosture: jest.fn().mockResolvedValue({ success: true, posture: 'normal' }),
  getAuditEvents: jest.fn().mockResolvedValue({ success: true, items: [] }),
  refreshSystemUserToken: jest.fn().mockResolvedValue({ success: true }),
  setCampaignGuardrails: jest.fn().mockResolvedValue({ success: true }),
  setDailyBudgetCaps: jest.fn().mockResolvedValue({ success: true }),
  setApprovalThresholds: jest.fn().mockResolvedValue({ success: true }),
  quarantineIntegration: jest.fn().mockResolvedValue({ success: true }),
  rotateCredentials: jest.fn().mockResolvedValue({ success: true }),
  rebindAdAccount: jest.fn().mockResolvedValue({ success: true }),
  disableIntegration: jest.fn().mockResolvedValue({ success: true })
}));

const metaGovernanceService = require('backend/metaGovernanceService');
const { executeTool, resumeAfterApproval, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');
const { createGate, resolveGate } = require('backend/agentRunLedgerService');
const { routeAIRequest } = require('backend/aiRouterService');

describe('admin_meta_ads_governance router', () => {
  const ctx = { runId: 'run-meta-1', userId: 'admin-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is registered in ACTION_REGISTRY and ROUTER_DEFINITIONS', () => {
    expect(ACTION_REGISTRY).toHaveProperty('admin_meta_ads_governance');
    expect(ROUTER_DEFINITIONS).toHaveProperty('admin_meta_ads_governance');
    expect(Object.keys(ACTION_REGISTRY.admin_meta_ads_governance)).toHaveLength(13);
    expect(ROUTER_DEFINITIONS.admin_meta_ads_governance.roles).toContain('admin');
  });

  test('dispatches read action get_token_health', async () => {
    const result = await executeTool(
      'admin_meta_ads_governance',
      { action: 'get_token_health', params: { integrationId: 'int_123' } },
      ctx
    );

    expect(metaGovernanceService.getTokenHealth).toHaveBeenCalledWith('int_123');
    expect(result).toMatchObject({ success: true, status: 'healthy' });
  });

  test('injects userId for execute_low policy actions', async () => {
    await executeTool(
      'admin_meta_ads_governance',
      {
        action: 'set_approval_thresholds',
        params: { launch_budget_threshold: 2500, budget_change_pct: 20 }
      },
      ctx
    );

    expect(metaGovernanceService.setApprovalThresholds).toHaveBeenCalledWith(
      { launch_budget_threshold: 2500, budget_change_pct: 20 },
      'admin-1'
    );
  });

  test('returns approval_required for execute_high action without gate approval', async () => {
    const result = await executeTool(
      'admin_meta_ads_governance',
      { action: 'rotate_credentials', params: { integrationId: 'int_123' } },
      ctx
    );

    expect(result.type).toBe('approval_required');
    expect(result.toolName).toBe('admin_meta_ads_governance.rotate_credentials');
    expect(result.gateId).toBe('gate-meta-1');
    expect(createGate).toHaveBeenCalled();
    expect(metaGovernanceService.rotateCredentials).not.toHaveBeenCalled();
  });

  test('executes execute_high action when approvedGateId is provided', async () => {
    const result = await executeTool(
      'admin_meta_ads_governance',
      {
        action: 'rotate_credentials',
        params: { integrationId: 'int_123', appSecretHint: 'new-secret' }
      },
      { ...ctx, approvedGateId: 'gate-meta-1' }
    );

    expect(metaGovernanceService.rotateCredentials).toHaveBeenCalledWith(
      'int_123',
      { integrationId: 'int_123', appSecretHint: 'new-secret' },
      'admin-1'
    );
    expect(result).toMatchObject({ success: true });
  });

  test('approval workflow integration: approved gate resumes and executes pending execute_high action', async () => {
    routeAIRequest.mockResolvedValue({
      content: 'Approved action executed.',
      contentBlocks: [{ type: 'text', text: 'Approved action executed.' }],
      tokensUsed: 22
    });

    const approvalContext = {
      conversationId: 'conv_meta_1',
      runId: 'run-meta-1',
      gateId: 'gate-meta-1',
      pendingToolBlock: {
        id: 'tool-use-1',
        name: 'admin_meta_ads_governance',
        input: {
          action: 'disable_integration',
          params: { integrationId: 'int_123', reason: 'policy breach' }
        }
      },
      pendingMessages: [],
      role: 'admin'
    };

    const result = await resumeAfterApproval(approvalContext, 'approved', 'admin-1');

    expect(resolveGate).toHaveBeenCalledWith('gate-meta-1', 'approved', 'admin-1');
    expect(metaGovernanceService.disableIntegration).toHaveBeenCalledWith(
      'int_123',
      { integrationId: 'int_123', reason: 'policy breach' },
      'admin-1'
    );
    expect(result.response).toContain('Approved action executed');
  });

  test('approval workflow integration: rejected gate does not execute pending action', async () => {
    routeAIRequest.mockResolvedValue({
      content: 'Understood, I will not execute that change.',
      contentBlocks: [{ type: 'text', text: 'Understood, I will not execute that change.' }],
      tokensUsed: 12
    });

    const approvalContext = {
      conversationId: 'conv_meta_2',
      runId: 'run-meta-2',
      gateId: 'gate-meta-2',
      pendingToolBlock: {
        id: 'tool-use-2',
        name: 'admin_meta_ads_governance',
        input: {
          action: 'rotate_credentials',
          params: { integrationId: 'int_789' }
        }
      },
      pendingMessages: [],
      role: 'admin'
    };

    const result = await resumeAfterApproval(approvalContext, 'rejected', 'admin-1');

    expect(resolveGate).toHaveBeenCalledWith('gate-meta-2', 'rejected', 'admin-1');
    expect(metaGovernanceService.rotateCredentials).not.toHaveBeenCalled();
    expect(result.response).toContain('not execute');
  });
});
