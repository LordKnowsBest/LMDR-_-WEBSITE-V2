# Track Spec: Meta Marketing API Surface Buildout

**Track:** `meta_marketing_api_surface_buildout_20260219`
**Created:** 2026-02-19
**Scope:** End-to-end Meta (Facebook/Instagram) campaign creation, monitoring, optimization, and governance wired into LMDR recruiter/admin surfaces and agentic tool/action infrastructure.

---

## 1) Objective

Create production-grade Meta Marketing API capability parity across:
- Recruiter Outreach surface (campaign building and launch)
- Recruiter Analytics surface (performance monitoring and reporting)
- Admin Platform surface (governance, credentials, approvals, audit)
- Agentic orchestration layer (router actions + policy gating + run ledger)

Primary business outcomes:
- Reduce campaign launch cycle time from hours to minutes.
- Enable autonomous but governed optimization loops.
- Consolidate paid media signal into recruiter pipeline analytics.

---

## 2) Source-Backed Capability Context (Meta)

The official Meta SDK and Meta Postman workspace indicate full support for:

### 2.1 Campaign Creation and Hierarchy
- Campaign CRUD under Ad Account.
- Ad Set CRUD (budgeting, schedule, bid strategy, targeting).
- Ad CRUD (status controls for publish/pause lifecycle).
- Creative and media objects (ad creatives, image/video asset references).

### 2.2 Monitoring and Reporting
- Insights API access for campaigns/ad sets/ads/accounts.
- Time-windowed performance pulls and breakdowns.
- Action metrics and attribution-window based reporting.
- Async/long-running report jobs for heavy analytics use cases.

### 2.3 Audience and Activation Dependencies
- Custom audiences and lookalike audiences.
- Targeting search/discovery and delivery/reach estimation helpers.
- Conversion and lead flows (including lead-related workflows available in Meta collections/tooling).

### 2.4 Operational Constraints
- OAuth token and ad account permissions model (app + user/system user context).
- API versioning lifecycle requiring planned upgrade windows.
- Rate/throughput limits requiring queueing, retries, and backoff.

---

## 3) LMDR Surface Mapping

### 3.1 Recruiter Outreach Surface
Purpose: Build and launch paid campaigns tied to job reqs and target driver segments.

Capabilities to expose:
- campaign creation wizard (objective, special ad category, status)
- ad set planner (budget, schedule, geography, audience, placements)
- creative composer (copy variants, CTA, media selection)
- draft/validate/launch workflow with approval handoff when policy requires

### 3.2 Recruiter Analytics Surface
Purpose: Monitor performance and drive optimization decisions.

Capabilities to expose:
- campaign/ad set/ad dashboards with spend, reach, results, CPA/CPL
- pacing and anomaly alerts (overspend, delivery drop, frequency fatigue)
- cohort and funnel overlays (impressions -> clicks -> lead -> qualified applicant)
- scheduled and on-demand report export

### 3.3 Admin Platform Surface
Purpose: Govern integrations, access, and policy.

Capabilities to expose:
- credential vault + token health + account binding
- approval policies for high-risk actions (launch, budget increases, broad targeting)
- audit timeline for every outbound mutation
- version/rate-limit observability and error triage panel

### 3.4 Agentic Layer
Purpose: Let AI agents execute campaign ops safely through router actions.

Capabilities to expose:
- domain routers + action registry for Meta operations
- risk-tiered execution gates
- deterministic idempotency keys for mutation actions
- closed-loop optimization actions with rollback

---

## 4) Router and Action Architecture

Use the existing domain-router pattern from `full_agentic_buildout_20260218`.

### 4.1 `recruiter_paid_media` router (role: recruiter)

Current v1 actions (implemented):
- `create_campaign_draft`
- `create_campaign`
- `update_campaign`
- `pause_campaign`
- `resume_campaign`
- `delete_campaign`
- `create_ad_set_draft`
- `create_ad_set`
- `update_ad_set_targeting`
- `update_ad_set_budget`
- `update_ad_set_schedule`
- `pause_ad_set`
- `resume_ad_set`
- `delete_ad_set`
- `create_creative_draft`
- `create_creative`
- `update_creative`
- `archive_creative`
- `create_ad`
- `update_ad`
- `pause_ad`
- `resume_ad`
- `delete_ad`
- `attach_creative_to_ad`

Planned v2 additions:
- `list_ad_accounts`
- `list_campaigns`
- `get_campaign`
- `list_ad_sets`
- `list_ads`
- `get_targeting_suggestions`
- `estimate_audience_reach`

### 4.2 `recruiter_paid_media_analytics` router (role: recruiter)

Current v1 actions (implemented):
- `get_insights_campaign_level`
- `get_insights_adset_level`
- `get_insights_ad_level`
- `get_insights_with_breakdowns`
- `create_async_report_job`
- `get_async_report_status`
- `download_report`
- `get_creative_performance`
- `get_placement_performance`
- `get_frequency_fatigue_alerts`
- `suggest_budget_reallocation`
- `suggest_creative_rotation`
- `suggest_audience_narrowing`
- `apply_budget_reallocation`
- `apply_bid_adjustment`
- `rotate_creative_variant`

### 4.3 `admin_meta_ads_governance` router (role: admin)

Read actions:
- `list_meta_integrations`
- `get_token_health`
- `get_meta_api_error_digest`
- `get_rate_limit_posture`
- `get_audit_events`

Execute low:
- `refresh_system_user_token`
- `set_campaign_guardrails`
- `set_daily_budget_caps`
- `set_approval_thresholds`
- `quarantine_integration`

Execute high:
- `rotate_credentials`
- `rebind_ad_account`
- `disable_integration`

### 4.4 `cross_role_paid_media_pipeline` router (roles: recruiter, admin)

Current v1 actions (implemented):

Read:
- `get_paid_media_to_pipeline_funnel`
- `get_cpl_to_hire_trend`
- `get_source_quality_score`

Suggest:
- `suggest_channel_mix`
- `suggest_geo_expansion`

Execute low:
- `sync_campaign_taxonomy_to_pipeline`
- `backfill_missing_attribution`

---

## 5) Data and Service Design

### 5.1 New backend services
- `metaAdsAuthService.jsw`
- `metaCampaignService.jsw`
- `metaAdSetService.jsw`
- `metaCreativeService.jsw`
- `metaInsightsService.jsw`
- `metaOptimizationService.jsw`
- `metaGovernanceService.jsw`
- `metaAttributionBridgeService.jsw`
- `metaReliabilityService.jsw`
- `metaComplianceService.jsw`

### 5.2 Collection additions (Airtable-routed)
- `metaIntegrations`
- `metaAdAccounts`
- `metaCampaignMirror`
- `metaAdSetMirror`
- `metaAdMirror`
- `metaCreativeMirror`
- `metaInsightsDaily`
- `metaInsightsIntraday`
- `metaAsyncReportJobs`
- `metaOptimizationActions`
- `metaGovernancePolicies`
- `metaMutationAudit`
- `metaErrorEvents`
- `metaRateLimitEvents`
- `metaAttributionLinks`

### 5.3 Critical implementation rules
- All mutation calls logged with action, actor, before/after, external id, correlation id.
- Idempotency keys required for all create/update/delete actions.
- Retries use exponential backoff and dead-letter queue for non-recoverable API errors.
- Token refresh runs on schedule plus just-in-time failure recovery.
- Compliance jobs enforce audit completeness checks and retention windows.
- Operational runbooks are documented in:
  - `runbook_meta_token_permission_version.md`
  - `incident_playbook_campaign_delivery_interruptions.md`

---

## 6) Agent Policy and Risk Controls

Risk levels:
- `read`: no side effects
- `suggest`: recommendation only
- `execute_low`: reversible or low blast radius writes
- `execute_high`: irreversible/high-impact actions requiring approval

Approval gates required for:
- first launch on new ad account
- budget changes above configured threshold
- campaign deletions
- cross-account duplication
- integration disable/credential rotation

Hard safety checks:
- enforce campaign naming taxonomy
- block launch if required compliance fields missing
- block optimization actions when data freshness below minimum threshold

---

## 7) Observability and QA

Must-have telemetry:
- outbound call success/error rates by endpoint
- per-action latency and retries
- budget drift and pacing anomalies
- attribution lag and missing UTM/source mappings

Testing requirements:
- unit tests for each service wrapper
- integration tests for router -> service -> data flow
- approval-gate tests for all `execute_high` actions
- replay tests for idempotency and retry correctness
- parity tests that recruiter/admin UI triggers match agent tool actions
- phase-6 production validation artifacts:
  - `src/public/__tests__/metaProductionReadiness.e2e.test.js`
  - `src/public/__tests__/metaInsightsLoad.test.js`
  - `src/public/__tests__/metaSecurityReview.test.js`
  - `security_review_meta_marketing_api_20260219.md`

---

## 8) Phase Model

- Phase 1: auth, account discovery, governance baseline
- Phase 2: campaign/ad set/ad draft + launch lifecycle
- Phase 3: insights and async reporting
- Phase 4: optimization loop + auto-actions with safeguards
- Phase 5: recruiter/admin UI parity + pipeline attribution bridge
- Phase 6: production hardening and compliance

Detailed execution checklist is in `plan.md`.

---

## 9) Source References (official)

1. Meta Business SDK for Node.js (official Meta repo):
   - https://github.com/facebook/facebook-nodejs-business-sdk
2. Meta Business SDK for Python (official Meta repo):
   - https://github.com/facebook/facebook-python-business-sdk
3. Meta Marketing API Postman workspace (official Meta):
   - https://www.postman.com/meta/workspace/facebook-marketing-api/documentation/31691153-4fae975b-b95e-446f-ac99-b8cfa16f681e

Notes:
- This track is aligned to source availability checked on 2026-02-19.
- Use Meta Graph/Marketing API version pinning and scheduled upgrade windows during implementation.
