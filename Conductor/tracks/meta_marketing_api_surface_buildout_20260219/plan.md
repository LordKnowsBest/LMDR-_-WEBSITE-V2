# Track Plan: Meta Marketing API Surface Buildout

## Phase 1: Integration Foundation (Auth + Governance Baseline)

### 1.1 Credentials and Account Discovery
- [x] Task: Create `metaAdsAuthService.jsw` for token validation and refresh orchestration
- [x] Task: Implement account discovery sync (`list_ad_accounts`) and persist to `metaAdAccounts`
- [x] Task: Add scheduled token health checks and proactive refresh job
- [x] Task: Add failure-mode handling for auth and permission errors

### 1.2 Governance Baseline
- [x] Task: Create `metaGovernancePolicies` collection schema and default policies
- [x] Task: Implement approval threshold config (launch/budget/delete)
- [x] Task: Implement mutation audit writer to `metaMutationAudit`
- [x] Task: Add admin surface cards for integration status and token health

### 1.3 Agent Router Foundation
- [x] Task: Register `admin_meta_ads_governance` router in `agentService.jsw`
- [x] Task: Add action registry mappings for governance actions
- [x] Task: Add risk policy metadata and approval gating for execute_high actions

### 1.4 Testing - Phase 1
- [x] Task: Unit tests for auth service token validation/refresh paths
- [x] Task: Unit tests for governance policy evaluation
- [x] Task: Integration test for approval gate enforcement
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Meta Foundation'

---

## Phase 2: Campaign Build and Launch Lifecycle

### 2.1 Campaign/AdSet/Ad Services
- [x] Task: Create `metaCampaignService.jsw` with draft/create/update/pause/resume/delete
- [x] Task: Create `metaAdSetService.jsw` with targeting/budget/schedule updates
- [x] Task: Create `metaCreativeService.jsw` for media and creative object management
- [x] Task: Persist mirrored entities into `metaCampaignMirror`, `metaAdSetMirror`, `metaAdMirror`, `metaCreativeMirror`

### 2.2 Recruiter Outreach Surface
- [x] Task: Add campaign creation wizard (objective, category, status)
- [x] Task: Add ad set planner (budget, schedule, audience, placements)
- [x] Task: Add creative builder (copy + media + CTA)
- [x] Task: Add draft validation and launch confirmation UX

### 2.3 Agent Router - Recruiter Ops
- [x] Task: Register `recruiter_paid_media` router
- [x] Task: Implement actions for draft lifecycle and launch controls
- [x] Task: Wire approval for `launch_campaign` and high-budget actions
- [x] Task: Ensure idempotency keys for all mutation actions

### 2.4 Testing - Phase 2
- [x] Task: Unit tests for campaign/ad set/ad create and update methods
- [x] Task: Router dispatch tests for all recruiter paid media actions
- [x] Task: UI bridge tests for wizard submit/launch payloads
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Campaign Lifecycle'

---

## Phase 3: Monitoring, Insights, and Reporting

### 3.1 Insights Service
- [x] Task: Create `metaInsightsService.jsw` for campaign/ad set/ad insights fetches
- [x] Task: Support timeframe filters, breakdown dimensions, and attribution windows
- [x] Task: Add async report job orchestration and polling (`metaAsyncReportJobs`)
- [x] Task: Persist timeseries into `metaInsightsDaily` and `metaInsightsIntraday`

### 3.2 Recruiter Analytics Surface
- [x] Task: Add spend/reach/results dashboard cards with trend charts
- [x] Task: Add placement and creative performance slices
- [x] Task: Add frequency fatigue, pacing, and anomaly panels
- [x] Task: Add report export and async job status UX

### 3.3 Agent Router - Analytics
- [x] Task: Register `recruiter_paid_media_analytics` router
- [x] Task: Implement read actions for insights and report jobs
- [x] Task: Implement suggest actions for reallocation/creative/audience changes

### 3.4 Testing - Phase 3
- [x] Task: Unit tests for insights query building and normalization
- [x] Task: Async report lifecycle tests (create/status/download)
- [x] Task: End-to-end tests for analytics dashboard data loads
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Monitoring and Reports'

---

## Phase 4: Agentic Optimization Loop

### 4.1 Optimization Service
- [x] Task: Create `metaOptimizationService.jsw` with rule-driven recommendations
- [x] Task: Implement guarded auto-actions (budget shifts, creative rotation, bid adjustment)
- [x] Task: Log all optimization actions to `metaOptimizationActions`
- [x] Task: Add rollback handlers for reversible changes

### 4.2 Agent Actions and Safeguards
- [x] Task: Add execute_low actions for applying optimization suggestions
- [x] Task: Add data-freshness and confidence thresholds before action execution
- [x] Task: Add cooldown windows to prevent action thrashing
- [x] Task: Add anomaly stop-switch for volatile performance periods

### 4.3 Testing - Phase 4
- [x] Task: Recommendation quality tests with scenario fixtures
- [x] Task: Safety gate tests for confidence/freshness/cooldown checks
- [x] Task: Rollback tests for each optimization mutation type
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Agentic Optimization'

---

## Phase 5: Cross-Surface Parity and Admin Operations

### 5.1 Admin Governance Surface
- [x] Task: Add approval inbox for pending execute_high actions
- [x] Task: Add policy editor for thresholds/guardrails
- [x] Task: Add error digest and rate-limit posture dashboard
- [x] Task: Add integration quarantine and recovery controls

### 5.2 Cross-Role Funnel Layer
- [x] Task: Create `metaAttributionBridgeService.jsw` for campaign-to-pipeline joins
- [x] Task: Register `cross_role_paid_media_pipeline` router
- [x] Task: Add CPL-to-hire and source quality views to recruiter analytics
- [x] Task: Add taxonomy sync action for campaign naming -> pipeline dimensions

### 5.3 Testing - Phase 5
- [x] Task: Approval workflow integration tests (agent -> admin -> execution)
- [x] Task: Attribution join correctness tests
- [x] Task: Router parity tests across recruiter/admin roles
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Surface Parity'

---

## Phase 6: Hardening, Compliance, and Production Readiness

### 6.1 Reliability and Performance
- [x] Task: Add retry/backoff/dead-letter behavior to all Meta mutation paths
- [x] Task: Add circuit breaker strategy for sustained Meta API failure windows
- [x] Task: Add request budget management and adaptive polling for insights
- [x] Task: Add cache strategy for account/campaign metadata reads

### 6.2 Compliance and Audit
- [x] Task: Enforce full audit trail completeness checks pre-production
- [x] Task: Add retention policies for audit and performance events
- [x] Task: Add runbook for token expiry, permission drift, and version rollovers
- [x] Task: Add incident playbook for campaign delivery interruptions

### 6.3 Final Validation
- [x] Task: Full E2E test: create -> launch -> monitor -> optimize -> audit
- [x] Task: Load test for high-volume insights pulls
- [x] Task: Security review for credential handling and scoped permissions
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Production Readiness'

---

## Documentation and Parity Updates (Continuous)

- [ ] Task: Keep `progress.md` updated per completed task block
- [ ] Task: Keep `metadata.json` completion fields and dates current
- [ ] Task: Maintain source references and version assumptions in `spec.md`
- [x] Task: Sync action names with `full_agentic_buildout_20260218` router conventions
