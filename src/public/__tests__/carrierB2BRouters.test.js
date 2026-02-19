/**
 * Carrier & B2B Router Integration Tests (Phase 3)
 * Verifies all 5 carrier/B2B domain routers dispatch correctly through ACTION_REGISTRY.
 * Tests: registry completeness, router dispatch, arg mapping, approval gates, rate limiting.
 *
 * Routers under test:
 *   carrier_fleet (12 actions)       — carrierFleetAgentService
 *   carrier_compliance (10 actions)  — carrierComplianceAgentService
 *   carrier_communication (8 actions) — carrierCommunicationAgentService
 *   carrier_journey (8 actions)      — carrierJourneyService
 *   b2b_suite (18 actions)           — b2bAgentService
 */

// ── Mock Phase 3 carrier service modules ──

jest.mock('backend/carrierFleetAgentService', () => ({
  getFleetRoster: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getDriverScorecard: jest.fn().mockResolvedValue({ driverId: 'd1', score: 88 }),
  getEquipmentList: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getEquipmentStatus: jest.fn().mockResolvedValue({ equipmentId: 'eq1', status: 'active' }),
  getFleetCapacity: jest.fn().mockResolvedValue({ total: 50, available: 12 }),
  getELDFleetSummary: jest.fn().mockResolvedValue({ compliant: 48, violations: 2 }),
  getFleetUtilization: jest.fn().mockResolvedValue({ rate: 0.85 }),
  getFleetCosts: jest.fn().mockResolvedValue({ totalCost: 125000, period: '2026-01' }),
  assignDriverToUnit: jest.fn().mockResolvedValue({ success: true }),
  updateEquipmentStatus: jest.fn().mockResolvedValue({ success: true }),
  getFleetAlerts: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getDriverAvailability: jest.fn().mockResolvedValue({ items: [], totalCount: 0 })
}));

jest.mock('backend/carrierComplianceAgentService', () => ({
  getComplianceCalendar: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getDocumentVault: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  uploadCarrierDocument: jest.fn().mockResolvedValue({ success: true, documentId: 'doc1' }),
  getDQTracker: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getDQGaps: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getCSAScores: jest.fn().mockResolvedValue({ scores: {} }),
  getCSAAlerts: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  logIncident: jest.fn().mockResolvedValue({ success: true, incidentId: 'inc1' }),
  getIncidentHistory: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getAuditReadiness: jest.fn().mockResolvedValue({ score: 92, gaps: [] })
}));

jest.mock('backend/carrierCommunicationAgentService', () => ({
  createAnnouncement: jest.fn().mockResolvedValue({ success: true, announcementId: 'ann1' }),
  getAnnouncements: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  createPolicyUpdate: jest.fn().mockResolvedValue({ success: true, policyId: 'pol1' }),
  getPolicies: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  createRecognition: jest.fn().mockResolvedValue({ success: true, recognitionId: 'rec1' }),
  getRecognitions: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  createFeedbackRequest: jest.fn().mockResolvedValue({ success: true, requestId: 'fb1' }),
  getFeedbackResponses: jest.fn().mockResolvedValue({ items: [], totalCount: 0 })
}));

jest.mock('backend/carrierJourneyService', () => ({
  getOnboardingFlow: jest.fn().mockResolvedValue({ steps: [], progress: 0 }),
  updateCarrierIdentity: jest.fn().mockResolvedValue({ success: true }),
  getCarrierNavigation: jest.fn().mockResolvedValue({ sections: [] }),
  initiateDeposit: jest.fn().mockResolvedValue({ success: true, depositId: 'dep1' }),
  getPaymentHistory: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getSubscriptionStatus: jest.fn().mockResolvedValue({ plan: 'pro', status: 'active' }),
  upgradeCarrierPlan: jest.fn().mockResolvedValue({ success: true }),
  getCheckoutSession: jest.fn().mockResolvedValue({ sessionUrl: 'https://checkout.stripe.com/session1' })
}));

jest.mock('backend/b2bAgentService', () => ({
  getMatchIntelligence: jest.fn().mockResolvedValue({ matches: [], totalCount: 0 }),
  getB2BPipeline: jest.fn().mockResolvedValue({ opportunities: [], totalCount: 0 }),
  updateOpportunityStage: jest.fn().mockResolvedValue({ success: true }),
  createOutreach: jest.fn().mockResolvedValue({ success: true, outreachId: 'out1' }),
  getB2BEvents: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  runResearchAgent: jest.fn().mockResolvedValue({ success: true, researchId: 'res1' }),
  getResearchResults: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getB2BAnalytics: jest.fn().mockResolvedValue({ metrics: {} }),
  createB2BAccount: jest.fn().mockResolvedValue({ success: true, accountId: 'acc1' }),
  updateB2BAccount: jest.fn().mockResolvedValue({ success: true }),
  getTasks: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  createTask: jest.fn().mockResolvedValue({ success: true, taskId: 'task1' }),
  completeTask: jest.fn().mockResolvedValue({ success: true }),
  getContacts: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  addContact: jest.fn().mockResolvedValue({ success: true, contactId: 'ct1' }),
  getNotes: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  addNote: jest.fn().mockResolvedValue({ success: true, noteId: 'note1' }),
  getAccountScore: jest.fn().mockResolvedValue({ score: 78, factors: [] })
}));

// ── Mock shared dependencies ──
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
jest.mock('backend/metaGovernanceService', () => ({ listMetaIntegrations: jest.fn() }));

// Driver service stubs (needed for agentService module load)
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

// Recruiter service stubs (needed for agentService module load)
jest.mock('backend/smsCampaignService', () => ({ createSMSCampaign: jest.fn() }));
jest.mock('backend/emailCampaignService', () => ({ createEmailCampaign: jest.fn() }));
jest.mock('backend/recruiterOutreachService', () => ({ getCampaignStatus: jest.fn() }));
jest.mock('backend/jobBoardService', () => ({ syndicateJob: jest.fn() }));
jest.mock('backend/socialPostingService', () => ({ createSocialPost: jest.fn() }));
jest.mock('backend/voiceCampaignService', () => ({ createCampaign: jest.fn() }));
jest.mock('backend/onboardingWorkflowService', () => ({ createOnboardingWorkflow: jest.fn() }));
jest.mock('backend/recruiterOnboardingService', () => ({ requestDocuments: jest.fn() }));
jest.mock('backend/recruiterPipelineService', () => ({ saveDriverSearch: jest.fn() }));
jest.mock('backend/pipelineAutomationService', () => ({ createAutomationRule: jest.fn() }));
jest.mock('backend/recruiterRetentionService', () => ({ getRetentionRisks: jest.fn() }));
jest.mock('backend/recruiterReverseMatchService', () => ({ reverseSearchDrivers: jest.fn() }));

// ── Import after mocks ──
const { executeTool, ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

// ============================================================================
// REGISTRY COMPLETENESS
// ============================================================================

describe('ACTION_REGISTRY completeness — carrier & B2B routers', () => {
  test('has exactly 4 carrier routers', () => {
    const routerNames = Object.keys(ACTION_REGISTRY).filter(k => k.startsWith('carrier_'));
    expect(routerNames).toHaveLength(4);
    expect(routerNames.sort()).toEqual([
      'carrier_communication', 'carrier_compliance', 'carrier_fleet', 'carrier_journey'
    ]);
  });

  test('has exactly 1 b2b router', () => {
    const routerNames = Object.keys(ACTION_REGISTRY).filter(k => k.startsWith('b2b_'));
    expect(routerNames).toHaveLength(1);
    expect(routerNames[0]).toBe('b2b_suite');
  });

  test('carrier_fleet has 12 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.carrier_fleet)).toHaveLength(12);
  });

  test('carrier_compliance has 10 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.carrier_compliance)).toHaveLength(10);
  });

  test('carrier_communication has 8 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.carrier_communication)).toHaveLength(8);
  });

  test('carrier_journey has 8 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.carrier_journey)).toHaveLength(8);
  });

  test('b2b_suite has 18 actions', () => {
    expect(Object.keys(ACTION_REGISTRY.b2b_suite)).toHaveLength(18);
  });

  test('total carrier + B2B actions = 56', () => {
    const carrierTotal = Object.keys(ACTION_REGISTRY)
      .filter(k => k.startsWith('carrier_'))
      .reduce((sum, k) => sum + Object.keys(ACTION_REGISTRY[k]).length, 0);
    const b2bTotal = Object.keys(ACTION_REGISTRY.b2b_suite).length;
    expect(carrierTotal + b2bTotal).toBe(56);
  });

  test('every action has required policy fields', () => {
    const routers = ['carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey', 'b2b_suite'];
    for (const router of routers) {
      for (const [action, def] of Object.entries(ACTION_REGISTRY[router])) {
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
    const routers = ['carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey', 'b2b_suite'];
    for (const router of routers) {
      for (const [action, def] of Object.entries(ACTION_REGISTRY[router])) {
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

describe('ROUTER_DEFINITIONS — carrier & B2B routers', () => {
  test('has 4 carrier routers + 1 b2b router matching ACTION_REGISTRY', () => {
    const carrierRouters = Object.keys(ROUTER_DEFINITIONS).filter(k => k.startsWith('carrier_'));
    expect(carrierRouters).toHaveLength(4);
    for (const router of carrierRouters) {
      expect(ACTION_REGISTRY).toHaveProperty(router);
    }
    expect(ROUTER_DEFINITIONS).toHaveProperty('b2b_suite');
    expect(ACTION_REGISTRY).toHaveProperty('b2b_suite');
  });

  test('each router has name, description, input_schema with action enum, and roles', () => {
    const routers = ['carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey', 'b2b_suite'];
    for (const key of routers) {
      const def = ROUTER_DEFINITIONS[key];
      expect(def.name).toBe(key);
      expect(def.description).toBeTruthy();
      expect(def.input_schema).toBeDefined();
      expect(def.input_schema.properties.action.enum).toBeDefined();
      expect(def.roles).toBeDefined();
    }
  });

  test('carrier routers have carrier role', () => {
    const carrierRouters = ['carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey'];
    for (const key of carrierRouters) {
      expect(ROUTER_DEFINITIONS[key].roles).toContain('carrier');
    }
  });

  test('b2b_suite roles include carrier and admin', () => {
    expect(ROUTER_DEFINITIONS.b2b_suite.roles).toContain('carrier');
    expect(ROUTER_DEFINITIONS.b2b_suite.roles).toContain('admin');
  });

  test('action enums match ACTION_REGISTRY keys', () => {
    const routers = ['carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey', 'b2b_suite'];
    for (const key of routers) {
      const registryActions = Object.keys(ACTION_REGISTRY[key]).sort();
      const enumActions = [...ROUTER_DEFINITIONS[key].input_schema.properties.action.enum].sort();
      expect(enumActions).toEqual(registryActions);
    }
  });
});

// ============================================================================
// ROUTER DISPATCH — carrier_fleet (12 actions)
// ============================================================================

describe('carrier_fleet router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'carrier123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_fleet_roster dispatches to carrierFleetAgentService.getFleetRoster', async () => {
    const result = await executeTool('carrier_fleet', { action: 'get_fleet_roster', params: { carrierDot: 'DOT123' } }, ctx);
    const { getFleetRoster } = require('backend/carrierFleetAgentService');
    // argMapping: ['carrierDot', 'params'] — carrierDot is scalar, params is aggregate
    expect(getFleetRoster).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
    expect(result).toEqual({ items: [], totalCount: 0 });
  });

  test('get_driver_scorecard dispatches to carrierFleetAgentService.getDriverScorecard', async () => {
    const result = await executeTool('carrier_fleet', { action: 'get_driver_scorecard', params: { carrierDot: 'DOT123', driverId: 'd1' } }, ctx);
    const { getDriverScorecard } = require('backend/carrierFleetAgentService');
    expect(getDriverScorecard).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', driverId: 'd1' });
    expect(result).toEqual({ driverId: 'd1', score: 88 });
  });

  test('get_equipment_list dispatches to carrierFleetAgentService.getEquipmentList', async () => {
    await executeTool('carrier_fleet', { action: 'get_equipment_list', params: { carrierDot: 'DOT123' } }, ctx);
    const { getEquipmentList } = require('backend/carrierFleetAgentService');
    expect(getEquipmentList).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_equipment_status dispatches to carrierFleetAgentService.getEquipmentStatus', async () => {
    await executeTool('carrier_fleet', { action: 'get_equipment_status', params: { carrierDot: 'DOT123', equipmentId: 'eq1' } }, ctx);
    const { getEquipmentStatus } = require('backend/carrierFleetAgentService');
    expect(getEquipmentStatus).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', equipmentId: 'eq1' });
  });

  test('get_fleet_capacity dispatches to carrierFleetAgentService.getFleetCapacity', async () => {
    await executeTool('carrier_fleet', { action: 'get_fleet_capacity', params: { carrierDot: 'DOT123' } }, ctx);
    const { getFleetCapacity } = require('backend/carrierFleetAgentService');
    expect(getFleetCapacity).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_eld_fleet_summary dispatches to carrierFleetAgentService.getELDFleetSummary', async () => {
    await executeTool('carrier_fleet', { action: 'get_eld_fleet_summary', params: { carrierDot: 'DOT123' } }, ctx);
    const { getELDFleetSummary } = require('backend/carrierFleetAgentService');
    expect(getELDFleetSummary).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_fleet_utilization dispatches to carrierFleetAgentService.getFleetUtilization', async () => {
    await executeTool('carrier_fleet', { action: 'get_fleet_utilization', params: { carrierDot: 'DOT123', period: '2026-01' } }, ctx);
    const { getFleetUtilization } = require('backend/carrierFleetAgentService');
    expect(getFleetUtilization).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', period: '2026-01' });
  });

  test('get_fleet_costs dispatches to carrierFleetAgentService.getFleetCosts', async () => {
    await executeTool('carrier_fleet', { action: 'get_fleet_costs', params: { carrierDot: 'DOT123', period: '2026-01' } }, ctx);
    const { getFleetCosts } = require('backend/carrierFleetAgentService');
    expect(getFleetCosts).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', period: '2026-01' });
  });

  test('assign_driver_to_unit dispatches to carrierFleetAgentService.assignDriverToUnit (execute_low)', async () => {
    const result = await executeTool('carrier_fleet', { action: 'assign_driver_to_unit', params: { carrierDot: 'DOT123', driverId: 'd1', unitId: 'u1' } }, ctx);
    const { assignDriverToUnit } = require('backend/carrierFleetAgentService');
    expect(assignDriverToUnit).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', driverId: 'd1', unitId: 'u1' });
    expect(result).toEqual({ success: true });
  });

  test('update_equipment_status dispatches to carrierFleetAgentService.updateEquipmentStatus (execute_low)', async () => {
    const result = await executeTool('carrier_fleet', { action: 'update_equipment_status', params: { carrierDot: 'DOT123', equipmentId: 'eq1', status: 'maintenance' } }, ctx);
    const { updateEquipmentStatus } = require('backend/carrierFleetAgentService');
    expect(updateEquipmentStatus).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', equipmentId: 'eq1', status: 'maintenance' });
    expect(result).toEqual({ success: true });
  });

  test('get_fleet_alerts dispatches to carrierFleetAgentService.getFleetAlerts', async () => {
    await executeTool('carrier_fleet', { action: 'get_fleet_alerts', params: { carrierDot: 'DOT123' } }, ctx);
    const { getFleetAlerts } = require('backend/carrierFleetAgentService');
    expect(getFleetAlerts).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_driver_availability dispatches to carrierFleetAgentService.getDriverAvailability', async () => {
    await executeTool('carrier_fleet', { action: 'get_driver_availability', params: { carrierDot: 'DOT123' } }, ctx);
    const { getDriverAvailability } = require('backend/carrierFleetAgentService');
    expect(getDriverAvailability).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('unknown action returns error', async () => {
    const result = await executeTool('carrier_fleet', { action: 'nonexistent', params: {} }, ctx);
    expect(result.error).toContain("Unknown action 'nonexistent'");
  });
});

// ============================================================================
// ROUTER DISPATCH — carrier_compliance (10 actions)
// ============================================================================

describe('carrier_compliance router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'carrier123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_compliance_calendar dispatches to carrierComplianceAgentService.getComplianceCalendar', async () => {
    await executeTool('carrier_compliance', { action: 'get_compliance_calendar', params: { carrierDot: 'DOT123' } }, ctx);
    const { getComplianceCalendar } = require('backend/carrierComplianceAgentService');
    expect(getComplianceCalendar).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_document_vault dispatches to carrierComplianceAgentService.getDocumentVault', async () => {
    await executeTool('carrier_compliance', { action: 'get_document_vault', params: { carrierDot: 'DOT123' } }, ctx);
    const { getDocumentVault } = require('backend/carrierComplianceAgentService');
    expect(getDocumentVault).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('upload_carrier_document dispatches to carrierComplianceAgentService.uploadCarrierDocument (execute_low)', async () => {
    const result = await executeTool('carrier_compliance', { action: 'upload_carrier_document', params: { carrierDot: 'DOT123', docType: 'insurance' } }, ctx);
    const { uploadCarrierDocument } = require('backend/carrierComplianceAgentService');
    expect(uploadCarrierDocument).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', docType: 'insurance' });
    expect(result).toEqual({ success: true, documentId: 'doc1' });
  });

  test('get_dq_tracker dispatches to carrierComplianceAgentService.getDQTracker', async () => {
    await executeTool('carrier_compliance', { action: 'get_dq_tracker', params: { carrierDot: 'DOT123' } }, ctx);
    const { getDQTracker } = require('backend/carrierComplianceAgentService');
    expect(getDQTracker).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_dq_gaps dispatches to carrierComplianceAgentService.getDQGaps', async () => {
    await executeTool('carrier_compliance', { action: 'get_dq_gaps', params: { carrierDot: 'DOT123' } }, ctx);
    const { getDQGaps } = require('backend/carrierComplianceAgentService');
    expect(getDQGaps).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_csa_scores dispatches to carrierComplianceAgentService.getCSAScores', async () => {
    await executeTool('carrier_compliance', { action: 'get_csa_scores', params: { carrierDot: 'DOT123' } }, ctx);
    const { getCSAScores } = require('backend/carrierComplianceAgentService');
    expect(getCSAScores).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_csa_alerts dispatches to carrierComplianceAgentService.getCSAAlerts', async () => {
    await executeTool('carrier_compliance', { action: 'get_csa_alerts', params: { carrierDot: 'DOT123' } }, ctx);
    const { getCSAAlerts } = require('backend/carrierComplianceAgentService');
    expect(getCSAAlerts).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('log_incident dispatches to carrierComplianceAgentService.logIncident (execute_low)', async () => {
    const result = await executeTool('carrier_compliance', { action: 'log_incident', params: { carrierDot: 'DOT123', type: 'accident', description: 'Minor fender bender' } }, ctx);
    const { logIncident } = require('backend/carrierComplianceAgentService');
    expect(logIncident).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', type: 'accident', description: 'Minor fender bender' });
    expect(result).toEqual({ success: true, incidentId: 'inc1' });
  });

  test('get_incident_history dispatches to carrierComplianceAgentService.getIncidentHistory', async () => {
    await executeTool('carrier_compliance', { action: 'get_incident_history', params: { carrierDot: 'DOT123' } }, ctx);
    const { getIncidentHistory } = require('backend/carrierComplianceAgentService');
    expect(getIncidentHistory).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_audit_readiness dispatches to carrierComplianceAgentService.getAuditReadiness', async () => {
    const result = await executeTool('carrier_compliance', { action: 'get_audit_readiness', params: { carrierDot: 'DOT123' } }, ctx);
    const { getAuditReadiness } = require('backend/carrierComplianceAgentService');
    expect(getAuditReadiness).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
    expect(result).toEqual({ score: 92, gaps: [] });
  });
});

// ============================================================================
// ROUTER DISPATCH — carrier_communication (8 actions)
// ============================================================================

describe('carrier_communication router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'carrier123' };

  beforeEach(() => jest.clearAllMocks());

  test('create_announcement returns approval_required (execute_high)', async () => {
    const result = await executeTool('carrier_communication', { action: 'create_announcement', params: { carrierDot: 'DOT123', title: 'Test' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_announcements dispatches to carrierCommunicationAgentService.getAnnouncements', async () => {
    await executeTool('carrier_communication', { action: 'get_announcements', params: { carrierDot: 'DOT123' } }, ctx);
    const { getAnnouncements } = require('backend/carrierCommunicationAgentService');
    expect(getAnnouncements).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('create_policy_update returns approval_required (execute_high)', async () => {
    const result = await executeTool('carrier_communication', { action: 'create_policy_update', params: { carrierDot: 'DOT123', title: 'New policy' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_policies dispatches to carrierCommunicationAgentService.getPolicies', async () => {
    await executeTool('carrier_communication', { action: 'get_policies', params: { carrierDot: 'DOT123' } }, ctx);
    const { getPolicies } = require('backend/carrierCommunicationAgentService');
    expect(getPolicies).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('create_recognition dispatches to carrierCommunicationAgentService.createRecognition (execute_low)', async () => {
    const result = await executeTool('carrier_communication', { action: 'create_recognition', params: { carrierDot: 'DOT123', driverId: 'd1', recognitionType: 'safety' } }, ctx);
    const { createRecognition } = require('backend/carrierCommunicationAgentService');
    expect(createRecognition).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', driverId: 'd1', recognitionType: 'safety' });
    expect(result).toEqual({ success: true, recognitionId: 'rec1' });
  });

  test('get_recognitions dispatches to carrierCommunicationAgentService.getRecognitions', async () => {
    await executeTool('carrier_communication', { action: 'get_recognitions', params: { carrierDot: 'DOT123' } }, ctx);
    const { getRecognitions } = require('backend/carrierCommunicationAgentService');
    expect(getRecognitions).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('create_feedback_request dispatches to carrierCommunicationAgentService.createFeedbackRequest (execute_low)', async () => {
    const result = await executeTool('carrier_communication', { action: 'create_feedback_request', params: { carrierDot: 'DOT123', targetAudience: 'all_drivers' } }, ctx);
    const { createFeedbackRequest } = require('backend/carrierCommunicationAgentService');
    expect(createFeedbackRequest).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', targetAudience: 'all_drivers' });
    expect(result).toEqual({ success: true, requestId: 'fb1' });
  });

  test('get_feedback_responses dispatches to carrierCommunicationAgentService.getFeedbackResponses', async () => {
    await executeTool('carrier_communication', { action: 'get_feedback_responses', params: { carrierDot: 'DOT123' } }, ctx);
    const { getFeedbackResponses } = require('backend/carrierCommunicationAgentService');
    expect(getFeedbackResponses).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });
});

// ============================================================================
// ROUTER DISPATCH — carrier_journey (8 actions)
// ============================================================================

describe('carrier_journey router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'carrier123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_onboarding_flow dispatches to carrierJourneyService.getOnboardingFlow', async () => {
    const result = await executeTool('carrier_journey', { action: 'get_onboarding_flow', params: { carrierDot: 'DOT123' } }, ctx);
    const { getOnboardingFlow } = require('backend/carrierJourneyService');
    expect(getOnboardingFlow).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
    expect(result).toEqual({ steps: [], progress: 0 });
  });

  test('update_carrier_identity dispatches to carrierJourneyService.updateCarrierIdentity (execute_low)', async () => {
    const result = await executeTool('carrier_journey', { action: 'update_carrier_identity', params: { carrierDot: 'DOT123', email: 'test@carrier.com' } }, ctx);
    const { updateCarrierIdentity } = require('backend/carrierJourneyService');
    expect(updateCarrierIdentity).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123', email: 'test@carrier.com' });
    expect(result).toEqual({ success: true });
  });

  test('get_carrier_navigation dispatches to carrierJourneyService.getCarrierNavigation', async () => {
    await executeTool('carrier_journey', { action: 'get_carrier_navigation', params: { carrierDot: 'DOT123' } }, ctx);
    const { getCarrierNavigation } = require('backend/carrierJourneyService');
    expect(getCarrierNavigation).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('initiate_deposit returns approval_required (execute_high)', async () => {
    const result = await executeTool('carrier_journey', { action: 'initiate_deposit', params: { carrierDot: 'DOT123', amount: 500 } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_payment_history dispatches to carrierJourneyService.getPaymentHistory', async () => {
    await executeTool('carrier_journey', { action: 'get_payment_history', params: { carrierDot: 'DOT123' } }, ctx);
    const { getPaymentHistory } = require('backend/carrierJourneyService');
    expect(getPaymentHistory).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
  });

  test('get_subscription_status dispatches to carrierJourneyService.getSubscriptionStatus', async () => {
    const result = await executeTool('carrier_journey', { action: 'get_subscription_status', params: { carrierDot: 'DOT123' } }, ctx);
    const { getSubscriptionStatus } = require('backend/carrierJourneyService');
    expect(getSubscriptionStatus).toHaveBeenCalledWith('DOT123', { carrierDot: 'DOT123' });
    expect(result).toEqual({ plan: 'pro', status: 'active' });
  });

  test('upgrade_carrier_plan returns approval_required (execute_high)', async () => {
    const result = await executeTool('carrier_journey', { action: 'upgrade_carrier_plan', params: { carrierDot: 'DOT123', plan: 'enterprise' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_checkout_session returns approval_required (execute_high)', async () => {
    const result = await executeTool('carrier_journey', { action: 'get_checkout_session', params: { carrierDot: 'DOT123', priceId: 'price_abc' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });
});

// ============================================================================
// ROUTER DISPATCH — b2b_suite (18 actions)
// ============================================================================

describe('b2b_suite router dispatch', () => {
  const ctx = { runId: 'run1', userId: 'b2bUser123' };

  beforeEach(() => jest.clearAllMocks());

  test('get_match_intelligence dispatches to b2bAgentService.getMatchIntelligence', async () => {
    const result = await executeTool('b2b_suite', { action: 'get_match_intelligence', params: { carrierDot: 'DOT456' } }, ctx);
    const { getMatchIntelligence } = require('backend/b2bAgentService');
    // argMapping: ['userId', 'params'] — userId is identity (runContext.userId), params is aggregate
    expect(getMatchIntelligence).toHaveBeenCalledWith('b2bUser123', { carrierDot: 'DOT456' });
    expect(result).toEqual({ matches: [], totalCount: 0 });
  });

  test('get_b2b_pipeline dispatches to b2bAgentService.getB2BPipeline', async () => {
    await executeTool('b2b_suite', { action: 'get_b2b_pipeline', params: { status: 'active' } }, ctx);
    const { getB2BPipeline } = require('backend/b2bAgentService');
    expect(getB2BPipeline).toHaveBeenCalledWith('b2bUser123', { status: 'active' });
  });

  test('update_opportunity_stage dispatches to b2bAgentService.updateOpportunityStage (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'update_opportunity_stage', params: { opportunityId: 'opp1', stage: 'negotiation' } }, ctx);
    const { updateOpportunityStage } = require('backend/b2bAgentService');
    expect(updateOpportunityStage).toHaveBeenCalledWith('b2bUser123', { opportunityId: 'opp1', stage: 'negotiation' });
    expect(result).toEqual({ success: true });
  });

  test('create_b2b_outreach returns approval_required (execute_high)', async () => {
    const result = await executeTool('b2b_suite', { action: 'create_b2b_outreach', params: { accountId: 'acc1', channel: 'email' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('get_b2b_events dispatches to b2bAgentService.getB2BEvents', async () => {
    await executeTool('b2b_suite', { action: 'get_b2b_events', params: { limit: 20 } }, ctx);
    const { getB2BEvents } = require('backend/b2bAgentService');
    expect(getB2BEvents).toHaveBeenCalledWith('b2bUser123', { limit: 20 });
  });

  test('run_research_agent dispatches to b2bAgentService.runResearchAgent (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'run_research_agent', params: { carrierDot: 'DOT456' } }, ctx);
    const { runResearchAgent } = require('backend/b2bAgentService');
    expect(runResearchAgent).toHaveBeenCalledWith('b2bUser123', { carrierDot: 'DOT456' });
    expect(result).toEqual({ success: true, researchId: 'res1' });
  });

  test('get_research_results dispatches to b2bAgentService.getResearchResults', async () => {
    await executeTool('b2b_suite', { action: 'get_research_results', params: { researchId: 'res1' } }, ctx);
    const { getResearchResults } = require('backend/b2bAgentService');
    expect(getResearchResults).toHaveBeenCalledWith('b2bUser123', { researchId: 'res1' });
  });

  test('get_b2b_analytics dispatches to b2bAgentService.getB2BAnalytics', async () => {
    await executeTool('b2b_suite', { action: 'get_b2b_analytics', params: { period: '30d' } }, ctx);
    const { getB2BAnalytics } = require('backend/b2bAgentService');
    expect(getB2BAnalytics).toHaveBeenCalledWith('b2bUser123', { period: '30d' });
  });

  test('create_b2b_account dispatches to b2bAgentService.createB2BAccount (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'create_b2b_account', params: { name: 'Acme Trucking', dot: 'DOT789' } }, ctx);
    const { createB2BAccount } = require('backend/b2bAgentService');
    expect(createB2BAccount).toHaveBeenCalledWith('b2bUser123', { name: 'Acme Trucking', dot: 'DOT789' });
    expect(result).toEqual({ success: true, accountId: 'acc1' });
  });

  test('update_b2b_account dispatches to b2bAgentService.updateB2BAccount (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'update_b2b_account', params: { accountId: 'acc1', status: 'qualified' } }, ctx);
    const { updateB2BAccount } = require('backend/b2bAgentService');
    expect(updateB2BAccount).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1', status: 'qualified' });
    expect(result).toEqual({ success: true });
  });

  test('get_b2b_tasks dispatches to b2bAgentService.getTasks', async () => {
    await executeTool('b2b_suite', { action: 'get_b2b_tasks', params: { accountId: 'acc1' } }, ctx);
    const { getTasks } = require('backend/b2bAgentService');
    expect(getTasks).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1' });
  });

  test('create_b2b_task dispatches to b2bAgentService.createTask (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'create_b2b_task', params: { accountId: 'acc1', title: 'Follow up call' } }, ctx);
    const { createTask } = require('backend/b2bAgentService');
    expect(createTask).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1', title: 'Follow up call' });
    expect(result).toEqual({ success: true, taskId: 'task1' });
  });

  test('complete_b2b_task dispatches to b2bAgentService.completeTask (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'complete_b2b_task', params: { taskId: 'task1' } }, ctx);
    const { completeTask } = require('backend/b2bAgentService');
    expect(completeTask).toHaveBeenCalledWith('b2bUser123', { taskId: 'task1' });
    expect(result).toEqual({ success: true });
  });

  test('get_b2b_contacts dispatches to b2bAgentService.getContacts', async () => {
    await executeTool('b2b_suite', { action: 'get_b2b_contacts', params: { accountId: 'acc1' } }, ctx);
    const { getContacts } = require('backend/b2bAgentService');
    expect(getContacts).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1' });
  });

  test('add_b2b_contact dispatches to b2bAgentService.addContact (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'add_b2b_contact', params: { accountId: 'acc1', name: 'Jane Doe', email: 'jane@acme.com' } }, ctx);
    const { addContact } = require('backend/b2bAgentService');
    expect(addContact).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1', name: 'Jane Doe', email: 'jane@acme.com' });
    expect(result).toEqual({ success: true, contactId: 'ct1' });
  });

  test('get_b2b_notes dispatches to b2bAgentService.getNotes', async () => {
    await executeTool('b2b_suite', { action: 'get_b2b_notes', params: { accountId: 'acc1' } }, ctx);
    const { getNotes } = require('backend/b2bAgentService');
    expect(getNotes).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1' });
  });

  test('add_b2b_note dispatches to b2bAgentService.addNote (execute_low)', async () => {
    const result = await executeTool('b2b_suite', { action: 'add_b2b_note', params: { accountId: 'acc1', content: 'Met with CFO' } }, ctx);
    const { addNote } = require('backend/b2bAgentService');
    expect(addNote).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1', content: 'Met with CFO' });
    expect(result).toEqual({ success: true, noteId: 'note1' });
  });

  test('get_b2b_score dispatches to b2bAgentService.getAccountScore', async () => {
    const result = await executeTool('b2b_suite', { action: 'get_b2b_score', params: { accountId: 'acc1' } }, ctx);
    const { getAccountScore } = require('backend/b2bAgentService');
    expect(getAccountScore).toHaveBeenCalledWith('b2bUser123', { accountId: 'acc1' });
    expect(result).toEqual({ score: 78, factors: [] });
  });

  test('unknown action returns error', async () => {
    const result = await executeTool('b2b_suite', { action: 'nonexistent', params: {} }, ctx);
    expect(result.error).toContain("Unknown action 'nonexistent'");
  });
});

// ============================================================================
// APPROVAL GATES — verify all 6 execute_high actions across Phase 3
// ============================================================================

describe('Carrier & B2B approval gates', () => {
  const ctx = { runId: 'run1', userId: 'carrier123' };

  const executeHighActions = [
    // carrier_communication (2)
    ['carrier_communication', 'create_announcement'],
    ['carrier_communication', 'create_policy_update'],
    // carrier_journey (3)
    ['carrier_journey', 'initiate_deposit'],
    ['carrier_journey', 'upgrade_carrier_plan'],
    ['carrier_journey', 'get_checkout_session'],
    // b2b_suite (1)
    ['b2b_suite', 'create_b2b_outreach'],
  ];

  test.each(executeHighActions)('%s.%s returns approval_required without approvedGateId', async (router, action) => {
    const result = await executeTool(router, { action, params: { carrierDot: 'DOT123' } }, ctx);
    expect(result.type).toBe('approval_required');
    expect(result.riskLevel).toBe('execute_high');
  });

  test('execute_high with approvedGateId bypasses gate (carrier_communication.create_announcement)', async () => {
    const approvedCtx = { runId: 'run1', userId: 'carrier123', approvedGateId: 'gate1' };
    const result = await executeTool('carrier_communication', { action: 'create_announcement', params: { carrierDot: 'DOT123', title: 'Approved announcement' } }, approvedCtx);
    // Should NOT be approval_required since gate is provided
    expect(result.type).not.toBe('approval_required');
    expect(result.success).toBe(true);
  });

  test('execute_high with approvedGateId bypasses gate (b2b_suite.create_b2b_outreach)', async () => {
    const approvedCtx = { runId: 'run1', userId: 'b2bUser123', approvedGateId: 'gate1' };
    const result = await executeTool('b2b_suite', { action: 'create_b2b_outreach', params: { accountId: 'acc1', channel: 'email' } }, approvedCtx);
    expect(result.type).not.toBe('approval_required');
    expect(result.success).toBe(true);
  });

  test('non-gated execute_low actions proceed without approval', async () => {
    const result = await executeTool('carrier_fleet', { action: 'assign_driver_to_unit', params: { carrierDot: 'DOT123', driverId: 'd1' } }, ctx);
    expect(result.type).not.toBe('approval_required');
    expect(result).toEqual({ success: true });
  });
});

// ============================================================================
// RATE LIMITING
// ============================================================================

describe('Carrier & B2B router rate limiting', () => {
  test('blocks after exceeding rate_limit on carrier_fleet.get_fleet_roster', async () => {
    const ctx = { runId: 'run1', userId: 'rate-test-carrier' };
    // get_fleet_roster has rate_limit: 10
    for (let i = 0; i < 10; i++) {
      const r = await executeTool('carrier_fleet', { action: 'get_fleet_roster', params: { carrierDot: 'DOT123' } }, ctx);
      expect(r.type).not.toBe('rate_limited');
    }
    // 11th call should be blocked
    const result = await executeTool('carrier_fleet', { action: 'get_fleet_roster', params: { carrierDot: 'DOT123' } }, ctx);
    expect(result.type).toBe('rate_limited');
  });

  test('blocks after exceeding rate_limit on b2b_suite.run_research_agent (rate_limit: 3)', async () => {
    const ctx = { runId: 'run1', userId: 'rate-test-b2b' };
    // run_research_agent has rate_limit: 3
    for (let i = 0; i < 3; i++) {
      const r = await executeTool('b2b_suite', { action: 'run_research_agent', params: { carrierDot: 'DOT456' } }, ctx);
      expect(r.type).not.toBe('rate_limited');
    }
    // 4th call should be blocked
    const result = await executeTool('b2b_suite', { action: 'run_research_agent', params: { carrierDot: 'DOT456' } }, ctx);
    expect(result.type).toBe('rate_limited');
  });

  test('every carrier action has a rate_limit defined', () => {
    const routers = ['carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey'];
    for (const router of routers) {
      for (const [action, def] of Object.entries(ACTION_REGISTRY[router])) {
        expect(def.policy.rate_limit).toBeGreaterThan(0);
      }
    }
  });

  test('every b2b action has a rate_limit defined', () => {
    for (const [action, def] of Object.entries(ACTION_REGISTRY.b2b_suite)) {
      expect(def.policy.rate_limit).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Carrier & B2B router edge cases', () => {
  test('unknown action in carrier router returns error', async () => {
    const result = await executeTool('carrier_compliance', { action: 'nonexistent', params: {} }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain("Unknown action 'nonexistent'");
  });

  test('unknown carrier router falls through to flat tool lookup and errors', async () => {
    const result = await executeTool('carrier_nonexistent', { action: 'foo', params: {} }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain('Unknown tool');
  });

  test('router call without action falls through to flat tool lookup', async () => {
    const result = await executeTool('carrier_fleet', { no_action: 'foo' }, { runId: 'r1', userId: 'u1' });
    expect(result.error).toContain('Unknown tool');
  });

  test('router call with no userId skips rate limiting', async () => {
    const result = await executeTool('carrier_fleet', { action: 'get_fleet_roster', params: { carrierDot: 'DOT123' } }, { runId: 'r1' });
    const { getFleetRoster } = require('backend/carrierFleetAgentService');
    expect(getFleetRoster).toHaveBeenCalled();
  });

  test('b2b_suite with no userId still dispatches (userId maps to undefined)', async () => {
    const result = await executeTool('b2b_suite', { action: 'get_b2b_pipeline', params: { status: 'active' } }, { runId: 'r1' });
    const { getB2BPipeline } = require('backend/b2bAgentService');
    // userId identity arg maps to undefined when no userId in context
    expect(getB2BPipeline).toHaveBeenCalledWith(undefined, { status: 'active' });
  });
});
