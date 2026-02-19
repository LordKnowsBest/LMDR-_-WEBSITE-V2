/**
 * Cross-Role Router Integration Tests (Phase 5)
 * Verifies all 5 cross-role domain routers dispatch correctly through ACTION_REGISTRY.
 * Tests: registry completeness, router definitions, multi-role access, approval gates, rate limiting, edge cases.
 *
 * Routers under test:
 *   cross_role_utility (10 actions)  — crossRoleUtilityAgentService
 *   observability_ops (5 actions)    — adminObservabilityAgentService
 *   external_api (10 actions)        — externalApiAgentService
 *   financial_extended (8 actions)   — financialExtAgentService
 *   lifecycle_ops (10 actions)       — lifecycleOpsAgentService
 */

// ── Mock Phase 5 service modules ──

jest.mock('backend/crossRoleUtilityAgentService', () => ({
  getMutualInterest: jest.fn().mockResolvedValue({ interests: [], count: 0 }),
  getRetentionForCarrier: jest.fn().mockResolvedValue({ risks: [], riskCount: 0 }),
  getMatchExplanation: jest.fn().mockResolvedValue({ explanation: {} }),
  getRecruiterHealth: jest.fn().mockResolvedValue({ status: 'operational' }),
  getPlatformBenchmarks: jest.fn().mockResolvedValue({ benchmarks: {}, period: '30d' }),
  getIndustryTrends: jest.fn().mockResolvedValue({ trends: [], totalCount: 0 }),
  getRegionalAnalysis: jest.fn().mockResolvedValue({ region: 'TX', supply: 100, demand: 50 }),
  getSeasonalPatterns: jest.fn().mockResolvedValue({ patterns: [], peakMonth: 'March' }),
  compareCarriers: jest.fn().mockResolvedValue({ carriers: [] }),
  getDriverMarketValue: jest.fn().mockResolvedValue({ estimatedPayRange: { min: 50000, max: 80000 } })
}));

jest.mock('backend/adminObservabilityAgentService', () => ({
  getTracingDashboard: jest.fn().mockResolvedValue({ health: {}, agentBehavior: {} }),
  getToolPerformance: jest.fn().mockResolvedValue({ tools: [] }),
  getScoringAccuracy: jest.fn().mockResolvedValue({ stats: {}, trends: [] }),
  recalibrateScoring: jest.fn().mockResolvedValue({ success: true, newWeights: {} }),
  getAgentReplay: jest.fn().mockResolvedValue({ run: {}, steps: [], gates: [] })
}));

jest.mock('backend/externalApiAgentService', () => ({
  querySafetyApi: jest.fn().mockResolvedValue({ safety: {} }),
  queryIntelApi: jest.fn().mockResolvedValue({ intelligence: {} }),
  queryOpsApi: jest.fn().mockResolvedValue({ operations: {} }),
  queryMatchingApi: jest.fn().mockResolvedValue({ matching: {} }),
  queryDocumentApi: jest.fn().mockResolvedValue({ document: {} }),
  queryEngagementApi: jest.fn().mockResolvedValue({ engagement: {} }),
  getApiUsage: jest.fn().mockResolvedValue({ usage: {} }),
  getApiHealth: jest.fn().mockResolvedValue({ apis: [] }),
  configureApiKey: jest.fn().mockResolvedValue({ success: true }),
  testApiEndpoint: jest.fn().mockResolvedValue({ success: true, statusCode: 200 })
}));

jest.mock('backend/financialExtAgentService', () => ({
  trackExpenses: jest.fn().mockResolvedValue({ expenseId: 'exp1' }),
  getExpenseReport: jest.fn().mockResolvedValue({ summary: {} }),
  getSettlementDetail: jest.fn().mockResolvedValue({ settlement: {} }),
  calculateTripCost: jest.fn().mockResolvedValue({ breakdown: {} }),
  getTaxSummary: jest.fn().mockResolvedValue({ taxSummary: {} }),
  getIrsPerDiem: jest.fn().mockResolvedValue({ rates: {} }),
  getFuelTaxReport: jest.fn().mockResolvedValue({ report: {} }),
  estimateTakeHome: jest.fn().mockResolvedValue({ estimatedTakeHome: 3500 })
}));

jest.mock('backend/lifecycleOpsAgentService', () => ({
  getDriverTimeline: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  getCarrierTimeline: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  updateDisposition: jest.fn().mockResolvedValue({ updated: true }),
  getDispositionOptions: jest.fn().mockResolvedValue({ dispositions: [] }),
  createExitSurvey: jest.fn().mockResolvedValue({ success: true, surveyId: 'srv1' }),
  getSurveyResponses: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
  submitAlgorithmFeedback: jest.fn().mockResolvedValue({ success: true, feedbackId: 'fb1' }),
  getFeedbackSummary: jest.fn().mockResolvedValue({ summary: {} }),
  getLifecycleAnalytics: jest.fn().mockResolvedValue({ analytics: {} }),
  getCohortRetention: jest.fn().mockResolvedValue({ cohorts: [] })
}));

// ── Shared mocks (same as Phase 1-4 tests) ──

jest.mock('backend/agentRunLedgerService', () => ({
  startRun: jest.fn().mockResolvedValue({ runId: 'run_1' }),
  logStep: jest.fn().mockResolvedValue({ stepId: 'step_1' }),
  createGate: jest.fn().mockResolvedValue({ gateId: 'gate_1' }),
  resolveGate: jest.fn().mockResolvedValue({ gateId: 'gate_1', decision: 'approved' }),
  completeRun: jest.fn().mockResolvedValue(undefined),
  getRun: jest.fn().mockResolvedValue({ runId: 'run_1' }),
  getSteps: jest.fn().mockResolvedValue([]),
  getGatesForRun: jest.fn().mockResolvedValue([]),
  getRunsByUser: jest.fn().mockResolvedValue([]),
  getRecentRuns: jest.fn().mockResolvedValue([]),
  logAgentAction: jest.fn().mockResolvedValue({ stepId: 'step_1' }),
  getApprovalGatesByDateRange: jest.fn().mockResolvedValue([])
}));

jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn().mockResolvedValue({ conversationId: 'conv_1' }),
  addTurn: jest.fn().mockResolvedValue({ turnId: 'turn_1' }),
  getRecentContext: jest.fn().mockResolvedValue([]),
  endConversation: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('backend/aiRouterService', () => ({
  routeRequest: jest.fn().mockResolvedValue({ text: 'AI response', tool_use: null })
}));

const { ACTION_REGISTRY, ROUTER_DEFINITIONS, executeTool } = require('backend/agentService');

// ── Phase 5 router names ──
const PHASE5_ROUTERS = ['cross_role_utility', 'observability_ops', 'external_api', 'financial_extended', 'lifecycle_ops'];

const PHASE5_COUNTS = {
  cross_role_utility: 10,
  observability_ops: 5,
  external_api: 10,
  financial_extended: 8,
  lifecycle_ops: 10
};

const PRE_PHASE5_ROUTERS = [
  'driver_cockpit', 'driver_road', 'driver_community', 'driver_compliance',
  'driver_financial', 'driver_lifecycle', 'driver_utility',
  'recruiter_outreach', 'recruiter_analytics', 'recruiter_onboarding',
  'recruiter_pipeline', 'recruiter_retention', 'recruiter_reverse_match',
  'carrier_fleet', 'carrier_compliance', 'carrier_communication',
  'carrier_journey', 'b2b_suite',
  'admin_business_ops', 'admin_platform_config', 'admin_portal',
  'admin_support', 'admin_gamification', 'admin_feature_adoption',
  'admin_meta_ads_governance'
];

describe('Phase 5: Cross-Role Routers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('ACTION_REGISTRY completeness', () => {
    it('should contain all 5 Phase 5 routers', () => {
      for (const router of PHASE5_ROUTERS) {
        expect(ACTION_REGISTRY).toHaveProperty(router);
      }
    });

    it('should have exactly 43 total actions across all 5 routers', () => {
      let total = 0;
      for (const router of PHASE5_ROUTERS) {
        total += Object.keys(ACTION_REGISTRY[router]).length;
      }
      expect(total).toBe(43);
    });

    // ── Per-router action count and individual action checks ──

    describe('ACTION_REGISTRY.cross_role_utility', () => {
      it('should have exactly 10 actions', () => {
        expect(Object.keys(ACTION_REGISTRY.cross_role_utility)).toHaveLength(10);
      });
      const actions = ['get_mutual_interest', 'get_retention_for_carrier', 'get_match_explanation',
        'get_recruiter_health', 'get_platform_benchmarks', 'get_industry_trends',
        'get_regional_analysis', 'get_seasonal_patterns', 'compare_carriers', 'get_driver_market_value'];
      for (const action of actions) {
        it(`should have action '${action}'`, () => {
          expect(ACTION_REGISTRY.cross_role_utility).toHaveProperty(action);
          const entry = ACTION_REGISTRY.cross_role_utility[action];
          expect(entry).toHaveProperty('serviceModule');
          expect(entry).toHaveProperty('serviceFunction');
          expect(entry).toHaveProperty('argMapping');
          expect(entry).toHaveProperty('policy');
        });
      }
    });

    describe('ACTION_REGISTRY.observability_ops', () => {
      it('should have exactly 5 actions', () => {
        expect(Object.keys(ACTION_REGISTRY.observability_ops)).toHaveLength(5);
      });
      const actions = ['get_tracing_dashboard', 'get_tool_performance', 'get_scoring_accuracy',
        'recalibrate_scoring', 'get_agent_replay'];
      for (const action of actions) {
        it(`should have action '${action}'`, () => {
          expect(ACTION_REGISTRY.observability_ops).toHaveProperty(action);
        });
      }
    });

    describe('ACTION_REGISTRY.external_api', () => {
      it('should have exactly 10 actions', () => {
        expect(Object.keys(ACTION_REGISTRY.external_api)).toHaveLength(10);
      });
      const actions = ['query_safety_api', 'query_intel_api', 'query_ops_api', 'query_matching_api',
        'query_document_api', 'query_engagement_api', 'get_api_usage', 'get_api_health',
        'configure_api_key', 'test_api_endpoint'];
      for (const action of actions) {
        it(`should have action '${action}'`, () => {
          expect(ACTION_REGISTRY.external_api).toHaveProperty(action);
        });
      }
    });

    describe('ACTION_REGISTRY.financial_extended', () => {
      it('should have exactly 8 actions', () => {
        expect(Object.keys(ACTION_REGISTRY.financial_extended)).toHaveLength(8);
      });
      const actions = ['track_expenses', 'get_expense_report', 'get_settlement_detail',
        'calculate_trip_cost', 'get_tax_summary', 'get_irs_per_diem',
        'get_fuel_tax_report', 'estimate_take_home'];
      for (const action of actions) {
        it(`should have action '${action}'`, () => {
          expect(ACTION_REGISTRY.financial_extended).toHaveProperty(action);
        });
      }
    });

    describe('ACTION_REGISTRY.lifecycle_ops', () => {
      it('should have exactly 10 actions', () => {
        expect(Object.keys(ACTION_REGISTRY.lifecycle_ops)).toHaveLength(10);
      });
      const actions = ['get_driver_timeline', 'get_carrier_timeline', 'update_disposition',
        'get_disposition_options', 'create_exit_survey', 'get_survey_responses',
        'submit_algorithm_feedback', 'get_feedback_summary', 'get_lifecycle_analytics', 'get_cohort_retention'];
      for (const action of actions) {
        it(`should have action '${action}'`, () => {
          expect(ACTION_REGISTRY.lifecycle_ops).toHaveProperty(action);
        });
      }
    });
  });

  describe('ROUTER_DEFINITIONS completeness', () => {
    it('should contain all 5 Phase 5 router definitions', () => {
      for (const router of PHASE5_ROUTERS) {
        expect(ROUTER_DEFINITIONS).toHaveProperty(router);
      }
    });

    for (const router of PHASE5_ROUTERS) {
      describe(`ROUTER_DEFINITIONS.${router}`, () => {
        it('should have name matching the key', () => {
          expect(ROUTER_DEFINITIONS[router].name).toBe(router);
        });
        it('should have a non-empty description', () => {
          expect(ROUTER_DEFINITIONS[router].description.length).toBeGreaterThan(10);
        });
        it('should have input_schema with action enum', () => {
          const schema = ROUTER_DEFINITIONS[router].input_schema;
          expect(schema).toBeDefined();
          expect(schema.properties.action.enum).toBeDefined();
          expect(schema.properties.action.enum.length).toBeGreaterThan(0);
        });
        it('should have roles array', () => {
          expect(Array.isArray(ROUTER_DEFINITIONS[router].roles)).toBe(true);
          expect(ROUTER_DEFINITIONS[router].roles.length).toBeGreaterThan(0);
        });
        it('should have action enum matching ACTION_REGISTRY actions', () => {
          const enumActions = ROUTER_DEFINITIONS[router].input_schema.properties.action.enum;
          const registryActions = Object.keys(ACTION_REGISTRY[router]);
          expect(enumActions.sort()).toEqual(registryActions.sort());
        });
      });
    }
  });

  describe('Multi-role access', () => {
    it('cross_role_utility should be available to all 4 roles', () => {
      expect(ROUTER_DEFINITIONS.cross_role_utility.roles).toEqual(
        expect.arrayContaining(['driver', 'recruiter', 'carrier', 'admin'])
      );
    });
    it('observability_ops should be admin-only', () => {
      expect(ROUTER_DEFINITIONS.observability_ops.roles).toEqual(['admin']);
    });
    it('external_api should be available to all 4 roles', () => {
      expect(ROUTER_DEFINITIONS.external_api.roles).toEqual(
        expect.arrayContaining(['admin', 'recruiter', 'carrier', 'driver'])
      );
    });
    it('financial_extended should be available to driver and carrier', () => {
      expect(ROUTER_DEFINITIONS.financial_extended.roles).toEqual(
        expect.arrayContaining(['driver', 'carrier'])
      );
    });
    it('lifecycle_ops should be available to driver, recruiter, and admin', () => {
      expect(ROUTER_DEFINITIONS.lifecycle_ops.roles).toEqual(
        expect.arrayContaining(['driver', 'recruiter', 'admin'])
      );
    });
  });

  describe('Policy correctness', () => {
    for (const router of PHASE5_ROUTERS) {
      describe(`${router} policies`, () => {
        const actions = Object.entries(ACTION_REGISTRY[router]);
        for (const [actionName, entry] of actions) {
          it(`${actionName} should have a valid risk_level`, () => {
            expect(['read', 'execute_low', 'execute_high']).toContain(entry.policy.risk_level);
          });
        }
        it('execute_high actions should require approval', () => {
          for (const [, entry] of actions) {
            if (entry.policy.risk_level === 'execute_high') {
              expect(entry.policy.requires_approval).toBe(true);
            }
          }
        });
        it('read actions should not require approval', () => {
          for (const [, entry] of actions) {
            if (entry.policy.risk_level === 'read') {
              expect(entry.policy.requires_approval).toBe(false);
            }
          }
        });
        it('every action should have a rate_limit', () => {
          for (const [, entry] of actions) {
            expect(entry.policy.rate_limit).toBeGreaterThan(0);
          }
        });
      });
    }
  });

  describe('cross_role_utility router dispatch', () => {
    const readActions = [
      ['get_mutual_interest', 'getMutualInterest'],
      ['get_retention_for_carrier', 'getRetentionForCarrier'],
      ['get_match_explanation', 'getMatchExplanation'],
      ['get_recruiter_health', 'getRecruiterHealth'],
      ['get_platform_benchmarks', 'getPlatformBenchmarks'],
      ['get_industry_trends', 'getIndustryTrends'],
      ['get_regional_analysis', 'getRegionalAnalysis'],
      ['get_seasonal_patterns', 'getSeasonalPatterns'],
      ['compare_carriers', 'compareCarriers'],
      ['get_driver_market_value', 'getDriverMarketValue'],
    ];
    for (const [action, fn] of readActions) {
      it(`${action} dispatches to crossRoleUtilityAgentService.${fn}`, async () => {
        const svc = require('backend/crossRoleUtilityAgentService');
        const result = await executeTool('cross_role_utility', { action, params: {} }, { userId: 'u1', role: 'driver', runId: 'r1' });
        expect(result.error).toBeUndefined();
        expect(svc[fn]).toHaveBeenCalled();
      });
    }
    it('unknown action returns error', async () => {
      const result = await executeTool('cross_role_utility', { action: 'nonexistent', params: {} }, { userId: 'u1', role: 'driver', runId: 'r1' });
      expect(result.error || result.message).toBeDefined();
    });
  });

  describe('observability_ops router dispatch', () => {
    const readActions = [
      ['get_tracing_dashboard', 'getTracingDashboard'],
      ['get_tool_performance', 'getToolPerformance'],
      ['get_scoring_accuracy', 'getScoringAccuracy'],
      ['get_agent_replay', 'getAgentReplay'],
    ];
    for (const [action, fn] of readActions) {
      it(`${action} dispatches to adminObservabilityAgentService.${fn}`, async () => {
        const svc = require('backend/adminObservabilityAgentService');
        const result = await executeTool('observability_ops', { action, params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
        expect(result.error).toBeUndefined();
        expect(svc[fn]).toHaveBeenCalled();
      });
    }
    it('recalibrate_scoring returns approval_required (execute_high)', async () => {
      const result = await executeTool('observability_ops', { action: 'recalibrate_scoring', params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
      expect(result.approval_required || result.gateId).toBeDefined();
    });
  });

  describe('external_api router dispatch', () => {
    const readActions = [
      ['query_safety_api', 'querySafetyApi'],
      ['query_intel_api', 'queryIntelApi'],
      ['query_ops_api', 'queryOpsApi'],
      ['query_matching_api', 'queryMatchingApi'],
      ['query_document_api', 'queryDocumentApi'],
      ['query_engagement_api', 'queryEngagementApi'],
      ['get_api_usage', 'getApiUsage'],
      ['get_api_health', 'getApiHealth'],
    ];
    for (const [action, fn] of readActions) {
      it(`${action} dispatches to externalApiAgentService.${fn}`, async () => {
        const svc = require('backend/externalApiAgentService');
        const result = await executeTool('external_api', { action, params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
        expect(result.error).toBeUndefined();
        expect(svc[fn]).toHaveBeenCalled();
      });
    }
    it('configure_api_key returns approval_required (execute_high)', async () => {
      const result = await executeTool('external_api', { action: 'configure_api_key', params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
      expect(result.approval_required || result.gateId).toBeDefined();
    });
    it('test_api_endpoint dispatches (execute_low, no approval)', async () => {
      const svc = require('backend/externalApiAgentService');
      const result = await executeTool('external_api', { action: 'test_api_endpoint', params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
      expect(result.error).toBeUndefined();
      expect(svc.testApiEndpoint).toHaveBeenCalled();
    });
  });

  describe('financial_extended router dispatch', () => {
    const readActions = [
      ['get_expense_report', 'getExpenseReport'],
      ['get_settlement_detail', 'getSettlementDetail'],
      ['calculate_trip_cost', 'calculateTripCost'],
      ['get_tax_summary', 'getTaxSummary'],
      ['get_irs_per_diem', 'getIrsPerDiem'],
      ['get_fuel_tax_report', 'getFuelTaxReport'],
      ['estimate_take_home', 'estimateTakeHome'],
    ];
    for (const [action, fn] of readActions) {
      it(`${action} dispatches to financialExtAgentService.${fn}`, async () => {
        const svc = require('backend/financialExtAgentService');
        const result = await executeTool('financial_extended', { action, params: {} }, { userId: 'u1', role: 'driver', runId: 'r1' });
        expect(result.error).toBeUndefined();
        expect(svc[fn]).toHaveBeenCalled();
      });
    }
    it('track_expenses dispatches (execute_low, no approval)', async () => {
      const svc = require('backend/financialExtAgentService');
      const result = await executeTool('financial_extended', { action: 'track_expenses', params: {} }, { userId: 'u1', role: 'driver', runId: 'r1' });
      expect(result.error).toBeUndefined();
      expect(svc.trackExpenses).toHaveBeenCalled();
    });
  });

  describe('lifecycle_ops router dispatch', () => {
    const readActions = [
      ['get_driver_timeline', 'getDriverTimeline'],
      ['get_carrier_timeline', 'getCarrierTimeline'],
      ['get_disposition_options', 'getDispositionOptions'],
      ['get_survey_responses', 'getSurveyResponses'],
      ['get_feedback_summary', 'getFeedbackSummary'],
      ['get_lifecycle_analytics', 'getLifecycleAnalytics'],
      ['get_cohort_retention', 'getCohortRetention'],
    ];
    for (const [action, fn] of readActions) {
      it(`${action} dispatches to lifecycleOpsAgentService.${fn}`, async () => {
        const svc = require('backend/lifecycleOpsAgentService');
        const result = await executeTool('lifecycle_ops', { action, params: {} }, { userId: 'u1', role: 'recruiter', runId: 'r1' });
        expect(result.error).toBeUndefined();
        expect(svc[fn]).toHaveBeenCalled();
      });
    }
    it('update_disposition dispatches (execute_low, no approval)', async () => {
      const svc = require('backend/lifecycleOpsAgentService');
      const result = await executeTool('lifecycle_ops', { action: 'update_disposition', params: {} }, { userId: 'u1', role: 'recruiter', runId: 'r1' });
      expect(result.error).toBeUndefined();
      expect(svc.updateDisposition).toHaveBeenCalled();
    });
    it('submit_algorithm_feedback dispatches (execute_low, no approval)', async () => {
      const svc = require('backend/lifecycleOpsAgentService');
      const result = await executeTool('lifecycle_ops', { action: 'submit_algorithm_feedback', params: {} }, { userId: 'u1', role: 'driver', runId: 'r1' });
      expect(result.error).toBeUndefined();
      expect(svc.submitAlgorithmFeedback).toHaveBeenCalled();
    });
    it('create_exit_survey returns approval_required (execute_high)', async () => {
      const result = await executeTool('lifecycle_ops', { action: 'create_exit_survey', params: {} }, { userId: 'u1', role: 'recruiter', runId: 'r1' });
      expect(result.approval_required || result.gateId).toBeDefined();
    });
  });

  describe('Phase 5 approval gates', () => {
    const gatedActions = [
      ['observability_ops', 'recalibrate_scoring'],
      ['external_api', 'configure_api_key'],
      ['lifecycle_ops', 'create_exit_survey'],
    ];
    for (const [router, action] of gatedActions) {
      it(`${router}.${action} returns approval_required without approvedGateId`, async () => {
        const result = await executeTool(router, { action, params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
        expect(result.approval_required || result.gateId).toBeDefined();
      });
    }
    it('execute_high with approvedGateId bypasses gate (observability_ops.recalibrate_scoring)', async () => {
      const svc = require('backend/adminObservabilityAgentService');
      const result = await executeTool('observability_ops',
        { action: 'recalibrate_scoring', params: {} },
        { userId: 'bypass_gate_user', role: 'admin', runId: 'r1', approvedGateId: 'gate_pre_approved' });
      expect(result.approval_required).toBeUndefined();
      expect(svc.recalibrateScoring).toHaveBeenCalled();
    });
    it('non-gated execute_low actions proceed without approval', async () => {
      const svc = require('backend/externalApiAgentService');
      const result = await executeTool('external_api',
        { action: 'test_api_endpoint', params: {} },
        { userId: 'u1', role: 'admin', runId: 'r1' });
      expect(result.approval_required).toBeUndefined();
      expect(svc.testApiEndpoint).toHaveBeenCalled();
    });
  });

  describe('Phase 5 router rate limiting', () => {
    it('blocks after exceeding rate_limit on cross_role_utility.get_mutual_interest', async () => {
      const ctx = { userId: 'rate_test_user', role: 'driver', runId: 'r1' };
      // rate_limit is 10, call 11 times
      for (let i = 0; i < 10; i++) {
        await executeTool('cross_role_utility', { action: 'get_mutual_interest', params: {} }, ctx);
      }
      const result = await executeTool('cross_role_utility', { action: 'get_mutual_interest', params: {} }, ctx);
      expect(result.error || result.rate_limited).toBeDefined();
    });

    it('blocks after exceeding rate_limit on observability_ops.recalibrate_scoring (rate_limit: 3)', async () => {
      const ctx = { userId: 'rate_obs_user', role: 'admin', runId: 'r1' };
      for (let i = 0; i < 3; i++) {
        await executeTool('observability_ops', { action: 'recalibrate_scoring', params: {}, approvedGateId: `gate_${i}` }, ctx);
      }
      const result = await executeTool('observability_ops', { action: 'recalibrate_scoring', params: {}, approvedGateId: 'gate_extra' }, ctx);
      expect(result.error || result.rate_limited).toBeDefined();
    });

    it('every Phase 5 action has a rate_limit defined', () => {
      for (const router of PHASE5_ROUTERS) {
        for (const [actionName, entry] of Object.entries(ACTION_REGISTRY[router])) {
          expect(entry.policy.rate_limit).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('No collision with existing routers', () => {
    it('Phase 5 router names should not overlap with pre-Phase 5 names', () => {
      for (const router of PHASE5_ROUTERS) {
        expect(PRE_PHASE5_ROUTERS).not.toContain(router);
      }
    });
    it('pre-Phase 5 routers should still exist in ACTION_REGISTRY', () => {
      for (const router of PRE_PHASE5_ROUTERS) {
        expect(ACTION_REGISTRY).toHaveProperty(router);
      }
    });
  });

  describe('Edge cases', () => {
    it('unknown action in Phase 5 router returns error', async () => {
      const result = await executeTool('lifecycle_ops', { action: 'nonexistent_action', params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
      expect(result.error || result.message).toBeDefined();
    });
    it('unknown Phase 5 router falls through to flat tool lookup and errors', async () => {
      const result = await executeTool('nonexistent_phase5_router', { action: 'test', params: {} }, { userId: 'u1', role: 'admin', runId: 'r1' });
      expect(result.error || result.message).toBeDefined();
    });
    it('router call without action falls through to flat tool lookup', async () => {
      const result = await executeTool('cross_role_utility', {}, { userId: 'u1', role: 'driver', runId: 'r1' });
      expect(result.error || result.message).toBeDefined();
    });
    it('router call with no userId skips rate limiting', async () => {
      const result = await executeTool('cross_role_utility', { action: 'get_platform_benchmarks', params: {} }, { role: 'admin', runId: 'r1' });
      expect(result.error).toBeUndefined();
    });
  });
});
