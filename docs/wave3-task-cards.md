# Wave 3 Task Cards — B2B Suite

**Timeline:** Weeks 5-6
**Juniors:** J6, J7
**Gate 1 follows immediately after this wave (week 7)**
**Templates:** `_TEMPLATE_seed.jsw`, `_TEMPLATE_connectionTest.jsw`, `_TEMPLATE_bridge.test.js`, `_TEMPLATE_html.test.js`

---

## Wave 3 Overview

Wave 3 covers the entire B2B sales portal — accounts, pipeline, outreach sequences, analytics, lead capture, and research. This is the last wave before **Gate 1** (senior expert review).

### Key Architectural Notes
- **B2B_DASHBOARD** uses a **unified bridge pattern** — all actions route through `handleB2BAction()` in `b2bBridgeService.jsw` rather than calling services directly
- **B2B_ACCOUNT_DETAIL** calls services directly + has a nested `accountAction` handler with 7 sub-types
- **b2bBridgeService** and **b2bSequenceService** depend on `b2bSecurityService.jsw` — flag for Gate 1 if security mocks are needed
- All B2B services correctly use dual-source helpers (no direct wixData)
- 30 unique Airtable collections across the B2B domain

### Existing Bridge Tests
| Page | Test File | Status |
|------|-----------|--------|
| B2B_DASHBOARD | `b2bDashboard.test.js` | Exists — J6 reviews |
| B2B_ACCOUNT_DETAIL | `b2bAccountDetail.test.js` | Exists — J6 reviews |
| B2B_PIPELINE | — | NEW — J7 creates |
| B2B_CAMPAIGNS | — | NEW — J7 creates |
| B2B_ANALYTICS | — | NEW — J7 creates |
| B2B_LEAD_CAPTURE | — | NEW — J7 creates |
| B2B_OUTREACH | — | NEW — J7 creates |
| B2B_RESEARCH_PANEL | — | NEW — J7 creates |

### Existing Backend Tests
| Test File | Status |
|-----------|--------|
| `b2bBridgeService.test.js` | Exists — J6 reviews |
| `b2bSecurityService.test.js` | Exists — not in Wave 3 scope |

---

# JUNIOR 6 (J6): B2B Accounts, Activity, Signals & Research

## J6-A: B2B Accounts Seed Data

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedB2BAccounts.jsw` | `_TEMPLATE_seed.jsw` |

### Collection Keys
| Key | Expected Airtable Table | Service |
|-----|------------------------|---------|
| `b2bAccounts` | `v2_B2B_Accounts` | accountService, activityService, matchSignalService, researchAgent |
| `b2bContacts` | `v2_B2B_Contacts` | accountService, researchAgent, sequenceService |
| `b2bLeadSources` | `v2_B2B_Lead_Sources` | accountService |
| `b2bMatchSignals` | `v2_B2B_Match_Signals` | matchSignalService, researchAgent |
| `b2bActivities` | `v2_B2B_Activities` | activityService, pipelineService, analyticsService |
| `b2bAccountResearch` | `v2_B2B_Account_Research` | researchAgent |

### Seed Data Requirements

**B2B Accounts (5 records):**
```
company_name, carrier_dot, industry, employee_count, status,
stage, owner_id, website, notes, created_at
```
- Stages: 'prospect', 'qualified', 'proposal', 'negotiation', 'closed_won'
- 1 account with no carrier_dot (cold lead)
- 1 account with status 'churned'

**B2B Contacts (8 records):**
```
account_id, first_name, last_name, email, phone, title,
role, is_primary, created_at
```
- 2 contacts per account for first 3 accounts
- 1 contact each for remaining 2
- Roles: 'decision_maker', 'influencer', 'champion', 'end_user'

**B2B Lead Sources (5 records):**
```
account_id, source_type, source_detail, captured_at
```
- Types: 'website', 'referral', 'event', 'cold_outreach', 'inbound_call'

**B2B Match Signals (5 records):**
```
carrier_dot, signal_type, signal_strength, details, detected_at
```
- Types: 'hiring_surge', 'safety_decline', 'fleet_expansion', 'contract_expiry', 'competitor_loss'
- Strengths: 'strong', 'moderate', 'weak'

**B2B Activities (10 records):**
```
account_id, type, description, performed_by, metadata, created_at
```
- Types: 'call', 'email', 'sms', 'note', 'task', 'meeting'
- Span across multiple accounts

**B2B Account Research (3 records):**
```
account_id, brief, carrier_data, signals_summary, generated_at, cached
```
- 1 fresh brief, 1 stale brief (>24h), 1 with no carrier data

---

## J6-B: B2B Accounts Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/tests/b2bAccountsConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Configuration
```javascript
const DOMAIN_NAME = 'B2BAccounts';

const TEST_COLLECTIONS = {
    'b2bAccounts': 'v2_B2B_Accounts',
    'b2bContacts': 'v2_B2B_Contacts',
    'b2bLeadSources': 'v2_B2B_Lead_Sources',
    'b2bMatchSignals': 'v2_B2B_Match_Signals',
    'b2bActivities': 'v2_B2B_Activities',
    'b2bAccountResearch': 'v2_B2B_Account_Research'
};

const TEST_RECORD = {
    company_name: '__TEST_SEED__ B2B Connection Test',
    status: 'prospect',
    stage: 'prospect',
    notes: 'Automated connection test - safe to delete'
};

const EXPECTED_AIRTABLE_FIELDS = {
    'company_name': 'Company Name',
    'status': 'Status',
    'stage': 'Stage',
    'notes': 'Notes'
};
```

---

## J6-C: Review Existing Bridge Tests + Create HTML DOM Tests

### Task
Review the 2 existing bridge tests and verify they match current page code. **Also create HTML DOM tests for each page.**

**1. `b2bDashboard.test.js` vs `B2B_DASHBOARD.i5csc.js`**

Expected actions (8 total via unified bridge):
| Action | Response |
|--------|----------|
| `viewAccount` | navigation to `/b2b-account-detail?accountId=...` |
| `getDashboardKPIs` | bridge response |
| `getTopProspects` | bridge response |
| `getAlerts` | bridge response |
| `getTopOpportunities` | bridge response |
| `getNextActions` | bridge response |
| `quickAction` | bridge response |
| `getSignalSpikes` | bridge response |

Note: All non-navigation actions go through `handleB2BAction()` — test should verify the bridge dispatch pattern.

**2. `b2bAccountDetail.test.js` vs `B2B_ACCOUNT_DETAIL.f31mi.js`**

Expected actions (7 main + 7 sub-actions):

| Action | Response | Notes |
|--------|----------|-------|
| `getAccount` | `accountLoaded` | |
| `getSignal` | `signalLoaded` | calls getAccount first, then getSignalByCarrier |
| `getOpportunity` | `opportunityLoaded` | returns active or most recent |
| `getContacts` | `contactsLoaded` | |
| `getTimeline` | `timelineLoaded` | |
| `getRisks` | `risksLoaded` | has fallback logic |
| `accountAction` (type: call) | `actionSuccess` + timeline refresh | |
| `accountAction` (type: email) | `actionSuccess` + timeline refresh | |
| `accountAction` (type: sms) | `actionSuccess` + timeline refresh | |
| `accountAction` (type: task) | `actionSuccess` + timeline refresh | |
| `accountAction` (type: brief) | `actionSuccess` + timeline refresh | |
| `accountAction` (type: addContact) | `actionSuccess` | no timeline refresh |
| `accountAction` (type: logActivity) | `actionSuccess` + timeline refresh | |
| `navigate` | wixLocation.to | routes to dashboard/pipeline/analytics |

Verify all 14 action paths are tested, including error cases and the timeline auto-refresh after accountAction.

**HTML DOM Test Deliverables:**
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bDashboard.html.test.js` | `_TEMPLATE_html.test.js` |
| 2 | `src/public/__tests__/b2bAccountDetail.html.test.js` | `_TEMPLATE_html.test.js` |

### Acceptance Criteria for J6
- [ ] `seedB2BAccounts.jsw` seeds 36 records across 6 collections
- [ ] `b2bAccountsConnectionTest.jsw` passes all 4 phases
- [ ] `b2bDashboard.test.js` reviewed — all 8 actions verified
- [ ] `b2bDashboard.html.test.js` tests DOM rendering for dashboard KPIs, prospect list, alerts
- [ ] `b2bAccountDetail.test.js` reviewed — all 14 action paths verified
- [ ] `b2bAccountDetail.html.test.js` tests DOM rendering for account data, signals, timeline, contacts
- [ ] Error cases for every backend call
- [ ] `npm test` passes
- [ ] Committed: `feat(wave3): Add verification for B2B Accounts, Activity, Signals & Research`

---

# JUNIOR 7 (J7): B2B Pipeline, Sequences, Analytics & Outreach

## J7-A: B2B Pipeline & Outreach Seed Data

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/seeds/seedB2BPipeline.jsw` | `_TEMPLATE_seed.jsw` |

### Collection Keys
| Key | Expected Airtable Table | Service |
|-----|------------------------|---------|
| `b2bOpportunities` | `v2_B2B_Opportunities` | pipelineService, analyticsService |
| `b2bAutomationRules` | `v2_B2B_Automation_Rules` | pipelineService |
| `b2bPlaybooks` | `v2_B2B_Playbooks` | pipelineService |
| `b2bValueProps` | `v2_B2B_Value_Props` | pipelineService |
| `b2bSequences` | `v2_B2B_Sequences` | sequenceService |
| `b2bSequenceSteps` | `v2_B2B_Sequence_Steps` | sequenceService |
| `b2bEmails` | `v2_B2B_Emails` | sequenceService, analyticsService |
| `b2bTextMessages` | `v2_B2B_Text_Messages` | sequenceService, analyticsService |
| `b2bCalls` | `v2_B2B_Calls` | sequenceService, analyticsService |
| `b2bCallCampaigns` | `v2_B2B_Call_Campaigns` | sequenceService |
| `b2bAnalyticsSnapshots` | `v2_B2B_Analytics_Snapshots` | analyticsService |
| `b2bLeadAttribution` | `v2_B2B_Lead_Attribution` | analyticsService |
| `b2bSpend` | `v2_B2B_Spend` | analyticsService |
| `b2bCompetitorIntel` | `v2_B2B_Competitor_Intel` | analyticsService |

**NOTE:** `b2bAccounts`, `b2bActivities`, `b2bContacts` overlap with J6. Check `countData()` and skip if already seeded.

### Seed Data Requirements

**B2B Opportunities (5 records):**
```
account_id, title, stage, value, probability, close_date, owner_id, created_at
```
- Stages: 'discovery', 'proposal', 'negotiation', 'verbal_commit', 'closed_won'
- 1 opportunity with stage 'closed_lost'
- Values ranging $5K - $100K

**B2B Sequences (3 records):**
```
name, description, status, trigger_type, steps_count, created_by, created_at
```
- Statuses: 'active', 'paused', 'draft'
- Triggers: 'manual', 'signal_based', 'time_based'

**B2B Sequence Steps (9 records — 3 per sequence):**
```
sequence_id, step_number, channel, template, delay_hours, created_at
```
- Channels: 'email', 'sms', 'call'
- Each sequence has 3 steps in order

**B2B Emails (5 records):**
```
account_id, contact_id, subject, status, sent_at, opened_at, clicked_at
```
- Statuses: 'sent', 'delivered', 'opened', 'clicked', 'bounced'

**B2B Text Messages (3 records):**
```
account_id, contact_id, content, status, sent_at
```
- Statuses: 'sent', 'delivered', 'failed'

**B2B Calls (5 records):**
```
account_id, contact_id, duration_seconds, outcome, notes, called_at
```
- Outcomes: 'connected', 'voicemail', 'no_answer', 'busy', 'wrong_number'

**B2B Analytics Snapshots (7 records):**
```
snapshot_date, total_accounts, total_pipeline_value, conversion_rate,
avg_deal_size, deals_closed, created_at
```
- 7 consecutive days

**B2B Competitor Intel (3 records):**
```
competitor_name, intel_type, details, source, reported_at
```
- Types: 'pricing', 'feature', 'partnership'

**B2B Lead Attribution (5 records):**
```
account_id, source, campaign, cost, converted, attributed_at
```

**B2B Spend (3 records):**
```
category, amount, period, description, created_at
```

**B2B Playbooks (2 records), Value Props (3 records), Automation Rules (2 records), Call Campaigns (2 records):**
- Minimal seed data to verify collection access

---

## J7-B: B2B Pipeline Connection Test

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/backend/tests/b2bPipelineConnectionTest.jsw` | `_TEMPLATE_connectionTest.jsw` |

### Configuration
```javascript
const DOMAIN_NAME = 'B2BPipeline';

const TEST_COLLECTIONS = {
    'b2bOpportunities': 'v2_B2B_Opportunities',
    'b2bSequences': 'v2_B2B_Sequences',
    'b2bSequenceSteps': 'v2_B2B_Sequence_Steps',
    'b2bEmails': 'v2_B2B_Emails',
    'b2bTextMessages': 'v2_B2B_Text_Messages',
    'b2bCalls': 'v2_B2B_Calls',
    'b2bAnalyticsSnapshots': 'v2_B2B_Analytics_Snapshots',
    'b2bCompetitorIntel': 'v2_B2B_Competitor_Intel',
    'b2bLeadAttribution': 'v2_B2B_Lead_Attribution',
    'b2bSpend': 'v2_B2B_Spend',
    'b2bCallCampaigns': 'v2_B2B_Call_Campaigns',
    'b2bPlaybooks': 'v2_B2B_Playbooks',
    'b2bValueProps': 'v2_B2B_Value_Props',
    'b2bAutomationRules': 'v2_B2B_Automation_Rules'
};

const TEST_RECORD = {
    account_id: '__TEST_SEED__',
    title: 'Connection Test Opportunity',
    stage: 'discovery',
    value: 0,
    probability: 0
};

const EXPECTED_AIRTABLE_FIELDS = {
    'account_id': 'Account ID',
    'title': 'Title',
    'stage': 'Stage',
    'value': 'Value',
    'probability': 'Probability'
};
```

**Run CRUD against `b2bOpportunities` as primary.** Run table mapping checks against all 14 collections.

---

## J7-C: B2B Pipeline Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bPipeline.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/b2bPipeline.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files
- `src/pages/B2B_PIPELINE.qsh6m.js`
- `src/public/admin/B2B_PIPELINE.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_PIPELINE.qsh6m.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getPipelineView: jest.fn().mockResolvedValue({
        stages: [], totalValue: 0, dealCount: 0
    }),
    getForecast: jest.fn().mockResolvedValue({
        projected: 0, confidence: 0.5
    })
};
const mockWixLocation = { to: jest.fn() };
```

### Actions to Test (3 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `getPipeline` | `getPipelineView(filters)` | `pipelineLoaded` | optional ownerId filter |
| 2 | `getForecast` | `getForecast(options)` | `forecastLoaded` | optional ownerId |
| 3 | `viewAccount` | wixLocation.to | navigation | requires: accountId |

---

## J7-D: B2B Campaigns Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bCampaigns.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/b2bCampaigns.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files
- `src/pages/B2B_CAMPAIGNS.rhlno.js`
- `src/public/admin/B2B_CAMPAIGNS.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_CAMPAIGNS.rhlno.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getOutreachMetrics: jest.fn().mockResolvedValue({ sent: 100, opened: 60, replied: 20 }),
    getChannelPerformance: jest.fn().mockResolvedValue([
        { channel: 'email', sent: 50, opened: 30 }
    ]),
    getRepPerformance: jest.fn().mockResolvedValue([
        { rep: 'Rep1', calls: 20, emails: 30 }
    ])
};
```

### Actions to Test (3 total)

| # | Action | Calls | Response | Notes |
|---|--------|-------|----------|-------|
| 1 | `getOutreachMetrics` | `getOutreachMetrics({ days })` | `metricsLoaded` | defaults days to 30 |
| 2 | `getChannelPerformance` | `getChannelPerformance(days)` | `channelsLoaded` | defaults days to 30 |
| 3 | `getRepPerformance` | `getRepPerformance(days)` | `repsLoaded` | defaults days to 30 |

---

## J7-E: B2B Analytics Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bAnalytics.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/b2bAnalytics.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files
- `src/pages/B2B_ANALYTICS.ab55b.js`
- `src/public/admin/B2B_ANALYTICS.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_ANALYTICS.ab55b.js');
```

### Mock Backend
```javascript
const mockBackend = {
    getDashboardKPIs: jest.fn().mockResolvedValue({ revenue: 100000, deals: 5 }),
    getStageConversions: jest.fn().mockResolvedValue({ stages: [] }),
    getSourcePerformance: jest.fn().mockResolvedValue({ sources: [] }),
    getCostPerAcquisition: jest.fn().mockResolvedValue({ cpa: 500 }),
    getCompetitorIntel: jest.fn().mockResolvedValue({ intel: [] }),
    saveSnapshot: jest.fn().mockResolvedValue({ success: true }),
    addCompetitorIntel: jest.fn().mockResolvedValue({ success: true })
};
```

### Actions to Test (7 total)

| # | Action | Calls | Response | Notes |
|---|--------|-------|----------|-------|
| 1 | `getDashboardKPIs` | `getDashboardKPIs({ days })` | `kpisLoaded` | defaults days to 30 |
| 2 | `getStageConversions` | `getStageConversions()` | `conversionsLoaded` | |
| 3 | `getSourcePerformance` | `getSourcePerformance()` | `sourcesLoaded` | |
| 4 | `getCPA` | `getCostPerAcquisition(days)` | `cpaLoaded` | defaults days to 90 |
| 5 | `getCompetitorIntel` | `getCompetitorIntel()` | `intelLoaded` | |
| 6 | `saveSnapshot` | `saveSnapshot({ days })` | `snapshotSaved` | defaults days to 30 |
| 7 | `addCompetitorIntel` | `addCompetitorIntel(intel)` then `getCompetitorIntel()` | `actionSuccess` + `intelLoaded` | defaults intel to {} |

---

## J7-F: B2B Lead Capture Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bLeadCapture.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/b2bLeadCapture.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files
- `src/pages/B2B_LEAD_CAPTURE.jf8ac.js`
- `src/public/admin/B2B_LEAD_CAPTURE.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_LEAD_CAPTURE.jf8ac.js');
```

### Mock Backend
```javascript
const mockBackend = {
    createAccount: jest.fn().mockResolvedValue({ _id: 'acc-new', company_name: 'New Lead' }),
    createContact: jest.fn().mockResolvedValue({ _id: 'con-new' }),
    trackLeadSource: jest.fn().mockResolvedValue({ success: true })
};
```

### Actions to Test (1 action + validation branches)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `captureLead` | `createAccount()` + conditionally `createContact()` + `trackLeadSource()` | `leadCaptured` | requires: companyName |

**Test branches:**
- Full lead with companyName + contactName + captureSource → all 3 calls
- Lead with only companyName → only createAccount called
- Lead with companyName + contactName but no source → createAccount + createContact, no trackLeadSource
- Missing companyName → `actionError`

---

## J7-G: B2B Outreach Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bOutreach.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/b2bOutreach.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files
- `src/pages/B2B_OUTREACH.y9tsi.js`
- `src/public/admin/B2B_OUTREACH.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_OUTREACH.y9tsi.js');
```

### Mock Backend
```javascript
const mockBackend = {
    listSequences: jest.fn().mockResolvedValue({ sequences: [] }),
    getSequence: jest.fn().mockResolvedValue({ _id: 'seq-1', name: 'Test Sequence', steps: [] }),
    createSequence: jest.fn().mockResolvedValue({ _id: 'seq-new' }),
    updateSequence: jest.fn().mockResolvedValue({ success: true }),
    addStep: jest.fn().mockResolvedValue({ success: true }),
    checkThrottleLimits: jest.fn().mockResolvedValue({ allowed: true, remaining: 50 }),
    isQuietHours: jest.fn().mockResolvedValue(false)
};
```

### Actions to Test (4 total)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `getSequences` | `listSequences(filters)` | `sequencesLoaded` | optional status filter |
| 2 | `getSequence` | `getSequence(sequenceId)` | `sequenceLoaded` | requires: sequenceId |
| 3 | `getThrottleStatus` | `checkThrottleLimits()` x3 + `isQuietHours()` | `throttleStatus` | errors suppressed |
| 4 | `saveSequence` | `updateSequence()` or `createSequence()` + `addStep()` per step | `sequenceSaved` | requires: name; update vs create based on sequenceId |

**`saveSequence` branches:**
- With `sequenceId` → `updateSequence()` + `addStep()` per step
- Without `sequenceId` → `createSequence()` + `addStep()` per step
- Missing `name` → `actionError`

---

## J7-H: B2B Research Panel Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/b2bResearchPanel.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/b2bResearchPanel.html.test.js` | `_TEMPLATE_html.test.js` |

### Source Files
- `src/pages/B2B_RESEARCH_PANEL.mz9zk.js`
- `src/public/admin/B2B_RESEARCH_PANEL.html`

### Page Code Config
```javascript
const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_RESEARCH_PANEL.mz9zk.js');
```

### Mock Backend
```javascript
const mockBackend = {
    generateBrief: jest.fn().mockResolvedValue({
        brief: { summary: 'Test brief', sections: [] },
        cached: false
    }),
    getBrief: jest.fn().mockResolvedValue(null)
};
```

### Actions to Test (1 action + validation)

| # | Action | Calls | Response | Validation |
|---|--------|-------|----------|------------|
| 1 | `generateBrief` | sends `briefGenerating` → `generateBrief(accountId, forceRefresh)` | `briefLoaded` with { brief, cached } | requires: accountId |

**Test branches:**
- Valid accountId → sends `briefGenerating` then `briefLoaded`
- Missing accountId → `actionError`
- `forceRefresh: true` → verify boolean conversion
- Backend returns `result.brief` vs flat `result` (backward compatibility)

---

## Acceptance Criteria for J7
- [ ] `seedB2BPipeline.jsw` seeds records across 14 collections
- [ ] `b2bPipelineConnectionTest.jsw` passes all 4 phases for all 14 collections
- [ ] 6 new bridge tests created: Pipeline (3), Campaigns (3), Analytics (7), Lead Capture (1+branches), Outreach (4), Research Panel (1+branches)
- [ ] 6 new HTML DOM tests: `b2bPipeline.html.test.js`, `b2bCampaigns.html.test.js`, `b2bAnalytics.html.test.js`, `b2bLeadCapture.html.test.js`, `b2bOutreach.html.test.js`, `b2bResearchPanel.html.test.js`
- [ ] Each HTML DOM test verifies DOM rendering for all inbound message types + error display
- [ ] Error cases for every backend call across all 6 bridge tests
- [ ] `npm test` passes
- [ ] Committed: `feat(wave3): Add verification for B2B Pipeline, Sequences, Analytics & Outreach`

---

# Issues to Flag for Gate 1

| Issue | Service | Details |
|-------|---------|---------|
| **Security dependency** | `b2bBridgeService.jsw`, `b2bSequenceService.jsw` | Both import from `b2bSecurityService.jsw` — mock in tests or add security service to scope |
| **30 collections** | All B2B services | Largest domain — rate limit testing recommended during Gate 1 |
| **Unified bridge pattern** | `B2B_DASHBOARD` | All actions route through `handleB2BAction()` — different from direct-call pattern used elsewhere |
| **Prior Wave issues** | From Wave 2 | `aiRouterService` wixData inconsistency, `ADMIN_FEATURE_ADOPTION` protocol divergence, `adminAuditLog` overlap |

---

# Post-Wave 3: Gate 1 Checklist

Gate 1 happens **immediately after Wave 3** (week 7). Use `docs/verification-gate-checklist.md`.

**Scope:** All deliverables from Waves 1, 2, and 3:
- **Wave 1:** J1 (13 files), J2 (4 files), J3 (4 files)
- **Wave 2:** J4 (4 files + reviews), J5 (7 files + review)
- **Wave 3:** J6 (2 files + reviews), J7 (8 files)

**Gate 1 focus areas:**
1. Do seed files create data through the real dual-source pipeline?
2. Do connection tests verify all collection mappings?
3. Do bridge tests cover 100% of routeMessage actions?
4. Can an expert run seed → connection test → open page → see data in HTML?
5. Are the 4 flagged issues addressed or documented as accepted tech debt?

---

# Shared Rules (same as Waves 1-2)

## Branch Naming
```
wave3/{junior-name}/{domain}
```

## Commit Message Format
```
feat(wave3): Add verification for {ServiceName}

- Seed data: {N} records across {M} collections
- Connection test: 4-phase Airtable CRUD verification
- Bridge test: {N} actions tested with error cases

Co-Authored-By: {Your Name}
```
