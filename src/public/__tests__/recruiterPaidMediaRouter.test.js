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
  logStep: jest.fn().mockResolvedValue({ stepId: 'step-paid-media-1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate-paid-media-1' }),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));

jest.mock('backend/metaCampaignService', () => ({
  createCampaignDraft: jest.fn().mockResolvedValue({ success: true, campaign: { campaign_id: 'cmp_1' } }),
  createCampaign: jest.fn().mockResolvedValue({ success: true, campaign: { campaign_id: 'cmp_1' } }),
  updateCampaign: jest.fn().mockResolvedValue({ success: true }),
  pauseCampaign: jest.fn().mockResolvedValue({ success: true }),
  resumeCampaign: jest.fn().mockResolvedValue({ success: true }),
  deleteCampaign: jest.fn().mockResolvedValue({ success: true }),
  createAd: jest.fn().mockResolvedValue({ success: true }),
  updateAd: jest.fn().mockResolvedValue({ success: true }),
  pauseAd: jest.fn().mockResolvedValue({ success: true }),
  resumeAd: jest.fn().mockResolvedValue({ success: true }),
  deleteAd: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/metaAdSetService', () => ({
  createAdSetDraft: jest.fn().mockResolvedValue({ success: true }),
  createAdSet: jest.fn().mockResolvedValue({ success: true }),
  updateAdSetTargeting: jest.fn().mockResolvedValue({ success: true }),
  updateAdSetBudget: jest.fn().mockResolvedValue({ success: true }),
  updateAdSetSchedule: jest.fn().mockResolvedValue({ success: true }),
  pauseAdSet: jest.fn().mockResolvedValue({ success: true }),
  resumeAdSet: jest.fn().mockResolvedValue({ success: true }),
  deleteAdSet: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/metaCreativeService', () => ({
  createCreativeDraft: jest.fn().mockResolvedValue({ success: true }),
  createCreative: jest.fn().mockResolvedValue({ success: true }),
  updateCreative: jest.fn().mockResolvedValue({ success: true }),
  archiveCreative: jest.fn().mockResolvedValue({ success: true }),
  attachCreativeToAd: jest.fn().mockResolvedValue({ success: true })
}));

const metaCampaignService = require('backend/metaCampaignService');
const metaCreativeService = require('backend/metaCreativeService');
const { createGate } = require('backend/agentRunLedgerService');
const { executeTool, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

describe('recruiter_paid_media router', () => {
  const ctx = { runId: 'run-paid-media-1', userId: 'recruiter-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is registered in ACTION_REGISTRY and ROUTER_DEFINITIONS', () => {
    expect(ACTION_REGISTRY).toHaveProperty('recruiter_paid_media');
    expect(ROUTER_DEFINITIONS).toHaveProperty('recruiter_paid_media');
    expect(Object.keys(ACTION_REGISTRY.recruiter_paid_media)).toHaveLength(24);
    expect(ROUTER_DEFINITIONS.recruiter_paid_media.roles).toContain('recruiter');
  });

  test('dispatches execute_low action without approval', async () => {
    const result = await executeTool(
      'recruiter_paid_media',
      {
        action: 'create_campaign_draft',
        params: { campaignId: 'cmp_draft_1', name: 'Q1 Hiring Push' }
      },
      ctx
    );

    expect(result.success).toBe(true);
    expect(metaCampaignService.createCampaignDraft).toHaveBeenCalledWith(
      'recruiter-1',
      { campaignId: 'cmp_draft_1', name: 'Q1 Hiring Push' }
    );
  });

  test('returns approval_required for execute_high action', async () => {
    const result = await executeTool(
      'recruiter_paid_media',
      {
        action: 'create_campaign',
        params: { campaignId: 'cmp_live_1', dailyBudget: 5000 }
      },
      ctx
    );

    expect(result.type).toBe('approval_required');
    expect(result.toolName).toBe('recruiter_paid_media.create_campaign');
    expect(result.gateId).toBe('gate-paid-media-1');
    expect(createGate).toHaveBeenCalled();
    expect(metaCampaignService.createCampaign).not.toHaveBeenCalled();
  });

  test('executes approved high-risk action', async () => {
    const result = await executeTool(
      'recruiter_paid_media',
      {
        action: 'create_campaign',
        params: { campaignId: 'cmp_live_2', dailyBudget: 6000, idempotencyKey: 'idem_launch_2' }
      },
      { ...ctx, approvedGateId: 'gate-paid-media-1' }
    );

    expect(result.success).toBe(true);
    expect(metaCampaignService.createCampaign).toHaveBeenCalledWith(
      'recruiter-1',
      { campaignId: 'cmp_live_2', dailyBudget: 6000, idempotencyKey: 'idem_launch_2' }
    );
  });

  test('dispatches creative link action', async () => {
    const result = await executeTool(
      'recruiter_paid_media',
      {
        action: 'attach_creative_to_ad',
        params: { adId: 'ad_1', creativeId: 'creative_1' }
      },
      ctx
    );

    expect(result.success).toBe(true);
    expect(metaCreativeService.attachCreativeToAd).toHaveBeenCalledWith(
      'recruiter-1',
      { adId: 'ad_1', creativeId: 'creative_1' }
    );
  });
});
