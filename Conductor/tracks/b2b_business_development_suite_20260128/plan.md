# Track Plan: B2B Business Development Suite - Carrier Acquisition

> **Dependencies**: `reverse_matching_20251225` (match intelligence), `carrier_conversion_20260103` (carrier onboarding), `recruiter_outreach_20260120` (multi-channel outreach patterns).

---

## Phase 1: Backend Services ✅ COMPLETE

Build all domain services that power the B2B suite.

### 1.1 Match Intelligence Service
- [x] Implement `b2bMatchSignalService.jsw` — signal CRUD, scoring, batch generation
- [x] Calculate high match counts by region, equipment, and job type
- [x] Confidence and urgency scoring rules
- [x] Top opportunities API for dashboard

### 1.2 Account & Contact Service
- [x] Implement `b2bAccountService.jsw` — account + contact CRUD, list, search
- [x] Account segmentation (enterprise, mid_market, regional, owner_operator)
- [x] Contact consent tracking and preferred channel

### 1.3 Activity Service
- [x] Implement `b2bActivityService.jsw` — unified activity timeline
- [x] Activity types: call, email, sms, meeting, task, note, sequence_step, stage_change
- [x] Outcome tracking and activity velocity metrics

### 1.4 Pipeline Service
- [x] Implement `b2bPipelineService.jsw` — opportunity CRUD, stage transitions
- [x] Stage definitions: prospecting (10%) → discovery (25%) → proposal (50%) → negotiation (75%) → closed
- [x] Forecast calculation with weighted probability
- [x] Risk detection (stalled deals, missing next-step, no decision maker)
- [x] Stage conversion funnel analytics
- [x] Playbook suggestions and value props by segment

### 1.5 Sequence & Outreach Service
- [x] Implement `b2bSequenceService.jsw` — sequences, steps, throttling
- [x] Email/SMS/call record logging
- [x] Call campaign management
- [x] Throttle limits: 200 emails/day, 100 SMS/day, 50 calls/day, quiet hours 9PM-8AM

### 1.6 Analytics Service
- [x] Implement `b2bAnalyticsService.jsw` — KPIs, snapshots, attribution
- [x] Source performance and cost-per-acquisition reporting
- [x] Competitor intel tracking
- [x] Lead source attribution (first/last touch)

### 1.7 Research Agent Service
- [x] Implement `b2bResearchAgentService.jsw` — AI-powered account research
- [x] Research brief generation with talk track and recommendations
- [x] 7-day cache TTL on briefs
- [x] Source aggregation (FMCSA, job boards, company sites)

**Files created:**
- `src/backend/b2bMatchSignalService.jsw`
- `src/backend/b2bAccountService.jsw`
- `src/backend/b2bActivityService.jsw`
- `src/backend/b2bPipelineService.jsw`
- `src/backend/b2bSequenceService.jsw`
- `src/backend/b2bAnalyticsService.jsw`
- `src/backend/b2bResearchAgentService.jsw`

---

## Phase 2: Frontend HTML Modules ✅ COMPLETE

Build all 8 HTML iframe panels for the B2B console.

### 2.1 Dashboard
- [x] `B2B_DASHBOARD.html` — KPI tiles, top prospects, alerts, opportunities, next actions
- [x] Quick actions (call, email, sms, task, brief) per account
- [x] Date range filtering (7d/30d/90d)

### 2.2 Account Detail
- [x] `B2B_ACCOUNT_DETAIL.html` — account info, contacts, match signals, timeline
- [x] Contact management with consent tracking
- [x] Opportunity stage display with next-step scheduling
- [x] Quick actions panel

### 2.3 Pipeline & Deal Flow
- [x] `B2B_PIPELINE.html` — Kanban view with stage cards
- [x] Weighted forecast summary (commit/best/pipeline/coverage)
- [x] Risk flags per deal (stalled, no next-step, no decision maker)
- [x] Drag-and-drop stage transitions

### 2.4 Outreach Workspace
- [x] `B2B_OUTREACH.html` — sequence builder and management
- [x] Step editor (email, sms, call, wait, condition)
- [x] Throttle status display
- [x] Template variable injection

### 2.5 Campaign Reporting
- [x] `B2B_CAMPAIGNS.html` — outreach metrics, channel breakdown, rep performance
- [x] Date range filtering
- [x] Campaign-level and sequence-level performance

### 2.6 Lead Capture
- [x] `B2B_LEAD_CAPTURE.html` — mobile-first lead capture form
- [x] Event-ready with QR entry support
- [x] Follow-up reminders and tagging
- [x] Quick account creation from business cards

### 2.7 Analytics Dashboard
- [x] `B2B_ANALYTICS.html` — pipeline coverage, win rate, cycle length, forecast accuracy
- [x] Source performance and CPA reporting
- [x] Competitor intel tracking and alerts
- [x] Snapshot save for period comparisons

### 2.8 Research Agent Panel
- [x] `B2B_RESEARCH_PANEL.html` — one-click research brief generation
- [x] Highlights: fleet size, hiring signals, compliance, growth signals
- [x] Suggested talk track and recommended next steps
- [x] 7-day cached briefs with force-refresh option

**Files created:**
- `src/public/admin/B2B_DASHBOARD.html`
- `src/public/admin/B2B_ACCOUNT_DETAIL.html`
- `src/public/admin/B2B_PIPELINE.html`
- `src/public/admin/B2B_OUTREACH.html`
- `src/public/admin/B2B_CAMPAIGNS.html`
- `src/public/admin/B2B_LEAD_CAPTURE.html`
- `src/public/admin/B2B_ANALYTICS.html`
- `src/public/admin/B2B_RESEARCH_PANEL.html`

---

## Phase 3: Data Layer (Airtable) ✅ COMPLETE

Create all 21 Airtable tables in base `app9N1YCJ3gdhExA0` and register in `config.jsw`.

### 3.1 Collection Registration
- [x] Register 21 collections in `config.jsw` DATA_SOURCE, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES
- [x] All collections route to Airtable via `usesAirtable()` → `airtableClient.jsw` v2_ passthrough

### 3.2 Airtable Tables Created
- [x] `v2_B2B Accounts` (tblONbwNcIbMcmGnt) — carrier_dot, carrier_name, status, segment, region, fleet_size, source, owner_id
- [x] `v2_B2B Contacts` (tblDgDRafOmJgPwDX) — account_id, name, role, email, phone, timezone, preferred_channel, consent_status
- [x] `v2_B2B Match Signals` (tblLr7vgHmoxUovAU) — carrier_dot, signal_score, driver_count, top_regions/equipment/jobs (JSON), confidence, urgency
- [x] `v2_B2B Opportunities` (tblt2Q3g5xCjrruWE) — account_id, stage, value_estimate, match_signal_id, owner_id, next_step, close_reason
- [x] `v2_B2B Activities` (tblKuVVkOo0yg6DjP) — account_id, contact_id, type, channel, subject, notes, outcome
- [x] `v2_B2B Automation Rules` (tblzqkYrNd45LHWsR) — rule_name, trigger_event, from/to_stage, conditions/actions (JSON), is_active
- [x] `v2_B2B Sequences` (tblz3YpHDy8vN8gid) — name, channel_mix, status, steps/throttle_rules (JSON)
- [x] `v2_B2B Sequence Steps` (tblTGsZE8BKoFHcrV) — sequence_id, step_type, template_subject/body, delay_hours, conditions (JSON)
- [x] `v2_B2B Calls` (tblrIkxUPsQbODCWH) — account_id, contact_id, campaign_id, direction, status, duration, recording_url, transcript
- [x] `v2_B2B Emails` (tblSv8shRmB2iknhh) — account_id, contact_id, sequence_id, subject, body, status, opened, clicked, replied
- [x] `v2_B2B Text Messages` (tblop7J9Hu6Y890Fi) — account_id, contact_id, body, status, sent/delivered_at, response_text
- [x] `v2_B2B Lead Capture Events` (tblKKzr3fPv6FK9jh) — event_name, capture_source, company_name, dot_number, contact info, tags, follow_up
- [x] `v2_B2B Lead Sources` (tblejtWyd8q14bUmi) — account_id, source, medium, campaign, captured_at
- [x] `v2_B2B Analytics Snapshots` (tblZ6QDlQyMH5CBGa) — owner_id, period_start/end, pipeline metrics, stage_conversions/channel_metrics (JSON)
- [x] `v2_B2B Account Research` (tblUGUJanpfZFo1TN) — account_id, carrier_dot, summary, sources/signals/highlights (JSON), talk_track, next_steps
- [x] `v2_B2B Lead Attribution` (tbl34XKG8LnlO5QUP) — account_id, source, medium, campaign, first/last_touch_at, touchpoint_history (JSON)
- [x] `v2_B2B Spend` (tblN1iPBNtexzBMHX) — period_start/end, channel, amount, notes
- [x] `v2_B2B Competitor Intel` (tbln4xfVblfJHF9gR) — competitor_name, region, offerings, pricing_notes, source_url
- [x] `v2_B2B Call Campaigns` (tbld1JVvCcypkE0wg) — name, status, target_list (JSON), script, owner_id, start/end_date
- [x] `v2_B2B Playbooks` (tblEg3MmTzzlUri6x) — name, description, stage, steps (JSON), is_active
- [x] `v2_B2B Value Props` (tblKV9mkAkdA3Ke82) — name, segment, region, message, supporting_data (JSON), is_active

**Note:** Date and boolean fields use `singleLineText` type (ISO strings / "true"/"false") due to Airtable MCP tool limitations with `dateTime` and `checkbox` field creation.

---

## Phase 4: Velo Bridge (Page Code) ✅ COMPLETE

Wire HTML iframe panels to backend services via PostMessage.

### 4.1 Bridge Service
- [x] Implement `b2bBridgeService.jsw` — unified backend message router
- [x] Single entry point: `handleB2BAction(action, data)` routes 45+ actions to 7 domain services
- [x] Response format: `{action, payload}` on success, `{action: 'actionError', message}` on failure
- [x] Compound operations (e.g., `captureLead` creates account + contact + lead source + note)
- [x] Quick action handler for call/email/sms/task/note/meeting shortcuts

### 4.2 Page Code
- [x] Implement `B2B Console.js` — Velo page code
- [x] Auto-discovers 8 HTML components by ID (#b2bDashboard, #b2bAccountDetail, etc.)
- [x] MESSAGE_REGISTRY with 60+ inbound and 40+ outbound message types
- [x] Navigation handler for viewAccount/navigate actions via wix-location
- [x] Sends `init` message on connect so HTML panels know the bridge is ready

### 4.3 Protocol Verification
- [x] All 8 HTML panels confirmed using `{action, ...data}` outbound format
- [x] All 8 HTML panels confirmed expecting `{action, payload}` or `{action, message}` responses
- [x] Zero protocol mismatches between HTML panels and bridge service

**Files created:**
- `src/backend/b2bBridgeService.jsw`
- `src/pages/B2B Console.js`

---

## Phase 5: Integration Testing ✅ COMPLETE

Validate the full bridge routing contract and HTML↔Velo message compatibility.

### 5.1 Bridge Routing Tests
- [x] Create `b2bBridgeService.test.js` with 87 test cases
- [x] Response format validation (success/error/unknown/exception)
- [x] Dashboard actions (6 tests): KPIs, prospects, alerts, opportunities, next actions
- [x] Account actions (4 tests): get, create, update, list
- [x] Contact actions (2 tests): get, create
- [x] Signal actions (2 tests): get, generate
- [x] Pipeline actions (5 tests): pipeline, forecast, moveStage, conversions, risks
- [x] Activity actions (2 tests): timeline, logActivity
- [x] Sequence actions (4 tests): list, save (create vs update), throttle
- [x] Campaign actions (3 tests): metrics, channels, reps
- [x] Lead capture actions (2 tests): captureLead with new + existing account
- [x] Analytics actions (4 tests): sources, CPA, competitor intel, snapshots
- [x] Research actions (3 tests): generateBrief, forceRefresh, getBrief
- [x] Quick actions (6 tests): call, email, sms, task, generateBrief, unknown
- [x] Outreach records (3 tests): recordEmail, recordSms, recordCall
- [x] Action coverage (37 parameterized tests): every action returns non-error response

### 5.2 Protocol Compatibility
- [x] Verified all 8 HTML panels send `{action, ...data}` format
- [x] Verified all 8 HTML panels expect `{action, payload|message}` responses
- [x] Verified bridge service returns matching format

**Result: 87/87 tests passing (0.728s)**

**Files created:**
- `src/public/__tests__/b2bBridgeService.test.js`

---

## Phase 6: Security, Compliance, and Admin Controls ✅ COMPLETE

Protect carrier data and ensure outreach compliance.

### 6.1 Security Service
- [x] Create `b2bSecurityService.jsw` — centralized auth, roles, consent, audit
- [x] Define B2B role hierarchy: viewer (read) → rep (write) → manager (sequences/campaigns) → admin (all)
- [x] Map 45+ actions to minimum role requirements
- [x] Site admin roles (admin, super_admin, ops_admin) auto-map to b2b_admin
- [x] Authenticate via `currentMember` from `wix-members-backend` + `AdminUsers` fallback

### 6.2 Access Controls in Bridge
- [x] Add authentication check at `handleB2BAction()` entry point
- [x] Add role-based permission check before routing to domain services
- [x] Refactored bridge to separate `handleB2BAction()` (auth+audit) from `routeAction()` (dispatch)
- [x] Clear error messages for unauthenticated and unauthorized users

### 6.3 Compliance Enforcement
- [x] Consent validation: email allows until opt-out; SMS/call require explicit opt-in
- [x] Do-not-contact list enforcement blocks all channels
- [x] Quiet hours enforcement (9PM-8AM UTC) blocks outreach sends
- [x] Pre-flight compliance check at bridge level for recordEmail, recordSms, recordCall
- [x] Pre-flight compliance check for quick action outreach (call, email, sms)
- [x] Service-level compliance in `b2bSequenceService.jsw` (recordEmail, recordSms, recordCall)

### 6.4 Audit Logging
- [x] All 19 write/mutation actions are audit-logged (non-blocking)
- [x] Audit entries stored in B2B Activities table with `[AUDIT]` subject prefix
- [x] Captures: action, user ID, email, target type, target ID, data keys, timestamp

### 6.5 Security Tests
- [x] 59 test cases in `b2bSecurityService.test.js`
- [x] Role hierarchy tests (3), hasRole tests (5), action permission tests (4)
- [x] checkActionPermission tests (8), audit tests (3)
- [x] Consent validation tests (12), quiet hours tests (7)
- [x] Target type inference tests (9), site admin mapping tests (4)
- [x] Full permission coverage tests (4)

**Files created/modified:**
- `src/backend/b2bSecurityService.jsw` (NEW — ~350 lines)
- `src/backend/b2bBridgeService.jsw` (MODIFIED — auth + audit + compliance pre-flight)
- `src/backend/b2bSequenceService.jsw` (MODIFIED — consent + quiet hours + DNC)
- `src/public/__tests__/b2bSecurityService.test.js` (NEW — 59 tests)

---

## Phase 7: Track Documentation and Deployment ✅ COMPLETE

Finalize documentation and prepare for production deployment.

### 7.1 Documentation
- [x] Created `track.md` with full implementation summary (~450 lines)
- [x] Documented all 45+ PostMessage action→response mappings with data keys and min roles
- [x] Documented all 21 Airtable table schemas with table IDs and field references
- [x] Documented security model: role hierarchy, auth flow, compliance enforcement, audit
- [x] Documented configuration: throttle defaults, pipeline stages, cache TTLs

### 7.2 Deployment Checklist (documented in track.md §7)
- [x] Wix Editor deployment instructions for B2B Console page creation
- [x] HTML component ID → file mapping table for all 8 panels
- [x] B2B role assignment instructions for team members
- [x] Sync verification steps (commit/push → Wix auto-sync → preview test)
- [x] Updated metadata.json to 100% complete

**Files created:**
- `Conductor/tracks/b2b_business_development_suite_20260128/track.md` (NEW — comprehensive reference)

---

## Phase 8: Autonomous Signal Prospecting ✅ COMPLETE

Replace manual prospect list building with an autonomous nightly pipeline that turns match intelligence into ranked, ready-to-contact carrier accounts.

### 8.1 Scheduled Signal Batch Job
- [x] Add `runB2BSignalBatch` to `jobs.config` — runs nightly at 3 AM UTC (`0 3 * * *`)
- [x] Scan full match engine output for non-client carriers with high driver match counts
- [x] Score every carrier using weighted formula: match count × region overlap × equipment fit × recency
- [x] Auto-create B2B accounts via `createAccountFromSignal()` for carriers above score threshold (≥55)
- [x] Auto-assign segment (enterprise/mid_market/small_fleet/owner_operator) from fleet size lookup via FMCSA

### 8.2 Signal Trend Detection
- [x] Store daily signal snapshots in `v2_B2B Match Signals` via `storeSignalSnapshot()` (idempotent per carrier+date)
- [x] Detect signal spikes (>20% score increase week-over-week) via exported `detectSignalSpikes()` and flag as urgent
- [x] Generate alerts for spike carriers → push to dashboard alerts feed via `checkOpportunityAlerts()` as HIGH severity

### 8.3 Auto-Enrichment
- [x] Cross-reference new accounts against FMCSA API via `enrichAccountFromFMCSA()` → calls `getCarrierSafetyData()`
- [x] Populate region, segment, and fleet_size fields automatically
- [x] Tag accounts with signal-derived metadata: `auto_prospected`, `equip:{equipment}`, `jobs:{jobTypes}`

### 8.4 Dashboard Integration
- [x] Rewrite `getTopProspects()` to merge live signals and rank by AI-computed signal_score (descending)
- [x] Add "AI Score" label with color-coded badge to Top Non-Client Carriers widget in `B2B_DASHBOARD.html`
- [x] Add "NEW" badge (blue) for `is_new_this_week` auto-created accounts
- [x] Add urgency red pulse dot for `urgency === 'high'` (spike-detected carriers)
- [x] Add driver match count in prospect subtitle

### 8.5 Bridge & Security (additional scope)
- [x] Add `getSignalSpikes` route to `b2bBridgeService.jsw` → response `signalSpikesLoaded`
- [x] Register `getSignalSpikes` in `b2bSecurityService.jsw` ACTION_PERMISSIONS (VIEWER role)
- [x] Register `getSignalSpikes` / `signalSpikesLoaded` in `B2B Console.js` MESSAGE_REGISTRY
- [x] Fix VALID_ACTIONS in `B2B_DASHBOARD.html` to match bridge response action names

### 8.6 Bug Fixes (discovered during implementation)
- [x] Fix 38 `result.data` references in `b2bBridgeService.jsw` to use correct service return keys
- [x] Fix `captureLead` case: `accountResult.data` → `accountResult.account`
- [x] Fix dashboard VALID_ACTIONS mismatch: `topProspects` → `topProspectsLoaded`, etc.

**Configuration:** `BATCH_CONFIG` — batchSize: 3, delayBetweenBatchMs: 2000, scoreThreshold: 55, minDriverCount: 3, spikeThresholdPercent: 20, maxProcessPerRun: 25

**Files modified:**
- `src/backend/b2bMatchSignalService.jsw` — 4 new functions + enhanced alerts
- `src/backend/b2bAccountService.jsw` — rewritten getTopProspects + enhanced createAccountFromSignal
- `src/backend/b2bBridgeService.jsw` — new route + 38 return key fixes
- `src/backend/b2bSecurityService.jsw` — new permission entry
- `src/pages/B2B Console.js` — new MESSAGE_REGISTRY entries
- `src/public/admin/B2B_DASHBOARD.html` — VALID_ACTIONS fix + prospect rendering overhaul
- `src/backend/jobs.config` — nightly batch job at 3 AM UTC

---

## Phase 9: LLM-Powered Research Briefs ✅ COMPLETE

Wire real LLM calls into the existing research agent service to generate carrier intelligence briefs from 7 data sources with automatic template fallback.

### 9.1 Data Source Aggregation
- [x] Integrate FMCSA SAFER API via `fetchLiveFMCSA()` wrapper around `getCarrierSafetyData()` — fleet size, BASICs with alert flags, inspections, crashes, operating status
- [x] Aggregate match signal data (driver count, regions, equipment, score history) — existing `getSignalProfile()`
- [x] Aggregate carrier profile, enrichment data, safety records, hiring signals, contacts — 6 existing sources + 1 new FMCSA live source (7 total in `Promise.all`)

### 9.2 LLM Brief Generation
- [x] Build structured prompt via `buildResearchPrompt()` — system prompt (analyst role, FMCSA-as-truth, segment tone, BASIC alert compliance guidance, JSON-only output) + user prompt (all 7 data sources in labeled sections + output JSON schema)
- [x] Call Claude API (`claude-sonnet-4-20250514`) via `generateLLMBrief()` — follows exact `fetch` + `Promise.race` timeout pattern from `aiEnrichment.jsw` with 30s timeout
- [x] Parse LLM response via `parseResearchBriefResponse()` — strips markdown fences, extracts JSON, validates/normalizes fields (highlights[], talk_track, next_steps[], confidence, sources[])
- [x] Store generated brief with `confidence` and `generated_by` fields, source citations, generation timestamp
- [x] 7-day cache TTL preserved; `forceRefresh` bypasses cache; `getCachedBrief()` and `getBrief()` add default confidence/generated_by for backwards compatibility

### 9.3 Talk Track Personalization
- [x] Segment-specific tone via `SEGMENT_TONE` config — enterprise (ROI-focused), mid_market (efficiency/scalability), regional (relationship/local), owner_operator (speed/simplicity)
- [x] Match-specific value props injected via user prompt context (driver count, regions, equipment, hiring signals)
- [x] Compliance/safety talking points auto-included when `has_basic_alerts` is true — system prompt instructs Claude to add compliance talking points about LMDR's pre-screened drivers

### 9.4 Frontend Updates
- [x] Confidence badge (green=high, amber=medium, red=low) with icon in header
- [x] Generated-by badge ("AI-Powered" blue for `llm_claude`, "Template" grey for `template_fallback`, "Agent" for legacy)
- [x] "Copy" button on Talk Track section — `navigator.clipboard.writeText` with `document.execCommand('copy')` fallback for Wix iframes
- [x] Source count badge showing number of data sources used
- [x] `renderBrief()` updated to populate all new badges from `brief.confidence` and `brief.generated_by`

### 9.5 Observability & Error Handling
- [x] Full `startTrace`/`endTrace` lifecycle on `generateBrief()` with `b2b-research-brief` trace name
- [x] `logAIOperation()` on both success and failure paths with provider=anthropic, function=research-brief-llm, token counts, latency
- [x] Automatic fallback: LLM failure → existing template functions (`buildHighlights`, `buildTalkTrack`, `buildNextSteps`, `buildSources`) with `generated_by='template_fallback'`, `confidence='low'`
- [x] All 146 existing B2B tests pass (0 regressions)

**Files modified:**
- `src/backend/b2bResearchAgentService.jsw` — 6 new functions, modified `generateBrief()`, `getBrief()`, `getCachedBrief()`
- `src/public/admin/B2B_RESEARCH_PANEL.html` — badges, copy button, source count, render updates

---

## Phase 10: AI Outreach Content Generation ✅ COMPLETE

Replace static `{{variable}}` templates with LLM-generated personalized outreach content per contact.

### 10.1 Content Generation Service
- [x] Create `b2bContentAIService.jsw` with `generateEmailContent()`, `generateSmsContent()`, `generateCallScript()`
- [x] Input context: match signal data, research brief, contact role, account timeline summary, sequence step position
- [x] Output: subject line + body (email), message text (SMS), or call script with objection handling
- [x] Enforce brand voice guidelines and compliance constraints (no false claims, include opt-out for email)
- [x] 24-hour content caching per contact+channel+step combination
- [x] Automatic fallback to static templates on LLM failure/timeout

### 10.2 Sequence Integration
- [x] Add `ai_generated` flag to sequence step schema — when true, content is generated at send time
- [x] Add `renderStepContent()` in `b2bSequenceService.jsw` to call LLM when step has `ai_generated: true`
- [x] Fallback to static template if LLM call fails or times out
- [x] Cache generated content per contact+step combination to avoid regeneration on retry

### 10.3 Human-in-the-Loop Approval
- [x] Add "Review before send" mode — `saveDraft()`, `approveDraft()`, `getPendingDrafts()`
- [x] Store AI draft and final sent version for A/B comparison
- [x] Track edit distance between AI draft and final send to measure AI accuracy over time

### 10.4 Frontend Updates
- [x] Add "Generate with AI" button in `B2B_OUTREACH.html` step editor
- [x] Add "AI On/Off" toggle per step to enable/disable AI generation at send time
- [x] Add purpose dropdown (intro, follow_up, proposal, check_in, discovery, close)
- [x] Show AI-generated content preview in template textarea
- [x] Visual indicators: cyan badge for AI-enabled steps, success toasts for generation status

### 10.5 Bridge & Security
- [x] Add 6 new routes to `b2bBridgeService.jsw`: generateEmailContent, generateSmsContent, generateCallScript, saveDraft, approveDraft, getPendingDrafts
- [x] Register all 6 actions in `b2bSecurityService.jsw` ACTION_PERMISSIONS (REP role for writes, VIEWER for getPendingDrafts)
- [x] Add write actions to AUDITABLE_ACTIONS for compliance logging
- [x] Wire `B2B_OUTREACH.y9tsi.js` page code with MESSAGE_REGISTRY for all new actions

### 10.6 Data Layer
- [x] Create `v2_B2B Content Cache` table (tblQqnV4vsqe0Dch2) — cache_key, account_id, contact_id, channel, sequence_step_id, content, created_at
- [x] Create `v2_B2B Content Drafts` table (tblKTEqvsvKDndqHI) — account_id, contact_id, channel, ai_draft, final_content, status, timestamps
- [x] Register `b2bContentCache` and `b2bContentDrafts` in `config.jsw` DATA_SOURCE, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES

**Files created:**
- `src/backend/b2bContentAIService.jsw` (~750 lines)

**Files modified:**
- `src/backend/b2bBridgeService.jsw` — 6 new routes for content AI
- `src/backend/b2bSequenceService.jsw` — added `renderStepContent()`, LLM integration import
- `src/backend/b2bSecurityService.jsw` — 6 new ACTION_PERMISSIONS, 5 new AUDITABLE_ACTIONS
- `src/backend/config.jsw` — 2 new collection registrations
- `src/public/admin/B2B_OUTREACH.html` — AI generation UI, toggle, preview
- `src/pages/B2B_OUTREACH.y9tsi.js` — full page code with MESSAGE_REGISTRY

---

## Phase 11: Next-Best-Action Engine ✅ COMPLETE

Replace manual daily planning with an AI-prioritized action queue that tells reps exactly who to contact and why.

### 11.1 Scoring Model
- [x] Create `b2bAIService.jsw` with `scoreNextActions()` function (~500 lines)
- [x] Score every open opportunity and pending activity by:
  - Days since last touch vs. stage SLA (14d prospecting, 10d discovery, 7d proposal/negotiation)
  - Engagement signals (email opens, reply count, response latency) with multipliers
  - Match signal strength and trend direction (urgency=high triggers signal spike detection)
  - Stage-appropriate timing (proposals >5 days get `PROPOSAL_STALE` reason code)
  - Contact availability (timezone-aware, preferred channel from contact record)
- [x] Return ranked action queue with 12 reason codes (OPENED_RECENTLY, REPLIED, SIGNAL_SPIKE, etc.)
- [x] Configurable scoring weights: touchRecency=25, engagement=30, signalStrength=20, stageTiming=15, dealValue=10

### 11.2 Bridge Integration
- [x] Add `getAINextActions` action to bridge → response `aiNextActionsLoaded`
- [x] Add `snoozeAction`, `skipAction`, `recordActionTaken`, `recordActionOutcome` routes
- [x] Register 5 new actions in `b2bSecurityService.jsw` ACTION_PERMISSIONS (VIEWER for read, REP for writes)
- [x] Add 4 write actions to AUDITABLE_ACTIONS for compliance logging
- [x] Update `B2B_DASHBOARD.i5csc.js` BRIDGE_ACTIONS with 5 new entries

### 11.3 Dashboard Widget
- [x] Replace static "Next Actions" panel in `B2B_DASHBOARD.html` with AI-scored queue
- [x] Show priority score (color-coded: red≥70, amber≥50, blue≥30), reason code with icon, recommended channel
- [x] Add "Start" button (play_arrow) that records action and navigates to account
- [x] Add "Snooze" (snooze icon) and "Skip" (close icon) controls for rep override
- [x] Show action count badge ("15 of 42 shown") in panel header
- [x] Days since touch indicator ("Today", "Yesterday", "5d ago")

### 11.4 Learning Loop
- [x] Track which recommended actions led to positive outcomes via `recordActionTaken()` and `recordActionOutcome()`
- [x] Store action→outcome pairs in `v2_B2B AI Action Log` table (tblmDNVFrw6jI2Gu9)
- [x] `getSnoozedAccountIds()` filters snoozed accounts from recommendations until snooze expires
- [x] Outcome types: reply, meeting, stage_advance, no_response — stored for future weight calibration

### 11.5 Data Layer
- [x] Create `v2_B2B AI Action Log` table (tblmDNVFrw6jI2Gu9) — 14 fields
- [x] Register `b2bAIActionLog` in `config.jsw` DATA_SOURCE, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES

**Files created:**
- `src/backend/b2bAIService.jsw` (~500 lines)
- Airtable table: `v2_B2B AI Action Log`

**Files modified:**
- `src/backend/b2bBridgeService.jsw` — 5 new routes, import for b2bAIService
- `src/backend/b2bSecurityService.jsw` — 5 new ACTION_PERMISSIONS, 4 new AUDITABLE_ACTIONS
- `src/backend/config.jsw` — b2bAIActionLog collection routing
- `src/pages/B2B_DASHBOARD.i5csc.js` — 5 new BRIDGE_ACTIONS, updated PostMessage contract docs
- `src/public/admin/B2B_DASHBOARD.html` — AI Next Actions widget, renderAINextActions(), action handlers

---

## Phase 12: AI Lead Qualification & Routing ⬜ NOT STARTED

Auto-score and route inbound leads so hot prospects get immediate follow-up instead of sitting in a queue.

### 12.1 Lead Scoring Model
- [ ] Add `scoreAndRouteLead()` to `b2bAIService.jsw`
- [ ] Score based on: DOT match signal data, fleet size, region overlap with driver supply, equipment fit, capture source quality
- [ ] Classify as hot (≥80), warm (50-79), or cold (<50)
- [ ] Auto-set account status: hot → `prospecting`, warm → `target`, cold → `target`

### 12.2 Auto-Routing
- [ ] Define rep assignment rules by region and segment in `v2_B2B Automation Rules`
- [ ] Auto-assign `owner_id` on account based on best-fit rep
- [ ] For hot leads: auto-create opportunity at `prospecting` stage with estimated value
- [ ] For hot leads: trigger immediate notification to assigned rep

### 12.3 Lead Capture Integration
- [ ] Update `captureLead` in bridge to call `scoreAndRouteLead()` after account creation
- [ ] Return lead score and assigned rep in `leadCaptured` response payload
- [ ] Update `B2B_LEAD_CAPTURE.html` to show instant score + assignment after capture

### 12.4 Scoring Feedback
- [ ] Track lead score → conversion outcome for model calibration
- [ ] Store in `v2_B2B Lead Attribution` with `ai_score` and `ai_score_at` fields
- [ ] Monthly recalibration job to adjust scoring weights based on actual conversion data

**Modifies:** `b2bBridgeService.jsw`, `b2bAccountService.jsw`, `B2B_LEAD_CAPTURE.html`
**Creates:** Scoring functions in `b2bAIService.jsw`, new fields in Lead Attribution table

---

## Phase 13: Predictive Pipeline Forecasting ⬜ NOT STARTED

Replace static stage-based probabilities with ML-predicted close likelihood per deal.

### 13.1 Feature Extraction
- [ ] Add `predictCloseRate()` to `b2bAIService.jsw`
- [ ] Extract features per opportunity:
  - Activity velocity (touches per week)
  - Time in current stage vs. historical average
  - Engagement quality score (opens, replies, meetings)
  - Match signal strength and trend
  - Carrier segment and fleet size
  - Rep historical win rate for this segment
  - Days since last contact vs. stage SLA

### 13.2 Prediction Model
- [ ] Train logistic regression or gradient boosted model on historical deal outcomes
- [ ] Output: predicted close probability (0-100%), confidence interval, risk factors
- [ ] Store predictions in `v2_B2B Opportunities` with `ai_close_probability` and `ai_predicted_at` fields
- [ ] Refresh predictions nightly or on stage change

### 13.3 Forecast View Updates
- [ ] Update `getForecast()` in `b2bPipelineService.jsw` to use AI probabilities when available
- [ ] Show "AI Forecast" vs. "Stage Forecast" toggle in `B2B_PIPELINE.html`
- [ ] Highlight deals where AI probability diverges significantly from stage probability (hidden risk/opportunity)

### 13.4 Forecast Accuracy Tracking
- [ ] Compare AI predictions vs. actual outcomes monthly
- [ ] Store accuracy metrics in `v2_B2B Analytics Snapshots`
- [ ] Surface forecast accuracy trend in `B2B_ANALYTICS.html`

**Modifies:** `b2bPipelineService.jsw`, `b2bAnalyticsService.jsw`, `B2B_PIPELINE.html`, `B2B_ANALYTICS.html`
**Creates:** Prediction functions in `b2bAIService.jsw`, new fields in Opportunities table

---

## Phase 14: AI Activity Summarization & Handoff ⬜ NOT STARTED

Use LLM to generate instant account context summaries from raw activity timelines.

### 14.1 Timeline Summarization
- [ ] Add `summarizeTimeline()` to `b2bContentAIService.jsw`
- [ ] Input: full account timeline (activities, stage changes, outreach records, match signals)
- [ ] Output: 3-5 sentence context brief covering: relationship status, last interaction, key risks, next step
- [ ] Example: "Carrier X (210 trucks, TX/OK) — Discovery stage, $25k est. Last contacted 3 days ago via email (opened, no reply). No decision maker confirmed. Recommended: call owner with updated match data."

### 14.2 Auto-Summary Triggers
- [ ] Generate summary automatically before scheduled calls (attach to call prep view)
- [ ] Generate summary on account reassignment (new rep gets instant context)
- [ ] Generate summary when account is opened in `B2B_ACCOUNT_DETAIL.html`
- [ ] Cache summary for 24 hours; invalidate on new activity

### 14.3 Bridge Integration
- [ ] Add `getAccountSummary` action to bridge → response `summaryLoaded`
- [ ] Register in MESSAGE_REGISTRY and ACTION_PERMISSIONS (viewer role)

### 14.4 Frontend Updates
- [ ] Add "AI Context" card at top of `B2B_ACCOUNT_DETAIL.html` timeline section
- [ ] Show summary with "Last updated X minutes ago" indicator
- [ ] Add "Refresh" button to force regeneration
- [ ] Add summary snippet to `B2B_DASHBOARD.html` prospect cards on hover/expand

**Modifies:** `b2bBridgeService.jsw`, `B2B_ACCOUNT_DETAIL.html`, `B2B_DASHBOARD.html`, `B2B Console.js`
**Creates:** `summarizeTimeline()` in `b2bContentAIService.jsw`

---

## Phase 15: Adaptive Sequence Optimization ⬜ NOT STARTED

Learn which outreach patterns produce the highest response rates and auto-generate optimized sequences.

### 15.1 Pattern Analysis
- [ ] Add `analyzeSequencePerformance()` to `b2bAIService.jsw`
- [ ] Aggregate outcomes by: channel order, step count, delay timing, content type, time of day
- [ ] Segment analysis by carrier segment, region, fleet size, and contact role
- [ ] Identify statistically significant patterns (e.g., "Call-first sequences for enterprise get 2.3x more meetings")

### 15.2 Sequence Recommendation Engine
- [ ] Add `recommendSequence()` to `b2bAIService.jsw`
- [ ] Input: target segment, region, contact role, available channels
- [ ] Output: recommended sequence structure (steps, channels, delays, content themes)
- [ ] Include confidence score and supporting data (sample size, win rate)

### 15.3 Auto-Sequence Generation
- [ ] Combine sequence recommendations with AI content generation (Phase 10)
- [ ] Generate complete ready-to-use sequences with AI-written step content
- [ ] Present as "AI-Suggested Sequence" in `B2B_OUTREACH.html` — manager approves/edits, then activates

### 15.4 Send Time Optimization
- [ ] Analyze historical open/reply rates by hour-of-day and day-of-week per contact timezone
- [ ] Recommend optimal send windows per contact
- [ ] Auto-schedule outreach within optimal windows (respecting quiet hours and throttle limits)

### 15.5 Diminishing Returns Detection
- [ ] Track response probability per additional touch in a sequence
- [ ] Recommend sequence termination when expected response drops below threshold (e.g., <1%)
- [ ] Surface "stop wasting touches" alerts for over-contacted non-responsive accounts

### 15.6 Bridge Integration
- [ ] Add `getSequenceRecommendation` action to bridge → response `recommendationLoaded`
- [ ] Add `getOptimalSendTime` action to bridge → response `sendTimeLoaded`
- [ ] Register in MESSAGE_REGISTRY and ACTION_PERMISSIONS (manager role)

**Modifies:** `b2bBridgeService.jsw`, `b2bSequenceService.jsw`, `B2B_OUTREACH.html`, `B2B_CAMPAIGNS.html`, `B2B Console.js`
**Creates:** Analysis and recommendation functions in `b2bAIService.jsw`

---

## Phase 16: AI Services Integration Testing ⬜ NOT STARTED

Comprehensive test coverage for all AI automation services (Phases 8-15), validating scoring logic, LLM integration contracts, bridge routing for new actions, compliance enforcement on AI-initiated outreach, and end-to-end workflow correctness.

### 16.1 Signal Prospecting Tests (Phase 8)
- [ ] Test signal scoring formula — weighted match count × region overlap × equipment fit × recency
- [ ] Test score threshold filtering — carriers below threshold are not auto-created
- [ ] Test auto-account creation from signal — correct segment assignment by fleet size
- [ ] Test signal spike detection — >20% week-over-week increase triggers urgent flag
- [ ] Test auto-enrichment field population — region, segment, fleet_size from FMCSA data
- [ ] Test nightly batch idempotency — re-running does not create duplicate accounts
- [ ] Test dashboard ranking uses AI signal score instead of last_activity_at

### 16.2 LLM Research Brief Tests (Phase 9)
- [ ] Test prompt template assembly — carrier context, match data, and source data are included
- [ ] Test LLM response parsing — structured JSON matches `v2_B2B Account Research` schema
- [ ] Test 7-day cache TTL — cached briefs are returned within TTL, fresh call after expiry
- [ ] Test `forceRefresh` bypasses cache and regenerates
- [ ] Test talk track personalization by segment — enterprise (ROI-focused) vs. owner_operator (speed-focused)
- [ ] Test compliance talking points included when CSA BASICs are flagged
- [ ] Test graceful fallback when LLM call fails or times out

### 16.3 Content Generation Tests (Phase 10)
- [ ] Test `generateEmailContent()` — returns subject + body with correct brand voice
- [ ] Test `generateSmsContent()` — returns message under 160-char SMS limit
- [ ] Test `generateCallScript()` — includes objection handling section
- [ ] Test context assembly — match signals, research brief, contact role, timeline all injected
- [ ] Test `ai_generated` flag in sequence step triggers LLM call at render time
- [ ] Test fallback to static template when LLM fails
- [ ] Test content caching — same contact+step returns cached version on retry
- [ ] Test "Review before send" mode — AI draft stored separately from final sent version
- [ ] Test edit distance tracking between AI draft and final send
- [ ] Test compliance constraints — email includes opt-out, no false claims

### 16.4 Next-Best-Action Engine Tests (Phase 11)
- [ ] Test action scoring formula — days since touch, engagement signals, signal strength, stage timing
- [ ] Test timezone-aware contact availability filtering
- [ ] Test ranked queue ordering — highest-priority actions first
- [ ] Test reason codes attached to each recommended action
- [ ] Test "Snooze" removes action from queue temporarily
- [ ] Test "Skip" marks action as dismissed
- [ ] Test bridge action `getAINextActions` routes correctly and returns `aiNextActionsLoaded`
- [ ] Test learning loop — positive outcomes (reply, meeting, stage advance) are recorded
- [ ] Test action→outcome pairs stored in `v2_B2B AI Action Log`

### 16.5 Lead Qualification & Routing Tests (Phase 12)
- [ ] Test lead scoring — DOT match signals, fleet size, region overlap, equipment fit, source quality
- [ ] Test classification thresholds — hot (≥80), warm (50-79), cold (<50)
- [ ] Test auto-status assignment — hot → `prospecting`, warm/cold → `target`
- [ ] Test auto-routing — rep assigned by region + segment matching rules
- [ ] Test hot lead auto-creates opportunity at `prospecting` stage with estimated value
- [ ] Test `captureLead` bridge action calls `scoreAndRouteLead()` after account creation
- [ ] Test lead score + assigned rep returned in `leadCaptured` response payload
- [ ] Test scoring feedback — ai_score and ai_score_at stored in Lead Attribution

### 16.6 Predictive Pipeline Forecasting Tests (Phase 13)
- [ ] Test feature extraction — activity velocity, stage time, engagement quality, signal trend
- [ ] Test prediction output — close probability (0-100%), confidence interval, risk factors
- [ ] Test predictions stored in Opportunities with `ai_close_probability` and `ai_predicted_at`
- [ ] Test prediction refresh triggers — nightly batch and on stage change
- [ ] Test `getForecast()` uses AI probabilities when available, falls back to stage probabilities
- [ ] Test divergence detection — flag deals where AI vs. stage probability differ by >20%
- [ ] Test forecast accuracy tracking — AI predictions vs. actual outcomes stored in Analytics Snapshots

### 16.7 Activity Summarization Tests (Phase 14)
- [ ] Test `summarizeTimeline()` input assembly — activities, stage changes, outreach, match signals
- [ ] Test output format — 3-5 sentence brief covering status, last interaction, risks, next step
- [ ] Test 24-hour cache with invalidation on new activity
- [ ] Test auto-summary on account reassignment
- [ ] Test bridge action `getAccountSummary` routes correctly and returns `summaryLoaded`
- [ ] Test graceful fallback when LLM call fails

### 16.8 Adaptive Sequence Optimization Tests (Phase 15)
- [ ] Test `analyzeSequencePerformance()` — aggregates by channel order, step count, timing, content
- [ ] Test segment-specific pattern analysis (enterprise vs. regional vs. owner_operator)
- [ ] Test `recommendSequence()` — returns steps, channels, delays, content themes with confidence
- [ ] Test auto-sequence generation combines recommendation with AI content
- [ ] Test send time optimization — recommends windows by contact timezone
- [ ] Test quiet hours and throttle limits respected in auto-scheduled sends
- [ ] Test diminishing returns detection — flags over-contacted non-responsive accounts
- [ ] Test bridge actions `getSequenceRecommendation` and `getOptimalSendTime` route correctly

### 16.9 Cross-Cutting AI Concerns
- [ ] Test all new bridge actions registered in ACTION_PERMISSIONS with correct min roles
- [ ] Test auth enforcement on all new AI endpoints (viewer, rep, manager as appropriate)
- [ ] Test compliance pre-flight on AI-initiated outreach (consent, quiet hours, DNC)
- [ ] Test audit logging for AI-triggered write operations
- [ ] Test LLM error handling — timeout, rate limit, malformed response all return clean error messages
- [ ] Test AI services degrade gracefully when LLM is unavailable — core B2B features remain functional
- [ ] Test no PII leakage in LLM prompts — sensitive contact data is redacted or anonymized

### 16.10 End-to-End Workflow Tests
- [ ] Test full prospecting flow: signal batch → auto-account → AI score → dashboard ranking
- [ ] Test full outreach flow: next-best-action → AI content → compliance check → send → track outcome
- [ ] Test full lead flow: capture → AI score → auto-route → auto-opportunity → rep notification
- [ ] Test full pipeline flow: deal created → AI probability → forecast update → accuracy tracking
- [ ] Test full research flow: account opened → auto-summary → research brief → talk track → outreach

**Files created:**
- `src/public/__tests__/b2bAIService.test.js` — scoring, qualification, prediction, optimization tests
- `src/public/__tests__/b2bContentAIService.test.js` — content generation, summarization, LLM contract tests
- `src/public/__tests__/b2bAIIntegration.test.js` — end-to-end workflow and cross-cutting concern tests

---

## Summary

| Phase | Description | Status | Key Artifacts |
|-------|-------------|--------|---------------|
| 1 | Backend Services | ✅ Complete | 8 `.jsw` service files |
| 2 | Frontend HTML | ✅ Complete | 8 `.html` panel files |
| 3 | Data Layer (Airtable) | ✅ Complete | 21 tables + config.jsw entries |
| 4 | Velo Bridge | ✅ Complete | Bridge service + page code |
| 5 | Integration Testing | ✅ Complete | 87/87 routing tests passing |
| 6 | Security & Compliance | ✅ Complete | Security service + 59 tests |
| 7 | Documentation & Deploy | ✅ Complete | track.md + deployment checklist |
| 8 | Autonomous Signal Prospecting | ✅ Complete | Nightly batch job, auto-accounts, trend alerts, 38 bridge fixes |
| 9 | LLM-Powered Research Briefs | ✅ Complete | Claude API integration, 7-source briefs, template fallback, UI badges |
| 10 | AI Outreach Content Generation | ✅ Complete | `b2bContentAIService.jsw`, human-in-loop drafts, 2 Airtable tables |
| 11 | Next-Best-Action Engine | ✅ Complete | `b2bAIService.jsw`, scored action queue, learning loop |
| 12 | AI Lead Qualification & Routing | ⬜ Not Started | Auto-score, auto-route, auto-opportunity |
| 13 | Predictive Pipeline Forecasting | ⬜ Not Started | ML close probability, forecast accuracy |
| 14 | AI Activity Summarization | ⬜ Not Started | LLM timeline summaries, handoff context |
| 15 | Adaptive Sequence Optimization | ⬜ Not Started | Pattern analysis, send time, auto-sequences |
| 16 | AI Services Integration Testing | ⬜ Not Started | 3 test files, 70+ test cases, E2E workflows |

**Foundation (Phases 1-7): 100% complete — 146 tests passing**
**AI Automation Phase 8: 100% complete — signal prospecting pipeline operational**
**AI Automation Phase 9: 100% complete — LLM-powered research briefs with Claude API**
**AI Automation Phase 10: 100% complete — personalized content generation with Claude API**
**AI Automation Phase 11: 100% complete — next-best-action scoring engine with learning loop**
**AI Automation (Phases 12-16): 0% — 5 phases planned**
