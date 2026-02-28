function buildPlan(workflowType) {
  return {
    plan_id: `plan_${workflowType}`,
    workflow_type: workflowType,
    execution_model: 'planned_sequential',
    nodes: [
      {
        node_id: 'n1',
        kind: 'tool_action',
        tool: 'observability_ops',
        action: 'get_tracing_dashboard',
        params: {},
        depends_on: [],
        branch_id: 'b1',
        join_key: workflowType,
        execution_mode: 'parallel_safe',
        verifier_required: true,
        approval_required: false
      }
    ],
    summary: {
      planned_nodes: 1,
      parallel_nodes: 1
    }
  };
}

async function loadAgentServiceWithFlags(roleFlags = ['admin']) {
  jest.resetModules();

  const routeAIRequest = jest.fn().mockResolvedValue({
    stopReason: 'end_turn',
    content: 'Workflow response ready.',
    contentBlocks: [{ type: 'text', text: 'Workflow response ready.' }],
    tokensUsed: 120
  });
  const buildExecutionPlan = jest.fn((role) => {
    const workflowMap = {
      admin: 'admin_diagnostics',
      recruiter: 'recruiter_candidate_assessment',
      carrier: 'carrier_operational_benchmark',
      driver: 'driver_carrier_intelligence'
    };
    return Promise.resolve(buildPlan(workflowMap[role] || `${role}_general`));
  });
  const executePlannedReadNodes = jest.fn().mockResolvedValue({
    executed_nodes: ['n1'],
    skipped_nodes: [],
    results: [{ node_id: 'n1', branch_id: 'b1', success: true, result: { ok: true } }],
    branch_results: { b1: [{ node_id: 'n1', success: true }] },
    summary_text: '- observability_ops.get_tracing_dashboard: ok :: {"ok":true}'
  });
  const verifyPlannedResponse = jest.fn().mockResolvedValue({
    status: 'verified',
    verifier_type: 'consistency_verifier',
    issues: []
  });
  const completeRun = jest.fn().mockResolvedValue(undefined);

  jest.doMock('backend/aiRouterService', () => ({ routeAIRequest }));
  jest.doMock('backend/agentConversationService', () => ({
    createConversation: jest.fn().mockResolvedValue({ conversationId: 'conv-rollout-1' }),
    addTurn: jest.fn().mockResolvedValue({}),
    getRecentContext: jest.fn().mockResolvedValue([])
  }));
  jest.doMock('backend/dataAccess', () => ({}));
  jest.doMock('backend/agentRunLedgerService', () => ({
    startRun: jest.fn().mockResolvedValue({ runId: 'run-rollout-1' }),
    logStep: jest.fn().mockResolvedValue({ stepId: 'step-rollout-1' }),
    createGate: jest.fn().mockResolvedValue({ gateId: 'gate-rollout-1' }),
    resolveGate: jest.fn().mockResolvedValue({}),
    completeRun,
    updateRunPlanningMetadata: jest.fn().mockResolvedValue({})
  }));
  jest.doMock('backend/agentRuntimeService', () => ({
    isRuntimeAvailable: jest.fn().mockReturnValue(false),
    callRuntimeStep: jest.fn()
  }));
  jest.doMock('backend/intentService', () => ({
    classifyUserIntent: jest.fn().mockResolvedValue({ intentClass: 'diagnostic' }),
    buildRagConfig: jest.fn().mockReturnValue(null)
  }));
  jest.doMock('backend/ragIngestionService', () => ({
    ingestTurnMemory: jest.fn().mockResolvedValue({})
  }));
  jest.doMock('backend/configData', () => ({
    FEATURE_FLAGS: {
      dagPlanningEnabled: true,
      dagPlanningEnabledRoles: roleFlags,
      parallelReadBranchesEnabled: true,
      parallelReadBranchesEnabledRoles: roleFlags,
      branchAwareApprovalsEnabled: false,
      agentVerifierEnabled: true,
      agentVerifierEnabledRoles: roleFlags
    }
  }));
  jest.doMock('backend/agentPlanService', () => ({ buildExecutionPlan }));
  jest.doMock('backend/agentDagExecutorService', () => ({
    executePlannedReadNodes,
    isPlanExecutorEligible: jest.fn().mockReturnValue(true)
  }));
  jest.doMock('backend/agentVerifierService', () => ({ verifyPlannedResponse }));
  jest.doMock('backend/agentApprovalCoordinator', () => ({
    buildApprovalContext: jest.fn((base, meta) => ({ ...base, executionContext: meta })),
    getApprovalExecutionContext: jest.fn().mockReturnValue({}),
    getPendingApprovalQueue: jest.fn().mockReturnValue([]),
    buildNextApprovalContext: jest.fn()
  }));
  jest.doMock('backend/agentOutcomeService', () => ({
    evaluateRun: jest.fn().mockResolvedValue({})
  }));

  const agentService = require('backend/agentService');
  return {
    ...agentService,
    mocks: {
      routeAIRequest,
      buildExecutionPlan,
      executePlannedReadNodes,
      verifyPlannedResponse,
      completeRun
    }
  };
}

describe('AgentService rollout gating', () => {
  it('enables DAG planning, bounded parallel reads, and verifier for admin in the current rollout', async () => {
    const { handleAgentTurn, mocks } = await loadAgentServiceWithFlags(['admin', 'recruiter']);

    await handleAgentTurn('admin', 'admin-1', 'Investigate system health and api status', {});

    expect(mocks.buildExecutionPlan).toHaveBeenCalledTimes(1);
    expect(mocks.executePlannedReadNodes).toHaveBeenCalledTimes(1);
    expect(mocks.verifyPlannedResponse).toHaveBeenCalledTimes(1);
    expect(mocks.completeRun).toHaveBeenCalledWith(
      'run-rollout-1',
      'completed',
      expect.any(Number),
      0,
      expect.objectContaining({
        verifier_status: 'verified',
        verifier_type: 'consistency_verifier'
      })
    );
  });

  it('keeps driver on the legacy sequential path while admin and recruiter are enabled', async () => {
    const { handleAgentTurn, mocks } = await loadAgentServiceWithFlags(['admin', 'recruiter']);

    await handleAgentTurn('driver', 'driver-1', 'Compare carriers for me', {});

    expect(mocks.buildExecutionPlan).not.toHaveBeenCalled();
    expect(mocks.executePlannedReadNodes).not.toHaveBeenCalled();
    expect(mocks.verifyPlannedResponse).not.toHaveBeenCalled();
  });

  it('supports recruiter in the current rollout and carrier only when explicitly enabled', async () => {
    const recruiter = await loadAgentServiceWithFlags(['admin', 'recruiter']);
    await recruiter.handleAgentTurn('recruiter', 'rec-1', 'Assess this candidate market before outreach', {});
    expect(recruiter.mocks.buildExecutionPlan).toHaveBeenCalledTimes(1);
    expect(recruiter.mocks.executePlannedReadNodes).toHaveBeenCalledTimes(1);
    expect(recruiter.mocks.verifyPlannedResponse).toHaveBeenCalledTimes(1);

    const carrier = await loadAgentServiceWithFlags(['admin', 'recruiter', 'carrier']);
    await carrier.handleAgentTurn('carrier', 'carrier-1', 'Benchmark my operation against peers', {});
    expect(carrier.mocks.buildExecutionPlan).toHaveBeenCalledTimes(1);
    expect(carrier.mocks.executePlannedReadNodes).toHaveBeenCalledTimes(1);
    expect(carrier.mocks.verifyPlannedResponse).toHaveBeenCalledTimes(1);
  });
});
