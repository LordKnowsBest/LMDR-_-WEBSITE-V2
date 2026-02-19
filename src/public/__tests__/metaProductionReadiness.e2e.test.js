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
  logStep: jest.fn().mockResolvedValue({ stepId: 'step-prod-1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate-prod-1' }),
  resolveGate: jest.fn(),
  completeRun: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('backend/metaCampaignService', () => ({
  createCampaignDraft: jest.fn().mockResolvedValue({ success: true, campaign: { campaign_id: 'cmp_prod_1', status: 'draft' } }),
  createCampaign: jest.fn().mockResolvedValue({ success: true, campaign: { campaign_id: 'cmp_prod_1', status: 'active' } }),
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
  deleteAdSet: jest.fn().mockResolvedValue({ success: true }),
  updateAdSet: jest.fn().mockResolvedValue({ success: true, adSet: { ad_set_id: 'as_prod_1' } })
}));

jest.mock('backend/metaCreativeService', () => ({
  createCreativeDraft: jest.fn().mockResolvedValue({ success: true }),
  createCreative: jest.fn().mockResolvedValue({ success: true }),
  updateCreative: jest.fn().mockResolvedValue({ success: true }),
  archiveCreative: jest.fn().mockResolvedValue({ success: true }),
  attachCreativeToAd: jest.fn().mockResolvedValue({ success: true, ad: { ad_id: 'ad_prod_1', creative_id: 'cr_prod_1' } })
}));

jest.mock('backend/metaInsightsService', () => ({
  getInsightsCampaignLevel: jest.fn().mockResolvedValue({
    success: true,
    entityType: 'campaign',
    totals: { spend: 550, results: 12, cpl: 45.83 },
    rows: [{ entity_id: 'cmp_prod_1', spend: 550, results: 12 }]
  }),
  getInsightsAdSetLevel: jest.fn().mockResolvedValue({ success: true, rows: [] }),
  getInsightsAdLevel: jest.fn().mockResolvedValue({ success: true, rows: [] }),
  getInsightsWithBreakdowns: jest.fn().mockResolvedValue({ success: true, rows: [], breakdown: [] }),
  createAsyncReportJob: jest.fn().mockResolvedValue({ success: true, job: { job_id: 'job_prod_1' } }),
  getAsyncReportStatus: jest.fn().mockResolvedValue({ success: true, job: { status: 'completed' } }),
  downloadReport: jest.fn().mockResolvedValue({ success: true, rows: [] }),
  getCreativePerformance: jest.fn().mockResolvedValue({ success: true, items: [] }),
  getPlacementPerformance: jest.fn().mockResolvedValue({ success: true, breakdown: [] }),
  getFrequencyFatigueAlerts: jest.fn().mockResolvedValue({ success: true, alerts: [] }),
  suggestBudgetReallocation: jest.fn().mockResolvedValue({ success: true, suggestions: [] }),
  suggestCreativeRotation: jest.fn().mockResolvedValue({ success: true, suggestions: [] }),
  suggestAudienceNarrowing: jest.fn().mockResolvedValue({ success: true, suggestions: [] })
}));

jest.mock('backend/metaOptimizationService', () => ({
  getRuleDrivenRecommendations: jest.fn().mockResolvedValue({ success: true, recommendations: {} }),
  applyBudgetReallocation: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_prod_1' }),
  applyBidAdjustment: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_prod_2' }),
  rotateCreativeVariant: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_prod_3' }),
  rollbackOptimizationAction: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/metaGovernanceService', () => ({
  listMetaIntegrations: jest.fn().mockResolvedValue({ success: true, items: [] }),
  getTokenHealth: jest.fn().mockResolvedValue({ success: true, status: 'healthy' }),
  getMetaApiErrorDigest: jest.fn().mockResolvedValue({ success: true, totalEvents: 0, digest: {} }),
  getRateLimitPosture: jest.fn().mockResolvedValue({ success: true, posture: 'normal' }),
  getAuditEvents: jest.fn().mockResolvedValue({
    success: true,
    items: [
      { action: 'create_campaign', correlation_id: 'corr_prod_1' },
      { action: 'apply_budget_reallocation', correlation_id: 'corr_prod_2' }
    ]
  }),
  refreshSystemUserToken: jest.fn().mockResolvedValue({ success: true }),
  setCampaignGuardrails: jest.fn().mockResolvedValue({ success: true }),
  setDailyBudgetCaps: jest.fn().mockResolvedValue({ success: true }),
  setApprovalThresholds: jest.fn().mockResolvedValue({ success: true }),
  quarantineIntegration: jest.fn().mockResolvedValue({ success: true }),
  rotateCredentials: jest.fn().mockResolvedValue({ success: true }),
  rebindAdAccount: jest.fn().mockResolvedValue({ success: true }),
  disableIntegration: jest.fn().mockResolvedValue({ success: true })
}));

const { executeTool } = require('backend/agentService');
const { createCampaignDraft, createCampaign } = require('backend/metaCampaignService');
const { getInsightsCampaignLevel } = require('backend/metaInsightsService');
const { applyBudgetReallocation } = require('backend/metaOptimizationService');
const { getAuditEvents } = require('backend/metaGovernanceService');

describe('meta production readiness e2e', () => {
  const recruiterCtx = { runId: 'run-prod-recruiter-1', userId: 'recruiter-1' };
  const adminCtx = { runId: 'run-prod-admin-1', userId: 'admin-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create -> launch -> monitor -> optimize -> audit flow completes', async () => {
    const draft = await executeTool(
      'recruiter_paid_media',
      {
        action: 'create_campaign_draft',
        params: { campaignId: 'cmp_prod_1', name: 'Production Readiness Campaign' }
      },
      recruiterCtx
    );
    expect(draft.success).toBe(true);
    expect(createCampaignDraft).toHaveBeenCalled();

    const gatedLaunch = await executeTool(
      'recruiter_paid_media',
      {
        action: 'create_campaign',
        params: { campaignId: 'cmp_prod_1', dailyBudget: 6000, idempotencyKey: 'idem_prod_launch_1' }
      },
      recruiterCtx
    );
    expect(gatedLaunch.type).toBe('approval_required');

    const launched = await executeTool(
      'recruiter_paid_media',
      {
        action: 'create_campaign',
        params: { campaignId: 'cmp_prod_1', dailyBudget: 6000, idempotencyKey: 'idem_prod_launch_1' }
      },
      { ...recruiterCtx, approvedGateId: gatedLaunch.gateId }
    );
    expect(launched.success).toBe(true);
    expect(createCampaign).toHaveBeenCalled();

    const monitored = await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'get_insights_campaign_level', params: { campaignId: 'cmp_prod_1' } },
      recruiterCtx
    );
    expect(monitored.success).toBe(true);
    expect(monitored.totals.spend).toBe(550);
    expect(getInsightsCampaignLevel).toHaveBeenCalled();

    const optimized = await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'apply_budget_reallocation', params: { adSetId: 'as_prod_1', dailyBudget: 7000 } },
      recruiterCtx
    );
    expect(optimized.success).toBe(true);
    expect(applyBudgetReallocation).toHaveBeenCalled();

    const audited = await executeTool(
      'admin_meta_ads_governance',
      { action: 'get_audit_events', params: { integrationId: 'int_prod_1' } },
      adminCtx
    );
    expect(audited.success).toBe(true);
    expect(audited.items.length).toBeGreaterThan(0);
    expect(getAuditEvents).toHaveBeenCalled();
  });
});
