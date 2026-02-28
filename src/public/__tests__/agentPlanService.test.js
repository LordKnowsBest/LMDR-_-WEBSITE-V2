const { buildExecutionPlan } = require('backend/agentPlanService');

describe('agentPlanService', () => {
  it('builds an admin diagnostics plan with parallel-safe read nodes', async () => {
    const tools = [
      { name: 'observability_ops' },
      { name: 'external_api' },
      { name: 'cross_role_utility' }
    ];

    const plan = await buildExecutionPlan('admin', 'Investigate system health and API errors', {
      tools,
      intentResult: { intentClass: 'system_health' }
    });

    expect(plan.workflow_type).toBe('admin_diagnostics');
    expect(plan.summary.parallel_nodes).toBeGreaterThan(0);
    expect(plan.nodes.some(n => n.tool === 'observability_ops')).toBe(true);
  });

  it('builds a driver carrier intelligence plan for carrier comparison prompts', async () => {
    const tools = [
      { name: 'driver_utility' },
      { name: 'cross_role_utility' }
    ];

    const plan = await buildExecutionPlan('driver', 'Compare this carrier on safety and pay', {
      tools,
      intentResult: { intentClass: 'carrier_intel_request' }
    });

    expect(plan.workflow_type).toBe('driver_carrier_intelligence');
    expect(plan.nodes.some(n => n.tool === 'driver_utility')).toBe(true);
    expect(plan.nodes.some(n => n.tool === 'cross_role_utility')).toBe(true);
    expect(plan.nodes.some(n => n.tool === 'assistant_synthesis')).toBe(true);
  });

  it('falls back to a generic sequential plan when no specialized workflow matches', async () => {
    const tools = [
      { name: 'find_matches' },
      { name: 'get_carrier_details' },
      { name: 'explain_match' }
    ];

    const plan = await buildExecutionPlan('driver', 'Hello there', { tools });

    expect(plan.workflow_type).toBe('driver_general');
    expect(plan.summary.planned_nodes).toBeGreaterThan(0);
    expect(plan.nodes[0].execution_mode).toBe('sequential_only');
  });
});
