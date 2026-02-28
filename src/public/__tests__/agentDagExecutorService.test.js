const { executePlannedReadNodes, isPlanExecutorEligible } = require('backend/agentDagExecutorService');

describe('agentDagExecutorService', () => {
  it('recognizes admin diagnostics plans as eligible', () => {
    expect(isPlanExecutorEligible({ workflow_type: 'admin_diagnostics', nodes: [] })).toBe(true);
    expect(isPlanExecutorEligible({ workflow_type: 'driver_carrier_intelligence', nodes: [] })).toBe(true);
    expect(isPlanExecutorEligible({ workflow_type: 'recruiter_candidate_assessment', nodes: [] })).toBe(true);
    expect(isPlanExecutorEligible({ workflow_type: 'carrier_operational_benchmark', nodes: [] })).toBe(true);
    expect(isPlanExecutorEligible({ workflow_type: 'driver_general', nodes: [] })).toBe(false);
  });

  it('executes root parallel-safe tool_action nodes and summarizes results', async () => {
    const executeNodeFn = jest.fn()
      .mockResolvedValueOnce({ dashboard: true })
      .mockResolvedValueOnce({ api: 'healthy' });

    const plan = {
      workflow_type: 'admin_diagnostics',
      nodes: [
        {
          node_id: 'n1',
          kind: 'tool_action',
          tool: 'observability_ops',
          action: 'get_tracing_dashboard',
          params: {},
          depends_on: [],
          execution_mode: 'parallel_safe',
          approval_required: false
        },
        {
          node_id: 'n2',
          kind: 'tool_action',
          tool: 'external_api',
          action: 'get_api_health',
          params: {},
          depends_on: [],
          execution_mode: 'parallel_safe',
          approval_required: false
        },
        {
          node_id: 'n3',
          kind: 'tool_action',
          tool: 'assistant_synthesis',
          action: '',
          params: {},
          depends_on: ['n1', 'n2'],
          execution_mode: 'sequential_only',
          approval_required: false
        }
      ]
    };

    const result = await executePlannedReadNodes(plan, { maxConcurrency: 2 }, executeNodeFn);

    expect(executeNodeFn).toHaveBeenCalledTimes(2);
    expect(result.executed_nodes).toEqual(expect.arrayContaining(['n1', 'n2']));
    expect(result.skipped_nodes).toContain('n3');
    expect(result.summary_text).toContain('observability_ops.get_tracing_dashboard');
    expect(result.summary_text).toContain('external_api.get_api_health');
    expect(result.branch_results).toEqual(expect.objectContaining({
      sequential: expect.any(Array)
    }));
  });

  it('returns skipped nodes only for ineligible plans', async () => {
    const executeNodeFn = jest.fn();
    const plan = {
      workflow_type: 'driver_general',
      nodes: [{ node_id: 'n1' }, { node_id: 'n2' }]
    };

    const result = await executePlannedReadNodes(plan, {}, executeNodeFn);

    expect(executeNodeFn).not.toHaveBeenCalled();
    expect(result.executed_nodes).toEqual([]);
    expect(result.skipped_nodes).toEqual(['n1', 'n2']);
  });
});
