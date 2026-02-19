/**
 * Driver Router Integration Tests
 * Verifies all 7 driver domain routers dispatch correctly through ACTION_REGISTRY.
 * Tests: registry completeness, router dispatch, arg mapping, approval gates, rate limiting.
 */

// ── Mock all Phase 1 service modules ──
jest.mock('backend/driverCockpitService', () => ({
  searchJobs: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getJobDetails: jest.fn().mockResolvedValue({ job: { id: 'job1' } }),
  submitApplication: jest.fn().mockResolvedValue({ success: true, applicationId: 'app1' }),
  withdrawApplication: jest.fn().mockResolvedValue({ success: true }),
  getApplicationStatus: jest.fn().mockResolvedValue({ status: 'submitted' }),
  getApplicationHistory: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  saveJob: jest.fn().mockResolvedValue({ success: true }),
  getSavedJobs: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getDashboardSummary: jest.fn().mockResolvedValue({ unread: 0, active_apps: 0 }),
  getDriverNotifications: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  sendQuickResponse: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/messagingService', () => ({
  sendDriverMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'msg1' }),
  getConversationMessages: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getConversation: jest.fn().mockResolvedValue({ conversationId: 'conv1' }),
  markConversationRead: jest.fn().mockResolvedValue({ success: true }),
  getDriverUnreadCount: jest.fn().mockResolvedValue({ count: 0 })
}));

jest.mock('backend/driverProfileService', () => ({
  updateDriverProfile: jest.fn().mockResolvedValue({ success: true }),
  getProfileStrength: jest.fn().mockResolvedValue({ score: 72, missingFields: [] }),
  getProfileSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
  getProfileStrengthScore: jest.fn().mockResolvedValue({ score: 72 })
}));

jest.mock('backend/documentService', () => ({
  recordDriverDocumentUpload: jest.fn().mockResolvedValue({ success: true }),
  uploadComplianceDoc: jest.fn().mockResolvedValue({ success: true }),
  getDriverComplianceDocs: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  checkDocumentExpiry: jest.fn().mockResolvedValue({ days_until_expiry: 45 }),
  getExpiringDocuments: jest.fn().mockResolvedValue({ items: [], totalCount: 0 })
}));

jest.mock('backend/matchingService', () => ({
  getDriverMatches: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getMatchDetails: jest.fn().mockResolvedValue({ matchId: 'm1', score: 85 }),
  expressDriverInterest: jest.fn().mockResolvedValue({ success: true }),
  dismissMatch: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/parkingService', () => ({
  findTruckParking: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getParkingDetails: jest.fn().mockResolvedValue({ locationId: 'loc1' }),
  reportParkingAvailability: jest.fn().mockResolvedValue({ success: true }),
  saveFavoriteParking: jest.fn().mockResolvedValue({ success: true }),
  searchParking: jest.fn().mockResolvedValue({ items: [] })
}));

jest.mock('backend/fuelService', () => ({
  findDieselPrices: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getFuelPriceTrends: jest.fn().mockResolvedValue({ trends: [] }),
  calculateTripFuelCost: jest.fn().mockResolvedValue({ estimated_cost: 450 })
}));

jest.mock('backend/roadUtilitiesService', () => ({
  getWeighStationStatus: jest.fn().mockResolvedValue({ status: 'open' }),
  getWeighStationsOnRoute: jest.fn().mockResolvedValue({ items: [] }),
  findRestStops: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  rateRestStop: jest.fn().mockResolvedValue({ success: true }),
  reportRoadHazard: jest.fn().mockResolvedValue({ success: true, reportId: 'hz1' })
}));

jest.mock('backend/weatherService', () => ({
  getWeatherForecast: jest.fn().mockResolvedValue({ forecast: [] }),
  getWeatherAlerts: jest.fn().mockResolvedValue({ alerts: [] }),
  getRoadConditions: jest.fn().mockResolvedValue({ conditions: [] })
}));

jest.mock('backend/communityService', () => ({
  getForumPosts: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  createForumPost: jest.fn().mockResolvedValue({ success: true, postId: 'p1' }),
  replyToPost: jest.fn().mockResolvedValue({ success: true }),
  toggleLike: jest.fn().mockResolvedValue({ success: true }),
  reportContent: jest.fn().mockResolvedValue({ success: true }),
  searchForums: jest.fn().mockResolvedValue({ items: [], totalCount: 0 })
}));

jest.mock('backend/mentorshipService', () => ({
  findMentors: jest.fn().mockResolvedValue({ items: [] }),
  requestMentorship: jest.fn().mockResolvedValue({ success: true }),
  getDriverMentorshipStatus: jest.fn().mockResolvedValue({ connections: [] }),
  rateMentor: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/petFriendlyService', () => ({
  searchLocations: jest.fn().mockResolvedValue({ items: [] }),
  submitLocation: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/healthService', () => ({
  getResourcesByCategory: jest.fn().mockResolvedValue({ items: [] }),
  submitTip: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/hosService', () => ({
  getHOSSummary: jest.fn().mockResolvedValue({ driving: 0, on_duty: 0, off_duty: 0, sleeper: 0 }),
  logHOSEntry: jest.fn().mockResolvedValue({ success: true }),
  getHOSViolations: jest.fn().mockResolvedValue({ items: [], totalCount: 0 })
}));

jest.mock('backend/eldService', () => ({
  syncELDData: jest.fn().mockResolvedValue({ success: true, records_synced: 24 })
}));

jest.mock('backend/trainingService', () => ({
  getAvailableCourses: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  enrollInCourse: jest.fn().mockResolvedValue({ success: true }),
  getTrainingProgress: jest.fn().mockResolvedValue({ items: [] }),
  getDriverCertifications: jest.fn().mockResolvedValue({ items: [] })
}));

jest.mock('backend/driverFinancialService', () => ({
  logExpense: jest.fn().mockResolvedValue({ success: true, expenseId: 'exp1' }),
  getExpenses: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getExpenseSummary: jest.fn().mockResolvedValue({ total: 0, categories: {} }),
  exportExpenses: jest.fn().mockResolvedValue({ data: '', format: 'csv' }),
  calculateTripCost: jest.fn().mockResolvedValue({ estimated_total: 1200 })
}));

jest.mock('backend/settlementService', () => ({
  getSettlementHistory: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  disputeSettlement: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/taxService', () => ({
  getDriverTaxSummary: jest.fn().mockResolvedValue({ total_income: 0 }),
  getDeductionSuggestions: jest.fn().mockResolvedValue({ suggestions: [] }),
  getPerDiemRates: jest.fn().mockResolvedValue({ rate: 69 })
}));

jest.mock('backend/driverLifecycleService', () => ({
  getDriverTimeline: jest.fn().mockResolvedValue({ events: [] }),
  updateDisposition: jest.fn().mockResolvedValue({ success: true }),
  submitMatchFeedback: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/surveyService', () => ({
  getPendingSurveys: jest.fn().mockResolvedValue({ items: [] }),
  submitSurveyResponse: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/alertService', () => ({
  createReverseAlert: jest.fn().mockResolvedValue({ success: true, alertId: 'al1' })
}));

jest.mock('backend/marketIntelService', () => ({
  getDriverMarketInsights: jest.fn().mockResolvedValue({ insights: [] })
}));

// Mock shared dependencies
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
jest.mock('backend/recruiterAnalyticsService', () => ({ getFunnelMetrics: jest.fn() }));
jest.mock('backend/observabilityService', () => ({ getMetrics: jest.fn() }));
jest.mock('backend/admin_service', () => ({ getDrivers: jest.fn() }));
jest.mock('backend/admin_dashboard_service', () => ({ getDashboardStats: jest.fn() }));
jest.mock('backend/autopilotService', () => ({ startAutopilot: jest.fn(), getAutopilotStatus: jest.fn() }));
jest.mock('backend/driverProfiles', () => ({ getDriverStats: jest.fn() }));
jest.mock('backend/selfHealingService', () => ({ triageIssue: jest.fn(), executeRemediation: jest.fn() }));
jest.mock('backend/compendiumService', () => ({ triggerKnowledgeCurator: jest.fn() }));
jest.mock('backend/voiceService', () => ({ createAssistant: jest.fn(), initiateOutboundCall: jest.fn() }));
jest.mock('backend/voiceAgentTemplates', () => ({ createAssistantFromTemplate: jest.fn() }));
jest.mock('backend/utils/tcpaGuard', () => ({ isTCPACompliant: jest.fn().mockReturnValue(true) }));
jest.mock('backend/pipelineEventBus', () => ({ emitEvent: jest.fn() }));
jest.mock('backend/pipelineExecutionAgent', () => ({ getPipelineHealth: jest.fn() }));

// ── Import after mocks ──
const { executeTool, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

// ============================================================================
// REGISTRY COMPLETENESS
// ============================================================================

describe('ACTION_REGISTRY completeness', () => {
  test('has exactly 7 driver routers', () => {
    const routerNames = Object.keys(ACTION_REGISTRY).filter(k => k.startsWith('driver_'));
    expect(routerNames).toHaveLength(7);
    expect(routerNames.sort()).toEqual([
      'driver_cockpit', 'driver_community', 'driver_compliance',
      'driver_financial', 'driver_lifecycle', 'driver_road', 'driver_utility'
    ]);
  });

  test('driver_cockpit has 23 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_cockpit)).toHaveLength(23);
  });

  test('driver_road has 15 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_road)).toHaveLength(15);
  });

  test('driver_community has 14 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_community)).toHaveLength(14);
  });

  test('driver_compliance has 12 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_compliance)).toHaveLength(12);
  });

  test('driver_financial has 10 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_financial)).toHaveLength(10);
  });

  test('driver_lifecycle has 5 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_lifecycle)).toHaveLength(5);
  });

  test('driver_utility has 4 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.driver_utility)).toHaveLength(4);
  });

  test('total driver actions = 83', () => {
    const total = Object.keys(ACTION_REGISTRY)
      .filter(k => k.startsWith('driver_'))
      .reduce((sum, k) => sum + Object.keys(ACTION_REGISTRY[k]).length, 0);
    expect(total).toBe(83);
  });

  test('every action has required policy fields', () => {
    for (const [router, actions] of Object.entries(ACTION_REGISTRY)) {
      if (!router.startsWith('driver_')) continue;
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
      if (!router.startsWith('driver_')) continue;
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

describe('ROUTER_DEFINITIONS', () => {
  test('has 7 driver routers matching ACTION_REGISTRY', () => {
    const driverRouters = Object.keys(ROUTER_DEFINITIONS).filter(k => k.startsWith('driver_'));
    expect(driverRouters).toHaveLength(7);
    for (const router of driverRouters) {
      expect(ACTION_REGISTRY).toHaveProperty(router);
    }
  });

  test('each router has name, description, input_schema with action enum, and roles', () => {
    for (const [key, def] of Object.entries(ROUTER_DEFINITIONS)) {
      if (!key.startsWith('driver_')) continue;
      expect(def.name).toBe(key);
      expect(def.description).toBeTruthy();
      expect(def.input_schema).toBeDefined();
      expect(def.input_schema.properties.action.enum).toBeDefined();
      expect(def.roles).toContain('driver');
    }
  });

  test('action enums match ACTION_REGISTRY keys', () => {
    for (const [key, def] of Object.entries(ROUTER_DEFINITIONS)) {
      if (!key.startsWith('driver_')) continue;
      const registryActions = Object.keys(ACTION_REGISTRY[key]).sort();
      const enumActions = [...def.input_schema.properties.action.enum].sort();
      expect(enumActions).toEqual(registryActions);
    }
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_cockpit
// ============================================================================

describe('driver_cockpit router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('search_jobs dispatches to driverCockpitService.searchJobs', async () => {
    const result = await executeTool('driver_cockpit', { action: 'search_jobs', params: { state: 'TX' } }, ctx);
    const { searchJobs } = require('backend/driverCockpitService');
    expect(searchJobs).toHaveBeenCalledWith('driver123', { state: 'TX' }, { state: 'TX' });
    expect(result).toEqual({ items: [], totalCount: 0 });
  });

  test('get_job_details dispatches to driverCockpitService.getJobDetails', async () => {
    await executeTool('driver_cockpit', { action: 'get_job_details', params: { jobId: 'j1' } }, ctx);
    const { getJobDetails } = require('backend/driverCockpitService');
    expect(getJobDetails).toHaveBeenCalledWith('j1', 'driver123');
  });

  test('quick_apply returns approval_required (execute_high)', async () => {
    const result = await executeTool('driver_cockpit', { action: 'quick_apply', params: { jobId: 'j1' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('save_job dispatches to driverCockpitService.saveJob', async () => {
    await executeTool('driver_cockpit', { action: 'save_job', params: { jobId: 'j1' } }, ctx);
    const { saveJob } = require('backend/driverCockpitService');
    expect(saveJob).toHaveBeenCalledWith('driver123', 'j1');
  });

  test('send_message dispatches to messagingService.sendDriverMessage', async () => {
    await executeTool('driver_cockpit', { action: 'send_message', params: { conversationId: 'c1', body: 'hi' } }, ctx);
    const { sendDriverMessage } = require('backend/messagingService');
    expect(sendDriverMessage).toHaveBeenCalledWith('driver123', 'c1', { conversationId: 'c1', body: 'hi' });
  });

  test('get_unread_count dispatches to messagingService.getDriverUnreadCount', async () => {
    await executeTool('driver_cockpit', { action: 'get_unread_count', params: {} }, ctx);
    const { getDriverUnreadCount } = require('backend/messagingService');
    expect(getDriverUnreadCount).toHaveBeenCalledWith('driver123');
  });

  test('update_profile dispatches to driverProfileService.updateDriverProfile', async () => {
    await executeTool('driver_cockpit', { action: 'update_profile', params: { fields: { bio: 'test' } } }, ctx);
    const { updateDriverProfile } = require('backend/driverProfileService');
    // argMapping: ['driverId', 'fields'] — 'fields' is not aggregate, so extracts params.fields
    expect(updateDriverProfile).toHaveBeenCalledWith('driver123', { bio: 'test' });
  });

  test('upload_document returns approval_required (execute_high)', async () => {
    const result = await executeTool('driver_cockpit', { action: 'upload_document', params: { document_type: 'cdl' } }, ctx);
    expect(result.type).toBe('approval_required');
  });

  test('get_matches dispatches to matchingService.getDriverMatches', async () => {
    await executeTool('driver_cockpit', { action: 'get_matches', params: { min_score: 70 } }, ctx);
    const { getDriverMatches } = require('backend/matchingService');
    expect(getDriverMatches).toHaveBeenCalledWith('driver123', { min_score: 70 });
  });

  test('express_interest dispatches to matchingService.expressDriverInterest', async () => {
    await executeTool('driver_cockpit', { action: 'express_interest', params: { matchId: 'm1', message: 'Interested!' } }, ctx);
    const { expressDriverInterest } = require('backend/matchingService');
    expect(expressDriverInterest).toHaveBeenCalledWith('driver123', 'm1', 'Interested!');
  });

  test('get_dashboard_summary dispatches to driverCockpitService.getDashboardSummary', async () => {
    await executeTool('driver_cockpit', { action: 'get_dashboard_summary', params: {} }, ctx);
    const { getDashboardSummary } = require('backend/driverCockpitService');
    expect(getDashboardSummary).toHaveBeenCalledWith('driver123');
  });

  test('unknown action returns error', async () => {
    const result = await executeTool('driver_cockpit', { action: 'nonexistent', params: {} }, ctx);
    expect(result.error).toContain("Unknown action 'nonexistent'");
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_road
// ============================================================================

describe('driver_road router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('find_parking dispatches to parkingService.findTruckParking', async () => {
    await executeTool('driver_road', { action: 'find_parking', params: { lat: 32.7, lng: -96.8 } }, ctx);
    const { findTruckParking } = require('backend/parkingService');
    expect(findTruckParking).toHaveBeenCalledWith({ lat: 32.7, lng: -96.8 });
  });

  test('find_fuel_prices dispatches to fuelService.findDieselPrices', async () => {
    await executeTool('driver_road', { action: 'find_fuel_prices', params: { lat: 32.7, lng: -96.8 } }, ctx);
    const { findDieselPrices } = require('backend/fuelService');
    expect(findDieselPrices).toHaveBeenCalled();
  });

  test('get_weigh_station_status dispatches to roadUtilitiesService', async () => {
    await executeTool('driver_road', { action: 'get_weigh_station_status', params: { stationId: 'ws1' } }, ctx);
    const { getWeighStationStatus } = require('backend/roadUtilitiesService');
    expect(getWeighStationStatus).toHaveBeenCalledWith('ws1');
  });

  test('get_weather_forecast dispatches to weatherService', async () => {
    await executeTool('driver_road', { action: 'get_weather_forecast', params: { zip: '75001' } }, ctx);
    const { getWeatherForecast } = require('backend/weatherService');
    expect(getWeatherForecast).toHaveBeenCalled();
  });

  test('report_road_hazard dispatches to roadUtilitiesService.reportRoadHazard', async () => {
    await executeTool('driver_road', { action: 'report_road_hazard', params: { type: 'debris', lat: 32.7 } }, ctx);
    const { reportRoadHazard } = require('backend/roadUtilitiesService');
    expect(reportRoadHazard).toHaveBeenCalledWith('driver123', { type: 'debris', lat: 32.7 });
  });

  test('rate_rest_stop dispatches with driverId injected', async () => {
    await executeTool('driver_road', { action: 'rate_rest_stop', params: { stopId: 'rs1', rating: 4 } }, ctx);
    const { rateRestStop } = require('backend/roadUtilitiesService');
    expect(rateRestStop).toHaveBeenCalledWith('driver123', 'rs1', { stopId: 'rs1', rating: 4 });
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_community
// ============================================================================

describe('driver_community router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_forum_posts dispatches to communityService.getForumPosts', async () => {
    await executeTool('driver_community', { action: 'get_forum_posts', params: { category: 'general' } }, ctx);
    const { getForumPosts } = require('backend/communityService');
    expect(getForumPosts).toHaveBeenCalled();
  });

  test('create_forum_post dispatches with driverId injected', async () => {
    await executeTool('driver_community', { action: 'create_forum_post', params: { title: 'Test post' } }, ctx);
    const { createForumPost } = require('backend/communityService');
    expect(createForumPost).toHaveBeenCalledWith('driver123', { title: 'Test post' });
  });

  test('find_mentors dispatches to mentorshipService.findMentors', async () => {
    await executeTool('driver_community', { action: 'find_mentors', params: { specialty: 'hazmat' } }, ctx);
    const { findMentors } = require('backend/mentorshipService');
    expect(findMentors).toHaveBeenCalledWith({ specialty: 'hazmat' });
  });

  test('request_mentorship dispatches with driverId injected', async () => {
    await executeTool('driver_community', { action: 'request_mentorship', params: { mentorId: 'mentor1' } }, ctx);
    const { requestMentorship } = require('backend/mentorshipService');
    expect(requestMentorship).toHaveBeenCalledWith('driver123', 'mentor1', { mentorId: 'mentor1' });
  });

  test('search_pet_friendly_locations dispatches to petFriendlyService', async () => {
    await executeTool('driver_community', { action: 'search_pet_friendly_locations', params: { state: 'TX' } }, ctx);
    const { searchLocations } = require('backend/petFriendlyService');
    expect(searchLocations).toHaveBeenCalledWith({ state: 'TX' });
  });

  test('get_health_resources dispatches to healthService', async () => {
    await executeTool('driver_community', { action: 'get_health_resources', params: { category: 'exercise' } }, ctx);
    const { getResourcesByCategory } = require('backend/healthService');
    expect(getResourcesByCategory).toHaveBeenCalled();
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_compliance
// ============================================================================

describe('driver_compliance router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('upload_compliance_doc returns approval_required (execute_high)', async () => {
    const result = await executeTool('driver_compliance', { action: 'upload_compliance_doc', params: {} }, ctx);
    expect(result.type).toBe('approval_required');
  });

  test('get_compliance_docs dispatches to documentService.getDriverComplianceDocs', async () => {
    await executeTool('driver_compliance', { action: 'get_compliance_docs', params: {} }, ctx);
    const { getDriverComplianceDocs } = require('backend/documentService');
    expect(getDriverComplianceDocs).toHaveBeenCalledWith('driver123', {});
  });

  test('get_hos_summary dispatches to hosService.getHOSSummary', async () => {
    await executeTool('driver_compliance', { action: 'get_hos_summary', params: {} }, ctx);
    const { getHOSSummary } = require('backend/hosService');
    expect(getHOSSummary).toHaveBeenCalledWith('driver123');
  });

  test('log_hos_entry dispatches with driverId injected', async () => {
    await executeTool('driver_compliance', { action: 'log_hos_entry', params: { status: 'driving' } }, ctx);
    const { logHOSEntry } = require('backend/hosService');
    expect(logHOSEntry).toHaveBeenCalledWith('driver123', { status: 'driving' });
  });

  test('sync_eld_data dispatches to eldService.syncELDData', async () => {
    await executeTool('driver_compliance', { action: 'sync_eld_data', params: { provider: 'keeptruckin' } }, ctx);
    const { syncELDData } = require('backend/eldService');
    expect(syncELDData).toHaveBeenCalledWith('driver123', 'keeptruckin', undefined);
  });

  test('get_training_courses dispatches to trainingService.getAvailableCourses', async () => {
    await executeTool('driver_compliance', { action: 'get_training_courses', params: {} }, ctx);
    const { getAvailableCourses } = require('backend/trainingService');
    expect(getAvailableCourses).toHaveBeenCalledWith('driver123', {});
  });

  test('start_training dispatches to trainingService.enrollInCourse', async () => {
    await executeTool('driver_compliance', { action: 'start_training', params: { courseId: 'c1' } }, ctx);
    const { enrollInCourse } = require('backend/trainingService');
    expect(enrollInCourse).toHaveBeenCalledWith('driver123', 'c1', undefined);
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_financial
// ============================================================================

describe('driver_financial router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('log_expense dispatches to driverFinancialService.logExpense', async () => {
    await executeTool('driver_financial', { action: 'log_expense', params: { amount: 55 } }, ctx);
    const { logExpense } = require('backend/driverFinancialService');
    expect(logExpense).toHaveBeenCalledWith('driver123', { amount: 55 });
  });

  test('get_expenses dispatches to driverFinancialService.getExpenses', async () => {
    await executeTool('driver_financial', { action: 'get_expenses', params: { category: 'fuel' } }, ctx);
    const { getExpenses } = require('backend/driverFinancialService');
    expect(getExpenses).toHaveBeenCalledWith('driver123', { category: 'fuel' }, { category: 'fuel' });
  });

  test('dispute_settlement returns approval_required (execute_high)', async () => {
    const result = await executeTool('driver_financial', { action: 'dispute_settlement', params: { settlementId: 's1' } }, ctx);
    expect(result.type).toBe('approval_required');
  });

  test('get_tax_summary dispatches to taxService.getDriverTaxSummary', async () => {
    await executeTool('driver_financial', { action: 'get_tax_summary', params: { taxYear: 2025 } }, ctx);
    const { getDriverTaxSummary } = require('backend/taxService');
    expect(getDriverTaxSummary).toHaveBeenCalledWith('driver123', 2025, undefined);
  });

  test('get_per_diem_rates dispatches to taxService.getPerDiemRates', async () => {
    await executeTool('driver_financial', { action: 'get_per_diem_rates', params: { taxYear: 2025, state: 'TX' } }, ctx);
    const { getPerDiemRates } = require('backend/taxService');
    expect(getPerDiemRates).toHaveBeenCalledWith(2025, 'TX');
  });

  test('calculate_trip_cost dispatches to driverFinancialService', async () => {
    await executeTool('driver_financial', { action: 'calculate_trip_cost', params: { origin: 'Dallas', destination: 'Houston' } }, ctx);
    const { calculateTripCost } = require('backend/driverFinancialService');
    expect(calculateTripCost).toHaveBeenCalledWith('driver123', { origin: 'Dallas', destination: 'Houston' });
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_lifecycle
// ============================================================================

describe('driver_lifecycle router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_driver_timeline dispatches to driverLifecycleService', async () => {
    await executeTool('driver_lifecycle', { action: 'get_driver_timeline', params: {} }, ctx);
    const { getDriverTimeline } = require('backend/driverLifecycleService');
    expect(getDriverTimeline).toHaveBeenCalledWith('driver123', {});
  });

  test('update_disposition dispatches with driverId injected', async () => {
    await executeTool('driver_lifecycle', { action: 'update_disposition', params: { disposition: 'available', availableDate: '2026-03-01' } }, ctx);
    const { updateDisposition } = require('backend/driverLifecycleService');
    expect(updateDisposition).toHaveBeenCalledWith('driver123', 'available', '2026-03-01', undefined);
  });

  test('get_pending_surveys dispatches to surveyService', async () => {
    await executeTool('driver_lifecycle', { action: 'get_pending_surveys', params: {} }, ctx);
    const { getPendingSurveys } = require('backend/surveyService');
    expect(getPendingSurveys).toHaveBeenCalledWith('driver123', undefined);
  });

  test('submit_survey_response dispatches to surveyService', async () => {
    await executeTool('driver_lifecycle', { action: 'submit_survey_response', params: { surveyRequestId: 'sr1', responses: { q1: 'yes' } } }, ctx);
    const { submitSurveyResponse } = require('backend/surveyService');
    // argMapping: ['driverId', 'surveyRequestId', 'responses'] — extracts params.responses
    expect(submitSurveyResponse).toHaveBeenCalledWith('driver123', 'sr1', { q1: 'yes' });
  });

  test('submit_match_feedback dispatches with driverId injected', async () => {
    await executeTool('driver_lifecycle', { action: 'submit_match_feedback', params: { matchId: 'm1', feedback: { rating: 4 } } }, ctx);
    const { submitMatchFeedback } = require('backend/driverLifecycleService');
    expect(submitMatchFeedback).toHaveBeenCalledWith('driver123', 'm1', { matchId: 'm1', feedback: { rating: 4 } });
  });
});

// ============================================================================
// ROUTER DISPATCH — driver_utility
// ============================================================================

describe('driver_utility router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'driver123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_profile_strength_score dispatches to driverProfileService', async () => {
    await executeTool('driver_utility', { action: 'get_profile_strength_score', params: {} }, ctx);
    const { getProfileStrengthScore } = require('backend/driverProfileService');
    expect(getProfileStrengthScore).toHaveBeenCalledWith('driver123');
  });

  test('send_quick_response dispatches to driverCockpitService', async () => {
    await executeTool('driver_utility', { action: 'send_quick_response', params: { conversationId: 'c1', templateKey: 'thanks' } }, ctx);
    const { sendQuickResponse } = require('backend/driverCockpitService');
    expect(sendQuickResponse).toHaveBeenCalledWith('driver123', 'c1', 'thanks', undefined);
  });

  test('set_reverse_alert dispatches to alertService', async () => {
    await executeTool('driver_utility', { action: 'set_reverse_alert', params: { min_score: 80 } }, ctx);
    const { createReverseAlert } = require('backend/alertService');
    expect(createReverseAlert).toHaveBeenCalledWith('driver123', { min_score: 80 });
  });

  test('get_market_insights dispatches to marketIntelService', async () => {
    await executeTool('driver_utility', { action: 'get_market_insights', params: { insightType: 'demand' } }, ctx);
    const { getDriverMarketInsights } = require('backend/marketIntelService');
    expect(getDriverMarketInsights).toHaveBeenCalledWith('driver123', 'demand', undefined);
  });
});

// ============================================================================
// RATE LIMITING
// ============================================================================

describe('Router rate limiting', () => {
  const ctx = { runId: 'run1', userId: 'rate-test-user' };

  test('blocks after exceeding rate_limit', async () => {
    // driver_road.find_parking has rate_limit: 20
    for (let i = 0; i < 20; i++) {
      const r = await executeTool('driver_road', { action: 'find_parking', params: {} }, ctx);
      expect(r.error).toBeUndefined();
    }
    // 21st call should be blocked
    const result = await executeTool('driver_road', { action: 'find_parking', params: {} }, ctx);
    expect(result.type).toBe('rate_limited');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Router edge cases', () => {
  test('unknown router returns error from flat tool lookup', async () => {
    const result = await executeTool('driver_nonexistent', { action: 'foo', params: {} }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain('Unknown tool');
  });

  test('router call without action falls through to flat tool lookup', async () => {
    const result = await executeTool('driver_cockpit', { no_action: 'search' }, { runId: 'r1', userId: 'u1' });
    // Should not find driver_cockpit in TOOL_DEFINITIONS
    expect(result.error).toContain('Unknown tool');
  });

  test('router call with no userId skips rate limiting', async () => {
    const result = await executeTool('driver_road', { action: 'get_weather_alerts', params: { zip: '75001' } }, { runId: 'r1' });
    const { getWeatherAlerts } = require('backend/weatherService');
    expect(getWeatherAlerts).toHaveBeenCalled();
  });
});
