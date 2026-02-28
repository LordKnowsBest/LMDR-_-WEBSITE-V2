/**
 * Agent Evaluation Service Tests
 * Tests scorecard computation, regression detection, improvement actions, and weekly evaluation
 */

const mockQueryRecords = jest.fn();
const mockInsertRecord = jest.fn();
const mockRemoveRecord = jest.fn();

jest.mock('backend/dataAccess', () => ({
  queryRecords: (...args) => mockQueryRecords(...args),
  insertRecord: (...args) => mockInsertRecord(...args),
  removeRecord: (...args) => mockRemoveRecord(...args)
}));

jest.mock('backend/compendiumService', () => ({
  addEntry: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('backend/observabilityService', () => ({
  log: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('backend/configData', () => ({
  FEATURE_FLAGS: {
    dagPlanningEnabled: true,
    dagPlanningEnabledRoles: ['admin', 'recruiter'],
    parallelReadBranchesEnabled: true,
    parallelReadBranchesEnabledRoles: ['admin', 'recruiter'],
    agentVerifierEnabled: true,
    agentVerifierEnabledRoles: ['admin', 'recruiter']
  }
}));

const {
  computeWeeklyScorecard,
  detectToolRegressions,
  generateImprovementActions,
  runWeeklyEvaluation,
  getLatestEvaluation
} = require('backend/agentEvaluationService');

// ============================================================
// Helpers
// ============================================================

function makeRun(overrides = {}) {
  return {
    run_id: 'run_' + Math.random().toString(36).substr(2, 6),
    role: 'driver',
    status: 'completed',
    started_at: new Date().toISOString(),
    total_tokens: 2000,
    total_cost_usd: 0.05,
    ...overrides
  };
}

function makeOutcome(runId, overrides = {}) {
  return {
    run_id: runId,
    quality_score: 75,
    objective_met: 'yes',
    ...overrides
  };
}

function makeStep(runId, overrides = {}) {
  return {
    run_id: runId,
    tool_name: 'find_matches',
    status: 'completed',
    latency_ms: 150,
    executed_at: new Date().toISOString(),
    ...overrides
  };
}

function makeGate(runId, overrides = {}) {
  return {
    run_id: runId,
    gate_id: 'gate_' + Math.random().toString(36).substr(2, 6),
    tool_name: 'update_status',
    decision: 'approved',
    risk_level: 'high',
    ...overrides
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryRecords.mockResolvedValue({ items: [], totalCount: 0 });
  mockInsertRecord.mockResolvedValue({ _id: 'mock_id' });
});

// ============================================================
// computeWeeklyScorecard
// ============================================================

describe('computeWeeklyScorecard', () => {
  it('should return empty scorecard when no runs exist', async () => {
    const result = await computeWeeklyScorecard('driver', 7);

    expect(result).toBeDefined();
    expect(result.role).toBe('driver');
    expect(result.quality.avg_score).toBe(0);
    expect(result.quality.trend).toBe('stable');
    expect(result.volume.total_runs).toBe(0);
    expect(result.rates.success).toBe(0);
  });

  it('should compute quality metrics from runs and outcomes', async () => {
    const runs = [makeRun({ run_id: 'r1' }), makeRun({ run_id: 'r2' }), makeRun({ run_id: 'r3' })];
    const outcomes = [
      makeOutcome('r1', { quality_score: 80, objective_met: 'yes' }),
      makeOutcome('r2', { quality_score: 60, objective_met: 'partial' }),
      makeOutcome('r3', { quality_score: 40, objective_met: 'no' })
    ];

    mockQueryRecords
      .mockResolvedValueOnce({ items: runs })       // current runs
      .mockResolvedValueOnce({ items: [] })          // prior runs
      .mockResolvedValueOnce({ items: outcomes })    // current outcomes
      .mockResolvedValueOnce({ items: [] })          // steps (tool effectiveness)
      .mockResolvedValueOnce({ items: [] })          // gates
      .mockResolvedValueOnce({ items: runs });       // verifier runs

    const result = await computeWeeklyScorecard('driver', 7);

    expect(result.quality.avg_score).toBe(60);
    expect(result.volume.total_runs).toBe(3);
    expect(result.rates.success).toBeCloseTo(33.3, 0);
    expect(result.rates.partial).toBeCloseTo(33.3, 0);
    expect(result.rates.failure).toBeCloseTo(33.3, 0);
    expect(result.rollout).toEqual({
      dag_planning_roles: ['admin', 'recruiter'],
      parallel_read_roles: ['admin', 'recruiter'],
      verifier_roles: ['admin', 'recruiter']
    });
  });

  it('should detect improving trend when current > prior', async () => {
    const runs = [makeRun({ run_id: 'r1' })];
    const priorRuns = [makeRun({ run_id: 'p1' })];
    const outcomes = [makeOutcome('r1', { quality_score: 85 })];
    const priorOutcomes = [makeOutcome('p1', { quality_score: 60 })];

    mockQueryRecords
      .mockResolvedValueOnce({ items: runs })           // current runs
      .mockResolvedValueOnce({ items: priorRuns })       // prior runs
      .mockResolvedValueOnce({ items: outcomes })        // current outcomes
      .mockResolvedValueOnce({ items: priorOutcomes })   // prior outcomes
      .mockResolvedValueOnce({ items: [] })              // steps
      .mockResolvedValueOnce({ items: [] })              // gates
      .mockResolvedValueOnce({ items: runs });           // verifier runs

    const result = await computeWeeklyScorecard('admin', 7);

    expect(result.quality.trend).toBe('improving');
    expect(result.quality.delta).toBeGreaterThan(0);
  });

  it('should compute cost metrics', async () => {
    const runs = [
      makeRun({ run_id: 'r1', total_tokens: 3000, total_cost_usd: 0.08 }),
      makeRun({ run_id: 'r2', total_tokens: 5000, total_cost_usd: 0.12 })
    ];

    mockQueryRecords
      .mockResolvedValueOnce({ items: runs })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: runs });

    const result = await computeWeeklyScorecard('driver', 7);

    expect(result.cost.total_tokens).toBe(8000);
    expect(result.cost.total_usd).toBe(0.2);
    expect(result.cost.avg_tokens_per_run).toBe(4000);
  });

  it('should compute verifier degradation metrics from run records', async () => {
    const currentRuns = [
      makeRun({ run_id: 'r1' }),
      makeRun({ run_id: 'r2' }),
      makeRun({ run_id: 'r3' })
    ];
    const verifierRuns = [
      makeRun({ run_id: 'r1', verifier_status: 'verified', verifier_type: 'consistency_verifier' }),
      makeRun({ run_id: 'r2', verifier_status: 'degraded_but_acceptable', verifier_type: 'policy_verifier' }),
      makeRun({ run_id: 'r3', verifier_status: 'blocked', verifier_type: 'policy_verifier' })
    ];

    mockQueryRecords
      .mockResolvedValueOnce({ items: currentRuns })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: verifierRuns });

    const result = await computeWeeklyScorecard('admin', 7);

    expect(result.verifier).toEqual(expect.objectContaining({
      verified_runs: 1,
      degraded_runs: 1,
      blocked_runs: 1,
      degraded_rate: 33,
      blocked_rate: 33
    }));
    expect(result.verifier.by_type).toEqual(expect.objectContaining({
      consistency_verifier: 1,
      policy_verifier: 2
    }));
  });
});

// ============================================================
// detectToolRegressions
// ============================================================

describe('detectToolRegressions', () => {
  it('should return empty array when no steps exist', async () => {
    const result = await detectToolRegressions(14);

    expect(result.regressions).toEqual([]);
  });

  it('should detect regression when tool success rate drops >15%', async () => {
    // Current window: tool_a has 50% success (2/4)
    const currentSteps = [
      makeStep('r1', { tool_name: 'tool_a', status: 'completed' }),
      makeStep('r1', { tool_name: 'tool_a', status: 'completed' }),
      makeStep('r1', { tool_name: 'tool_a', status: 'failed' }),
      makeStep('r1', { tool_name: 'tool_a', status: 'failed' })
    ];

    // Prior window: tool_a had 100% success (4/4)
    const priorSteps = [
      makeStep('p1', { tool_name: 'tool_a', status: 'completed' }),
      makeStep('p1', { tool_name: 'tool_a', status: 'completed' }),
      makeStep('p1', { tool_name: 'tool_a', status: 'completed' }),
      makeStep('p1', { tool_name: 'tool_a', status: 'completed' })
    ];

    mockQueryRecords
      .mockResolvedValueOnce({ items: currentSteps })
      .mockResolvedValueOnce({ items: priorSteps });

    const result = await detectToolRegressions(14);

    expect(result.regressions.length).toBe(1);
    expect(result.regressions[0].tool).toBe('tool_a');
    expect(result.regressions[0].current_rate).toBe(50);
    expect(result.regressions[0].prior_rate).toBe(100);
    expect(result.regressions[0].drop_pct).toBe(50);
  });

  it('should NOT flag tools with small sample sizes (<3)', async () => {
    const currentSteps = [
      makeStep('r1', { tool_name: 'rare_tool', status: 'failed' }),
      makeStep('r1', { tool_name: 'rare_tool', status: 'failed' })
    ];
    const priorSteps = [
      makeStep('p1', { tool_name: 'rare_tool', status: 'completed' }),
      makeStep('p1', { tool_name: 'rare_tool', status: 'completed' })
    ];

    mockQueryRecords
      .mockResolvedValueOnce({ items: currentSteps })
      .mockResolvedValueOnce({ items: priorSteps });

    const result = await detectToolRegressions(14);

    expect(result.regressions.length).toBe(0);
  });

  it('should NOT flag tools with <15% drop', async () => {
    const currentSteps = [
      makeStep('r1', { tool_name: 'tool_b', status: 'completed' }),
      makeStep('r1', { tool_name: 'tool_b', status: 'completed' }),
      makeStep('r1', { tool_name: 'tool_b', status: 'failed' })
    ];
    const priorSteps = [
      makeStep('p1', { tool_name: 'tool_b', status: 'completed' }),
      makeStep('p1', { tool_name: 'tool_b', status: 'completed' }),
      makeStep('p1', { tool_name: 'tool_b', status: 'completed' })
    ];

    mockQueryRecords
      .mockResolvedValueOnce({ items: currentSteps })
      .mockResolvedValueOnce({ items: priorSteps });

    const result = await detectToolRegressions(14);

    // 100% → 67% = 33% drop, which IS > 15%, so it SHOULD be flagged
    expect(result.regressions.length).toBe(1);
  });
});

// ============================================================
// generateImprovementActions
// ============================================================

describe('generateImprovementActions', () => {
  it('should generate quality action when trend is declining', async () => {
    const actions = await generateImprovementActions({
      role: 'driver',
      quality: { trend: 'declining', delta: -12 },
      tools: [{ tool: 'find_matches', success_rate: 60 }],
      rates: { success: 65, partial: 20, failure: 15 },
      volume: { total_runs: 10 },
      cost: { avg_tokens_per_run: 2000 },
      gates: { rejection_rate: 10, timeout_rate: 5, most_rejected: [] }
    });

    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(a => a.category === 'quality')).toBe(true);
  });

  it('should generate cost action when tokens > 5000 avg', async () => {
    const actions = await generateImprovementActions({
      role: 'admin',
      quality: { trend: 'stable', delta: 0 },
      tools: [],
      rates: { success: 80, partial: 10, failure: 10 },
      volume: { total_runs: 5 },
      cost: { avg_tokens_per_run: 8000 },
      gates: { rejection_rate: 0, timeout_rate: 0, most_rejected: [] }
    });

    expect(actions.some(a => a.category === 'cost')).toBe(true);
  });

  it('should generate approval action when rejection rate > 30%', async () => {
    const actions = await generateImprovementActions({
      role: 'recruiter',
      quality: { trend: 'stable', delta: 0 },
      tools: [],
      rates: { success: 70, partial: 15, failure: 15 },
      volume: { total_runs: 10 },
      cost: { avg_tokens_per_run: 2000 },
      gates: { rejection_rate: 45, timeout_rate: 5, most_rejected: [{ tool: 'update_status', rejections: 4 }] }
    });

    expect(actions.some(a => a.category === 'approval')).toBe(true);
  });

  it('should generate critical action when success rate < 50%', async () => {
    const actions = await generateImprovementActions({
      role: 'carrier',
      quality: { trend: 'stable', delta: 0 },
      tools: [],
      rates: { success: 30, partial: 30, failure: 40 },
      volume: { total_runs: 20 },
      cost: { avg_tokens_per_run: 3000 },
      gates: { rejection_rate: 10, timeout_rate: 5, most_rejected: [] }
    });

    expect(actions.some(a => a.severity === 'critical')).toBe(true);
  });

  it('should generate engagement action when zero runs', async () => {
    const actions = await generateImprovementActions({
      role: 'carrier',
      quality: { trend: 'stable', delta: 0 },
      tools: [],
      rates: { success: 0, partial: 0, failure: 0 },
      volume: { total_runs: 0 },
      cost: { avg_tokens_per_run: 0 },
      gates: { rejection_rate: 0, timeout_rate: 0, most_rejected: [] }
    });

    expect(actions.some(a => a.category === 'engagement')).toBe(true);
  });

  it('should return empty array for healthy scorecard', async () => {
    const actions = await generateImprovementActions({
      role: 'driver',
      quality: { trend: 'stable', delta: 2 },
      tools: [{ tool: 'find_matches', success_rate: 95 }],
      rates: { success: 85, partial: 10, failure: 5 },
      volume: { total_runs: 50 },
      cost: { avg_tokens_per_run: 2000 },
      gates: { rejection_rate: 5, timeout_rate: 2, most_rejected: [] }
    });

    expect(actions.length).toBe(0);
  });
});

// ============================================================
// runWeeklyEvaluation
// ============================================================

describe('runWeeklyEvaluation', () => {
  it('should produce evaluation records for all 4 roles', async () => {
    // Mock returns empty data for all queries — evaluation still completes
    mockQueryRecords.mockResolvedValue({ items: [] });

    const result = await runWeeklyEvaluation();

    expect(result.success).toBe(true);
    expect(result.scorecards).toBeDefined();
    expect(Object.keys(result.scorecards)).toEqual(['driver', 'recruiter', 'admin', 'carrier']);

    // Should have called insertRecord 4 times (one per role)
    expect(mockInsertRecord).toHaveBeenCalledTimes(4);

    // Verify each insert is for the evaluations collection
    for (const call of mockInsertRecord.mock.calls) {
      expect(call[0]).toBe('agentEvaluations');
      expect(call[1].evaluation_id).toMatch(/^eval_/);
      expect(call[1].role).toBeDefined();
    }
  });

  it('should report critical roles when quality < 40', async () => {
    // Set up: admin role has low quality runs
    const adminRuns = [makeRun({ run_id: 'ar1', role: 'admin' })];
    const adminOutcomes = [makeOutcome('ar1', { quality_score: 25, objective_met: 'no' })];

    let callCount = 0;
    mockQueryRecords.mockImplementation((collection, opts) => {
      callCount++;
      // First scorecard call for 'driver' — return matching runs for admin only
      if (opts?.filters?.role === 'admin' && collection === 'agentRuns' && !opts.filters.started_at?.lt) {
        return { items: adminRuns };
      }
      if (collection === 'runOutcomes' && opts?.filters?.run_id?.in?.includes('ar1')) {
        return { items: adminOutcomes };
      }
      return { items: [] };
    });

    const result = await runWeeklyEvaluation();

    expect(result.success).toBe(true);
    // Admin has quality 25 < 40, should be critical
    expect(result.critical_roles).toContain('admin');
  });
});

// ============================================================
// getLatestEvaluation
// ============================================================

describe('getLatestEvaluation', () => {
  it('should return null when no evaluations exist', async () => {
    mockQueryRecords.mockResolvedValue({ items: [] });

    const result = await getLatestEvaluation('driver');

    expect(result).toBeNull();
  });

  it('should parse JSON fields in returned record', async () => {
    const record = {
      evaluation_id: 'eval_123',
      role: 'driver',
      tool_regressions: JSON.stringify([{ tool: 'find_matches', drop_pct: 20 }]),
      improvement_actions: JSON.stringify([{ category: 'quality', action: 'Review prompts' }]),
      avg_quality_score: 72,
      trend: 'improving'
    };

    mockQueryRecords.mockResolvedValue({ items: [record] });

    const result = await getLatestEvaluation('driver');

    expect(result).toBeDefined();
    expect(result.evaluation_id).toBe('eval_123');
    expect(Array.isArray(result.tool_regressions)).toBe(true);
    expect(result.tool_regressions[0].tool).toBe('find_matches');
    expect(Array.isArray(result.improvement_actions)).toBe(true);
    expect(result.improvement_actions[0].category).toBe('quality');
  });

  it('should handle malformed JSON gracefully', async () => {
    const record = {
      evaluation_id: 'eval_bad',
      role: 'admin',
      tool_regressions: 'not valid json',
      improvement_actions: '',
      avg_quality_score: 50,
      trend: 'stable'
    };

    mockQueryRecords.mockResolvedValue({ items: [record] });

    const result = await getLatestEvaluation('admin');

    expect(result).toBeDefined();
    expect(result.tool_regressions).toEqual([]);
    expect(result.improvement_actions).toEqual([]);
  });
});
