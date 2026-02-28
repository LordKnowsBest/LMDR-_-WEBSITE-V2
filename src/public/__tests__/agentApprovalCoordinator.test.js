const {
  buildApprovalContext,
  getApprovalExecutionContext,
  getPendingApprovalQueue,
  buildNextApprovalContext
} = require('backend/agentApprovalCoordinator');

describe('agentApprovalCoordinator', () => {
  it('builds approval context with execution metadata', () => {
    const context = buildApprovalContext(
      { conversationId: 'conv_1', planId: 'plan_1' },
      { node_id: 'n1', branch_id: 'b1', execution_mode: 'sequential_only' }
    );

    expect(context.executionContext).toEqual({
      node_id: 'n1',
      branch_id: 'b1',
      execution_mode: 'sequential_only',
      plan_id: 'plan_1'
    });
  });

  it('extracts default execution context when metadata is absent', () => {
    const context = getApprovalExecutionContext({ planId: 'plan_2' });
    expect(context).toEqual({
      node_id: '',
      branch_id: '',
      execution_mode: '',
      plan_id: 'plan_2'
    });
  });

  it('returns queued approvals and advances to the next gate context', () => {
    const context = buildApprovalContext(
      {
        conversationId: 'conv_1',
        planId: 'plan_1',
        gateId: 'gate_1',
        pendingToolBlock: { id: 'tool_1', name: 'send_message', input: {} }
      },
      {
        pendingApprovals: [
          {
            gateId: 'gate_1',
            stepId: 'step_1',
            toolName: 'send_message',
            toolDescription: 'send',
            args: {},
            riskLevel: 'execute_high',
            auditFields: [],
            toolBlock: { id: 'tool_1', name: 'send_message', input: {} },
            executionContext: { node_id: 'n1', branch_id: 'b1', execution_mode: 'sequential_only', plan_id: 'plan_1' }
          },
          {
            gateId: 'gate_2',
            stepId: 'step_2',
            toolName: 'create_email_campaign',
            toolDescription: 'email',
            args: {},
            riskLevel: 'execute_high',
            auditFields: [],
            toolBlock: { id: 'tool_2', name: 'recruiter_outreach', input: { action: 'create_email_campaign', params: {} } },
            executionContext: { node_id: 'n2', branch_id: 'b2', execution_mode: 'sequential_only', plan_id: 'plan_1' }
          }
        ],
        completedToolResults: [{ type: 'tool_result', tool_use_id: 'safe_1', content: '{}' }]
      }
    );

    expect(getPendingApprovalQueue(context)).toHaveLength(2);

    const next = buildNextApprovalContext(context, {
      type: 'tool_result',
      tool_use_id: 'tool_1',
      content: '{"ok":true}'
    }, getPendingApprovalQueue(context).slice(1));

    expect(next.gateId).toBe('gate_2');
    expect(next.pendingToolBlock).toEqual(expect.objectContaining({ id: 'tool_2' }));
    expect(next.completedToolResults).toHaveLength(2);
  });
});
