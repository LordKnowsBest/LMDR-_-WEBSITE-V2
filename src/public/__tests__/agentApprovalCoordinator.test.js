const {
  buildApprovalContext,
  getApprovalExecutionContext
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
});
