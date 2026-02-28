# Phase 1 Execution Checklist - Workflow Taxonomy and Safety Contracts

**Track:** `agentic_workflow_architecture_20260228`
**Phase:** 1
**Purpose:** Convert the Phase 1 architecture direction into a file-by-file implementation checklist with acceptance criteria at the function level.

---

## Phase 1 Objective

Add explicit execution metadata to the current agent tool surface so the system can distinguish:

- what must remain sequential
- what can be parallelized later
- what is safe only in bounded fan-out
- what requires idempotency or exclusive execution
- what data must be logged to support future DAG planning, branch replay, and verifier scoring

This phase does **not** implement DAG execution. It prepares the codebase for it.

---

## Scope Summary

### In scope

- `src/backend/agentService.jsw`
- `src/backend/agentRunLedgerService.jsw`
- `src/backend/agentOutcomeService.jsw`
- `src/backend/agentEvaluationService.jsw`
- documentation updates inside this track

### Out of scope

- new DAG executor runtime
- branch-aware approval resume logic
- verifier execution
- admin UI changes beyond documenting future telemetry needs

---

## File 1 - `src/backend/agentService.jsw`

### Purpose in Phase 1

This file is the canonical source of tool metadata today. Phase 1 must make it the canonical source of execution metadata as well.

### Functions and structures to update

#### 1. `TOOL_DEFINITIONS`

**Tasks**
- [ ] Add new policy fields to every legacy flat tool:
  - `execution_mode`
  - `side_effect_class`
  - `idempotency`
  - `timeout_ms`
  - `join_key`
  - `max_concurrency`
- [ ] Keep current fields intact:
  - `risk_level`
  - `requires_approval`
  - `rate_limit`
  - `audit_fields`

**Acceptance criteria**
- [ ] Every entry in `TOOL_DEFINITIONS` has all required Phase 1 execution metadata fields.
- [ ] No existing tool loses current rate-limit or approval behavior.
- [ ] Existing imports and exported behavior remain backward compatible.

#### 2. `ACTION_REGISTRY`

**Tasks**
- [ ] Add the same execution metadata fields to every router action under `policy`.
- [ ] Classify each action as one of:
  - `sequential_only`
  - `parallel_safe`
  - `parallel_chunked`
- [ ] Classify each action side effect as one of:
  - `read`
  - `suggest`
  - `write_reversible`
  - `write_irreversible`
- [ ] Mark approval-required actions `sequential_only` unless explicitly justified otherwise.
- [ ] Add conservative `timeout_ms` defaults by action class.
- [ ] Add `max_concurrency` only where future bounded fan-out is realistic.

**Acceptance criteria**
- [ ] Every routed action in `ACTION_REGISTRY` has a complete execution metadata block.
- [ ] All approval-required actions are explicitly classified.
- [ ] Read-only observability, analytics, and comparison actions are classified for future concurrency.
- [ ] No action is marked `parallel_safe` if it mutates platform or user state.

#### 3. `executeTool(toolName, toolInput, runContext = {})`

**Tasks**
- [ ] Add internal helpers to normalize metadata lookup for:
  - router actions
  - legacy flat tools
- [ ] Ensure execution metadata can be resolved for any executed action without changing runtime semantics yet.
- [ ] Include metadata references in step logging inputs passed to ledger functions.
- [ ] Preserve current behavior:
  - router dispatch
  - rate limiting
  - approval gates
  - result return shape

**Acceptance criteria**
- [ ] `executeTool()` can resolve execution metadata for both router and flat tool paths.
- [ ] Existing execution flow remains sequential and behaviorally unchanged.
- [ ] All ledger writes from `executeTool()` can carry enough metadata to support later DAG work.
- [ ] No caller-facing response contract changes are introduced in Phase 1.

#### 4. `getToolPolicy(toolName)`

**Tasks**
- [ ] Expand or supplement this helper so it can resolve execution metadata, not only legacy flat-tool policy.
- [ ] Add a router-aware metadata accessor if keeping `getToolPolicy()` narrow is cleaner.

**Acceptance criteria**
- [ ] A single helper path exists to retrieve execution metadata for any callable agent action.
- [ ] Unknown tools still fail safely.

#### 5. `validateToolExecution(toolName, userId)`

**Tasks**
- [ ] Keep current rate-limit semantics intact.
- [ ] Confirm no new metadata shape breaks the current flat-tool rate-limit path.
- [ ] Document that concurrency rules are metadata-only in Phase 1 and not enforced here yet.

**Acceptance criteria**
- [ ] Rate limiting behaves exactly as before for legacy flat tools.
- [ ] No regressions from policy shape expansion.

#### 6. `handleAgentTurn(role, userId, message, context = {})`

**Tasks**
- [ ] Do not change execution model in Phase 1.
- [ ] Add only minimal metadata plumbing if needed for future plan creation.
- [ ] Keep all current loop semantics intact.

**Acceptance criteria**
- [ ] `handleAgentTurn()` remains sequential in Phase 1.
- [ ] No planner, DAG, or branch behavior is introduced yet.
- [ ] Existing approval pause/resume contract remains intact.

### Router classification checklist inside `agentService.jsw`

#### Driver-first classifications
- [ ] `driver_road` read actions marked `parallel_safe`
- [ ] `driver_road` report/rating actions marked `sequential_only`
- [ ] `driver_utility` read/suggest actions classified
- [ ] `financial_extended` read calculations classified conservatively

#### Recruiter-first classifications
- [ ] `recruiter_analytics` read/suggest actions marked `parallel_safe`
- [ ] `recruiter_outreach` send actions marked `sequential_only`
- [ ] `recruiter_onboarding` regulated actions marked `sequential_only`
- [ ] `recruiter_pipeline` bulk mutation actions marked `sequential_only`

#### Admin-first classifications
- [ ] `observability_ops` reads marked `parallel_safe`
- [ ] `admin_meta_ads_governance` high-risk changes marked `sequential_only`
- [ ] `external_api.configure_api_key` marked `sequential_only`
- [ ] `cross_role_utility` comparison actions classified for safe read concurrency

#### Carrier-first classifications
- [ ] `carrier_fleet` read dashboards classified
- [ ] `carrier_compliance` writes marked `sequential_only`
- [ ] `carrier_communication` create/update actions marked `sequential_only`
- [ ] `b2b_suite` mixed reads and writes separated clearly

---

## File 2 - `src/backend/agentRunLedgerService.jsw`

### Purpose in Phase 1

The ledger already stores runs, steps, and gates. Phase 1 must expand the ledger shape enough to support future planning and branch replay without requiring immediate DAG behavior.

### Functions to update

#### 1. `startRun(conversationId, role, userId, goalText)`

**Tasks**
- [ ] Add optional support for storing planning-related placeholders:
  - `plan_id`
  - `execution_model`
  - `planned_nodes`
  - `parallel_nodes`
- [ ] Keep all current required fields working.

**Acceptance criteria**
- [ ] Existing callers work without passing new fields.
- [ ] Run records can store Phase 1 planning metadata when available.

#### 2. `logStep(runId, toolName, riskLevel, args, result, latencyMs, status)`

**Tasks**
- [ ] Extend signature or add optional object-based overload support for:
  - `execution_mode`
  - `side_effect_class`
  - `node_id`
  - `branch_id`
  - `join_key`
  - `timeout_ms`
- [ ] Preserve current call sites or make the migration fully backward compatible.
- [ ] Keep PII-safe summarization behavior.

**Acceptance criteria**
- [ ] Step logs can record future DAG metadata even while current execution stays sequential.
- [ ] Existing call sites do not break.
- [ ] Missing optional metadata does not throw.

#### 3. `createGate(runId, stepId, toolName, reason, riskLevel)`

**Tasks**
- [ ] Add optional support for:
  - `node_id`
  - `branch_id`
  - `execution_mode`
- [ ] Preserve current gate creation path.

**Acceptance criteria**
- [ ] Gates remain backward compatible with current approval flow.
- [ ] Gate records can carry future branch-aware identifiers.

#### 4. `resolveGate(gateId, decision, decidedBy)`

**Tasks**
- [ ] No behavior change required in Phase 1.
- [ ] Ensure any schema additions do not break reads/updates.

**Acceptance criteria**
- [ ] Current gate resolution remains intact.
- [ ] Added metadata fields do not block resolution.

#### 5. `getRun(runId)`, `getSteps(runId)`, `getGatesForRun(runId)`, `getRecentRuns(filters = {})`

**Tasks**
- [ ] Ensure retrieval paths can return new metadata fields cleanly.
- [ ] Add comments or docs noting which fields are Phase 1 placeholders for future DAG work.

**Acceptance criteria**
- [ ] Retrieval functions continue returning records without filtering out new metadata.
- [ ] Admin consumers remain compatible.

#### 6. `logAgentAction(runId, actionName, details = {})`

**Tasks**
- [ ] Pass through new execution metadata fields when provided.

**Acceptance criteria**
- [ ] Wrapper remains compatible and future-proof for graph-aware logging.

---

## File 3 - `src/backend/agentOutcomeService.jsw`

### Purpose in Phase 1

Outcome scoring must understand the difference between an ordinary sequential tool failure and a future branch/degraded-path outcome, even if DAG execution is not live yet.

### Functions to review and update

#### 1. Any function that computes run quality from steps and gates

**Tasks**
- [ ] Identify where tool failures, approvals, and productive executions are scored.
- [ ] Add placeholders or logic branches for:
  - `execution_mode`
  - `branch_id`
  - degraded completion vs full completion
- [ ] Keep existing score behavior unchanged for current sequential runs.

**Acceptance criteria**
- [ ] Current score outputs for sequential runs are unchanged or intentionally equivalent.
- [ ] The code can distinguish future branch-aware metadata without mis-scoring it.

#### 2. Any function that produces suggestions or summaries from steps

**Tasks**
- [ ] Ensure future branch failure messages can be represented without implying full-run failure.
- [ ] Add comments or TODO structure for:
  - partial branch failure
  - degraded but acceptable completion
  - verifier rejection hooks

**Acceptance criteria**
- [ ] Existing outcome suggestions still work for today’s runs.
- [ ] The service is structurally ready for DAG/degraded-path semantics.

---

## File 4 - `src/backend/agentEvaluationService.jsw`

### Purpose in Phase 1

Evaluation is where Phase 1 metadata becomes analytically useful. The service should be upgraded so branch and execution-mode metrics can be added later without redesigning the scorecard layer.

### Functions to update

#### 1. `computeWeeklyScorecard(role, days = 7)`

**Tasks**
- [ ] Preserve current weekly scorecard behavior.
- [ ] Add capacity to include future execution-dimension rollups:
  - sequential actions
  - parallel-safe actions
  - approval-heavy actions
- [ ] Add comments or empty fields for:
  - branch utilization
  - critical-path latency
  - degraded completion rate

**Acceptance criteria**
- [ ] Existing scorecard shape does not regress for current admin consumers.
- [ ] New metadata dimensions can be added without redesigning the scorecard contract.

#### 2. `computeToolEffectiveness(runIds)`

**Tasks**
- [ ] Expand grouping logic so later it can include:
  - `execution_mode`
  - `branch_id`
  - `side_effect_class`
- [ ] Preserve grouping by `tool_name`.

**Acceptance criteria**
- [ ] The function still returns current tool-level effectiveness data.
- [ ] The implementation can be extended to compare sequential vs parallel-safe actions later.

#### 3. `computeGateStats(runIds)`

**Tasks**
- [ ] Ensure future branch-aware gate metadata can be counted without code churn.
- [ ] Add support for surfacing approval concentration by action classification later.

**Acceptance criteria**
- [ ] Current gate statistics remain correct.
- [ ] The function is ready for node/branch-aware gate analysis.

#### 4. `detectToolRegressions(days = 14)` and related helper logic

**Tasks**
- [ ] Make sure future regressions can be segmented by execution posture, not only by tool name.
- [ ] Preserve current regression logic today.

**Acceptance criteria**
- [ ] No regression-detection behavior changes for current runs.
- [ ] The code is structured to support future execution-mode segmentation.

---

## Documentation Tasks

### Track docs to update after code work

- [ ] update `plan.md` if any metadata names change during implementation
- [ ] update `spec.md` with final field names
- [ ] update `progress.md` with Phase 1 completion details and any scope changes

**Acceptance criteria**
- [ ] Track documentation matches implemented field names exactly.

---

## Verification Checklist

### Static verification

- [ ] every routed action has execution metadata
- [ ] every legacy flat tool has execution metadata
- [ ] no approval-required action is missing `execution_mode`
- [ ] no mutating action is classified `parallel_safe`
- [ ] ledger functions accept and preserve new metadata

### Behavioral verification

- [ ] `handleAgentTurn()` still runs sequentially
- [ ] approval gates still trigger and resume exactly as before
- [ ] current run monitor payloads remain compatible
- [ ] outcome scoring remains valid for sequential runs
- [ ] evaluation scorecards remain valid for sequential runs

### Suggested test coverage

- [ ] unit tests for metadata completeness in `ACTION_REGISTRY`
- [ ] unit tests for metadata completeness in `TOOL_DEFINITIONS`
- [ ] unit tests for `executeTool()` metadata resolution
- [ ] unit tests for backward-compatible `logStep()` / `createGate()` behavior
- [ ] regression tests for approval-required actions

---

## Definition of Done - Phase 1

Phase 1 is complete only when:

1. `agentService.jsw` is the canonical source of execution metadata for all agent-callable actions.
2. `agentRunLedgerService.jsw` can store future plan/node/branch identifiers without breaking current execution.
3. `agentOutcomeService.jsw` and `agentEvaluationService.jsw` are structurally ready for execution-mode-aware scoring.
4. Current runtime behavior is still sequential and approval-safe.
5. Documentation in this track matches the implemented metadata contract exactly.
