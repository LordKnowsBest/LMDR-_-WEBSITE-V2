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
  logStep: jest.fn(),
  createGate: jest.fn(),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));

const { ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

describe('meta security review assertions', () => {
  test('execute_high recruiter paid media actions require approval', () => {
    const recruiterPaidMedia = ACTION_REGISTRY.recruiter_paid_media;
    const executeHighActions = [
      'create_campaign',
      'delete_campaign',
      'create_ad_set',
      'update_ad_set_budget',
      'delete_ad_set',
      'create_creative',
      'create_ad',
      'delete_ad'
    ];

    for (const action of executeHighActions) {
      expect(recruiterPaidMedia[action].policy.risk_level).toBe('execute_high');
      expect(recruiterPaidMedia[action].policy.requires_approval).toBe(true);
    }
  });

  test('admin meta governance high-impact credential actions require approval', () => {
    const adminGovernance = ACTION_REGISTRY.admin_meta_ads_governance;
    const highActions = ['rotate_credentials', 'rebind_ad_account', 'disable_integration'];

    for (const action of highActions) {
      expect(adminGovernance[action].policy.risk_level).toBe('execute_high');
      expect(adminGovernance[action].policy.requires_approval).toBe(true);
    }
  });

  test('meta router role scopes stay restricted to intended user classes', () => {
    expect(ROUTER_DEFINITIONS.recruiter_paid_media.roles).toEqual(expect.arrayContaining(['recruiter']));
    expect(ROUTER_DEFINITIONS.recruiter_paid_media.roles).not.toContain('driver');

    expect(ROUTER_DEFINITIONS.recruiter_paid_media_analytics.roles).toEqual(expect.arrayContaining(['recruiter']));
    expect(ROUTER_DEFINITIONS.admin_meta_ads_governance.roles).toEqual(expect.arrayContaining(['admin']));
    expect(ROUTER_DEFINITIONS.admin_meta_ads_governance.roles).not.toContain('recruiter');

    expect(ROUTER_DEFINITIONS.cross_role_paid_media_pipeline.roles)
      .toEqual(expect.arrayContaining(['recruiter', 'admin']));
  });
});
