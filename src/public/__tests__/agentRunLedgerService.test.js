const mockQueryRecords = jest.fn();
const mockInsertRecord = jest.fn();
const mockUpdateRecord = jest.fn();

jest.mock('backend/dataAccess', () => ({
  queryRecords: (...args) => mockQueryRecords(...args),
  insertRecord: (...args) => mockInsertRecord(...args),
  updateRecord: (...args) => mockUpdateRecord(...args)
}));

const {
  startRun,
  logStep,
  createGate,
  logAgentAction,
  completeRun,
  updateRunPlanningMetadata,
  getRunExecutionTrace,
  getRecentRunsWithExecution
} = require('backend/agentRunLedgerService');

beforeEach(() => {
  jest.clearAllMocks();
  mockInsertRecord.mockResolvedValue({ _id: 'mock_id' });
  mockUpdateRecord.mockResolvedValue({ _id: 'mock_id' });
  mockQueryRecords.mockResolvedValue({ items: [] });
});

describe('agentRunLedgerService phase 1 metadata compatibility', () => {
  it('startRun preserves backward compatibility and accepts planning metadata', async () => {
    await startRun('conv_1', 'driver', 'user_1', 'Find matches', {
      plan_id: 'plan_1',
      execution_model: 'sequential',
      planned_nodes: 4,
      parallel_nodes: 2
    });

    expect(mockInsertRecord).toHaveBeenCalledTimes(1);
    const payload = mockInsertRecord.mock.calls[0][1];
    expect(payload).toEqual(expect.objectContaining({
      conversation_id: 'conv_1',
      role: 'driver',
      goal_text: 'Find matches',
      plan_id: 'plan_1',
      execution_model: 'sequential',
      planned_nodes: 4,
      parallel_nodes: 2
    }));
  });

  it('logStep accepts execution metadata without breaking legacy arguments', async () => {
    await logStep('run_1', 'find_matches', 'read', { zip: '12345' }, { ok: true }, 120, 'executed', {
      execution_mode: 'parallel_safe',
      side_effect_class: 'read',
      node_id: 'n1',
      branch_id: 'b1',
      join_key: 'carrier_assessment',
      timeout_ms: 5000
    });

    const payload = mockInsertRecord.mock.calls[0][1];
    expect(payload).toEqual(expect.objectContaining({
      run_id: 'run_1',
      tool_name: 'find_matches',
      execution_mode: 'parallel_safe',
      side_effect_class: 'read',
      node_id: 'n1',
      branch_id: 'b1',
      join_key: 'carrier_assessment',
      timeout_ms: 5000
    }));
    expect(payload).toHaveProperty('executed_at');
  });

  it('createGate accepts optional branch-aware metadata while keeping current shape', async () => {
    await createGate('run_1', 'step_1', 'configure_api_key', 'Needs approval', 'execute_high', {
      node_id: 'n9',
      branch_id: 'b2',
      execution_mode: 'sequential_only'
    });

    const payload = mockInsertRecord.mock.calls[0][1];
    expect(payload).toEqual(expect.objectContaining({
      run_id: 'run_1',
      step_id: 'step_1',
      tool_name: 'configure_api_key',
      node_id: 'n9',
      branch_id: 'b2',
      execution_mode: 'sequential_only'
    }));
  });

  it('logAgentAction passes execution metadata through to logStep', async () => {
    await logAgentAction('run_1', 'observability_ops.get_tool_performance', {
      riskLevel: 'read',
      args: { period: '7d' },
      result: { ok: true },
      latencyMs: 200,
      status: 'executed',
      execution_mode: 'parallel_safe',
      side_effect_class: 'read',
      node_id: 'n2',
      branch_id: 'b1'
    });

    const payload = mockInsertRecord.mock.calls[0][1];
    expect(payload).toEqual(expect.objectContaining({
      tool_name: 'observability_ops.get_tool_performance',
      execution_mode: 'parallel_safe',
      side_effect_class: 'read',
      node_id: 'n2',
      branch_id: 'b1'
    }));
  });

  it('updateRunPlanningMetadata updates a run with plan summary fields', async () => {
    mockQueryRecords.mockResolvedValueOnce({
      items: [{ _id: 'rec_run_1', run_id: 'run_1' }]
    });

    await updateRunPlanningMetadata('run_1', {
      plan_id: 'plan_1',
      execution_model: 'planned_sequential',
      planned_nodes: 5,
      parallel_nodes: 4
    });

    expect(mockUpdateRecord).toHaveBeenCalledWith(
      'agentRuns',
      'rec_run_1',
      expect.objectContaining({
        plan_id: 'plan_1',
        execution_model: 'planned_sequential',
        planned_nodes: 5,
        parallel_nodes: 4
      }),
      { suppressAuth: true }
    );
  });

  it('completeRun persists verifier metadata when provided', async () => {
    mockQueryRecords.mockResolvedValueOnce({
      items: [{ _id: 'rec_run_1', run_id: 'run_1', started_at: '2026-02-28T00:00:00.000Z' }]
    });

    await completeRun('run_1', 'completed', 1200, 0.01, {
      verifier_status: 'degraded_but_acceptable',
      verifier_type: 'policy_verifier',
      verifier_issues: '["partial_prefetch_failure"]'
    });

    expect(mockUpdateRecord).toHaveBeenCalledWith(
      'agentRuns',
      'rec_run_1',
      expect.objectContaining({
        status: 'completed',
        verifier_status: 'degraded_but_acceptable',
        verifier_type: 'policy_verifier',
        verifier_issues: '["partial_prefetch_failure"]'
      }),
      { suppressAuth: true }
    );
  });

  it('getRunExecutionTrace returns derived plan, branch, and timeline summaries', async () => {
    mockQueryRecords
      .mockResolvedValueOnce({
        items: [{
          run_id: 'run_1',
          plan_id: 'plan_1',
          execution_model: 'planned_sequential',
          planned_nodes: 4,
          parallel_nodes: 2
        }]
      })
      .mockResolvedValueOnce({
        items: [{
          step_id: 'step_1',
          run_id: 'run_1',
          tool_name: 'get_tool_performance',
          execution_mode: 'parallel_safe',
          side_effect_class: 'read',
          node_id: 'n1',
          branch_id: 'b1',
          latency_ms: 240,
          status: 'executed',
          executed_at: '2026-02-28T00:00:01.000Z'
        }]
      })
      .mockResolvedValueOnce({
        items: [{
          gate_id: 'gate_1',
          run_id: 'run_1',
          tool_name: 'configure_api_key',
          execution_mode: 'sequential_only',
          node_id: 'n9',
          branch_id: 'b2',
          decision: 'pending',
          presented_at: '2026-02-28T00:00:02.000Z'
        }]
      });

    const trace = await getRunExecutionTrace('run_1');

    expect(trace.plan).toEqual({
      plan_id: 'plan_1',
      execution_model: 'planned_sequential',
      planned_nodes: 4,
      parallel_nodes: 2
    });
    expect(trace.verifier).toEqual({
      status: '',
      type: '',
      issues: ''
    });
    expect(trace.execution).toEqual(expect.objectContaining({
      branch_count: 2,
      node_count: 1,
      critical_path_ms: 240
    }));
    expect(trace.branches).toEqual(expect.arrayContaining([
      expect.objectContaining({ branch_id: 'b1', step_count: 1 }),
      expect.objectContaining({ branch_id: 'b2', gate_count: 1 })
    ]));
    expect(trace.timeline).toHaveLength(2);
  });

  it('getRecentRunsWithExecution enriches recent runs with branch metrics', async () => {
    mockQueryRecords
      .mockResolvedValueOnce({
        items: [{
          run_id: 'run_1',
          execution_model: 'planned_sequential',
          planned_nodes: 3,
          parallel_nodes: 2
        }],
        totalCount: 1
      })
      .mockResolvedValueOnce({
        items: [{
          run_id: 'run_1',
          execution_model: 'planned_sequential',
          planned_nodes: 3,
          parallel_nodes: 2
        }]
      })
      .mockResolvedValueOnce({
        items: [{
          step_id: 'step_1',
          run_id: 'run_1',
          execution_mode: 'parallel_safe',
          side_effect_class: 'read',
          node_id: 'n1',
          branch_id: 'b1',
          latency_ms: 125,
          status: 'executed',
          executed_at: '2026-02-28T00:00:01.000Z'
        }]
      })
      .mockResolvedValueOnce({
        items: [{
          gate_id: 'gate_1',
          run_id: 'run_1',
          branch_id: 'b1',
          execution_mode: 'parallel_safe',
          decision: 'approved',
          presented_at: '2026-02-28T00:00:02.000Z'
        }]
      });

    const result = await getRecentRunsWithExecution({ limit: 1 });

    expect(result.totalCount).toBe(1);
    expect(result.items[0]).toEqual(expect.objectContaining({
      run_id: 'run_1',
      branch_count: 1,
      node_count: 1,
      gate_count: 1,
      critical_path_ms: 125
    }));
  });
});
