# Plan - Agentic Workflow Architecture Upgrade
## Sequential Core, DAG Planning, and Bounded Parallel Execution

**Created:** 2026-02-28
**Status:** PLANNED
**Priority:** High
**Priority order:** Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5

---

## Why This Track Exists

LMDR now has a real agentic foundation, but its execution pattern is still dominated by a single sequential loop:

- `src/backend/agentService.jsw` is the central orchestrator.
- `handleAgentTurn()` executes tool calls in sequence inside a single model loop.
- approval gates pause the run cleanly, but they also stop the rest of the turn.
- some surrounding systems already use bounded parallelism (`voiceCampaignService.jsw`, `agentJobs.jsw`, `aiEnrichment.jsw`), but that capability is not yet expressed as a first-class orchestration pattern.

The result is a system that is reasonably safe and auditable, but slower than necessary and harder to scale into richer autonomous workflows. The current architecture is best described as:

> **singular orchestrator + sequential tool loop + approval-gated writes + isolated parallel subroutines**

This track upgrades that model without discarding the existing ledger, policy, router, runtime, and page wiring investments.

---

## Current-State Assessment

### What exists today

1. **Singular orchestrator**
   - `agentService.jsw` owns tool list building, model turn execution, tool dispatch, and approval pause/resume.

2. **Sequential execution**
   - tool calls within a turn are executed one at a time.
   - tool results are returned to the model only after the current batch completes.

3. **Approval-gated side effects**
   - high-risk actions can stop the turn and generate a gate via `agentRunLedgerService.jsw`.

4. **Good control-plane primitives**
   - runs, steps, gates, and outcomes already exist.
   - role-scoped routers and action registries already reduce token overhead.

5. **Parallelism already proven elsewhere**
   - `voiceCampaignService.jsw` uses chunked parallel calling.
   - `agentJobs.jsw` advances campaigns in bounded parallel chunks.
   - `aiEnrichment.jsw` parallelizes independent read/research work before synthesis.

### Current router surface already available for orchestration

The workflow upgrade should build on the router groups already present in `src/backend/agentService.jsw`, not introduce a second action taxonomy.

| Role | Current routers / domain tools |
|------|-------------------------------|
| Driver | `driver_cockpit`, `driver_road`, `driver_community`, `driver_compliance`, `driver_financial`, `driver_lifecycle`, `driver_utility`, `cross_role_utility`, `financial_extended`, `lifecycle_ops` |
| Recruiter | `recruiter_paid_media`, `recruiter_paid_media_analytics`, `recruiter_outreach`, `recruiter_analytics`, `recruiter_onboarding`, `recruiter_pipeline`, `recruiter_retention`, `recruiter_reverse_match`, `cross_role_utility`, `cross_role_paid_media_pipeline`, `external_api`, `lifecycle_ops` |
| Admin | `admin_business_ops`, `admin_platform_config`, `admin_portal`, `admin_support`, `admin_gamification`, `admin_feature_adoption`, `admin_meta_ads_governance`, `observability_ops`, `external_api`, `lifecycle_ops`, `cross_role_utility`, `cross_role_paid_media_pipeline` |
| Carrier | `carrier_fleet`, `carrier_compliance`, `carrier_communication`, `carrier_journey`, `b2b_suite`, `cross_role_utility`, `external_api`, `financial_extended` |

### What is missing

1. **No explicit plan object**
   - the model decides step order implicitly turn by turn.

2. **No dependency graph**
   - there is no machine-readable way to mark steps as independent, blocking, or join-required.

3. **No safe concurrency policy for tools**
   - tools know `risk_level` and approval requirements, but not whether they are parallel-safe, idempotent, or mutually exclusive.

4. **No verifier stage**
   - planning, execution, and summarization are coupled in one loop.

5. **No branch-level pause/resume**
   - one approval gate can stall an entire multi-action run.

---

## Architecture Direction

The next pattern should not be "full autonomous swarm". It should be:

> **planner -> DAG executor -> approval gate manager -> verifier -> summarizer**

With this operating model:

- **sequential** for writes, approvals, and dependency-sensitive work
- **parallel** for read-only or idempotent branches
- **deterministic joins** before synthesis or user-visible commitments

This preserves safety while reducing latency and increasing clarity.

### Canonical Execution Model

```
User Message
  -> agentService.handleAgentTurn()
    -> Plan Builder
      -> Execution Graph (nodes, dependencies, policies)
        -> DAG Executor
          -> parallel-safe read branches run concurrently
          -> write / approval nodes run sequentially
          -> branch joins produce structured artifacts
            -> Verifier
              -> Final model synthesis
                -> Run ledger + outcome logging
```

### Design Rule

**Parallelism is a property of the plan, not a side effect of ad hoc `Promise.all`.**

---

## Phase 1 - Workflow Taxonomy and Safety Contracts

**Goal:** Define the orchestration contract for every agent action before changing execution behavior.

**Execution checklist:** `phase1-execution-checklist.md`

### Deliverables

- Add workflow policy metadata to router actions and legacy tools:
  - `execution_mode`: `sequential_only` | `parallel_safe` | `parallel_chunked`
  - `side_effect_class`: `read` | `suggest` | `write_reversible` | `write_irreversible`
  - `idempotency`: `required` | `optional` | `not_applicable`
  - `join_key`: optional logical group for merge points
  - `timeout_ms`: per-action budget
  - `max_concurrency`: for chunked fan-out tools

- Publish a repo-level orchestration matrix covering:
  - tools that can run concurrently
  - tools that require exclusive execution
  - tools that must always follow a verifier
  - tools that can be auto-approved under policy

- Introduce a compact execution contract document inside the track:
  - planner output schema
  - node status lifecycle
  - branch pause/resume rules

### Required code targets

- `src/backend/agentService.jsw`
- `src/backend/agentRunLedgerService.jsw`
- `src/backend/agentOutcomeService.jsw`
- `src/backend/agentEvaluationService.jsw`

### Router-first implementation tasks

- [ ] extend `ACTION_REGISTRY` entries in `src/backend/agentService.jsw` with execution metadata
- [ ] extend legacy `TOOL_DEFINITIONS` entries in `src/backend/agentService.jsw` with the same metadata shape
- [ ] add helpers to resolve action execution posture from `router.action`
- [ ] ensure `agentRunLedgerService.jsw` can log `plan_id`, `node_id`, `branch_id`, and `join_key`
- [ ] update `agentOutcomeService.jsw` to distinguish sequential failures from branch failures
- [ ] update `agentEvaluationService.jsw` to aggregate by `tool_name`, `branch_id`, and `execution_mode`

### First-pass router classification set

| Router | Initial classification target |
|--------|-------------------------------|
| `observability_ops` | nearly all reads `parallel_safe`; `recalibrate_scoring` `sequential_only` |
| `cross_role_utility` | comparisons and analytics `parallel_safe`; any mutation `sequential_only` |
| `external_api` | query actions `parallel_safe` with bounded concurrency; `configure_api_key` `sequential_only` |
| `driver_road` | read actions `parallel_safe`; report/rating actions `sequential_only` |
| `recruiter_analytics` | read/suggest actions `parallel_safe` |
| `carrier_communication` | create/update actions `sequential_only` |

### Exit Criteria

- [ ] Every router action exposed to agents has explicit execution metadata.
- [ ] A parallel-safety audit exists for all current high-traffic routers.
- [ ] Approval-gated actions are classified as sequential-only unless explicitly exempted.
- [ ] No action is parallelized without a declared idempotency posture.

---

## Phase 2 - Plan Builder and DAG Representation

**Goal:** Move from implicit turn-by-turn sequencing to an explicit plan object.

### Deliverables

- Add a plan builder stage before tool execution.
- Planner emits structured execution graph:
  - `plan_id`
  - `goal`
  - `nodes`
  - `depends_on`
  - `execution_mode`
  - `approval_required`
  - `risk_level`
  - `verifier_required`
  - `fallback_strategy`

- Persist plan summaries in the run ledger.
- Store node-level intent and dependency information for replay/debugging.

### Implementation-ready tasks

- [ ] create `src/backend/agentPlanService.jsw`
- [ ] add `buildExecutionPlan(role, message, context, tools)` entrypoint
- [ ] attach planner output to `handleAgentTurn()` before executor selection
- [ ] persist plan summary in `agentRuns`
- [ ] persist node summaries in `agentSteps` or a new node-oriented collection if needed
- [ ] add feature flag `dagPlanningEnabled`

### Minimal node shape

```json
{
  "node_id": "n3",
  "tool": "cross_role_utility",
  "action": "get_market_intelligence",
  "params": {},
  "depends_on": ["n1"],
  "execution_mode": "parallel_safe",
  "approval_required": false,
  "risk_level": "read",
  "verifier_required": false,
  "status": "planned"
}
```

### Planning rules

1. Reads with no shared mutable state may fan out.
2. Writes always serialize unless a domain-specific lock says otherwise.
3. Approval-required nodes create explicit pause points.
4. Final summarization cannot occur until all required join groups are resolved.

### Exact first workflow mappings

| Role | Workflow | Candidate routers/actions |
|------|----------|---------------------------|
| Driver | carrier intelligence comparison | `cross_role_utility.get_match_explanation`, `cross_role_utility.compare_carriers`, `external_api.query_safety_api`, `driver_utility.get_market_insights` |
| Recruiter | candidate market assessment | `recruiter_analytics.*`, `recruiter_retention.*`, `cross_role_utility.get_recruiter_health`, `external_api.query_matching_api` |
| Admin | diagnostic triage | `observability_ops.get_tracing_dashboard`, `observability_ops.get_tool_performance`, `external_api.get_api_health`, `cross_role_utility.get_platform_benchmarks` |
| Carrier | operational benchmarking | `carrier_fleet.*`, `carrier_compliance.*`, `cross_role_utility.compare_carriers`, `external_api.query_ops_api` |

### Exit Criteria

- [ ] Planner can emit a valid graph for at least one workflow per role.
- [ ] Run ledger stores the graph or graph summary linked to `run_id`.
- [ ] Existing sequential fallback remains available behind a feature flag.
- [ ] Failed planning degrades to current sequential tool loop with no user-facing regression.

---

## Phase 3 - DAG Executor with Bounded Parallel Branches

**Goal:** Execute independent read branches concurrently while preserving policy and audit controls.

### Deliverables

- Add executor that:
  - topologically sorts ready nodes
  - groups `parallel_safe` nodes by join boundary
  - executes ready groups with bounded concurrency
  - serializes `sequential_only` nodes
  - records per-node and per-branch timings

- Add branch-level status values:
  - `planned`
  - `ready`
  - `running`
  - `awaiting_approval`
  - `blocked`
  - `completed`
  - `failed`
  - `skipped`

- Add merge logic for parallel branch outputs before verifier/summarizer stages.

### Implementation-ready tasks

- [ ] create `src/backend/agentDagExecutorService.jsw`
- [ ] add node scheduler that resolves ready sets from plan dependencies
- [ ] add bounded-concurrency execution helper for `parallel_safe` branches
- [ ] add branch join assembler for structured output bundles
- [ ] make `handleAgentTurn()` choose `executeSequentialLoop()` vs `executeDagPlan()`
- [ ] add feature flag `parallelReadBranchesEnabled`

### First candidate workflows

1. **Driver carrier intelligence**
   - parallel: carrier enrichment, FMCSA snapshot, market intel, weather/route context
   - join: explanation synthesis

2. **Recruiter candidate assessment**
   - parallel: search, score breakdown, retention risk, market comparison
   - sequential: outreach recommendation or pipeline mutation

3. **Admin diagnostics**
   - parallel: service health, tool performance, anomaly lookup, API posture
   - sequential: remediation proposal and gated action

### Exact file mapping for first rollout

| Workflow | Core files touched |
|----------|--------------------|
| Driver carrier intelligence | `src/backend/agentService.jsw`, `src/backend/aiEnrichment.jsw`, `src/backend/agentDagExecutorService.jsw` |
| Recruiter candidate assessment | `src/backend/agentService.jsw`, recruiter analytics/retention wrappers, `src/backend/agentDagExecutorService.jsw` |
| Admin diagnostics | `src/backend/agentService.jsw`, `src/backend/adminObservabilityAgentService.jsw`, `src/backend/agentDagExecutorService.jsw` |

### Hard safety limits

- default max concurrency per run: `3`
- branch timeout budget enforced
- any write node drains the current parallel group before execution
- no parallel group may contain more than one approval-required node

### Exit Criteria

- [ ] At least three read-heavy workflows execute with bounded parallel branches.
- [ ] Median latency for those workflows improves versus sequential baseline.
- [ ] Step logging remains complete and correctly ordered for replay.
- [ ] Approval-required nodes still pause safely without corrupting branch state.

---

## Phase 4 - Approval Gate Manager and Verifier Separation

**Goal:** Decouple action approval and result validation from the base executor.

### Deliverables

- Add branch-aware approval manager:
  - gate references node and branch identifiers
  - paused branch can wait while unrelated ready branches continue when policy allows
  - gate resolution resumes only the blocked branch and downstream dependents

- Add verifier stage:
  - validates branch outputs before final user-visible synthesis
  - runs on workflows that aggregate multiple sources or perform writes
  - can reject, retry, or downgrade confidence

- Add verifier policies:
  - source agreement thresholds
  - minimum evidence counts
  - stale-data rejection
  - no-final-answer on unresolved critical branch failures

### Implementation-ready tasks

- [ ] create `src/backend/agentApprovalCoordinator.jsw`
- [ ] create `src/backend/agentVerifierService.jsw`
- [ ] add gate state transitions keyed by `node_id` and `branch_id`
- [ ] update `resumeAfterApproval()` to resume blocked branch instead of assuming a single pending tool block
- [ ] add feature flag `branchAwareApprovalsEnabled`
- [ ] add feature flag `agentVerifierEnabled`

### First verifier attachments

| Workflow | Verifier type | Reason |
|----------|---------------|--------|
| Driver carrier intelligence | `consistency_verifier` | multiple market/safety/intel sources |
| Recruiter assessment | `outcome_verifier` | recommendation should be grounded before outreach |
| Admin self-healing / diagnostics | `policy_verifier` | any remediation path should meet risk policy |
| Carrier compliance benchmark | `consistency_verifier` | avoid contradictory operational guidance |

### Suggested verifier types

- `consistency_verifier`
- `policy_verifier`
- `outcome_verifier`

### Exit Criteria

- [ ] Approval gates no longer force full-run halt for unrelated safe branches.
- [ ] Verifier stage exists for at least one workflow per role.
- [ ] Final responses can cite branch confidence or degraded-data states.
- [ ] Gate, verifier, and executor telemetry appear in the run monitor model.

---

## Phase 5 - Observability, Evaluation, and Rollout Controls

**Goal:** Measure whether the architecture change is actually better.

### Deliverables

- Extend evaluation metrics:
  - sequential vs DAG latency
  - branch fan-out count
  - branch failure rate
  - approval wait time per node
  - verifier rejection rate
  - partial-completion rate

- Add admin observability support:
  - plan view
  - branch timeline view
  - critical path duration
  - gated node audit
  - degraded-path replay

- Add feature flags:
  - `dagPlanningEnabled`
  - `parallelReadBranchesEnabled`
  - `branchAwareApprovalsEnabled`
  - `agentVerifierEnabled`

- Rollout by workflow class, not by all roles at once.

### Implementation-ready tasks

- [ ] extend `src/backend/agentEvaluationService.jsw` with branch and verifier metrics
- [ ] extend `src/backend/agentRunLedgerService.jsw` with plan/branch retrieval helpers
- [ ] extend `src/public/admin/js/admin-run-monitor.js` with plan graph and branch timeline views
- [ ] extend `src/public/admin/js/admin-agent-kpis.js` with DAG and verifier KPI cards
- [ ] add critical-path and degraded-path fields to admin dashboard responses

### Recommended rollout order

1. Admin diagnostics
2. Driver carrier intelligence
3. Recruiter market analysis
4. Recruiter or carrier write workflows

### Exit Criteria

- [ ] All new architecture pieces are individually flaggable.
- [ ] Replay tooling can show plan, branches, gates, and final synthesis path.
- [ ] At least one production workflow shows material latency improvement without lower success rate.
- [ ] Reversion to sequential loop can be done without deploy by flipping flags.

---

## Cross-Phase Architecture Rules

### Rule 1 - Sequential is still the default

No workflow becomes parallel unless explicitly classified and tested.

### Rule 2 - Writes drain the graph

Before any write or irreversible side effect:
- all required upstream reads must be complete
- no sibling branch may still be mutating related state

### Rule 3 - Approval is a node, not an exception

Approval must be modeled as a first-class state transition in the graph, not a special-case interruption.

### Rule 4 - Verification is separate from generation

The same model call should not both aggregate complex branch outputs and self-certify them.

### Rule 5 - Plan drift must be visible

If runtime execution deviates from the original plan, that drift must be logged and explorable.

---

## Concrete Repository Changes

### New backend modules

```
src/backend/agentPlanService.jsw
src/backend/agentDagExecutorService.jsw
src/backend/agentApprovalCoordinator.jsw
src/backend/agentVerifierService.jsw
```

### Modified backend modules

```
src/backend/agentService.jsw
src/backend/agentRunLedgerService.jsw
src/backend/agentOutcomeService.jsw
src/backend/agentEvaluationService.jsw
src/backend/agentRuntimeService.jsw
```

### Optional admin UI extensions

```
src/public/admin/js/admin-run-monitor.js
src/public/admin/js/admin-agent-kpis.js
```

### Concrete execution touchpoints

| File | Purpose in this track |
|------|-----------------------|
| `src/backend/agentService.jsw` | planner invocation, executor selection, pause/resume changes |
| `src/backend/agentRunLedgerService.jsw` | persist plan, node, branch, and gate state |
| `src/backend/agentOutcomeService.jsw` | score DAG outcomes and degraded completions |
| `src/backend/agentEvaluationService.jsw` | branch-level effectiveness and regression analysis |
| `src/backend/agentRuntimeService.jsw` | optional future execution offload boundary |
| `src/public/admin/js/admin-run-monitor.js` | replay and branch timeline visualization |
| `src/public/admin/js/admin-agent-kpis.js` | latency and verifier KPI surfacing |

---

## Dependencies

- `agentic_orchestration_20260218` for the existing orchestration loop and role surfaces
- `full_agentic_buildout_20260218` for router-based tool architecture
- `ai_intelligence_layer_20260219` for runtime boundary and future execution offload
- `rag_intent_layer_20260224` for pre-flight intent and retrieval enrichment

---

## Definition of Done

This track is complete only when all of the following are true:

1. Agent actions have explicit execution metadata covering concurrency, side effects, and idempotency.
2. `handleAgentTurn()` can choose between legacy sequential execution and planned DAG execution behind feature flags.
3. At least three read-heavy workflows run with bounded parallel branches and logged join points.
4. Approval gates are branch-aware and resumable without corrupting unrelated work.
5. A verifier stage exists for high-value or multi-branch workflows.
6. Admin observability can replay plan, branches, gates, verifier decisions, and final response path.
7. Measured latency improves on targeted workflows without worse success rate, approval safety, or audit completeness.
