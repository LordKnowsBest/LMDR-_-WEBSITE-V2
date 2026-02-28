# Specification - Agentic Workflow Architecture Upgrade

## 1. Objective

Evolve LMDR from a single-loop agent executor into a workflow-aware orchestration system that can:

- plan work explicitly
- parallelize safe read branches
- preserve strict controls around writes and approvals
- verify aggregated results before final response
- expose the full execution path in observability

The target is not a swarm for its own sake. The target is a more legible and performant orchestration model for the workflows this repository already supports.

---

## 2. Current Pattern Classification

### 2.1 Singular pattern

The current system is singular at the orchestration tier:

- one main entrypoint: `agentService.handleAgentTurn()`
- one main dispatcher: `executeTool()`
- one run ledger family for steps and gates

This is good for control and debugging.

### 2.2 Sequential pattern

The current agent loop is primarily sequential:

- model emits one or more `tool_use` blocks
- tools are executed one after another
- tool results are appended back into the next model turn
- high-risk tools can stop the run and require approval

This is the dominant current design pattern.

### 2.3 Parallel pattern

Parallelism already exists, but only in isolated service-level implementations:

- chunked fan-out in `voiceCampaignService.jsw`
- chunked fan-out in `agentJobs.jsw`
- independent read/research fan-out in `aiEnrichment.jsw`

These are useful proofs, but they are not yet orchestrator-native.

### 2.4 Current router inventory that must remain canonical

The architecture upgrade must preserve `src/backend/agentService.jsw` as the canonical action registry surface.

#### Driver
- `driver_cockpit`
- `driver_road`
- `driver_community`
- `driver_compliance`
- `driver_financial`
- `driver_lifecycle`
- `driver_utility`
- `cross_role_utility`
- `financial_extended`
- `lifecycle_ops`

#### Recruiter
- `recruiter_paid_media`
- `recruiter_paid_media_analytics`
- `recruiter_outreach`
- `recruiter_analytics`
- `recruiter_onboarding`
- `recruiter_pipeline`
- `recruiter_retention`
- `recruiter_reverse_match`
- `cross_role_utility`
- `cross_role_paid_media_pipeline`
- `external_api`
- `lifecycle_ops`

#### Admin
- `admin_business_ops`
- `admin_platform_config`
- `admin_portal`
- `admin_support`
- `admin_gamification`
- `admin_feature_adoption`
- `admin_meta_ads_governance`
- `observability_ops`
- `external_api`
- `lifecycle_ops`
- `cross_role_utility`
- `cross_role_paid_media_pipeline`

#### Carrier
- `carrier_fleet`
- `carrier_compliance`
- `carrier_communication`
- `carrier_journey`
- `b2b_suite`
- `cross_role_utility`
- `external_api`
- `financial_extended`

---

## 3. Target Pattern

### 3.1 Recommended pattern

The recommended architecture is:

> **sequential orchestration spine + DAG planning + bounded parallel read branches + sequential writes + verifier before final synthesis**

This pattern matches the constraints of:

- Wix/Velo execution budgets
- approval gates
- Airtable consistency
- auditability needs
- mixed read/write workloads

### 3.2 Patterns explicitly not recommended yet

1. **full swarm autonomy**
   - too hard to govern with the current tool surface
   - weakens replayability

2. **unbounded `Promise.all` fan-out**
   - dangerous for Airtable and external APIs
   - hard to align with approval semantics

3. **parallel writes by default**
   - likely to produce collisions and confusing state transitions

### 3.3 Recommended first target workflows by role

| Role | Workflow | Why first |
|------|----------|-----------|
| Driver | carrier intelligence comparison and recommendation | multi-source, mostly read-only, easy to verify |
| Recruiter | candidate market assessment before outreach | analytics-heavy with clear write boundary after reads |
| Admin | diagnostics and triage bundle | best fit for parallel-safe reads |
| Carrier | operational benchmark and compliance snapshot | naturally composable from read-heavy sources |

---

## 4. Canonical Plan Schema

```json
{
  "plan_id": "plan_123",
  "run_id": "run_123",
  "goal": "Compare a carrier and recommend whether the driver should apply",
  "strategy": "parallel-read-then-summarize",
  "nodes": [
    {
      "node_id": "n1",
      "kind": "tool",
      "tool": "get_carrier_details",
      "params": { "dotNumber": "1234567" },
      "depends_on": [],
      "execution_mode": "parallel_safe",
      "side_effect_class": "read",
      "approval_required": false,
      "verifier_required": false,
      "join_key": "carrier_assessment"
    }
  ]
}
```

### 4.1 Required execution metadata on every action

Each routed action and any remaining legacy flat tool must expose:

- `execution_mode`
- `side_effect_class`
- `idempotency`
- `timeout_ms`
- `approval_required`
- `risk_level`
- `join_key` when applicable
- `max_concurrency` when applicable

Example extension inside `ACTION_REGISTRY`:

```javascript
get_tool_performance: {
  serviceModule: 'backend/adminObservabilityAgentService',
  serviceFunction: 'getToolPerformance',
  argMapping: ['userId', 'params'],
  policy: {
    risk_level: 'read',
    requires_approval: false,
    rate_limit: 10,
    execution_mode: 'parallel_safe',
    side_effect_class: 'read',
    idempotency: 'not_applicable',
    timeout_ms: 4000,
    max_concurrency: 3
  }
}
```

---

## 5. Execution Semantics

### 5.1 Node readiness

A node is ready when:

- all `depends_on` nodes are `completed`
- no policy lock blocks its execution
- the branch budget has capacity

### 5.2 Parallel branch rules

Nodes may run in parallel only if all are true:

- `execution_mode` is `parallel_safe` or `parallel_chunked`
- `side_effect_class` is `read` or `suggest`
- no shared exclusive resource lock is active
- no node in the group requires approval

### 5.2.1 Initial branchable router/action families

- `observability_ops.get_tracing_dashboard`
- `observability_ops.get_tool_performance`
- `observability_ops.get_scoring_accuracy`
- `external_api.get_api_health`
- `external_api.query_safety_api`
- `external_api.query_intel_api`
- `cross_role_utility.get_platform_benchmarks`
- `cross_role_utility.get_industry_trends`
- `cross_role_utility.get_regional_analysis`
- `driver_road` read-only actions
- `recruiter_analytics` read/suggest actions

### 5.3 Write rules

Nodes classified as `write_reversible` or `write_irreversible` must:

- execute sequentially
- create ledger entries before and after execution
- be eligible for approval and verifier policies

### 5.4 Join rules

A join point must:

- wait for all required nodes in its `join_key`
- merge outputs into a structured bundle
- expose missing or failed branch results explicitly

---

## 6. Approval Model

Approval becomes a graph node state transition:

- executor creates gate
- node state becomes `awaiting_approval`
- downstream dependent nodes become `blocked`
- unrelated ready branches may continue if policy allows
- approved node resumes with the original execution context
- rejected node returns structured rejection result into the graph

### Required gate fields

- `gate_id`
- `run_id`
- `node_id`
- `branch_id`
- `tool_name`
- `risk_level`
- `reason`
- `decision`
- `decided_by`
- `decided_at`

### 6.1 Existing functions that must evolve

- `src/backend/agentService.jsw`
  - `handleAgentTurn()`
  - `resumeAfterApproval()`
  - `executeTool()`

- `src/backend/agentRunLedgerService.jsw`
  - `createGate()`
  - `resolveGate()`
  - `logStep()`

Current implementation assumes a single paused tool continuation. This track requires branch-aware continuation semantics.

---

## 7. Verifier Model

Verifier is a separate stage from planning and execution.

### Verifier inputs

- original goal
- final plan
- node outputs
- branch failures
- approval decisions
- confidence metadata

### Verifier outputs

- `verified`
- `degraded_but_acceptable`
- `retry_recommended`
- `blocked`

### Example verifier use cases

1. Multi-source carrier analysis
   - ensure FMCSA, enrichment, and market data are not materially contradictory

2. Admin self-healing proposals
   - ensure remediation proposal is grounded in actual trace/anomaly evidence

3. Recruiter outreach recommendation
   - ensure no write action is recommended from incomplete read context

### 7.1 Existing repository hooks for verifier output

Verifier results should be reflected in:

- `src/backend/agentOutcomeService.jsw`
- `src/backend/agentEvaluationService.jsw`
- `src/public/admin/js/admin-run-monitor.js`

At minimum, verifier status should affect outcome scoring and admin replay visibility.

---

## 8. Metrics

### Efficiency

- time to first useful result
- total run latency
- critical path duration
- branch parallelism ratio

### Quality

- workflow completion rate
- verifier rejection rate
- degraded-result rate
- plan drift rate

### Safety

- approval bypass count
- write collision count
- branch resume failure count
- audit completeness rate

### 8.1 New admin monitor views expected

The admin run monitor should gain:

- plan summary card
- branch timeline table
- critical path breakdown
- verifier decision badge
- degraded branch warnings

---

## 9. Rollout Strategy

### Stage 1

Enable planning only, keep execution sequential.

### Stage 2

Enable bounded parallel branches for read-heavy admin and driver workflows.

### Stage 3

Enable branch-aware approvals.

### Stage 4

Enable verifier gating on high-value workflows.

### Stage 5

Expand to recruiter and carrier workflows that include side effects.

### 9.1 Feature flags required

- `dagPlanningEnabled`
- `parallelReadBranchesEnabled`
- `branchAwareApprovalsEnabled`
- `agentVerifierEnabled`

---

## 10. Success Standard

This architecture upgrade is successful if it produces all three:

1. Lower latency on read-heavy workflows.
2. Better explainability in the run monitor.
3. No reduction in approval safety or audit quality.

If latency improves but observability worsens, the design failed.
If flexibility improves but write safety regresses, the design failed.
If the graph becomes more complex than the workflows justify, the design failed.
