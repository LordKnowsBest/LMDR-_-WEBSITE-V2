# Track: B2B Business Development Suite - Carrier Acquisition

**Track ID:** `b2b_business_development_suite_20260128`
**Status:** In Progress (Phase 9 complete, Phases 10-16 planned)
**Priority:** Critical
**Last Updated:** 2026-02-02

---

## 1. Summary

This track delivers a complete B2B business development workspace that turns driver match intelligence into carrier acquisition. It equips business development professionals with prospecting, multi-channel outreach (email, SMS, voice), event lead capture, pipeline management, analytics, and AI-powered account research — all accessible through 8 HTML iframe panels wired to Wix Velo via PostMessage bridge.

### Key Metrics

| Metric | Value |
|--------|-------|
| Backend services | 8 `.jsw` files |
| Frontend panels | 8 HTML files |
| Airtable tables | 21 tables |
| Bridge actions | 46+ routed actions |
| Security roles | 4-tier hierarchy |
| Test coverage | 146 tests passing |
| Scheduled jobs | 1 (nightly signal batch) |
| Phases completed | 9/16 |

---

## 2. Architecture

```
+------------------------------------------------------------------+
|  HTML Iframe Panels (src/public/admin/B2B_*.html)                |
|  PostMessage: { action, ...data }                                |
+---------------------------------+--------------------------------+
                                  |
                                  v
+---------------------------------+--------------------------------+
|  Velo Page Code (src/pages/B2B Console.js)                       |
|  component.onMessage() → handleB2BAction() → component.postMessage() |
+---------------------------------+--------------------------------+
                                  |
                                  v
+---------------------------------+--------------------------------+
|  Bridge Service (src/backend/b2bBridgeService.jsw)               |
|  1. Authenticate (getB2BUser)                                    |
|  2. Authorize (checkActionPermission)                            |
|  3. Route to domain service                                      |
|  4. Audit-log write actions                                      |
+---------------------------------+--------------------------------+
                                  |
            +---------------------+---------------------+
            |                     |                     |
            v                     v                     v
   +----------------+   +----------------+   +------------------+
   | Domain Services|   | Security Svc   |   | Activity Service |
   | - Account      |   | - Auth/Roles   |   | - Timeline       |
   | - Pipeline     |   | - Consent      |   | - Audit logging  |
   | - Sequence     |   | - Quiet Hours  |   +------------------+
   | - Signal       |   | - DNC          |
   | - Analytics    |   +----------------+
   | - Research     |
   +--------+-------+
            |
            v
   +------------------+
   | Airtable (21 tbl)|
   | via config.jsw   |
   | + airtableClient |
   +------------------+
```

### Data Flow

```
Driver Match Engine → Match Signals → Prospect Lists → Outreach Sequences
                                                      → Activity Timeline
                                                      → Pipeline Stages
                                                      → Analytics + Alerts
```

---

## 3. File Inventory

### Backend Services (`src/backend/`)

| File | Lines | Purpose |
|------|-------|---------|
| `b2bBridgeService.jsw` | ~700 | Unified message router — auth, authorize, route, audit |
| `b2bSecurityService.jsw` | ~350 | Auth, role hierarchy, consent, quiet hours, DNC, audit |
| `b2bMatchSignalService.jsw` | ~300 | Signal generation, scoring, batch processing, alerts |
| `b2bAccountService.jsw` | ~545 | Account + contact CRUD, prospect lists, lead source tracking |
| `b2bActivityService.jsw` | ~500 | Unified activity timeline, velocity metrics |
| `b2bPipelineService.jsw` | ~600 | Opportunities, stages, forecast, automation, playbooks |
| `b2bSequenceService.jsw` | ~680 | Sequences, steps, outreach records, throttling, compliance |
| `b2bAnalyticsService.jsw` | ~500 | KPIs, snapshots, attribution, CPA, competitor intel |
| `b2bResearchAgentService.jsw` | ~830 | AI research briefs, LLM-powered generation (Claude API), template fallback, FMCSA live data, caching, observability |

### Frontend HTML Panels (`src/public/admin/`)

| File | Purpose |
|------|---------|
| `B2B_DASHBOARD.html` | KPI tiles, top prospects, alerts, opportunities, next actions |
| `B2B_ACCOUNT_DETAIL.html` | Account info, contacts, match signals, activity timeline |
| `B2B_PIPELINE.html` | Kanban pipeline, forecast, risk flags, stage transitions |
| `B2B_OUTREACH.html` | Sequence builder, step editor, throttle status |
| `B2B_CAMPAIGNS.html` | Outreach metrics, channel breakdown, rep performance |
| `B2B_LEAD_CAPTURE.html` | Mobile-first lead capture form, QR entry, follow-ups |
| `B2B_ANALYTICS.html` | Pipeline analytics, source performance, CPA, competitor intel |
| `B2B_RESEARCH_PANEL.html` | One-click research brief, talk track, recommendations |

### Page Code (`src/pages/`)

| File | Purpose |
|------|---------|
| `B2B Console.js` | Wix Velo page code — wires 8 HTML components to bridge service |

### Tests (`src/public/__tests__/`)

| File | Tests | Purpose |
|------|-------|---------|
| `b2bBridgeService.test.js` | 87 | Routing contract — all actions return correct response shapes |
| `b2bSecurityService.test.js` | 59 | Roles, permissions, consent, quiet hours, audit, coverage |

---

## 4. PostMessage Protocol

### Message Format

**HTML → Velo (inbound):**
```javascript
window.parent.postMessage({ action: 'actionName', key1: value1, key2: value2 }, '*');
```

**Velo → HTML (outbound):**
```javascript
// Success
{ action: 'responseAction', payload: { ... } }

// Error
{ action: 'actionError', message: 'Error description' }

// Init (sent on connect)
{ action: 'init', payload: { ready: true, timestamp: 1706000000000 } }
```

### Action → Response Mapping

#### Dashboard

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getDashboardKPIs` | `kpisLoaded` | `days`, `ownerId` | viewer |
| `getTopProspects` | `topProspectsLoaded` | `limit` | viewer |
| `getAlerts` | `alertsLoaded` | — | viewer |
| `getTopOpportunities` | `topOpportunitiesLoaded` | `limit` | viewer |
| `getNextActions` | `nextActionsLoaded` | `limit` | viewer |

#### Accounts & Contacts

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getAccount` | `accountLoaded` | `accountId` | viewer |
| `createAccount` | `accountCreated` | `carrier_dot`, `carrier_name`, `status`, ... | rep |
| `updateAccount` | `accountUpdated` | `accountId`, `updates` | rep |
| `listAccounts` | `accountsLoaded` | `filters` | viewer |
| `getContacts` | `contactsLoaded` | `accountId` | viewer |
| `createContact` | `contactCreated` | `account_id`, `name`, `role`, `email`, ... | rep |
| `updateContact` | `contactUpdated` | `contactId`, `updates` | rep |

#### Match Signals

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getSignal` | `signalLoaded` | `carrierDot` | viewer |
| `generateSignal` | `signalGenerated` | `carrierDot`, `matchData` | rep |
| `generateBatchSignals` | `batchSignalsGenerated` | batch params | rep |
| `getSignalSpikes` | `signalSpikesLoaded` | `days` | viewer |

#### Pipeline & Opportunities

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getPipeline` | `pipelineLoaded` | filters | viewer |
| `getForecast` | `forecastLoaded` | filters | viewer |
| `getOpportunity` | `opportunityLoaded` | `opportunityId` | viewer |
| `getOpportunitiesByAccount` | `opportunityLoaded` | `accountId` | viewer |
| `createOpportunity` | `opportunityCreated` | opp fields | rep |
| `moveStage` | `stageMoved` | `opportunityId`, `newStage`, `userId` | rep |
| `getPipelineKPIs` | `kpisLoaded` | filters | viewer |
| `getStageConversions` | `conversionsLoaded` | — | viewer |
| `getRisks` | `risksLoaded` | filters | viewer |
| `getStageDefinitions` | `stageDefinitionsLoaded` | — | viewer |
| `getPlaybookSuggestions` | `playbooksLoaded` | `stage`, `segment` | viewer |
| `getValueProps` | `valuePropsLoaded` | filters | viewer |

#### Activity Timeline

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getTimeline` | `timelineLoaded` | `accountId`, `type`, `limit` | viewer |
| `logActivity` | `activityLogged` | activity fields | rep |
| `getActivityVelocity` | `velocityLoaded` | `accountId`, options | viewer |

#### Outreach Sequences

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getSequences` | `sequencesLoaded` | `status`, `ownerId` | viewer |
| `getSequence` | `sequenceLoaded` | `sequenceId` | viewer |
| `saveSequence` | `sequenceSaved` | `sequenceId` (if update), seq fields | manager |
| `addStep` | `stepAdded` | `sequenceId`, `step` | manager |
| `getThrottleStatus` | `throttleLoaded` | — | viewer |

#### Outreach Records

| Inbound Action | Response Action | Data Keys | Min Role | Compliance |
|----------------|-----------------|-----------|----------|------------|
| `recordEmail` | `emailRecorded` | `account_id`, `contact_id`, `subject` | rep | Consent + Quiet Hours |
| `recordSms` | `smsRecorded` | `account_id`, `contact_id`, `message` | rep | Consent + Quiet Hours + DNC |
| `recordCall` | `callRecorded` | `account_id`, `contact_id`, call fields | rep | Consent + Quiet Hours + DNC |
| `createCallCampaign` | `callCampaignCreated` | `name`, `script`, `owner_id` | manager | — |

#### Campaigns & Analytics

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `getOutreachMetrics` | `metricsLoaded` | `days` | viewer |
| `getChannelPerformance` | `channelsLoaded` | `days` | viewer |
| `getRepPerformance` | `repsLoaded` | `days` | viewer |
| `getSourcePerformance` | `sourcesLoaded` | `days` | viewer |
| `getCPA` | `cpaLoaded` | `days` | viewer |
| `getCompetitorIntel` | `intelLoaded` | — | viewer |
| `addCompetitorIntel` | `intelAdded` | intel fields | rep |
| `saveSnapshot` | `snapshotSaved` | `days`, `ownerId` | manager |

#### Lead Capture

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `captureLead` | `leadCaptured` | `lead` (companyName, dotNumber, contactName, ...) | rep |

#### Research

| Inbound Action | Response Action | Data Keys | Min Role |
|----------------|-----------------|-----------|----------|
| `generateBrief` | `briefLoaded` | `accountId`, `forceRefresh` | rep |
| `getBrief` | `briefLoaded` | `accountId` | viewer |

#### Quick Actions

| Inbound Action | Response Action | Data Keys | Min Role | Compliance |
|----------------|-----------------|-----------|----------|------------|
| `quickAction` (type=call) | `actionSuccess` | `accountId`, `contactId` | rep | Consent + Quiet Hours |
| `quickAction` (type=email) | `actionSuccess` | `accountId`, `contactId` | rep | Consent + Quiet Hours |
| `quickAction` (type=sms) | `actionSuccess` | `accountId`, `contactId` | rep | Consent + Quiet Hours + DNC |
| `quickAction` (type=task) | `actionSuccess` | `accountId`, `subject` | rep | — |
| `quickAction` (type=note) | `actionSuccess` | `accountId`, `notes` | rep | — |
| `quickAction` (type=meeting) | `actionSuccess` | `accountId`, `contactId` | rep | — |
| `quickAction` (type=generateBrief) | `briefLoaded` | `accountId` | rep | — |

#### Navigation (handled in page code, not bridge)

| Inbound Action | Behavior |
|----------------|----------|
| `navigate` | `wixLocation.to()` based on `target` + `accountId` |
| `viewAccount` | Navigate to `/b2b-account?id={accountId}` |

---

## 5. Airtable Table Reference

**Base:** Last Mile Driver recruiting (`app9N1YCJ3gdhExA0`)

All tables use `v2_B2B ` prefix. Date fields stored as `singleLineText` (ISO strings). Boolean fields stored as `singleLineText` ("true"/"false").

### Core Tables

| Table | Airtable ID | Key Fields |
|-------|-------------|------------|
| `v2_B2B Accounts` | `tblONbwNcIbMcmGnt` | carrier_dot, carrier_name, status¹, segment², region, fleet_size, source, owner_id |
| `v2_B2B Contacts` | `tblDgDRafOmJgPwDX` | account_id, name, role, email, phone, timezone, preferred_channel, consent_status³ |
| `v2_B2B Opportunities` | `tblt2Q3g5xCjrruWE` | account_id, stage⁴, value_estimate, match_signal_id, owner_id, next_step, close_reason |
| `v2_B2B Activities` | `tblKuVVkOo0yg6DjP` | account_id, contact_id, type⁵, channel, subject, notes, outcome⁶, owner_id |
| `v2_B2B Automation Rules` | `tblzqkYrNd45LHWsR` | rule_name, trigger_event, from_stage, to_stage, conditions (JSON), actions (JSON), is_active |

### Match Intelligence

| Table | Airtable ID | Key Fields |
|-------|-------------|------------|
| `v2_B2B Match Signals` | `tblLr7vgHmoxUovAU` | carrier_dot, signal_score, driver_count_high_match, top_regions (JSON), confidence, urgency |

### Outreach

| Table | Airtable ID | Key Fields |
|-------|-------------|------------|
| `v2_B2B Sequences` | `tblz3YpHDy8vN8gid` | name, channel_mix, status⁷, steps (JSON), throttle_rules (JSON) |
| `v2_B2B Sequence Steps` | `tblTGsZE8BKoFHcrV` | sequence_id, step_type⁸, template_subject, template_body, delay_hours, step_order |
| `v2_B2B Emails` | `tblSv8shRmB2iknhh` | account_id, contact_id, sequence_id, subject, body, status⁹, opened, clicked, replied |
| `v2_B2B Text Messages` | `tblop7J9Hu6Y890Fi` | account_id, contact_id, body, status¹⁰, response_text |
| `v2_B2B Calls` | `tblrIkxUPsQbODCWH` | account_id, contact_id, campaign_id, direction, status, duration, recording_url, disposition |
| `v2_B2B Call Campaigns` | `tbld1JVvCcypkE0wg` | name, status⁷, target_list (JSON), script, owner_id |

### Lead Capture

| Table | Airtable ID | Key Fields |
|-------|-------------|------------|
| `v2_B2B Lead Capture Events` | `tblKKzr3fPv6FK9jh` | event_name, capture_source¹¹, company_name, dot_number, contact_name, email, phone |
| `v2_B2B Lead Sources` | `tblejtWyd8q14bUmi` | account_id, source, medium, campaign |

### Analytics & Research

| Table | Airtable ID | Key Fields |
|-------|-------------|------------|
| `v2_B2B Analytics Snapshots` | `tblZ6QDlQyMH5CBGa` | owner_id, period_start/end, pipeline_coverage, win_rate, stage_conversions (JSON) |
| `v2_B2B Account Research` | `tblUGUJanpfZFo1TN` | account_id, carrier_dot, summary, sources (JSON), talk_track, recommendations (JSON) |
| `v2_B2B Lead Attribution` | `tbl34XKG8LnlO5QUP` | account_id, source, medium, campaign, touchpoint_history (JSON) |
| `v2_B2B Spend` | `tblN1iPBNtexzBMHX` | period_start/end, channel, amount, notes |
| `v2_B2B Competitor Intel` | `tbln4xfVblfJHF9gR` | competitor_name, region, offerings, pricing_notes, source_url |

### Supporting

| Table | Airtable ID | Key Fields |
|-------|-------------|------------|
| `v2_B2B Playbooks` | `tblEg3MmTzzlUri6x` | name, description, stage⁴, steps (JSON), is_active |
| `v2_B2B Value Props` | `tblKV9mkAkdA3Ke82` | name, segment², region, message, supporting_data (JSON), is_active |

### Choice Field References

¹ **Account Status:** target, prospecting, engaged, client, churned, disqualified
² **Segment:** enterprise, mid_market, small_fleet, owner_operator
³ **Consent Status:** pending, opted_in, opted_out, do_not_contact
⁴ **Pipeline Stage:** prospecting (10%), discovery (25%), proposal (50%), negotiation (75%), closed_won, closed_lost
⁵ **Activity Type:** email, sms, call, meeting, task, note, stage_change, signal
⁶ **Outcome:** completed, no_answer, left_vm, connected, scheduled, cancelled, sent, opened, replied, bounced
⁷ **Sequence/Campaign Status:** draft, active, paused, archived
⁸ **Step Type:** email, sms, call, wait, condition
⁹ **Email Status:** queued, sent, delivered, opened, clicked, replied, bounced, failed
¹⁰ **SMS Status:** queued, sent, delivered, replied, failed, opted_out
¹¹ **Capture Source:** event_booth, webinar, referral, website, cold_outbound

---

## 6. Security Model

### Role Hierarchy

```
b2b_viewer (0)  →  Read dashboards, pipeline, analytics, briefs
b2b_rep (1)     →  + Create/edit accounts, contacts, log activities, outreach
b2b_manager (2) →  + Manage sequences, campaigns, save snapshots
b2b_admin (3)   →  Full access (auto-mapped from site admin roles)
```

Site admin roles (`admin`, `super_admin`, `ops_admin`) automatically receive `b2b_admin` access.

### Authentication Flow

```
handleB2BAction(action, data)
  → getB2BUser()
    → currentMember.getMember()     // Wix Members backend
    → Check customFields.b2b_role   // Explicit B2B role
    → Check customFields.role       // Site admin auto-map
    → Query AdminUsers collection   // Fallback admin check
  → checkActionPermission(user, action)
    → Compare user.roleLevel >= requiredLevel
  → routeAction(action, data, user)
  → logB2BAudit() if auditable      // Non-blocking
```

### Compliance Enforcement

| Check | Applies To | Behavior |
|-------|------------|----------|
| **Consent (email)** | recordEmail, quickAction(email) | Blocked if opted_out or do_not_contact |
| **Consent (SMS/call)** | recordSms, recordCall, quickAction(sms/call) | Requires explicit `opted_in` status |
| **Quiet Hours** | All outreach sends | Blocked 9PM-8AM UTC |
| **Do-Not-Contact** | SMS and Call channels | Blocked if consent_status = do_not_contact |

### Auditable Actions (19)

All write/mutation actions are logged to `v2_B2B Activities` with `[AUDIT]` subject prefix:
`createAccount`, `updateAccount`, `createContact`, `updateContact`, `createOpportunity`, `moveStage`, `recordEmail`, `recordSms`, `recordCall`, `captureLead`, `saveSequence`, `addStep`, `createCallCampaign`, `addCompetitorIntel`, `generateBrief`, `generateBatchSignals`, `saveSnapshot`, `quickAction`, `accountAction`

---

## 7. Wix Editor Deployment Checklist

The following steps must be completed manually in the Wix Editor to activate the B2B Console:

### 7.1 Create the B2B Console Page

1. In the Wix Editor, create a new page named **"B2B Console"**
2. The page code file `B2B Console.js` will auto-bind

### 7.2 Add HTML Components

Add 8 HTML iframe components to the page. For each component:

| Component ID | HTML File | Purpose |
|-------------|-----------|---------|
| `#b2bDashboard` | `B2B_DASHBOARD.html` | Main dashboard |
| `#b2bAccountDetail` | `B2B_ACCOUNT_DETAIL.html` | Account detail view |
| `#b2bPipeline` | `B2B_PIPELINE.html` | Pipeline Kanban |
| `#b2bOutreach` | `B2B_OUTREACH.html` | Sequence builder |
| `#b2bCampaigns` | `B2B_CAMPAIGNS.html` | Campaign reporting |
| `#b2bLeadCapture` | `B2B_LEAD_CAPTURE.html` | Lead capture form |
| `#b2bAnalytics` | `B2B_ANALYTICS.html` | Analytics dashboard |
| `#b2bResearchPanel` | `B2B_RESEARCH_PANEL.html` | Research agent |

**For each component:**
1. Add an HtmlComponent to the page
2. Set its **ID** in the Properties panel (e.g., `b2bDashboard`)
3. Set its **Source** to the corresponding HTML file from `src/public/admin/`
4. Not all 8 need to be on the same page — the page code auto-discovers which are present

### 7.3 Assign B2B Roles

To grant B2B access to team members:
1. In the Wix Members area, edit the member's custom fields
2. Add field `b2b_role` with value: `b2b_viewer`, `b2b_rep`, `b2b_manager`, or `b2b_admin`
3. Alternatively, site admins (role = `admin`/`super_admin`/`ops_admin`) automatically get `b2b_admin`

### 7.4 Verify Sync

1. Commit and push all code to GitHub: `git add -A && git commit -m "B2B suite complete" && git push`
2. Wix will auto-sync from the GitHub repository
3. Open the B2B Console page in Wix Preview mode
4. Verify the browser console shows: `[B2B Console] X component(s) connected`
5. Test a dashboard load to confirm data flows through the bridge

---

## 8. Autonomous Signal Prospecting (Phase 8)

Nightly autonomous pipeline that generates signals, stores snapshots, detects spikes, auto-creates accounts, enriches via FMCSA, and updates the dashboard.

### Nightly Batch (`runB2BSignalBatch`)

Runs at **3 AM UTC** daily via `jobs.config`. Orchestrator flow:

1. `generateBatchSignals({ limit: 25, minDriverCount: 3 })` — score carriers
2. For each signal: `storeSignalSnapshot()` (idempotent daily) + auto-create account if score ≥ 55 + FMCSA enrich new accounts
3. `detectSignalSpikes()` — compare current vs 7-day-old snapshots, flag >20% increases as urgent

### New Functions in `b2bMatchSignalService.jsw`

| Function | Exported | Purpose |
|----------|----------|---------|
| `storeSignalSnapshot(signal)` | No | Writes signal record with `snapshot_date` field, idempotent per carrier+date |
| `detectSignalSpikes(options)` | Yes | Week-over-week comparison, returns array of spikes with `increase_percent` |
| `enrichAccountFromFMCSA(carrierDot, account)` | No | Calls `getCarrierSafetyData()` to populate fleet_size, segment, region, safety tags |
| `runB2BSignalBatch()` | Yes | Nightly orchestrator: score → snapshot → auto-create → enrich → spike detect |

### BATCH_CONFIG

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `batchSize` | 3 | Carriers per micro-batch (Airtable rate limit safety) |
| `delayBetweenBatchMs` | 2000 | Pause between micro-batches |
| `scoreThreshold` | 55 | Minimum score to auto-create account |
| `minDriverCount` | 3 | Minimum high-match drivers to qualify |
| `spikeThresholdPercent` | 20 | Week-over-week increase to flag as urgent |
| `maxProcessPerRun` | 25 | Total carriers per nightly run (~33s budget) |

### Enhanced `getTopProspects()`

Rewrote in `b2bAccountService.jsw` to fetch target/prospecting accounts, merge live signal data (score, driver count, urgency, confidence), add `is_new_this_week` flag, and sort by `signal_score` descending.

### Dashboard Rendering Updates

- Urgency red pulse dot for `urgency === 'high'` (spike-detected carriers)
- Blue "NEW" badge for `is_new_this_week` auto-created accounts
- Driver match count in prospect card subtitle
- "AI Score" label under color-coded score badge
- "Ranked by AI signal score" header subtitle

### Bug Fixes (discovered during Phase 8)

- Fixed 38 `result.data` references in bridge `routeAction()` to use correct service return keys
- Fixed `captureLead` case: `accountResult.data` → `accountResult.account`
- Fixed dashboard `VALID_ACTIONS` to match bridge response names (`topProspectsLoaded`, `kpisLoaded`, etc.)

---

## 9. LLM-Powered Research Briefs (Phase 9)

Replaced template-based brief assembly with Claude API calls that generate structured, segment-personalized research briefs from 7 data sources. Existing template functions serve as automatic fallback.

### Architecture

```
generateBrief(accountId)
  ├─ cache check → return if fresh (7-day TTL)
  ├─ Promise.all([6 existing sources + FMCSA live])  // each catches own errors
  ├─ try: generateLLMBrief() → Claude API (30s timeout)
  │   ├─ success: parse JSON → {highlights, talk_track, next_steps, confidence, sources}
  │   └─ fail: throw
  └─ catch: log error → buildHighlights + buildTalkTrack + buildNextSteps + buildSources
            set generated_by='template_fallback', confidence='low'
```

### New Functions in `b2bResearchAgentService.jsw`

| Function | Purpose |
|----------|---------|
| `fetchLiveFMCSA(carrierDot)` | Wraps `getCarrierSafetyData()` with safe try/catch; returns `{}` on failure so `Promise.all` never rejects |
| `extractClaudeText(data)` | Extracts text from Claude Messages API response (`data.content[].text`) |
| `buildResearchPrompt(...)` | Builds `{systemPrompt, userPrompt}` with all 7 data sources, segment tone, BASIC alert compliance guidance |
| `parseResearchBriefResponse(text)` | Strips markdown fences, extracts/validates JSON, normalizes to brief schema |
| `generateLLMBrief(...)` | Core Claude API caller — `fetch` + `Promise.race` timeout (30s), full observability logging |

### LLM Configuration

| Parameter | Value |
|-----------|-------|
| Model | `claude-sonnet-4-20250514` |
| Endpoint | `https://api.anthropic.com/v1/messages` |
| Timeout | 30,000ms |
| Max Tokens | 1,500 |
| Secret | `CLAUDE_API_KEY` (via `wix-secrets-backend`) |

### Segment Tone Guide

| Segment | Tone |
|---------|------|
| `enterprise` | ROI-focused, data-driven, executive language |
| `mid_market` | Balanced efficiency and cost savings, scalability |
| `regional` | Practical, relationship-focused, local knowledge |
| `owner_operator` | Direct, simple, speed-focused, minimal paperwork |

### Brief Output Schema

```json
{
  "highlights": ["5-7 bullets, most important first"],
  "talk_track": "3-5 sentences, segment tone, data-specific, CTA at end",
  "next_steps": [{"text": "string", "type": "call|email|proposal|sequence|research|admin", "priority": 1}],
  "confidence": "high|medium|low",
  "sources": ["data sources used"]
}
```

### Confidence Rules

| Level | Criteria |
|-------|----------|
| `high` | 4+ data sources with verified data |
| `medium` | Some data gaps |
| `low` | Sparse data, or template fallback |

### Frontend Updates (`B2B_RESEARCH_PANEL.html`)

- **Confidence badge** — Color-coded (green/amber/red) with icon in header area
- **Generated-by badge** — "AI-Powered" (blue) for `llm_claude`, "Template" (grey) for `template_fallback`
- **Copy button** — On Talk Track section; `navigator.clipboard` primary, `execCommand('copy')` fallback for Wix iframes
- **Source count badge** — Shows number of data sources contributed to the brief

### Observability

- `startTrace('b2b-research-brief', ...)` / `endTrace()` on every `generateBrief()` call
- `logAIOperation()` on success: source=b2b-research-agent, function=research-brief-llm, provider=anthropic, token counts, latency
- `logAIOperation()` on failure: same fields + error message
- All logging is non-blocking (`.catch()` on log calls)

---

## 10. Dependencies

| Track | Purpose | Status |
|-------|---------|--------|
| `reverse_matching_20251225` | Match intelligence and scoring signals | Prerequisite |
| `carrier_conversion_20260103` | Carrier onboarding and conversion flow | Prerequisite |
| `recruiter_outreach_20260120` | Multi-channel outreach patterns | Prerequisite |

---

## 11. Configuration

### config.jsw Registrations

21 collections registered in `DATA_SOURCE`, `WIX_COLLECTION_NAMES`, and `AIRTABLE_TABLE_NAMES`:

```
b2bAccounts, b2bContacts, b2bMatchSignals, b2bOpportunities,
b2bActivities, b2bAutomationRules, b2bSequences, b2bSequenceSteps,
b2bCalls, b2bEmails, b2bTextMessages, b2bLeadCaptureEvents,
b2bLeadSources, b2bAnalyticsSnapshots, b2bAccountResearch,
b2bLeadAttribution, b2bSpend, b2bCompetitorIntel,
b2bCallCampaigns, b2bPlaybooks, b2bValueProps
```

All route to Airtable via the `v2_` prefix passthrough in `airtableClient.jsw`.

### Throttle Defaults

| Channel | Daily Limit | Quiet Hours |
|---------|-------------|-------------|
| Email | 200/day | 9PM-8AM UTC |
| SMS | 100/day | 9PM-8AM UTC |
| Call | 50/day | 9PM-8AM UTC |

### Pipeline Stage Probabilities

| Stage | Probability |
|-------|------------|
| Prospecting | 10% |
| Discovery | 25% |
| Proposal | 50% |
| Negotiation | 75% |
| Closed Won | 100% |
| Closed Lost | 0% |

### Research Brief Cache

- Cache TTL: 7 days
- Force refresh available via `forceRefresh: true` parameter
- Briefs include `confidence` (high/medium/low) and `generated_by` (llm_claude/template_fallback) fields
- LLM generation via Claude API with 30s timeout; automatic template fallback on failure

### Scheduled Jobs

| Job | Function | Schedule | File |
|-----|----------|----------|------|
| Signal Prospecting Batch | `runB2BSignalBatch` | `0 3 * * *` (3 AM UTC daily) | `b2bMatchSignalService.jsw` |
