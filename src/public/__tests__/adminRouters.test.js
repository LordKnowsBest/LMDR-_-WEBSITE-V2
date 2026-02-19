/**
 * Phase 4: Admin Router Integration Tests
 * Validates ACTION_REGISTRY entries, ROUTER_DEFINITIONS, and service export alignment
 * for the 6 new admin routers (52 actions total).
 */

// ── Mock all dependencies of agentService.jsw ──
jest.mock('backend/aiRouterService', () => ({ routeAIRequest: jest.fn() }));
jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(), addTurn: jest.fn(), getRecentContext: jest.fn()
}));
jest.mock('backend/agentRunLedgerService', () => ({
  startRun: jest.fn(), logStep: jest.fn(), createGate: jest.fn(), resolveGate: jest.fn(), completeRun: jest.fn()
}));
jest.mock('backend/agentOutcomeService', () => ({ evaluateRun: jest.fn(), getOutcomeStats: jest.fn() }));
jest.mock('backend/dataAccess', () => ({}));

// Legacy flat tool mocks
jest.mock('backend/carrierMatching', () => ({ findMatchingCarriers: jest.fn() }));
jest.mock('backend/aiEnrichment', () => ({ enrichCarrier: jest.fn() }));
jest.mock('backend/matchExplanationService', () => ({ getMatchExplanationForDriver: jest.fn() }));
jest.mock('backend/externalFmcsaApi', () => ({ getCarrierSafety: jest.fn() }));
jest.mock('backend/roadConditionService', () => ({ getRoadConditions: jest.fn() }));
jest.mock('backend/parkingService', () => ({ searchParking: jest.fn() }));
jest.mock('backend/driverMatching', () => ({ findMatchingDrivers: jest.fn() }));
jest.mock('backend/recruiter_service', () => ({ getPipelineCandidates: jest.fn(), updateCandidateStatus: jest.fn() }));
jest.mock('backend/messaging', () => ({ sendMessage: jest.fn() }));
jest.mock('backend/interviewScheduler', () => ({ requestAvailability: jest.fn() }));
jest.mock('backend/callOutcomeService', () => ({ logCallOutcome: jest.fn() }));
jest.mock('backend/recruiterAnalyticsService', () => ({ getFunnelMetrics: jest.fn() }));
jest.mock('backend/observabilityService', () => ({ getMetrics: jest.fn() }));
jest.mock('backend/admin_service', () => ({ getDrivers: jest.fn() }));
jest.mock('backend/promptLibraryService', () => ({ getPrompts: jest.fn(), getActivePrompt: jest.fn(), createPrompt: jest.fn(), updatePrompt: jest.fn() }));
jest.mock('backend/b2bAccountService', () => ({ getAccount: jest.fn() }));
jest.mock('backend/b2bMatchSignalService', () => ({ getSignals: jest.fn() }));
jest.mock('backend/b2bPipelineService', () => ({ getOpportunities: jest.fn() }));

const { ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

// ── Expected Phase 4 router shapes ──
const PHASE4_ROUTERS = {
  admin_business_ops: {
    actions: [
      'get_revenue_dashboard', 'get_billing_overview', 'get_invoices', 'create_invoice',
      'get_commission_report', 'approve_commission', 'get_mrr_metrics', 'get_churn_metrics',
      'get_arpu_breakdown', 'export_financial_report'
    ],
    serviceModule: 'backend/adminBusinessOpsAgentService',
    expectedCount: 10
  },
  admin_platform_config: {
    actions: [
      'get_feature_flags', 'toggle_feature_flag', 'get_ab_tests', 'create_ab_test',
      'get_email_templates', 'update_email_template', 'get_notification_rules',
      'update_notification_rule', 'get_platform_config', 'update_platform_config'
    ],
    serviceModule: 'backend/adminPlatformConfigAgentService',
    expectedCount: 10
  },
  admin_portal: {
    actions: [
      'get_admin_dashboard', 'get_user_list', 'get_user_detail', 'suspend_user',
      'unsuspend_user', 'get_moderation_queue', 'moderate_content', 'get_ai_dashboard',
      'get_compliance_audit', 'get_login_activity'
    ],
    serviceModule: 'backend/adminPortalAgentService',
    expectedCount: 10
  },
  admin_support: {
    actions: [
      'get_support_tickets', 'get_ticket_detail', 'update_ticket_status', 'assign_ticket',
      'get_knowledge_base', 'create_kb_article', 'get_nps_scores', 'get_csat_report'
    ],
    serviceModule: 'backend/adminSupportAgentService',
    expectedCount: 8
  },
  admin_gamification: {
    actions: [
      'get_gamification_config', 'update_xp_rules', 'get_achievement_list', 'create_achievement',
      'create_challenge', 'get_active_challenges', 'get_global_leaderboard', 'get_gamification_analytics'
    ],
    serviceModule: 'backend/adminGamificationAgentService',
    expectedCount: 8
  },
  admin_feature_adoption: {
    actions: [
      'get_feature_adoption', 'get_adoption_funnels', 'get_feature_health',
      'get_stickiness_metrics', 'get_adoption_cohorts', 'create_adoption_campaign'
    ],
    serviceModule: 'backend/adminFeatureAdoptionAgentService',
    expectedCount: 6
  }
};

describe('Phase 4: Admin Routers', () => {

  describe('ACTION_REGISTRY completeness', () => {
    const routerNames = Object.keys(PHASE4_ROUTERS);

    it('should contain all 6 Phase 4 admin routers', () => {
      routerNames.forEach(name => {
        expect(ACTION_REGISTRY).toHaveProperty(name);
      });
    });

    it('should have exactly 52 total actions across all 6 routers', () => {
      let total = 0;
      routerNames.forEach(name => {
        total += Object.keys(ACTION_REGISTRY[name]).length;
      });
      expect(total).toBe(52);
    });

    routerNames.forEach(routerName => {
      const expected = PHASE4_ROUTERS[routerName];

      describe(`ACTION_REGISTRY.${routerName}`, () => {
        it(`should have exactly ${expected.expectedCount} actions`, () => {
          expect(Object.keys(ACTION_REGISTRY[routerName]).length).toBe(expected.expectedCount);
        });

        expected.actions.forEach(actionName => {
          it(`should have action '${actionName}'`, () => {
            const action = ACTION_REGISTRY[routerName][actionName];
            expect(action).toBeDefined();
            expect(action.serviceModule).toBe(expected.serviceModule);
            expect(action.argMapping).toEqual(['userId', 'params']);
            expect(action.policy).toBeDefined();
            expect(action.policy.risk_level).toBeDefined();
            expect(typeof action.policy.requires_approval).toBe('boolean');
            expect(typeof action.policy.rate_limit).toBe('number');
          });
        });
      });
    });
  });

  describe('ROUTER_DEFINITIONS completeness', () => {
    const routerNames = Object.keys(PHASE4_ROUTERS);

    it('should contain all 6 Phase 4 admin router definitions', () => {
      routerNames.forEach(name => {
        expect(ROUTER_DEFINITIONS).toHaveProperty(name);
      });
    });

    routerNames.forEach(routerName => {
      const expected = PHASE4_ROUTERS[routerName];

      describe(`ROUTER_DEFINITIONS.${routerName}`, () => {
        it('should have name matching the key', () => {
          expect(ROUTER_DEFINITIONS[routerName].name).toBe(routerName);
        });

        it('should have a non-empty description', () => {
          expect(ROUTER_DEFINITIONS[routerName].description.length).toBeGreaterThan(10);
        });

        it('should have input_schema with action enum', () => {
          const schema = ROUTER_DEFINITIONS[routerName].input_schema;
          expect(schema).toBeDefined();
          expect(schema.type).toBe('object');
          expect(schema.properties.action).toBeDefined();
          expect(schema.properties.action.enum).toBeDefined();
          expect(schema.properties.params).toBeDefined();
          expect(schema.required).toContain('action');
        });

        it('should have roles restricted to admin', () => {
          expect(ROUTER_DEFINITIONS[routerName].roles).toEqual(['admin']);
        });

        it('should have action enum matching ACTION_REGISTRY actions', () => {
          const enumActions = ROUTER_DEFINITIONS[routerName].input_schema.properties.action.enum;
          const registryActions = Object.keys(ACTION_REGISTRY[routerName]);
          expect(enumActions.sort()).toEqual(registryActions.sort());
        });
      });
    });
  });

  describe('Policy correctness', () => {
    const VALID_RISK_LEVELS = ['read', 'suggest', 'execute_low', 'execute_high'];

    Object.entries(PHASE4_ROUTERS).forEach(([routerName, expected]) => {
      describe(`${routerName} policies`, () => {
        expected.actions.forEach(actionName => {
          it(`${actionName} should have a valid risk_level`, () => {
            const policy = ACTION_REGISTRY[routerName][actionName].policy;
            expect(VALID_RISK_LEVELS).toContain(policy.risk_level);
          });
        });

        it('execute_high actions should require approval', () => {
          expected.actions.forEach(actionName => {
            const policy = ACTION_REGISTRY[routerName][actionName].policy;
            if (policy.risk_level === 'execute_high') {
              expect(policy.requires_approval).toBe(true);
            }
          });
        });

        it('read actions should not require approval', () => {
          expected.actions.forEach(actionName => {
            const policy = ACTION_REGISTRY[routerName][actionName].policy;
            if (policy.risk_level === 'read') {
              expect(policy.requires_approval).toBe(false);
            }
          });
        });
      });
    });
  });

  describe('No collision with existing routers', () => {
    const phase4Names = Object.keys(PHASE4_ROUTERS);
    const prePhase4Routers = [
      'driver_cockpit', 'driver_road', 'driver_community', 'driver_compliance',
      'driver_financial', 'driver_lifecycle', 'driver_utility',
      'admin_meta_ads_governance',
      'recruiter_outreach', 'recruiter_analytics', 'recruiter_onboarding',
      'recruiter_pipeline', 'recruiter_retention', 'recruiter_reverse_match',
      'carrier_fleet', 'carrier_compliance', 'carrier_communication', 'carrier_journey',
      'b2b_suite'
    ];

    it('Phase 4 router names should not overlap with pre-Phase 4 names', () => {
      phase4Names.forEach(name => {
        expect(prePhase4Routers).not.toContain(name);
      });
    });

    it('pre-Phase 4 routers should still exist in ACTION_REGISTRY', () => {
      prePhase4Routers.forEach(name => {
        expect(ACTION_REGISTRY).toHaveProperty(name);
      });
    });
  });
});
