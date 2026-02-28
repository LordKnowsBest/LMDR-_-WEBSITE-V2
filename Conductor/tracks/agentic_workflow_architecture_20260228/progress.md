# Agentic Workflow Architecture Upgrade - Progress Tracker

**Track:** `agentic_workflow_architecture_20260228`
**Created:** 2026-02-28
**Goal:** Evolve LMDR agent orchestration from a singular sequential loop into a plan-aware execution model with bounded parallel read branches, branch-aware approvals, and verifier stages.

---

## Phase Summary

| Phase | Name | Status | Scope | Primary Files | Exit Gate |
|-------|------|--------|-------|---------------|-----------|
| 1 | Workflow Taxonomy + Safety Contracts | **COMPLETE** | execution metadata and concurrency rules | `agentService.jsw`, `agentRunLedgerService.jsw`, `agentOutcomeService.jsw`, `agentEvaluationService.jsw` | all routed actions classified |
| 2 | Plan Builder + DAG Representation | **IN PROGRESS** | explicit plan object before execution | `agentPlanService.jsw`, `agentService.jsw`, `configData.js`, `agentRunLedgerService.jsw` | graph emitted for 1 workflow per role |
| 3 | DAG Executor + Bounded Parallelism | **IN PROGRESS** | parallel read branches with joins | `agentDagExecutorService.jsw`, `agentService.jsw` | 3 workflows improved vs sequential |
| 4 | Branch-Aware Approvals + Verifier | **IN PROGRESS** | gate coordinator and verifier separation | `agentApprovalCoordinator.jsw`, `agentVerifierService.jsw` | gate + verifier telemetry live |
| 5 | Observability + Evaluation + Rollout | **IN PROGRESS** | replay, metrics, flags, staged enablement | `admin-run-monitor.js`, `agentEvaluationService.jsw` | replay and metrics complete |

---

## Current Architecture Baseline

### Confirmed repository state

- [x] Singular orchestration entrypoint: `src/backend/agentService.jsw`
- [x] Sequential tool-use loop in `handleAgentTurn()`
- [x] Approval gates and run ledger in `src/backend/agentRunLedgerService.jsw`
- [x] Runtime boundary in `src/backend/agentRuntimeService.jsw`
- [x] Outcome and evaluation services in `src/backend/agentOutcomeService.jsw` and `src/backend/agentEvaluationService.jsw`
- [x] Admin observability surface in `src/public/admin/js/admin-run-monitor.js`
- [x] Bounded parallel subroutines already proven in `voiceCampaignService.jsw`, `agentJobs.jsw`, `aiEnrichment.jsw`

### Current role router inventory

| Role | Router Groups Confirmed | File |
|------|-------------------------|------|
| Driver | `driver_cockpit`, `driver_road`, `driver_community`, `driver_compliance`, `driver_financial`, `driver_lifecycle`, `driver_utility`, `cross_role_utility`, `financial_extended`, `lifecycle_ops` | `src/backend/agentService.jsw` |
| Recruiter | `recruiter_paid_media`, `recruiter_paid_media_analytics`, `recruiter_outreach`, `recruiter_analytics`, `recruiter_onboarding`, `recruiter_pipeline`, `recruiter_retention`, `recruiter_reverse_match`, `cross_role_utility`, `cross_role_paid_media_pipeline`, `external_api`, `lifecycle_ops` | `src/backend/agentService.jsw` |
| Admin | `admin_business_ops`, `admin_platform_config`, `admin_portal`, `admin_support`, `admin_gamification`, `admin_feature_adoption`, `admin_meta_ads_governance`, `observability_ops`, `external_api`, `lifecycle_ops`, `cross_role_utility`, `cross_role_paid_media_pipeline` | `src/backend/agentService.jsw` |
| Carrier | `carrier_fleet`, `carrier_compliance`, `carrier_communication`, `carrier_journey`, `b2b_suite`, `cross_role_utility`, `external_api`, `financial_extended` | `src/backend/agentService.jsw` |

---

## Phase 1 - Workflow Taxonomy + Safety Contracts

### Planned work

- [ ] Add execution metadata to routed actions and legacy flat tools
- [ ] Define `execution_mode`, `side_effect_class`, `idempotency`, `join_key`, `timeout_ms`, `max_concurrency`
- [ ] Build router-by-router parallel safety matrix
- [ ] Mark approval-required actions as sequential-only unless explicitly reviewed

### Target files

- [ ] `src/backend/agentService.jsw`
- [ ] `src/backend/agentRunLedgerService.jsw`

### Candidate router classifications

| Router | Initial expectation | Reason |
|--------|---------------------|--------|
| `observability_ops` | `parallel_safe` for most reads | diagnostic reads are naturally independent |
| `cross_role_utility` | mixed | comparisons and benchmarks can fan out; match-affecting writes cannot |
| `external_api` | mixed / bounded | external reads can parallelize, but endpoint tests and key config are riskier |
| `driver_road` | `parallel_safe` for read-only queries | route/weather/fuel/parking lookups are independent |
| `recruiter_analytics` | `parallel_safe` | attribution, CPH, funnel, competitor reads can branch |
| `carrier_communication` | `sequential_only` for creates/updates | user-visible writes and acknowledgments |

### Exit criteria

- [x] Classification exists for all candidate routers targeted in Phases 2-3
- [x] Metadata shape finalized and documented in `spec.md`
- [x] Metadata normalized into `agentService.jsw`
- [x] Metadata propagated into run/step/gate ledger writes
- [x] Focused tests added for metadata completeness and ledger compatibility

---

## Phase 2 - Plan Builder + DAG Representation

### Planned work

- [x] Add `src/backend/agentPlanService.jsw`
- [x] Generate a plan scaffold before execution begins when flag enabled
- [x] Attach run-level plan summary metadata
- [x] Persist full graph references for replay

### First workflow candidates by file

| Workflow | Why it fits DAG first | Current file anchor |
|----------|-----------------------|---------------------|
| Admin diagnostics bundle | high-value, read-heavy, no immediate side effects | `src/backend/agentService.jsw`, `src/backend/adminObservabilityAgentService.jsw` |
| Driver carrier intelligence | multiple independent data pulls before one synthesis | `src/backend/agentService.jsw`, `src/backend/aiEnrichment.jsw` |
| Recruiter market analysis | analytics-heavy with a clear join before recommendation | `src/backend/agentService.jsw`, recruiter analytics routers |
| Carrier benchmarking | comparison-oriented and mostly read-only | `src/backend/agentService.jsw`, cross-role utility routers |

### Exit criteria

- [x] Planner can emit graph for 4 workflows, one per role
- [x] Legacy sequential path preserved behind flag
- [x] Feature flags added for planning / parallel / approvals / verifier rollout

---

## Phase 3 - DAG Executor + Bounded Parallelism

### Planned work

- [ ] Add `src/backend/agentDagExecutorService.jsw`
- [ ] Execute ready `parallel_safe` nodes in bounded groups
- [ ] Serialize writes and gate-required nodes
- [ ] Log branch timings and join points

### First rollout candidates

| Workflow | Candidate branch set | Expected join |
|----------|----------------------|---------------|
| Admin diagnostics | tracing dashboard + tool performance + API health + anomaly history | remediation or summary |
| Driver carrier intelligence | carrier details + FMCSA + market value + regional analysis | apply / compare guidance |
| Recruiter candidate assessment | score breakdown + retention risk + source quality + market intel | outreach recommendation |

### Exit criteria

- [x] 4 workflow classes now eligible for bounded read-prefetch execution
- [x] branch/critical-path metrics available in evaluation pipeline

---

## Phase 4 - Branch-Aware Approvals + Verifier

### Planned work

- [ ] Add `src/backend/agentApprovalCoordinator.jsw`
- [ ] Add `src/backend/agentVerifierService.jsw`
- [ ] Support pause/resume at node and branch level
- [ ] Verify multi-source outputs before final synthesis

### Approval-sensitive routers to target first

| Router | Action examples | Reason |
|--------|-----------------|--------|
| `recruiter_outreach` | send SMS/email/voice | business and compliance impact |
| `recruiter_onboarding` | background check, drug test, e-sign | regulated workflow |
| `admin_meta_ads_governance` | token refresh, quarantine, thresholds | platform-risking changes |
| `lifecycle_ops` | create exit survey | user-facing workflow mutation |
| `external_api` | configure API key | sensitive platform config |

### Exit criteria

- [x] Approval gate references node and branch ids
- [x] verifier participates in the planned workflow classes and persists run-level verifier state

---

## Phase 5 - Observability + Evaluation + Rollout

### Planned work

- [x] Extend `src/public/admin/js/admin-run-monitor.js` for plan and branch views
- [ ] Extend `src/backend/agentEvaluationService.jsw` with branch and verifier metrics
- [x] Add staged feature flags
- [ ] Define production rollout order

### New observability targets

- [x] plan overview panel
- [x] branch timeline panel
- [ ] gated-node audit
- [x] verifier decision summary
- [x] critical path duration metric

### Exit criteria

- [x] Admin run monitor can replay plan -> branch -> gate -> verifier -> response
- [ ] rollout flags documented and validated

---

## Change Log

| Date | Phase | Change | Author |
|------|-------|--------|--------|
| 2026-02-28 | - | Track created with metadata, plan, and spec | Codex |
| 2026-02-28 | - | Progress tracker added; router inventory and implementation file mappings captured | Codex |
| 2026-02-28 | 1 | File-by-file Phase 1 execution checklist added with function-level acceptance criteria | Codex |
| 2026-02-28 | 1 | Execution metadata normalized in `agentService.jsw` and propagated to run/step/gate ledger writes | Codex |
| 2026-02-28 | 1 | `agentRunLedgerService.jsw`, `agentOutcomeService.jsw`, and `agentEvaluationService.jsw` extended for execution metadata awareness | Codex |
| 2026-02-28 | 1 | Added focused tests: `agentRunLedgerService.test.js` and metadata assertions in `agentService.test.js` | Codex |
| 2026-02-28 | 2 | Added `agentPlanService.jsw`, Phase 2 feature flags, and non-blocking plan summary persistence in `handleAgentTurn()` | Codex |
| 2026-02-28 | 5 | Added derived execution trace helpers to `agentRunLedgerService.jsw` and richer admin observability wrappers in `adminObservabilityAgentService.jsw` | Codex |
| 2026-02-28 | 5 | Extended `ADMIN_DASHBOARD.svo6l.js`, `admin-run-monitor.js`, and `admin-agent-kpis.js` to surface plan, branch, critical-path, and execution-model metrics | Codex |
| 2026-02-28 | 5 | Added ledger trace tests and refreshed the targeted agent workflow suite | Codex |
| 2026-02-28 | 3 | Expanded DAG eligibility from admin-only to driver, recruiter, and carrier workflow classes using router-safe parallel read nodes | Codex |
| 2026-02-28 | 4 | Added queued approval context handling so safe tool branches complete before pause and multiple gated branches resume deterministically | Codex |
| 2026-02-28 | 4 | Persisted verifier status/type/issues onto run records and surfaced verifier telemetry in admin replay views | Codex |
