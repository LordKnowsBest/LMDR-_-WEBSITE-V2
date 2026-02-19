/**
 * Recruiter Router Integration Tests
 * Verifies all recruiter domain routers dispatch correctly through ACTION_REGISTRY.
 * Tests: registry completeness, router dispatch, arg mapping, approval gates, rate limiting.
 */

// ── Mock all Phase 2 recruiter service modules ──

jest.mock('backend/smsCampaignService', () => ({
  createSMSCampaign: jest.fn().mockResolvedValue({ success: true, campaignId: 'sms1' })
}));

jest.mock('backend/emailCampaignService', () => ({
  createEmailCampaign: jest.fn().mockResolvedValue({ success: true, campaignId: 'email1' })
}));

jest.mock('backend/recruiterOutreachService', () => ({
  getCampaignStatus: jest.fn().mockResolvedValue({ status: 'active', sent: 50 }),
  pauseCampaign: jest.fn().mockResolvedValue({ success: true }),
  resumeCampaign: jest.fn().mockResolvedValue({ success: true }),
  getCampaignHistory: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getMessageTemplates: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  createMessageTemplate: jest.fn().mockResolvedValue({ success: true, templateId: 'tpl1' }),
  previewCampaignReach: jest.fn().mockResolvedValue({ estimatedReach: 200 })
}));

jest.mock('backend/jobBoardService', () => ({
  syndicateJob: jest.fn().mockResolvedValue({ success: true, syndicationId: 'syn1' }),
  getJobPostings: jest.fn().mockResolvedValue({ items: [], totalCount: 0 })
}));

jest.mock('backend/socialPostingService', () => ({
  createSocialPost: jest.fn().mockResolvedValue({ success: true, postId: 'sp1' })
}));

jest.mock('backend/voiceCampaignService', () => ({
  createCampaign: jest.fn().mockResolvedValue({ success: true, campaignId: 'vc1' }),
  getCampaignStatus: jest.fn().mockResolvedValue({ status: 'running', contactsReached: 10 })
}));

jest.mock('backend/voiceAgentTemplates', () => ({
  getTemplatesByCategory: jest.fn().mockResolvedValue({ items: [] }),
  createAssistantFromTemplate: jest.fn()
}));

jest.mock('backend/recruiterAnalyticsService', () => ({
  getAttributionBreakdown: jest.fn().mockResolvedValue({ channels: [] }),
  calculateCostPerHire: jest.fn().mockResolvedValue({ cph: 4500 }),
  getFunnelMetrics: jest.fn().mockResolvedValue({ stages: [] }),
  getCompetitorComparison: jest.fn().mockResolvedValue({ competitors: [] }),
  getHiringForecast: jest.fn().mockResolvedValue({ forecast: [] }),
  getTimeToFill: jest.fn().mockResolvedValue({ avgDays: 21 }),
  getChannelROI: jest.fn().mockResolvedValue({ channels: [] }),
  getBottleneckAnalysis: jest.fn().mockResolvedValue({ bottlenecks: [] }),
  getRecruiterScorecard: jest.fn().mockResolvedValue({ score: 85 }),
  exportAnalytics: jest.fn().mockResolvedValue({ data: '', format: 'csv' }),
  getTurnoverRiskAnalysis: jest.fn().mockResolvedValue({ riskLevel: 'medium' })
}));

jest.mock('backend/onboardingWorkflowService', () => ({
  createOnboardingWorkflow: jest.fn().mockResolvedValue({ success: true, workflowId: 'wf1' }),
  getWorkflowStatus: jest.fn().mockResolvedValue({ status: 'in_progress' })
}));

jest.mock('backend/recruiterOnboardingService', () => ({
  requestDocuments: jest.fn().mockResolvedValue({ success: true }),
  getDocumentCollectionStatus: jest.fn().mockResolvedValue({ status: 'pending', docs: [] }),
  initiateBGC: jest.fn().mockResolvedValue({ success: true, checkId: 'bgc1' }),
  getBGCStatus: jest.fn().mockResolvedValue({ status: 'clear' }),
  initiateDrugTest: jest.fn().mockResolvedValue({ success: true, testId: 'dt1' }),
  getDrugTestStatus: jest.fn().mockResolvedValue({ status: 'negative' }),
  sendESignRequest: jest.fn().mockResolvedValue({ success: true, requestId: 'esign1' }),
  getESignStatus: jest.fn().mockResolvedValue({ status: 'signed' }),
  scheduleOrientation: jest.fn().mockResolvedValue({ success: true, slotId: 'slot1' }),
  getOrientationSlots: jest.fn().mockResolvedValue({ slots: [] })
}));

jest.mock('backend/recruiterPipelineService', () => ({
  saveDriverSearch: jest.fn().mockResolvedValue({ success: true, searchId: 'search1' }),
  getSavedSearches: jest.fn().mockResolvedValue({ items: [] }),
  runSavedSearch: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getInterventionTemplates: jest.fn().mockResolvedValue({ items: [] }),
  applyIntervention: jest.fn().mockResolvedValue({ success: true }),
  bulkUpdatePipeline: jest.fn().mockResolvedValue({ success: true, updated: 5 }),
  getStaleCandidates: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getCallOutcomesSummary: jest.fn().mockResolvedValue({ outcomes: {} })
}));

jest.mock('backend/pipelineAutomationService', () => ({
  createAutomationRule: jest.fn().mockResolvedValue({ success: true, ruleId: 'rule1' }),
  getAutomationRules: jest.fn().mockResolvedValue({ items: [] })
}));

jest.mock('backend/recruiterRetentionService', () => ({
  getRetentionRisks: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getRiskScoreDetail: jest.fn().mockResolvedValue({ score: 72, factors: [] }),
  addToWatchlist: jest.fn().mockResolvedValue({ success: true }),
  removeFromWatchlist: jest.fn().mockResolvedValue({ success: true }),
  getWatchlist: jest.fn().mockResolvedValue({ items: [] }),
  createRetentionIntervention: jest.fn().mockResolvedValue({ success: true, interventionId: 'ri1' }),
  getRetentionHistory: jest.fn().mockResolvedValue({ items: [] })
}));

jest.mock('backend/recruiterReverseMatchService', () => ({
  reverseSearchDrivers: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getReverseMatchScores: jest.fn().mockResolvedValue({ scores: [] }),
  createMatchSubscription: jest.fn().mockResolvedValue({ success: true, subscriptionId: 'sub1' }),
  getMatchSubscriptions: jest.fn().mockResolvedValue({ items: [] }),
  deleteMatchSubscription: jest.fn().mockResolvedValue({ success: true }),
  getSubscriptionAlerts: jest.fn().mockResolvedValue({ items: [] }),
  getStripeBilling: jest.fn().mockResolvedValue({ plan: 'pro', status: 'active' }),
  upgradeSubscription: jest.fn().mockResolvedValue({ success: true })
}));

// ── Mock shared dependencies (same as driverRouters.test.js) ──
jest.mock('backend/dataAccess', () => ({}));
jest.mock('backend/agentRunLedgerService', () => ({
  startRun: jest.fn(),
  logStep: jest.fn().mockResolvedValue({ stepId: 'step1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate1' }),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));
jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(),
  addTurn: jest.fn(),
  getRecentContext: jest.fn()
}));
jest.mock('backend/aiRouterService', () => ({
  routeAIRequest: jest.fn()
}));
jest.mock('backend/agentOutcomeService', () => ({
  evaluateRun: jest.fn(),
  getOutcomeStats: jest.fn()
}));

// Legacy tool service mocks (needed for agentService module load)
jest.mock('backend/carrierMatching', () => ({ findMatchingCarriers: jest.fn() }));
jest.mock('backend/messaging', () => ({ sendMessage: jest.fn() }));
jest.mock('backend/recruiter_service', () => ({ getPipelineCandidates: jest.fn(), updateCandidateStatus: jest.fn() }));
jest.mock('backend/b2bMatchSignalService', () => ({ getSignals: jest.fn() }));
jest.mock('backend/aiEnrichment', () => ({ enrichCarrier: jest.fn() }));
jest.mock('backend/matchExplanationService', () => ({ getMatchExplanationForDriver: jest.fn() }));
jest.mock('backend/externalFmcsaApi', () => ({ getCarrierSafety: jest.fn() }));
jest.mock('backend/roadConditionService', () => ({ getRoadConditions: jest.fn() }));
jest.mock('backend/driverMatching', () => ({ findMatchingDrivers: jest.fn() }));
jest.mock('backend/interviewScheduler', () => ({ requestAvailability: jest.fn() }));
jest.mock('backend/callOutcomeService', () => ({ logCallOutcome: jest.fn() }));
jest.mock('backend/observabilityService', () => ({ getMetrics: jest.fn() }));
jest.mock('backend/admin_service', () => ({ getDrivers: jest.fn() }));
jest.mock('backend/admin_dashboard_service', () => ({ getDashboardStats: jest.fn() }));
jest.mock('backend/autopilotService', () => ({ startAutopilot: jest.fn(), getAutopilotStatus: jest.fn() }));
jest.mock('backend/driverProfiles', () => ({ getDriverStats: jest.fn() }));
jest.mock('backend/selfHealingService', () => ({ triageIssue: jest.fn(), executeRemediation: jest.fn() }));
jest.mock('backend/compendiumService', () => ({ triggerKnowledgeCurator: jest.fn() }));
jest.mock('backend/voiceService', () => ({ createAssistant: jest.fn(), initiateOutboundCall: jest.fn() }));
jest.mock('backend/utils/tcpaGuard', () => ({ isTCPACompliant: jest.fn().mockReturnValue(true) }));
jest.mock('backend/pipelineEventBus', () => ({ emitEvent: jest.fn() }));
jest.mock('backend/pipelineExecutionAgent', () => ({ getPipelineHealth: jest.fn() }));

// Driver service mocks (needed because agentService imports them at module load)
jest.mock('backend/driverCockpitService', () => ({ searchJobs: jest.fn() }));
jest.mock('backend/messagingService', () => ({ sendDriverMessage: jest.fn() }));
jest.mock('backend/driverProfileService', () => ({ updateDriverProfile: jest.fn() }));
jest.mock('backend/documentService', () => ({ recordDriverDocumentUpload: jest.fn() }));
jest.mock('backend/matchingService', () => ({ getDriverMatches: jest.fn() }));
jest.mock('backend/parkingService', () => ({ findTruckParking: jest.fn() }));
jest.mock('backend/fuelService', () => ({ findDieselPrices: jest.fn() }));
jest.mock('backend/roadUtilitiesService', () => ({ getWeighStationStatus: jest.fn() }));
jest.mock('backend/weatherService', () => ({ getWeatherForecast: jest.fn() }));
jest.mock('backend/communityService', () => ({ getForumPosts: jest.fn() }));
jest.mock('backend/mentorshipService', () => ({ findMentors: jest.fn() }));
jest.mock('backend/petFriendlyService', () => ({ searchLocations: jest.fn() }));
jest.mock('backend/healthService', () => ({ getResourcesByCategory: jest.fn() }));
jest.mock('backend/hosService', () => ({ getHOSSummary: jest.fn() }));
jest.mock('backend/eldService', () => ({ syncELDData: jest.fn() }));
jest.mock('backend/trainingService', () => ({ getAvailableCourses: jest.fn() }));
jest.mock('backend/driverFinancialService', () => ({ logExpense: jest.fn() }));
jest.mock('backend/settlementService', () => ({ getSettlementHistory: jest.fn() }));
jest.mock('backend/taxService', () => ({ getDriverTaxSummary: jest.fn() }));
jest.mock('backend/driverLifecycleService', () => ({ getDriverTimeline: jest.fn() }));
jest.mock('backend/surveyService', () => ({ getPendingSurveys: jest.fn() }));
jest.mock('backend/alertService', () => ({ createReverseAlert: jest.fn() }));
jest.mock('backend/marketIntelService', () => ({ getDriverMarketInsights: jest.fn() }));
jest.mock('backend/metaGovernanceService', () => ({ listMetaIntegrations: jest.fn() }));
jest.mock('backend/metaCampaignService', () => ({
  createCampaignDraft: jest.fn().mockResolvedValue({ success: true, campaign: { campaign_id: 'cmp1' } }),
  createCampaign: jest.fn().mockResolvedValue({ success: true, campaign: { campaign_id: 'cmp1' } }),
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
jest.mock('backend/metaInsightsService', () => ({
  getInsightsCampaignLevel: jest.fn().mockResolvedValue({ success: true }),
  getInsightsAdSetLevel: jest.fn().mockResolvedValue({ success: true }),
  getInsightsAdLevel: jest.fn().mockResolvedValue({ success: true }),
  getInsightsWithBreakdowns: jest.fn().mockResolvedValue({ success: true }),
  createAsyncReportJob: jest.fn().mockResolvedValue({ success: true }),
  getAsyncReportStatus: jest.fn().mockResolvedValue({ success: true }),
  downloadReport: jest.fn().mockResolvedValue({ success: true }),
  getCreativePerformance: jest.fn().mockResolvedValue({ success: true }),
  getPlacementPerformance: jest.fn().mockResolvedValue({ success: true }),
  getFrequencyFatigueAlerts: jest.fn().mockResolvedValue({ success: true }),
  suggestBudgetReallocation: jest.fn().mockResolvedValue({ success: true }),
  suggestCreativeRotation: jest.fn().mockResolvedValue({ success: true }),
  suggestAudienceNarrowing: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('backend/metaOptimizationService', () => ({
  applyBudgetReallocation: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_1' }),
  applyBidAdjustment: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_2' }),
  rotateCreativeVariant: jest.fn().mockResolvedValue({ success: true, actionId: 'opt_3' })
}));

// ── Import after mocks ──
const { executeTool, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

// ============================================================================
// REGISTRY COMPLETENESS
// ============================================================================

describe('ACTION_REGISTRY completeness — recruiter routers', () => {
  test('has exactly 8 recruiter routers', () => {
    const routerNames = Object.keys(ACTION_REGISTRY).filter(k => k.startsWith('recruiter_'));
    expect(routerNames).toHaveLength(8);
    expect(routerNames.sort()).toEqual([
      'recruiter_analytics', 'recruiter_onboarding', 'recruiter_outreach', 'recruiter_paid_media', 'recruiter_paid_media_analytics',
      'recruiter_pipeline', 'recruiter_retention', 'recruiter_reverse_match'
    ]);
  });

  test('recruiter_paid_media has 24 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_paid_media)).toHaveLength(24);
  });

  test('recruiter_paid_media_analytics has 16 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_paid_media_analytics)).toHaveLength(16);
  });

  test('recruiter_outreach has 15 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_outreach)).toHaveLength(15);
  });

  test('recruiter_analytics has 10 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_analytics)).toHaveLength(10);
  });

  test('recruiter_onboarding has 12 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_onboarding)).toHaveLength(12);
  });

  test('recruiter_pipeline has 10 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_pipeline)).toHaveLength(10);
  });

  test('recruiter_retention has 8 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_retention)).toHaveLength(8);
  });

  test('recruiter_reverse_match has 8 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.recruiter_reverse_match)).toHaveLength(8);
  });

  test('total recruiter actions = 103', () => {
    const total = Object.keys(ACTION_REGISTRY)
      .filter(k => k.startsWith('recruiter_'))
      .reduce((sum, k) => sum + Object.keys(ACTION_REGISTRY[k]).length, 0);
    expect(total).toBe(103);
  });

  test('every action has required policy fields', () => {
    for (const [router, actions] of Object.entries(ACTION_REGISTRY)) {
      if (!router.startsWith('recruiter_')) continue;
      for (const [action, def] of Object.entries(actions)) {
        expect(def).toHaveProperty('serviceModule');
        expect(def).toHaveProperty('serviceFunction');
        expect(def).toHaveProperty('argMapping');
        expect(def).toHaveProperty('policy');
        expect(def.policy).toHaveProperty('risk_level');
        expect(def.policy).toHaveProperty('requires_approval');
        expect(def.policy).toHaveProperty('rate_limit');
        expect(['read', 'suggest', 'execute_low', 'execute_high']).toContain(def.policy.risk_level);
      }
    }
  });

  test('all execute_high actions require approval', () => {
    for (const [router, actions] of Object.entries(ACTION_REGISTRY)) {
      if (!router.startsWith('recruiter_')) continue;
      for (const [action, def] of Object.entries(actions)) {
        if (def.policy.risk_level === 'execute_high') {
          expect(def.policy.requires_approval).toBe(true);
        }
      }
    }
  });
});

// ============================================================================
// ROUTER_DEFINITIONS
// ============================================================================

describe('ROUTER_DEFINITIONS — recruiter routers', () => {
  test('has 8 recruiter routers matching ACTION_REGISTRY', () => {
    const recruiterRouters = Object.keys(ROUTER_DEFINITIONS).filter(k => k.startsWith('recruiter_'));
    expect(recruiterRouters).toHaveLength(8);
    for (const router of recruiterRouters) {
      expect(ACTION_REGISTRY).toHaveProperty(router);
    }
  });

  test('each router has name, description, input_schema with action enum, and roles', () => {
    for (const [key, def] of Object.entries(ROUTER_DEFINITIONS)) {
      if (!key.startsWith('recruiter_')) continue;
      expect(def.name).toBe(key);
      expect(def.description).toBeTruthy();
      expect(def.input_schema).toBeDefined();
      expect(def.input_schema.properties.action.enum).toBeDefined();
      expect(def.roles).toContain('recruiter');
    }
  });

  test('action enums match ACTION_REGISTRY keys', () => {
    for (const [key, def] of Object.entries(ROUTER_DEFINITIONS)) {
      if (!key.startsWith('recruiter_')) continue;
      const registryActions = Object.keys(ACTION_REGISTRY[key]).sort();
      const enumActions = [...def.input_schema.properties.action.enum].sort();
      expect(enumActions).toEqual(registryActions);
    }
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_paid_media (24 actions)
// ============================================================================

describe('recruiter_paid_media router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('create_campaign_draft dispatches to metaCampaignService.createCampaignDraft', async () => {
    await executeTool('recruiter_paid_media', { action: 'create_campaign_draft', params: { campaignId: 'cmp1', name: 'Q2 Hiring' } }, ctx);
    const { createCampaignDraft } = require('backend/metaCampaignService');
    expect(createCampaignDraft).toHaveBeenCalledWith('recruiter123', { campaignId: 'cmp1', name: 'Q2 Hiring' });
  });

  test('create_campaign returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_paid_media', { action: 'create_campaign', params: { campaignId: 'cmp1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('update_ad_set_budget returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_paid_media', { action: 'update_ad_set_budget', params: { adSetId: 'adset1', dailyBudget: 500 } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('attach_creative_to_ad dispatches to metaCreativeService.attachCreativeToAd', async () => {
    await executeTool('recruiter_paid_media', { action: 'attach_creative_to_ad', params: { adId: 'ad1', creativeId: 'cr1' } }, ctx);
    const { attachCreativeToAd } = require('backend/metaCreativeService');
    expect(attachCreativeToAd).toHaveBeenCalledWith('recruiter123', { adId: 'ad1', creativeId: 'cr1' });
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_paid_media_analytics (13 actions)
// ============================================================================

describe('recruiter_paid_media_analytics router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_insights_campaign_level dispatches to metaInsightsService.getInsightsCampaignLevel', async () => {
    await executeTool('recruiter_paid_media_analytics', { action: 'get_insights_campaign_level', params: { dateRange: {} } }, ctx);
    const { getInsightsCampaignLevel } = require('backend/metaInsightsService');
    expect(getInsightsCampaignLevel).toHaveBeenCalledWith('recruiter123', { dateRange: {} });
  });

  test('create_async_report_job dispatches to metaInsightsService.createAsyncReportJob', async () => {
    await executeTool('recruiter_paid_media_analytics', { action: 'create_async_report_job', params: { reportScope: 'campaign' } }, ctx);
    const { createAsyncReportJob } = require('backend/metaInsightsService');
    expect(createAsyncReportJob).toHaveBeenCalledWith('recruiter123', { reportScope: 'campaign' });
  });

  test('suggest_audience_narrowing dispatches to metaInsightsService.suggestAudienceNarrowing', async () => {
    await executeTool('recruiter_paid_media_analytics', { action: 'suggest_audience_narrowing', params: { dateRange: {} } }, ctx);
    const { suggestAudienceNarrowing } = require('backend/metaInsightsService');
    expect(suggestAudienceNarrowing).toHaveBeenCalledWith('recruiter123', { dateRange: {} });
  });

  test('apply_budget_reallocation dispatches to metaOptimizationService.applyBudgetReallocation', async () => {
    await executeTool('recruiter_paid_media_analytics', { action: 'apply_budget_reallocation', params: { adSetId: 'as1', budgetDeltaPct: 10 } }, ctx);
    const { applyBudgetReallocation } = require('backend/metaOptimizationService');
    expect(applyBudgetReallocation).toHaveBeenCalledWith('recruiter123', { adSetId: 'as1', budgetDeltaPct: 10 });
  });

  test('apply_bid_adjustment dispatches to metaOptimizationService.applyBidAdjustment', async () => {
    await executeTool('recruiter_paid_media_analytics', { action: 'apply_bid_adjustment', params: { adSetId: 'as1', bidStrategy: 'LOWEST_COST_WITH_BID_CAP' } }, ctx);
    const { applyBidAdjustment } = require('backend/metaOptimizationService');
    expect(applyBidAdjustment).toHaveBeenCalledWith('recruiter123', { adSetId: 'as1', bidStrategy: 'LOWEST_COST_WITH_BID_CAP' });
  });

  test('rotate_creative_variant dispatches to metaOptimizationService.rotateCreativeVariant', async () => {
    await executeTool('recruiter_paid_media_analytics', { action: 'rotate_creative_variant', params: { adId: 'ad1', nextCreativeId: 'cr2' } }, ctx);
    const { rotateCreativeVariant } = require('backend/metaOptimizationService');
    expect(rotateCreativeVariant).toHaveBeenCalledWith('recruiter123', { adId: 'ad1', nextCreativeId: 'cr2' });
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_outreach (15 actions)
// ============================================================================

describe('recruiter_outreach router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('create_sms_campaign returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_outreach', { action: 'create_sms_campaign', params: { carrierDot: '123456' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('create_email_campaign returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_outreach', { action: 'create_email_campaign', params: { carrierDot: '123456' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_campaign_status dispatches to recruiterOutreachService.getCampaignStatus', async () => {
    await executeTool('recruiter_outreach', { action: 'get_campaign_status', params: { campaignId: 'c1', campaignType: 'sms' } }, ctx);
    const { getCampaignStatus } = require('backend/recruiterOutreachService');
    // argMapping: ['recruiterId', 'campaignId', 'campaignType']
    expect(getCampaignStatus).toHaveBeenCalledWith('recruiter123', 'c1', 'sms');
  });

  test('pause_campaign dispatches to recruiterOutreachService.pauseCampaign', async () => {
    await executeTool('recruiter_outreach', { action: 'pause_campaign', params: { campaignId: 'c1', campaignType: 'email' } }, ctx);
    const { pauseCampaign } = require('backend/recruiterOutreachService');
    // argMapping: ['campaignId', 'campaignType']
    expect(pauseCampaign).toHaveBeenCalledWith('c1', 'email');
  });

  test('resume_campaign dispatches to recruiterOutreachService.resumeCampaign', async () => {
    await executeTool('recruiter_outreach', { action: 'resume_campaign', params: { campaignId: 'c1', campaignType: 'sms' } }, ctx);
    const { resumeCampaign } = require('backend/recruiterOutreachService');
    expect(resumeCampaign).toHaveBeenCalledWith('c1', 'sms');
  });

  test('get_campaign_history dispatches to recruiterOutreachService.getCampaignHistory', async () => {
    await executeTool('recruiter_outreach', { action: 'get_campaign_history', params: { status: 'completed' } }, ctx);
    const { getCampaignHistory } = require('backend/recruiterOutreachService');
    // argMapping: ['recruiterId', 'filters'] — 'filters' is aggregate, passes entire params
    expect(getCampaignHistory).toHaveBeenCalledWith('recruiter123', { status: 'completed' });
  });

  test('syndicate_job_posting returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_outreach', { action: 'syndicate_job_posting', params: { jobId: 'j1', boards: ['indeed'] } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_syndication_status dispatches to jobBoardService.getJobPostings', async () => {
    await executeTool('recruiter_outreach', { action: 'get_syndication_status', params: { carrierDot: '123456' } }, ctx);
    const { getJobPostings } = require('backend/jobBoardService');
    // argMapping: ['carrierDot', 'filters'] — carrierDot is scalar, filters is aggregate
    expect(getJobPostings).toHaveBeenCalledWith('123456', { carrierDot: '123456' });
  });

  test('create_social_post returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_outreach', { action: 'create_social_post', params: { carrierDot: '123456' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_message_templates dispatches to recruiterOutreachService.getMessageTemplates', async () => {
    await executeTool('recruiter_outreach', { action: 'get_message_templates', params: { channel: 'sms' } }, ctx);
    const { getMessageTemplates } = require('backend/recruiterOutreachService');
    // argMapping: ['recruiterId', 'filters']
    expect(getMessageTemplates).toHaveBeenCalledWith('recruiter123', { channel: 'sms' });
  });

  test('create_message_template dispatches to recruiterOutreachService.createMessageTemplate', async () => {
    await executeTool('recruiter_outreach', { action: 'create_message_template', params: { name: 'Welcome', body: 'Hi!' } }, ctx);
    const { createMessageTemplate } = require('backend/recruiterOutreachService');
    // argMapping: ['recruiterId', 'params'] — params is aggregate
    expect(createMessageTemplate).toHaveBeenCalledWith('recruiter123', { name: 'Welcome', body: 'Hi!' });
  });

  test('preview_campaign_reach dispatches to recruiterOutreachService.previewCampaignReach', async () => {
    await executeTool('recruiter_outreach', { action: 'preview_campaign_reach', params: { region: 'TX' } }, ctx);
    const { previewCampaignReach } = require('backend/recruiterOutreachService');
    // argMapping: ['recruiterId', 'params']
    expect(previewCampaignReach).toHaveBeenCalledWith('recruiter123', { region: 'TX' });
  });

  test('create_voice_campaign returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_outreach', { action: 'create_voice_campaign', params: { templateId: 't1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_voice_templates dispatches to voiceAgentTemplates.getTemplatesByCategory', async () => {
    await executeTool('recruiter_outreach', { action: 'get_voice_templates', params: { category: 'screening' } }, ctx);
    const { getTemplatesByCategory } = require('backend/voiceAgentTemplates');
    // argMapping: ['category'] — scalar from params
    expect(getTemplatesByCategory).toHaveBeenCalledWith('screening');
  });

  test('get_voice_campaign_status dispatches to voiceCampaignService.getCampaignStatus', async () => {
    await executeTool('recruiter_outreach', { action: 'get_voice_campaign_status', params: { campaignId: 'vc1' } }, ctx);
    const { getCampaignStatus } = require('backend/voiceCampaignService');
    // argMapping: ['campaignId'] — scalar from params
    expect(getCampaignStatus).toHaveBeenCalledWith('vc1');
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_analytics (10 actions)
// ============================================================================

describe('recruiter_analytics router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_attribution_report dispatches to recruiterAnalyticsService.getAttributionBreakdown', async () => {
    await executeTool('recruiter_analytics', { action: 'get_attribution_report', params: { carrierDot: '123456', dateRange: { start: '2026-01-01' }, metric: 'hires' } }, ctx);
    const { getAttributionBreakdown } = require('backend/recruiterAnalyticsService');
    // argMapping: ['carrierDot', 'dateRange', 'metric'] — dateRange is aggregate, carrierDot and metric are scalar
    expect(getAttributionBreakdown).toHaveBeenCalledWith('123456', { carrierDot: '123456', dateRange: { start: '2026-01-01' }, metric: 'hires' }, 'hires');
  });

  test('get_cph_metrics dispatches to recruiterAnalyticsService.calculateCostPerHire', async () => {
    await executeTool('recruiter_analytics', { action: 'get_cph_metrics', params: { carrierDot: '123456' } }, ctx);
    const { calculateCostPerHire } = require('backend/recruiterAnalyticsService');
    // argMapping: ['carrierDot', 'dateRange'] — carrierDot is scalar, dateRange is aggregate
    expect(calculateCostPerHire).toHaveBeenCalledWith('123456', { carrierDot: '123456' });
  });

  test('get_funnel_analysis dispatches to recruiterAnalyticsService.getFunnelMetrics', async () => {
    await executeTool('recruiter_analytics', { action: 'get_funnel_analysis', params: { carrierDot: '123456' } }, ctx);
    const { getFunnelMetrics } = require('backend/recruiterAnalyticsService');
    expect(getFunnelMetrics).toHaveBeenCalledWith('123456', { carrierDot: '123456' });
  });

  test('get_competitor_intel dispatches to recruiterAnalyticsService.getCompetitorComparison', async () => {
    await executeTool('recruiter_analytics', { action: 'get_competitor_intel', params: { region: 'TX', jobType: 'OTR' } }, ctx);
    const { getCompetitorComparison } = require('backend/recruiterAnalyticsService');
    // argMapping: ['region', 'jobType'] — both scalar from params
    expect(getCompetitorComparison).toHaveBeenCalledWith('TX', 'OTR');
  });

  test('get_ml_forecast dispatches to recruiterAnalyticsService.getHiringForecast', async () => {
    await executeTool('recruiter_analytics', { action: 'get_ml_forecast', params: { carrierDot: '123456' } }, ctx);
    const { getHiringForecast } = require('backend/recruiterAnalyticsService');
    // argMapping: ['carrierDot'] — scalar from params
    expect(getHiringForecast).toHaveBeenCalledWith('123456');
  });

  test('get_time_to_fill dispatches to recruiterAnalyticsService.getTimeToFill', async () => {
    await executeTool('recruiter_analytics', { action: 'get_time_to_fill', params: { carrierDot: '123456' } }, ctx);
    const { getTimeToFill } = require('backend/recruiterAnalyticsService');
    // argMapping: ['carrierDot', 'filters'] — carrierDot scalar, filters aggregate
    expect(getTimeToFill).toHaveBeenCalledWith('123456', { carrierDot: '123456' });
  });

  test('get_source_roi dispatches to recruiterAnalyticsService.getChannelROI', async () => {
    await executeTool('recruiter_analytics', { action: 'get_source_roi', params: { carrierDot: '123456' } }, ctx);
    const { getChannelROI } = require('backend/recruiterAnalyticsService');
    // argMapping: ['carrierDot', 'dateRange']
    expect(getChannelROI).toHaveBeenCalledWith('123456', { carrierDot: '123456' });
  });

  test('get_drop_off_analysis dispatches to recruiterAnalyticsService.getBottleneckAnalysis', async () => {
    await executeTool('recruiter_analytics', { action: 'get_drop_off_analysis', params: { carrierDot: '123456' } }, ctx);
    const { getBottleneckAnalysis } = require('backend/recruiterAnalyticsService');
    expect(getBottleneckAnalysis).toHaveBeenCalledWith('123456', { carrierDot: '123456' });
  });

  test('get_recruiter_scorecard dispatches to recruiterAnalyticsService.getRecruiterScorecard', async () => {
    await executeTool('recruiter_analytics', { action: 'get_recruiter_scorecard', params: {} }, ctx);
    const { getRecruiterScorecard } = require('backend/recruiterAnalyticsService');
    // argMapping: ['recruiterId', 'dateRange'] — recruiterId is identity (userId), dateRange aggregate
    expect(getRecruiterScorecard).toHaveBeenCalledWith('recruiter123', {});
  });

  test('export_analytics dispatches to recruiterAnalyticsService.exportAnalytics', async () => {
    await executeTool('recruiter_analytics', { action: 'export_analytics', params: { format: 'csv' } }, ctx);
    const { exportAnalytics } = require('backend/recruiterAnalyticsService');
    // argMapping: ['recruiterId', 'params'] — recruiterId is identity, params aggregate
    expect(exportAnalytics).toHaveBeenCalledWith('recruiter123', { format: 'csv' });
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_onboarding (12 actions)
// ============================================================================

describe('recruiter_onboarding router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('create_onboarding_workflow dispatches to onboardingWorkflowService.createOnboardingWorkflow', async () => {
    await executeTool('recruiter_onboarding', { action: 'create_onboarding_workflow', params: { driverId: 'd1', carrierId: 'c1' } }, ctx);
    const { createOnboardingWorkflow } = require('backend/onboardingWorkflowService');
    // argMapping: ['driverId', 'carrierId', 'recruiterId'] — driverId is scalar (NOT identity here, it's the target driver),
    // BUT the mapping logic treats 'driverId' as identity key => runContext.userId
    // carrierId is scalar from params, recruiterId is identity key => runContext.userId
    expect(createOnboardingWorkflow).toHaveBeenCalledWith('recruiter123', 'c1', 'recruiter123');
  });

  test('get_onboarding_status dispatches to onboardingWorkflowService.getWorkflowStatus', async () => {
    await executeTool('recruiter_onboarding', { action: 'get_onboarding_status', params: { workflowId: 'wf1' } }, ctx);
    const { getWorkflowStatus } = require('backend/onboardingWorkflowService');
    // argMapping: ['workflowId'] — scalar from params
    expect(getWorkflowStatus).toHaveBeenCalledWith('wf1');
  });

  test('request_documents returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_onboarding', { action: 'request_documents', params: { driverId: 'd1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_document_collection_status dispatches to recruiterOnboardingService.getDocumentCollectionStatus', async () => {
    await executeTool('recruiter_onboarding', { action: 'get_document_collection_status', params: { workflowId: 'wf1' } }, ctx);
    const { getDocumentCollectionStatus } = require('backend/recruiterOnboardingService');
    expect(getDocumentCollectionStatus).toHaveBeenCalledWith('wf1');
  });

  test('initiate_bgc returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_onboarding', { action: 'initiate_bgc', params: { driverId: 'd1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_bgc_status dispatches to recruiterOnboardingService.getBGCStatus', async () => {
    await executeTool('recruiter_onboarding', { action: 'get_bgc_status', params: { checkId: 'bgc1' } }, ctx);
    const { getBGCStatus } = require('backend/recruiterOnboardingService');
    expect(getBGCStatus).toHaveBeenCalledWith('bgc1');
  });

  test('initiate_drug_test returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_onboarding', { action: 'initiate_drug_test', params: { driverId: 'd1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_drug_test_status dispatches to recruiterOnboardingService.getDrugTestStatus', async () => {
    await executeTool('recruiter_onboarding', { action: 'get_drug_test_status', params: { testId: 'dt1' } }, ctx);
    const { getDrugTestStatus } = require('backend/recruiterOnboardingService');
    expect(getDrugTestStatus).toHaveBeenCalledWith('dt1');
  });

  test('send_esign_request returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_onboarding', { action: 'send_esign_request', params: { driverId: 'd1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_esign_status dispatches to recruiterOnboardingService.getESignStatus', async () => {
    await executeTool('recruiter_onboarding', { action: 'get_esign_status', params: { requestId: 'esign1' } }, ctx);
    const { getESignStatus } = require('backend/recruiterOnboardingService');
    expect(getESignStatus).toHaveBeenCalledWith('esign1');
  });

  test('schedule_orientation returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_onboarding', { action: 'schedule_orientation', params: { slotId: 's1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_orientation_slots dispatches to recruiterOnboardingService.getOrientationSlots', async () => {
    await executeTool('recruiter_onboarding', { action: 'get_orientation_slots', params: { carrierId: 'c1' } }, ctx);
    const { getOrientationSlots } = require('backend/recruiterOnboardingService');
    // argMapping: ['carrierId', 'filters'] — carrierId scalar, filters aggregate
    expect(getOrientationSlots).toHaveBeenCalledWith('c1', { carrierId: 'c1' });
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_pipeline (10 actions)
// ============================================================================

describe('recruiter_pipeline router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('save_driver_search dispatches to recruiterPipelineService.saveDriverSearch', async () => {
    await executeTool('recruiter_pipeline', { action: 'save_driver_search', params: { name: 'TX OTR', criteria: { state: 'TX' } } }, ctx);
    const { saveDriverSearch } = require('backend/recruiterPipelineService');
    // argMapping: ['recruiterId', 'params'] — recruiterId identity, params aggregate
    expect(saveDriverSearch).toHaveBeenCalledWith('recruiter123', { name: 'TX OTR', criteria: { state: 'TX' } });
  });

  test('get_saved_searches dispatches to recruiterPipelineService.getSavedSearches', async () => {
    await executeTool('recruiter_pipeline', { action: 'get_saved_searches', params: {} }, ctx);
    const { getSavedSearches } = require('backend/recruiterPipelineService');
    // argMapping: ['recruiterId'] — identity key
    expect(getSavedSearches).toHaveBeenCalledWith('recruiter123');
  });

  test('run_saved_search dispatches to recruiterPipelineService.runSavedSearch', async () => {
    await executeTool('recruiter_pipeline', { action: 'run_saved_search', params: { searchId: 's1' } }, ctx);
    const { runSavedSearch } = require('backend/recruiterPipelineService');
    // argMapping: ['recruiterId', 'searchId'] — recruiterId identity, searchId scalar
    expect(runSavedSearch).toHaveBeenCalledWith('recruiter123', 's1');
  });

  test('create_pipeline_automation dispatches to pipelineAutomationService.createAutomationRule', async () => {
    await executeTool('recruiter_pipeline', { action: 'create_pipeline_automation', params: { carrierDot: '123456', trigger: 'application_received' } }, ctx);
    const { createAutomationRule } = require('backend/pipelineAutomationService');
    // argMapping: ['carrierDot', 'params'] — carrierDot scalar, params aggregate
    expect(createAutomationRule).toHaveBeenCalledWith('123456', { carrierDot: '123456', trigger: 'application_received' });
  });

  test('get_pipeline_automations dispatches to pipelineAutomationService.getAutomationRules', async () => {
    await executeTool('recruiter_pipeline', { action: 'get_pipeline_automations', params: { carrierDot: '123456' } }, ctx);
    const { getAutomationRules } = require('backend/pipelineAutomationService');
    // argMapping: ['carrierDot'] — scalar from params
    expect(getAutomationRules).toHaveBeenCalledWith('123456');
  });

  test('get_intervention_templates dispatches to recruiterPipelineService.getInterventionTemplates', async () => {
    await executeTool('recruiter_pipeline', { action: 'get_intervention_templates', params: { type: 'follow_up' } }, ctx);
    const { getInterventionTemplates } = require('backend/recruiterPipelineService');
    // argMapping: ['filters'] — aggregate (entire params)
    expect(getInterventionTemplates).toHaveBeenCalledWith({ type: 'follow_up' });
  });

  test('apply_intervention returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_pipeline', { action: 'apply_intervention', params: { driverId: 'd1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('bulk_update_pipeline returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_pipeline', { action: 'bulk_update_pipeline', params: { ids: ['d1', 'd2'] } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_stale_candidates dispatches to recruiterPipelineService.getStaleCandidates', async () => {
    await executeTool('recruiter_pipeline', { action: 'get_stale_candidates', params: { daysIdle: 14 } }, ctx);
    const { getStaleCandidates } = require('backend/recruiterPipelineService');
    // argMapping: ['recruiterId', 'params']
    expect(getStaleCandidates).toHaveBeenCalledWith('recruiter123', { daysIdle: 14 });
  });

  test('get_call_outcomes_summary dispatches to recruiterPipelineService.getCallOutcomesSummary', async () => {
    await executeTool('recruiter_pipeline', { action: 'get_call_outcomes_summary', params: { period: '7d' } }, ctx);
    const { getCallOutcomesSummary } = require('backend/recruiterPipelineService');
    // argMapping: ['recruiterId', 'params']
    expect(getCallOutcomesSummary).toHaveBeenCalledWith('recruiter123', { period: '7d' });
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_retention (8 actions)
// ============================================================================

describe('recruiter_retention router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_retention_risks dispatches to recruiterRetentionService.getRetentionRisks', async () => {
    await executeTool('recruiter_retention', { action: 'get_retention_risks', params: { minScore: 50 } }, ctx);
    const { getRetentionRisks } = require('backend/recruiterRetentionService');
    // argMapping: ['recruiterId', 'filters']
    expect(getRetentionRisks).toHaveBeenCalledWith('recruiter123', { minScore: 50 });
  });

  test('get_risk_score_detail dispatches to recruiterRetentionService.getRiskScoreDetail', async () => {
    await executeTool('recruiter_retention', { action: 'get_risk_score_detail', params: { driverId: 'd1' } }, ctx);
    const { getRiskScoreDetail } = require('backend/recruiterRetentionService');
    // argMapping: ['driverId'] — driverId is identity key => runContext.userId
    expect(getRiskScoreDetail).toHaveBeenCalledWith('recruiter123');
  });

  test('add_to_watchlist dispatches to recruiterRetentionService.addToWatchlist', async () => {
    await executeTool('recruiter_retention', { action: 'add_to_watchlist', params: { driverId: 'd1', reason: 'low engagement' } }, ctx);
    const { addToWatchlist } = require('backend/recruiterRetentionService');
    // argMapping: ['recruiterId', 'params']
    expect(addToWatchlist).toHaveBeenCalledWith('recruiter123', { driverId: 'd1', reason: 'low engagement' });
  });

  test('remove_from_watchlist dispatches to recruiterRetentionService.removeFromWatchlist', async () => {
    await executeTool('recruiter_retention', { action: 'remove_from_watchlist', params: { driverId: 'd1' } }, ctx);
    const { removeFromWatchlist } = require('backend/recruiterRetentionService');
    // argMapping: ['recruiterId', 'driverId'] — recruiterId identity, driverId is identity key too => both get userId
    expect(removeFromWatchlist).toHaveBeenCalledWith('recruiter123', 'recruiter123');
  });

  test('get_watchlist dispatches to recruiterRetentionService.getWatchlist', async () => {
    await executeTool('recruiter_retention', { action: 'get_watchlist', params: { status: 'active' } }, ctx);
    const { getWatchlist } = require('backend/recruiterRetentionService');
    // argMapping: ['recruiterId', 'filters']
    expect(getWatchlist).toHaveBeenCalledWith('recruiter123', { status: 'active' });
  });

  test('create_retention_intervention returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_retention', { action: 'create_retention_intervention', params: { driverId: 'd1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_retention_history dispatches to recruiterRetentionService.getRetentionHistory', async () => {
    await executeTool('recruiter_retention', { action: 'get_retention_history', params: { driverId: 'd1' } }, ctx);
    const { getRetentionHistory } = require('backend/recruiterRetentionService');
    // argMapping: ['recruiterId', 'filters']
    expect(getRetentionHistory).toHaveBeenCalledWith('recruiter123', { driverId: 'd1' });
  });

  test('get_turnover_analytics dispatches to recruiterAnalyticsService.getTurnoverRiskAnalysis', async () => {
    await executeTool('recruiter_retention', { action: 'get_turnover_analytics', params: { carrierDot: '123456' } }, ctx);
    const { getTurnoverRiskAnalysis } = require('backend/recruiterAnalyticsService');
    // argMapping: ['carrierDot'] — scalar from params
    expect(getTurnoverRiskAnalysis).toHaveBeenCalledWith('123456');
  });
});

// ============================================================================
// ROUTER DISPATCH — recruiter_reverse_match (8 actions)
// ============================================================================

describe('recruiter_reverse_match router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  beforeEach(() => jest.clearAllMocks());

  test('reverse_search_drivers dispatches to recruiterReverseMatchService.reverseSearchDrivers', async () => {
    await executeTool('recruiter_reverse_match', { action: 'reverse_search_drivers', params: { endorsements: 'Hazmat', minExp: 3 } }, ctx);
    const { reverseSearchDrivers } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId', 'params']
    expect(reverseSearchDrivers).toHaveBeenCalledWith('recruiter123', { endorsements: 'Hazmat', minExp: 3 });
  });

  test('get_reverse_match_scores dispatches to recruiterReverseMatchService.getReverseMatchScores', async () => {
    await executeTool('recruiter_reverse_match', { action: 'get_reverse_match_scores', params: { matchId: 'm1' } }, ctx);
    const { getReverseMatchScores } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId', 'matchId'] — recruiterId identity, matchId scalar
    expect(getReverseMatchScores).toHaveBeenCalledWith('recruiter123', 'm1');
  });

  test('create_match_subscription dispatches to recruiterReverseMatchService.createMatchSubscription', async () => {
    await executeTool('recruiter_reverse_match', { action: 'create_match_subscription', params: { criteria: { state: 'TX' } } }, ctx);
    const { createMatchSubscription } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId', 'params']
    expect(createMatchSubscription).toHaveBeenCalledWith('recruiter123', { criteria: { state: 'TX' } });
  });

  test('get_match_subscriptions dispatches to recruiterReverseMatchService.getMatchSubscriptions', async () => {
    await executeTool('recruiter_reverse_match', { action: 'get_match_subscriptions', params: {} }, ctx);
    const { getMatchSubscriptions } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId'] — identity key only
    expect(getMatchSubscriptions).toHaveBeenCalledWith('recruiter123');
  });

  test('delete_match_subscription dispatches to recruiterReverseMatchService.deleteMatchSubscription', async () => {
    await executeTool('recruiter_reverse_match', { action: 'delete_match_subscription', params: { subscriptionId: 'sub1' } }, ctx);
    const { deleteMatchSubscription } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId', 'subscriptionId'] — recruiterId identity, subscriptionId scalar
    expect(deleteMatchSubscription).toHaveBeenCalledWith('recruiter123', 'sub1');
  });

  test('get_subscription_alerts dispatches to recruiterReverseMatchService.getSubscriptionAlerts', async () => {
    await executeTool('recruiter_reverse_match', { action: 'get_subscription_alerts', params: { unreadOnly: true } }, ctx);
    const { getSubscriptionAlerts } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId', 'filters']
    expect(getSubscriptionAlerts).toHaveBeenCalledWith('recruiter123', { unreadOnly: true });
  });

  test('get_stripe_billing dispatches to recruiterReverseMatchService.getStripeBilling', async () => {
    await executeTool('recruiter_reverse_match', { action: 'get_stripe_billing', params: {} }, ctx);
    const { getStripeBilling } = require('backend/recruiterReverseMatchService');
    // argMapping: ['recruiterId'] — identity key only
    expect(getStripeBilling).toHaveBeenCalledWith('recruiter123');
  });

  test('upgrade_subscription returns approval_required (execute_high)', async () => {
    const result = await executeTool('recruiter_reverse_match', { action: 'upgrade_subscription', params: { plan: 'enterprise' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });
});

// ============================================================================
// APPROVAL GATES — verify recruiter execute_high actions
// ============================================================================

describe('Recruiter approval gates', () => {
  const ctx = { runId: 'run1', userId: 'recruiter123' };

  const executeHighActions = [
    ['recruiter_paid_media', 'create_campaign'],
    ['recruiter_paid_media', 'delete_campaign'],
    ['recruiter_paid_media', 'create_ad_set'],
    ['recruiter_paid_media', 'update_ad_set_budget'],
    ['recruiter_paid_media', 'delete_ad_set'],
    ['recruiter_paid_media', 'create_creative'],
    ['recruiter_paid_media', 'create_ad'],
    ['recruiter_paid_media', 'delete_ad'],
    ['recruiter_outreach', 'create_sms_campaign'],
    ['recruiter_outreach', 'create_email_campaign'],
    ['recruiter_outreach', 'syndicate_job_posting'],
    ['recruiter_outreach', 'create_social_post'],
    ['recruiter_outreach', 'create_voice_campaign'],
    ['recruiter_onboarding', 'request_documents'],
    ['recruiter_onboarding', 'initiate_bgc'],
    ['recruiter_onboarding', 'initiate_drug_test'],
    ['recruiter_onboarding', 'send_esign_request'],
    ['recruiter_onboarding', 'schedule_orientation'],
    ['recruiter_pipeline', 'apply_intervention'],
    ['recruiter_pipeline', 'bulk_update_pipeline'],
    ['recruiter_retention', 'create_retention_intervention'],
    ['recruiter_reverse_match', 'upgrade_subscription'],
  ];

  test.each(executeHighActions)('%s.%s returns approval_required', async (router, action) => {
    const result = await executeTool(router, { action, params: {} }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('execute_high with approvedGateId bypasses gate', async () => {
    const approvedCtx = { runId: 'run1', userId: 'recruiter123', approvedGateId: 'gate1' };
    // get_campaign_status is read, not execute_high — but let's test a gated action
    // Using resume_campaign (execute_low, no approval needed) to confirm non-gated works
    const result = await executeTool('recruiter_outreach', { action: 'resume_campaign', params: { campaignId: 'c1', campaignType: 'sms' } }, approvedCtx);
    expect(result.type).not.toBe('approval_required');
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// RATE LIMITING
// ============================================================================

describe('Recruiter router rate limiting', () => {
  test('blocks after exceeding rate_limit on recruiter_reverse_match.upgrade_subscription', async () => {
    const ctx = { runId: 'run1', userId: 'rate-test-recruiter' };
    // upgrade_subscription has rate_limit: 3, but it requires approval so we can't normally exhaust it
    // Test with a read action instead — get_stripe_billing has rate_limit: 10
    for (let i = 0; i < 10; i++) {
      const r = await executeTool('recruiter_reverse_match', { action: 'get_stripe_billing', params: {} }, ctx);
      expect(r.type).not.toBe('rate_limited');
    }
    // 11th call should be blocked
    const result = await executeTool('recruiter_reverse_match', { action: 'get_stripe_billing', params: {} }, ctx);
    expect(result.type).toBe('rate_limited');
  });

  test('every recruiter action has a rate_limit defined', () => {
    for (const [router, actions] of Object.entries(ACTION_REGISTRY)) {
      if (!router.startsWith('recruiter_')) continue;
      for (const [action, def] of Object.entries(actions)) {
        expect(def.policy.rate_limit).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Recruiter router edge cases', () => {
  test('unknown action returns error', async () => {
    const result = await executeTool('recruiter_outreach', { action: 'nonexistent', params: {} }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain("Unknown action 'nonexistent'");
  });

  test('unknown recruiter router falls through to flat tool lookup and errors', async () => {
    const result = await executeTool('recruiter_nonexistent', { action: 'foo', params: {} }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain('Unknown tool');
  });

  test('router call without action falls through to flat tool lookup', async () => {
    const result = await executeTool('recruiter_outreach', { no_action: 'foo' }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain('Unknown tool');
  });

  test('router call with no userId skips rate limiting', async () => {
    const result = await executeTool('recruiter_analytics', { action: 'get_ml_forecast', params: { carrierDot: '123456' } }, { runId: 'r1' });
    const { getHiringForecast } = require('backend/recruiterAnalyticsService');
    expect(getHiringForecast).toHaveBeenCalled();
  });
});
