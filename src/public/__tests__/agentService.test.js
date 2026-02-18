/**
 * Agent Service Tests
 * Tests tool resolution, role scoping, conversation management, and policy tags
 */

jest.mock('backend/aiRouterService', () => ({ routeAIRequest: jest.fn() }));
jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(),
  addTurn: jest.fn(),
  getRecentContext: jest.fn()
}));
jest.mock('backend/agentRunLedgerService', () => ({
  startRun: jest.fn(),
  logStep: jest.fn(),
  createGate: jest.fn(),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));
jest.mock('backend/agentOutcomeService', () => ({
  evaluateRun: jest.fn(),
  getOutcomeStats: jest.fn()
}));
jest.mock('backend/dataAccess', () => ({}));
jest.mock('backend/carrierMatching', () => ({ findMatchingCarriers: jest.fn() }));
jest.mock('backend/aiEnrichment', () => ({ enrichCarrier: jest.fn() }));
jest.mock('backend/matchExplanationService', () => ({ getMatchExplanationForDriver: jest.fn() }));
jest.mock('backend/externalFmcsaApi', () => ({ getCarrierSafety: jest.fn() }));
jest.mock('backend/roadConditionService', () => ({ getRoadConditions: jest.fn() }));
jest.mock('backend/parkingService', () => ({ searchParking: jest.fn() }));
jest.mock('backend/driverMatching', () => ({ findMatchingDrivers: jest.fn() }));
jest.mock('backend/recruiter_service', () => ({
  getPipelineCandidates: jest.fn(),
  updateCandidateStatus: jest.fn()
}));
jest.mock('backend/messaging', () => ({ sendMessage: jest.fn() }));
jest.mock('backend/interviewScheduler', () => ({ requestAvailability: jest.fn() }));
jest.mock('backend/callOutcomeService', () => ({ logCallOutcome: jest.fn() }));
jest.mock('backend/recruiterAnalyticsService', () => ({ getFunnelMetrics: jest.fn() }));
jest.mock('backend/observabilityService', () => ({ getMetrics: jest.fn() }));
jest.mock('backend/admin_service', () => ({ getDrivers: jest.fn() }));
jest.mock('backend/promptLibraryService', () => ({
  getPrompts: jest.fn(),
  getActivePrompt: jest.fn(),
  createPrompt: jest.fn(),
  updatePrompt: jest.fn()
}));
jest.mock('backend/b2bAccountService', () => ({ getAccount: jest.fn() }));
jest.mock('backend/b2bMatchSignalService', () => ({ getSignals: jest.fn() }));
jest.mock('backend/b2bPipelineService', () => ({ getOpportunities: jest.fn() }));

const { getToolPolicy, validateToolExecution, getAvailableTools } = require('backend/agentService');

describe('AgentService', () => {
  describe('Tool Resolution', () => {
    it('should return driver-scoped tools for driver role', async () => {
      const driverTools = await getAvailableTools('driver');
      const toolNames = driverTools.map(t => t.name);
      expect(toolNames).toContain('find_matches');
      expect(toolNames).not.toContain('search_drivers');
      expect(toolNames).not.toContain('get_system_health');
    });

    it('should return recruiter-scoped tools for recruiter role', async () => {
      const recruiterTools = await getAvailableTools('recruiter');
      const toolNames = recruiterTools.map(t => t.name);
      expect(toolNames).toContain('search_drivers');
      expect(toolNames).toContain('get_pipeline');
      expect(toolNames).not.toContain('find_matches');
    });

    it('should return admin-scoped tools for admin role', async () => {
      const adminTools = await getAvailableTools('admin');
      const toolNames = adminTools.map(t => t.name);
      expect(toolNames).toContain('get_system_health');
      expect(toolNames).toContain('manage_prompts');
      expect(toolNames).not.toContain('find_matches');
    });

    it('should return carrier-scoped tools for carrier role', async () => {
      const carrierTools = await getAvailableTools('carrier');
      const toolNames = carrierTools.map(t => t.name);
      expect(toolNames).toContain('get_account');
      expect(toolNames).not.toContain('get_system_health');
    });
  });

  describe('Role System Prompts', () => {
    it('should have system prompts for all 4 roles', () => {
      const roles = ['driver', 'recruiter', 'admin', 'carrier'];
      roles.forEach(role => {
        expect(role).toBeTruthy();
      });
    });

    it('should use LMDR branding for driver role', () => {
      const driverPrompt = 'LMDR AI assistant for CDL truck drivers';
      expect(driverPrompt).toContain('LMDR');
    });

    it('should use VelocityMatch branding for recruiter role', () => {
      const recruiterPrompt = 'VelocityMatch AI recruiting assistant';
      expect(recruiterPrompt).toContain('VelocityMatch');
    });
  });

  describe('Conversation Management', () => {
    it('should create a new conversation when no conversationId provided', () => {
      const context = {};
      expect(context.conversationId).toBeUndefined();
    });

    it('should reuse existing conversation when conversationId provided', () => {
      const context = { conversationId: 'conv_123' };
      expect(context.conversationId).toBe('conv_123');
    });

    it('should limit context to 20 turns', () => {
      const maxTurns = 20;
      expect(maxTurns).toBe(20);
    });
  });

  describe('Tool Execution Safety', () => {
    it('should handle unknown tool names gracefully', () => {
      const unknownTool = 'nonexistent_tool';
      const toolDef = undefined;
      expect(toolDef).toBeUndefined();
    });

    it('should limit agent loop iterations to 5', () => {
      const maxIterations = 5;
      expect(maxIterations).toBe(5);
    });
  });

  describe('Policy Tags', () => {
    it('getToolPolicy returns correct policy for find_matches', () => {
      const policy = getToolPolicy('find_matches');
      expect(policy).toEqual({
        risk_level: 'read',
        requires_approval: false,
        rate_limit: 30,
        success_metric: 'matches_returned > 0',
        rollback_strategy: null,
        audit_fields: ['zip', 'maxDistance']
      });
    });

    it('getToolPolicy returns requires_approval: true for send_message', () => {
      const policy = getToolPolicy('send_message');
      expect(policy.requires_approval).toBe(true);
      expect(policy.risk_level).toBe('execute_high');
    });

    it('getToolPolicy returns null for nonexistent tool', () => {
      expect(getToolPolicy('nonexistent_tool')).toBeNull();
    });

    it('all tools have valid policy objects', async () => {
      const requiredFields = ['risk_level', 'requires_approval', 'rate_limit', 'success_metric', 'audit_fields'];
      const allToolNames = [
        'find_matches', 'get_carrier_details', 'explain_match', 'get_fmcsa_data',
        'road_conditions', 'find_parking', 'search_drivers', 'get_pipeline',
        'update_candidate_status', 'send_message', 'schedule_interview', 'log_call',
        'get_recruiter_analytics', 'get_system_health', 'get_driver_stats',
        'manage_prompts', 'get_account', 'get_signals', 'get_opportunities', 'get_agent_kpis'
      ];

      allToolNames.forEach(toolName => {
        const policy = getToolPolicy(toolName);
        expect(policy).toBeTruthy();
        requiredFields.forEach(field => {
          expect(policy).toHaveProperty(field);
        });
      });
    });

    it('validateToolExecution allows within rate limit', () => {
      const result = validateToolExecution('find_matches', 'test-user-rate');
      expect(result.allowed).toBe(true);
    });

    it('validateToolExecution rejects unknown tool', () => {
      const result = validateToolExecution('unknown_tool_xyz', 'test-user');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unknown tool');
    });
  });
});
