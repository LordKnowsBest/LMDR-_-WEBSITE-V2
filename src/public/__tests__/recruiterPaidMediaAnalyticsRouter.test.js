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
  logStep: jest.fn().mockResolvedValue({ stepId: 'step-paid-media-analytics-1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate-paid-media-analytics-1' }),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));

jest.mock('backend/metaInsightsService', () => ({
  getInsightsCampaignLevel: jest.fn().mockResolvedValue({ success: true, totals: { spend: 100 } }),
  getInsightsAdSetLevel: jest.fn().mockResolvedValue({ success: true }),
  getInsightsAdLevel: jest.fn().mockResolvedValue({ success: true }),
  getInsightsWithBreakdowns: jest.fn().mockResolvedValue({ success: true }),
  createAsyncReportJob: jest.fn().mockResolvedValue({ success: true, job: { job_id: 'job_1', status: 'queued' } }),
  getAsyncReportStatus: jest.fn().mockResolvedValue({ success: true, job: { status: 'processing' } }),
  downloadReport: jest.fn().mockResolvedValue({ success: true, rows: [] }),
  getCreativePerformance: jest.fn().mockResolvedValue({ success: true, items: [] }),
  getPlacementPerformance: jest.fn().mockResolvedValue({ success: true, breakdown: [] }),
  getFrequencyFatigueAlerts: jest.fn().mockResolvedValue({ success: true, alerts: [] }),
  suggestBudgetReallocation: jest.fn().mockResolvedValue({ success: true, suggestions: [] }),
  suggestCreativeRotation: jest.fn().mockResolvedValue({ success: true, suggestions: [] }),
  suggestAudienceNarrowing: jest.fn().mockResolvedValue({ success: true, suggestions: [] })
}));

jest.mock('backend/metaOptimizationService', () => ({
  applyBudgetReallocation: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_1' }),
  applyBidAdjustment: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_2' }),
  rotateCreativeVariant: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_3' })
}));

const metaInsightsService = require('backend/metaInsightsService');
const metaOptimizationService = require('backend/metaOptimizationService');
const { executeTool, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

describe('recruiter_paid_media_analytics router', () => {
  const ctx = { runId: 'run-paid-media-analytics-1', userId: 'recruiter-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is registered in ACTION_REGISTRY and ROUTER_DEFINITIONS', () => {
    expect(ACTION_REGISTRY).toHaveProperty('recruiter_paid_media_analytics');
    expect(ROUTER_DEFINITIONS).toHaveProperty('recruiter_paid_media_analytics');
    expect(Object.keys(ACTION_REGISTRY.recruiter_paid_media_analytics)).toHaveLength(16);
    expect(ROUTER_DEFINITIONS.recruiter_paid_media_analytics.roles).toContain('recruiter');
  });

  test('dispatches read action get_insights_campaign_level', async () => {
    const result = await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'get_insights_campaign_level', params: { dateRange: {} } },
      ctx
    );

    expect(metaInsightsService.getInsightsCampaignLevel).toHaveBeenCalledWith('recruiter-1', { dateRange: {} });
    expect(result).toMatchObject({ success: true });
  });

  test('dispatches async report create/status/download actions', async () => {
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'create_async_report_job', params: { reportScope: 'campaign' } },
      ctx
    );
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'get_async_report_status', params: { jobId: 'job_1' } },
      ctx
    );
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'download_report', params: { jobId: 'job_1' } },
      ctx
    );

    expect(metaInsightsService.createAsyncReportJob).toHaveBeenCalledWith('recruiter-1', { reportScope: 'campaign' });
    expect(metaInsightsService.getAsyncReportStatus).toHaveBeenCalledWith('recruiter-1', { jobId: 'job_1' });
    expect(metaInsightsService.downloadReport).toHaveBeenCalledWith('recruiter-1', { jobId: 'job_1' });
  });

  test('dispatches suggest actions', async () => {
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'suggest_budget_reallocation', params: {} },
      ctx
    );
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'suggest_creative_rotation', params: {} },
      ctx
    );
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'suggest_audience_narrowing', params: {} },
      ctx
    );

    expect(metaInsightsService.suggestBudgetReallocation).toHaveBeenCalled();
    expect(metaInsightsService.suggestCreativeRotation).toHaveBeenCalled();
    expect(metaInsightsService.suggestAudienceNarrowing).toHaveBeenCalled();
  });

  test('dispatches execute_low optimization apply actions', async () => {
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'apply_budget_reallocation', params: { adSetId: 'as_1', budgetDeltaPct: 10 } },
      ctx
    );
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'apply_bid_adjustment', params: { adSetId: 'as_1', bidStrategy: 'LOWEST_COST_WITH_BID_CAP' } },
      ctx
    );
    await executeTool(
      'recruiter_paid_media_analytics',
      { action: 'rotate_creative_variant', params: { adId: 'ad_1', nextCreativeId: 'cr_2' } },
      ctx
    );

    expect(metaOptimizationService.applyBudgetReallocation).toHaveBeenCalledWith('recruiter-1', { adSetId: 'as_1', budgetDeltaPct: 10 });
    expect(metaOptimizationService.applyBidAdjustment).toHaveBeenCalledWith('recruiter-1', { adSetId: 'as_1', bidStrategy: 'LOWEST_COST_WITH_BID_CAP' });
    expect(metaOptimizationService.rotateCreativeVariant).toHaveBeenCalledWith('recruiter-1', { adId: 'ad_1', nextCreativeId: 'cr_2' });
  });
});
