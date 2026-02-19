/**
 * Agent Service End-to-End Tests
 * Verifies orchestration loop behavior with mocked backend dependencies.
 */

jest.mock('backend/aiRouterService', () => ({
  routeAIRequest: jest.fn()
}));

jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(),
  addTurn: jest.fn(),
  getRecentContext: jest.fn()
}));

jest.mock('backend/carrierMatching', () => ({
  findMatchingCarriers: jest.fn()
}));

jest.mock('backend/dataAccess', () => ({}));

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

jest.mock('backend/messaging', () => ({
  sendMessage: jest.fn()
}));

jest.mock('backend/recruiter_service', () => ({
  getPipelineCandidates: jest.fn(),
  updateCandidateStatus: jest.fn()
}));

jest.mock('backend/b2bMatchSignalService', () => ({
  getSignals: jest.fn()
}));

// Additional service mocks needed by agentService tool definitions
jest.mock('backend/aiEnrichment', () => ({
  enrichCarrier: jest.fn()
}));
jest.mock('backend/matchExplanationService', () => ({
  getMatchExplanationForDriver: jest.fn()
}));
jest.mock('backend/externalFmcsaApi', () => ({
  getCarrierSafety: jest.fn()
}));
jest.mock('backend/roadConditionService', () => ({
  getRoadConditions: jest.fn()
}));
jest.mock('backend/parkingService', () => ({
  searchParking: jest.fn()
}));
jest.mock('backend/driverMatching', () => ({
  findMatchingDrivers: jest.fn()
}));
jest.mock('backend/interviewScheduler', () => ({
  requestAvailability: jest.fn()
}));
jest.mock('backend/callOutcomeService', () => ({
  logCallOutcome: jest.fn()
}));
jest.mock('backend/recruiterAnalyticsService', () => ({
  getFunnelMetrics: jest.fn()
}));
jest.mock('backend/observabilityService', () => ({
  getMetrics: jest.fn()
}));
jest.mock('backend/admin_service', () => ({
  getDrivers: jest.fn()
}));
jest.mock('backend/promptLibraryService', () => ({
  getPrompts: jest.fn(),
  getActivePrompt: jest.fn(),
  createPrompt: jest.fn(),
  updatePrompt: jest.fn()
}));
jest.mock('backend/b2bAccountService', () => ({
  getAccount: jest.fn()
}));
jest.mock('backend/b2bPipelineService', () => ({
  getOpportunities: jest.fn()
}));

const { routeAIRequest } = require('backend/aiRouterService');
const {
  createConversation,
  addTurn,
  getRecentContext
} = require('backend/agentConversationService');
const { findMatchingCarriers } = require('backend/carrierMatching');
const { startRun, logStep, createGate, resolveGate, completeRun } = require('backend/agentRunLedgerService');
const { evaluateRun } = require('backend/agentOutcomeService');
const { getSignals } = require('backend/b2bMatchSignalService');

const { handleAgentTurn, getAvailableTools, resumeAfterApproval } = require('backend/agentService');
const { getMetrics } = require('backend/observabilityService');
const { getPipelineCandidates } = require('backend/recruiter_service');

// Flush all pending microtasks / fire-and-forget promises
const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('AgentService E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createConversation.mockResolvedValue({ conversationId: 'conv-e2e-1' });
    getRecentContext.mockResolvedValue([]);
    startRun.mockResolvedValue({ runId: 'run-test-1' });
    logStep.mockResolvedValue({ stepId: 'step-test-1' });
    createGate.mockResolvedValue({ gateId: 'gate-test-1' });
    resolveGate.mockResolvedValue({ gateId: 'gate-test-1', decision: 'approved' });
    completeRun.mockResolvedValue(undefined);
    evaluateRun.mockResolvedValue({ quality_score: 75, objective_met: 'yes' });
  });

  it('completes a recruiter turn end-to-end without tool calls', async () => {
    routeAIRequest.mockResolvedValue({
      stopReason: 'end_turn',
      content: 'Recruiter summary ready.',
      contentBlocks: [{ type: 'text', text: 'Recruiter summary ready.' }],
      tokensUsed: 500
    });

    const result = await handleAgentTurn('recruiter', 'recruiter-123', 'Show pipeline status', {});

    expect(createConversation).toHaveBeenCalledWith('recruiter', 'recruiter-123');
    expect(routeAIRequest).toHaveBeenCalledTimes(1);
    expect(addTurn).toHaveBeenCalledWith('conv-e2e-1', 'user', 'Show pipeline status');
    expect(addTurn).toHaveBeenCalledWith('conv-e2e-1', 'assistant', 'Recruiter summary ready.');
    expect(result).toMatchObject({
      conversationId: 'conv-e2e-1',
      runId: 'run-test-1',
      response: 'Recruiter summary ready.',
      role: 'recruiter'
    });
  });

  it('completes a driver turn with a tool-use loop and tool execution', async () => {
    findMatchingCarriers.mockResolvedValue({ success: true, carriers: [{ dot: '1234567' }] });

    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use',
          id: 'tool_1',
          name: 'find_matches',
          input: {
            zip: '75001',
            maxDistance: 150,
            minCPM: 65,
            operationType: 'Regional'
          }
        }],
        tokensUsed: 300
      })
      .mockResolvedValueOnce({
        stopReason: 'end_turn',
        content: 'I found 1 match near 75001.',
        contentBlocks: [{ type: 'text', text: 'I found 1 match near 75001.' }],
        tokensUsed: 200
      });

    const result = await handleAgentTurn('driver', 'driver-42', 'Find me carriers near 75001', {});

    expect(findMatchingCarriers).toHaveBeenCalledWith({
      zip: '75001',
      maxDistance: 150,
      minCPM: 65,
      operationType: 'Regional'
    });
    expect(routeAIRequest).toHaveBeenCalledTimes(2);
    expect(addTurn).toHaveBeenCalledWith(
      'conv-e2e-1',
      'assistant',
      expect.stringContaining('find_matches'),
      expect.any(Array)
    );
    expect(result).toMatchObject({
      conversationId: 'conv-e2e-1',
      runId: 'run-test-1',
      response: 'I found 1 match near 75001.',
      role: 'driver'
    });
  });

  it('returns role-scoped tools through getAvailableTools', async () => {
    const carrierTools = await getAvailableTools('carrier');
    const toolNames = carrierTools.map((tool) => tool.name);

    expect(toolNames).toEqual(expect.arrayContaining([
      'get_account',
      'get_signals',
      'get_opportunities'
    ]));
    expect(toolNames).not.toContain('find_matches');
  });

  it('throws for unknown role', async () => {
    await expect(handleAgentTurn('unknown-role', 'user-1', 'hello', {}))
      .rejects
      .toThrow('Unknown role: unknown-role');
  });

  it('starts and completes a run ledger entry', async () => {
    routeAIRequest.mockResolvedValue({
      stopReason: 'end_turn',
      content: 'Done.',
      contentBlocks: [{ type: 'text', text: 'Done.' }],
      tokensUsed: 500
    });

    await handleAgentTurn('admin', 'admin-1', 'Check system health', {});

    expect(startRun).toHaveBeenCalledWith('conv-e2e-1', 'admin', 'admin-1', 'Check system health');
    expect(completeRun).toHaveBeenCalled();
  });

  it('logs steps for tool execution (driver find_matches)', async () => {
    findMatchingCarriers.mockResolvedValue({ carriers: [{ dot: '123' }, { dot: '456' }, { dot: '789' }] });

    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use', id: 'tool_1', name: 'find_matches',
          input: { zip: '75001', minCPM: 0.55 }
        }],
        tokensUsed: 300
      })
      .mockResolvedValueOnce({
        stopReason: 'end_turn',
        content: 'Found 3 carriers near 75001 paying over $0.55 CPM.',
        contentBlocks: [{ type: 'text', text: 'Found 3 carriers near 75001 paying over $0.55 CPM.' }],
        tokensUsed: 200
      });

    const result = await handleAgentTurn('driver', 'driver-42', 'Find carriers near 75001 paying over $0.55 CPM', {});

    expect(result.runId).toBe('run-test-1');
    expect(result.response).toContain('3 carriers');
    expect(findMatchingCarriers).toHaveBeenCalled();
    expect(startRun).toHaveBeenCalled();
  });

  it('triggers approval gate for execute_high tools (recruiter send_message)', async () => {
    routeAIRequest.mockResolvedValueOnce({
      stopReason: 'tool_use',
      contentBlocks: [{
        type: 'tool_use', id: 'tool_msg', name: 'send_message',
        input: { applicationId: 'app-1', content: 'Hi John', receiverId: 'driver-1' }
      }],
      tokensUsed: 400
    });

    const result = await handleAgentTurn('recruiter', 'rec-1', 'Send a message to John', {});

    expect(result.type).toBe('approval_required');
    expect(result.toolName).toBe('send_message');
    expect(result.riskLevel).toBe('execute_high');
    expect(result.gateId).toBe('gate-test-1');
    expect(createGate).toHaveBeenCalled();
  });

  it('executes read-level tool without approval (carrier get_signals)', async () => {
    getSignals.mockResolvedValue({ signals: [{ type: 'hiring_intent', score: 85 }] });

    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use', id: 'tool_sig', name: 'get_signals',
          input: { accountId: 'ACC-001' }
        }],
        tokensUsed: 200
      })
      .mockResolvedValueOnce({
        stopReason: 'end_turn',
        content: 'Account ACC-001 has a high hiring intent signal.',
        contentBlocks: [{ type: 'text', text: 'Account ACC-001 has a high hiring intent signal.' }],
        tokensUsed: 150
      });

    const result = await handleAgentTurn('carrier', 'carrier-1', 'Show signals for account ACC-001', {});

    expect(result.response).toContain('ACC-001');
    expect(result.runId).toBe('run-test-1');
    expect(createGate).not.toHaveBeenCalled();
    expect(getSignals).toHaveBeenCalled();
  });

  // ── Role-specific E2E tests ──────────────────────────────────────────────

  it('driver: find_matches — startRun with role=driver, logStep with riskLevel=read', async () => {
    findMatchingCarriers.mockResolvedValue({ carriers: [{ dot: '1' }, { dot: '2' }, { dot: '3' }] });

    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use', id: 'tool_d1', name: 'find_matches',
          input: { zip: '75001', maxDistance: 100, minCPM: 0.55, operationType: 'OTR' }
        }],
        tokensUsed: 300
      })
      .mockResolvedValueOnce({
        stopReason: 'end_turn',
        content: 'Found 3 carriers paying over $0.55 CPM near 75001.',
        contentBlocks: [{ type: 'text', text: 'Found 3 carriers paying over $0.55 CPM near 75001.' }],
        tokensUsed: 200
      });

    const result = await handleAgentTurn('driver', 'driver-42', 'Find carriers near 75001 paying over $0.55 CPM', {});
    // Flush fire-and-forget logStep promise
    await flushPromises();

    expect(startRun).toHaveBeenCalledWith('conv-e2e-1', 'driver', 'driver-42', expect.any(String));
    expect(logStep).toHaveBeenCalledWith(
      'run-test-1', 'find_matches', 'read',
      expect.any(Object), expect.anything(), expect.any(Number), 'executed'
    );
    expect(completeRun).toHaveBeenCalled();
    expect(result.runId).toBe('run-test-1');
    expect(result.response).toContain('3 carriers');
  });

  it('recruiter: get_pipeline runs freely, send_message hits approval gate', async () => {
    getPipelineCandidates.mockResolvedValue({ candidates: [{ id: 'app-1', name: 'John' }] });

    // First AI call: get_pipeline (read, no approval)
    // Second AI call: send_message (execute_high — triggers gate, loop stops)
    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use', id: 'tool_r1', name: 'get_pipeline',
          input: { carrierDot: '9999999' }
        }],
        tokensUsed: 250
      })
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use', id: 'tool_r2', name: 'send_message',
          input: { applicationId: 'app-1', content: 'Hi John, are you available?', receiverId: 'driver-1' }
        }],
        tokensUsed: 350
      });

    const result = await handleAgentTurn('recruiter', 'rec-99', 'Show my pipeline and send a message to John', {});

    // get_pipeline should have executed (no approval)
    expect(getPipelineCandidates).toHaveBeenCalled();
    // send_message should have triggered an approval gate
    expect(result.type).toBe('approval_required');
    expect(result.toolName).toBe('send_message');
    expect(result.riskLevel).toBe('execute_high');
    expect(result.gateId).toBe('gate-test-1');
    expect(createGate).toHaveBeenCalledTimes(1);
    expect(result.runId).toBe('run-test-1');
  });

  it('admin: get_system_health — read-level, no approval, run completed', async () => {
    getMetrics.mockResolvedValue({ status: 'operational', uptime: 99.9 });

    routeAIRequest
      .mockResolvedValueOnce({
        stopReason: 'tool_use',
        contentBlocks: [{
          type: 'tool_use', id: 'tool_a1', name: 'get_system_health',
          input: {}
        }],
        tokensUsed: 200
      })
      .mockResolvedValueOnce({
        stopReason: 'end_turn',
        content: 'System is operational with 99.9% uptime.',
        contentBlocks: [{ type: 'text', text: 'System is operational with 99.9% uptime.' }],
        tokensUsed: 150
      });

    const result = await handleAgentTurn('admin', 'admin-1', 'Check system health', {});
    await flushPromises();

    expect(getMetrics).toHaveBeenCalled();
    expect(createGate).not.toHaveBeenCalled();
    expect(startRun).toHaveBeenCalledWith('conv-e2e-1', 'admin', 'admin-1', expect.any(String));
    expect(completeRun).toHaveBeenCalled();
    expect(result.runId).toBe('run-test-1');
    expect(result.response).toContain('operational');
  });

  // ── resumeAfterApproval ──────────────────────────────────────────────────

  describe('resumeAfterApproval', () => {
    const buildApprovalContext = () => ({
      conversationId: 'conv-e2e-1',
      runId: 'run-test-1',
      gateId: 'gate-test-1',
      role: 'recruiter',
      pendingToolBlock: {
        id: 'tool_msg',
        name: 'send_message',
        input: { applicationId: 'app-1', content: 'Hi John', receiverId: 'driver-1' }
      },
      pendingMessages: [
        { role: 'user', content: 'Send a message to John' },
        {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tool_msg', name: 'send_message',
            input: { applicationId: 'app-1', content: 'Hi John', receiverId: 'driver-1' }
          }]
        }
      ]
    });

    const { sendMessage } = require('backend/messaging');

    it('approved path: resolveGate approved, tool executes, response returned', async () => {
      sendMessage.mockResolvedValue({ success: true, messageId: 'msg-1' });
      routeAIRequest.mockResolvedValue({
        stopReason: 'end_turn',
        content: 'Message sent to John successfully.',
        contentBlocks: [{ type: 'text', text: 'Message sent to John successfully.' }],
        tokensUsed: 200
      });

      const result = await resumeAfterApproval(buildApprovalContext(), 'approved', 'admin-user');

      expect(resolveGate).toHaveBeenCalledWith('gate-test-1', 'approved', 'admin-user');
      expect(sendMessage).toHaveBeenCalled();
      expect(result.response).toContain('Message sent');
      expect(result.conversationId).toBe('conv-e2e-1');
      expect(result.runId).toBe('run-test-1');
    });

    it('rejected path: resolveGate rejected, AI gets rejection context, graceful response', async () => {
      routeAIRequest.mockResolvedValue({
        stopReason: 'end_turn',
        content: "Understood, I won't send that message.",
        contentBlocks: [{ type: 'text', text: "Understood, I won't send that message." }],
        tokensUsed: 150
      });

      const result = await resumeAfterApproval(buildApprovalContext(), 'rejected', 'admin-user');

      expect(resolveGate).toHaveBeenCalledWith('gate-test-1', 'rejected', 'admin-user');
      // sendMessage must NOT have been called
      const { sendMessage: sm } = require('backend/messaging');
      expect(sm).not.toHaveBeenCalled();
      expect(result.response).toBeTruthy();
      expect(result.conversationId).toBe('conv-e2e-1');
    });
  });
});
