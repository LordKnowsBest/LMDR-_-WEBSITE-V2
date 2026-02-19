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
  logStep: jest.fn().mockResolvedValue({ stepId: 'step-cross-role-pipeline-1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate-cross-role-pipeline-1' }),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));

jest.mock('backend/metaAttributionBridgeService', () => ({
  getPaidMediaToPipelineFunnel: jest.fn().mockResolvedValue({ success: true, totals: { leads: 10, hires: 2 } }),
  getCplToHireTrend: jest.fn().mockResolvedValue({ success: true, points: [] }),
  getSourceQualityScore: jest.fn().mockResolvedValue({ success: true, items: [] }),
  suggestChannelMix: jest.fn().mockResolvedValue({ success: true, suggestions: [] }),
  suggestGeoExpansion: jest.fn().mockResolvedValue({ success: true, suggestions: [] }),
  syncCampaignTaxonomyToPipeline: jest.fn().mockResolvedValue({ success: true, synced: 4 }),
  backfillMissingAttribution: jest.fn().mockResolvedValue({ success: true, updated: 7 })
}));

const bridgeService = require('backend/metaAttributionBridgeService');
const { executeTool, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

describe('cross_role_paid_media_pipeline router', () => {
  const ctx = { runId: 'run-cross-role-pipeline-1', userId: 'recruiter-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is registered with 7 actions and recruiter/admin role access', () => {
    expect(ACTION_REGISTRY).toHaveProperty('cross_role_paid_media_pipeline');
    expect(ROUTER_DEFINITIONS).toHaveProperty('cross_role_paid_media_pipeline');
    expect(Object.keys(ACTION_REGISTRY.cross_role_paid_media_pipeline)).toHaveLength(7);
    expect(ROUTER_DEFINITIONS.cross_role_paid_media_pipeline.roles).toEqual(expect.arrayContaining(['recruiter', 'admin']));
  });

  test('dispatches read actions', async () => {
    await executeTool('cross_role_paid_media_pipeline', { action: 'get_paid_media_to_pipeline_funnel', params: { carrierDot: '123456' } }, ctx);
    await executeTool('cross_role_paid_media_pipeline', { action: 'get_cpl_to_hire_trend', params: { carrierDot: '123456' } }, ctx);
    await executeTool('cross_role_paid_media_pipeline', { action: 'get_source_quality_score', params: { carrierDot: '123456' } }, ctx);

    expect(bridgeService.getPaidMediaToPipelineFunnel).toHaveBeenCalledWith('recruiter-1', { carrierDot: '123456' });
    expect(bridgeService.getCplToHireTrend).toHaveBeenCalledWith('recruiter-1', { carrierDot: '123456' });
    expect(bridgeService.getSourceQualityScore).toHaveBeenCalledWith('recruiter-1', { carrierDot: '123456' });
  });

  test('dispatches suggest actions', async () => {
    await executeTool('cross_role_paid_media_pipeline', { action: 'suggest_channel_mix', params: {} }, ctx);
    await executeTool('cross_role_paid_media_pipeline', { action: 'suggest_geo_expansion', params: {} }, ctx);

    expect(bridgeService.suggestChannelMix).toHaveBeenCalledWith('recruiter-1', {});
    expect(bridgeService.suggestGeoExpansion).toHaveBeenCalledWith('recruiter-1', {});
  });

  test('dispatches execute_low actions without approval', async () => {
    const syncResult = await executeTool('cross_role_paid_media_pipeline', { action: 'sync_campaign_taxonomy_to_pipeline', params: { carrierDot: '123456' } }, ctx);
    const backfillResult = await executeTool('cross_role_paid_media_pipeline', { action: 'backfill_missing_attribution', params: { carrierDot: '123456' } }, ctx);

    expect(syncResult.type).not.toBe('approval_required');
    expect(backfillResult.type).not.toBe('approval_required');
    expect(bridgeService.syncCampaignTaxonomyToPipeline).toHaveBeenCalledWith('recruiter-1', { carrierDot: '123456' });
    expect(bridgeService.backfillMissingAttribution).toHaveBeenCalledWith('recruiter-1', { carrierDot: '123456' });
  });
});
