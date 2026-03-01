# RecruiterOS Intelligence Convergence — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform RecruiterOS from a well-structured CDN shell with partial data wiring into a fully-live, context-aware OS where every view is data-backed, the agent knows which view you're on, and the platform pushes insights proactively.

**Architecture:** 5-wave team delivery with 2 expert gates. Wave 1 freezes the bridge contract. Wave 2 wires all 7 stub views to real backend services. Wave 3 enables NBA chips, view-aware agent context, and market signals. Wave 4 adds proactive AI push and session memory. Wave 5 runs Evidence Pack for final sign-off.

**Tech Stack:** Wix Velo, CDN-first JS modules (jsDelivr), Wix PostMessage bridge, Airtable, Pinecone (lmdr-memory namespace), VAPI, marketSignalsService, agentService, ragService

---

## Pre-Start: Verify Backend Service Exports

### Task 0: Confirm all required backend exports exist

**Files to read:**
- `src/backend/recruiterAnalyticsService.jsw`
- `src/backend/recruiterRetentionService.jsw`
- `src/backend/recruiterOnboardingService.jsw`
- `src/backend/recruiter_service.jsw`
- `src/backend/marketSignalsService.jsw`
- `src/backend/ragService.jsw`
- `src/backend/agentService.jsw`

**Step 1: Read each file and confirm these exports exist**

| Service | Required Export | Confirm |
|---------|----------------|---------|
| `recruiterAnalyticsService` | `getFunnelMetrics`, `getSourceAttribution`, `getHiringForecast` | ☐ |
| `recruiterRetentionService` | `getLifecycleMetrics`, `getAtRiskDrivers`, `getAtRiskCount` | ☐ |
| `recruiterOnboardingService` | `getOnboardingDashboard` | ☐ |
| `recruiter_service` | `getRecruiterDot`, `getCompetitorIntel` | ☐ |
| `marketSignalsService` | `getMarketContext` | ☐ |
| `ragService` | `retrieveContext` | ☐ |
| `agentService` | `handleAgentTurn` | ☐ |

**Step 2: If any export is missing**, create a stub that returns a valid empty response before proceeding. Do not block Wave 1 on this.

**Step 3: Commit if stubs were added**
```bash
git add src/backend/*.jsw
git commit -m "fix(backend): add missing service export stubs for ROS convergence"
git push
```

---

## Wave 1 — Contract Foundation

### Task 1: Audit bridge messages

**Files to read:**
- `src/public/recruiter/os/js/ros-bridge.js` — catalog every `send()` and `on()` call
- `src/pages/Recruiter Console.zriuj.js` — catalog every `case` in message router
- All 29 files in `src/public/recruiter/os/js/views/` — all `ROS.bridge.send()` calls

**Step 1: Open bridge_inventory.md**

Path: `Conductor/tracks/recruiter_os_convergence_20260228/bridge_inventory.md`

**Step 2: For each message discovered during audit, check it off in the inventory table.**

Mark `page_handler: ✅` if a `case 'actionName':` exists in the Recruiter Console router.
Mark `wired: ✅` if the handler returns real data (not a stub or TODO).

**Step 3: Record total counts in the Coverage Summary table at bottom of bridge_inventory.md**

---

### Task 2: Create `ros-contract.js`

**File:**
- Create: `src/public/recruiter/os/js/ros-contract.js`

**Step 1: Write the file**

```javascript
// ============================================================================
// ROS-CONTRACT — Canonical Bridge Message Registry v2.0.0
// Single source of truth for all inbound and outbound message schemas.
// Validation is ONLY active in dev mode (window.__ROS_DEV__ = true).
// ============================================================================

window.ROS = window.ROS || {};

ROS.CONTRACT = {
  version: '2.0.0',

  inbound: {
    // ── Core ──
    rosReady:              { required: [] },
    // ── Recruiter Profile ──
    getRecruiterProfile:   { required: [] },
    // ── Pipeline ──
    getDriversForPipeline: { required: ['stage'], optional: ['limit'] },
    moveDriverStage:       { required: ['driverId', 'fromStage', 'toStage'] },
    // ── Messages ──
    getMessages:           { required: [], optional: ['limit', 'offset'] },
    sendMessage:           { required: ['driverId', 'text'] },
    // ── Search ──
    searchDrivers:         { required: ['query'], optional: ['filters', 'page'] },
    getAIMatches:          { required: [], optional: ['filters'] },
    // ── Alerts ──
    getSavedAlerts:        { required: [] },
    createAlert:           { required: ['criteria'] },
    deleteAlert:           { required: ['alertId'] },
    // ── Job Boards ──
    getJobBoardPostings:   { required: [], optional: ['carrierId'] },
    publishJobPosting:     { required: ['posting'] },
    // ── Campaigns ──
    getSMSCampaigns:       { required: [], optional: ['carrierId'] },
    createSMSCampaign:     { required: ['campaign'] },
    getEmailCampaigns:     { required: [], optional: ['carrierId'] },
    createEmailCampaign:   { required: ['campaign'] },
    // ── Social ──
    getSocialPosts:        { required: [], optional: ['carrierId'] },
    scheduleSocialPost:    { required: ['post'] },
    // ── Carriers ──
    getCarriers:           { required: [], optional: ['filters'] },
    // ── Docs ──
    getDocuments:          { required: ['driverId'] },
    requestDocument:       { required: ['driverId', 'docType'] },
    // ── Compliance ──
    getBGCheckStatus:      { required: ['driverId'] },
    orderBGCheck:          { required: ['driverId', 'vendor'] },
    getDrugTestStatus:     { required: ['driverId'] },
    orderDrugTest:         { required: ['driverId', 'vendor'] },
    getOrientationSchedule: { required: [], optional: ['carrierId'] },
    scheduleOrientation:   { required: ['driverId', 'date'] },
    getComplianceStatus:   { required: [], optional: ['recruiterDot'] },
    // ── Analytics ──
    getLeaderboard:        { required: [], optional: ['period'] },
    getGamification:       { required: [], optional: ['recruiterId'] },
    getCostAnalysis:       { required: [], optional: ['period'] },
    getTelemetry:          { required: [], optional: ['period'] },
    // ── Automation ──
    getAutomationRules:    { required: [], optional: ['carrierId'] },
    createAutomationRule:  { required: ['rule'] },
    // ── Agent ──
    agentMessage:          { required: ['text'], optional: ['context'] },
    // ── Wave 2: Consolidate tools ──
    getIntelData:          { required: [], optional: ['carrierId', 'refresh'] },
    getHiringForecast:     { required: [], optional: ['horizon', 'driverType'] },
    getFunnelMetrics:      { required: [], optional: ['period', 'breakdown'] },
    getAttributionData:    { required: [], optional: ['period', 'channel'] },
    getLifecycleData:      { required: [], optional: ['recruiterDot'] },
    getRetentionSignals:   { required: [], optional: ['recruiterDot', 'limit'] },
    getOnboardingStatus:   { required: [], optional: ['carrierId', 'limit'] },
    // ── Wave 3: Intelligence ──
    refreshNBAChips:       { required: [], optional: ['stateSnapshot'] },
    getMarketSignals:      { required: [] },
    // ── Wave 4: Proactive AI + Memory ──
    getAgentMemory:        { required: ['userId'] },
    getProactiveInsights:  { required: [], optional: ['context'] }
  },

  outbound: {
    // ── Core ──
    pageReady:             { required: [] },
    actionError:           { required: ['message'] },
    // ── Recruiter Profile ──
    recruiterProfileLoaded: { required: ['profile'] },
    // ── Pipeline ──
    pipelineLoaded:        { required: ['drivers', 'stages'] },
    stageMovedConfirm:     { required: ['driverId', 'newStage'] },
    // ── Messages ──
    messagesLoaded:        { required: ['threads'] },
    messageSent:           { required: ['messageId'] },
    // ── Search ──
    searchResults:         { required: ['drivers', 'total'] },
    aiMatchesLoaded:       { required: ['matches'] },
    // ── Alerts ──
    alertsLoaded:          { required: ['alerts'] },
    alertCreated:          { required: ['alert'] },
    // ── Job Boards ──
    jobPostingsLoaded:     { required: ['postings'] },
    // ── Campaigns ──
    smsCampaignsLoaded:    { required: ['campaigns'] },
    emailCampaignsLoaded:  { required: ['campaigns'] },
    // ── Social ──
    socialPostsLoaded:     { required: ['posts'] },
    // ── Carriers ──
    carriersLoaded:        { required: ['carriers'] },
    // ── Docs ──
    documentsLoaded:       { required: ['docs'] },
    // ── Compliance ──
    bgCheckLoaded:         { required: ['checks'] },
    drugTestLoaded:        { required: ['tests'] },
    orientationLoaded:     { required: ['schedule'] },
    complianceLoaded:      { required: ['status'] },
    // ── Analytics ──
    leaderboardLoaded:     { required: ['rankings'] },
    gamificationLoaded:    { required: ['xp', 'badges'] },
    costAnalysisLoaded:    { required: ['metrics'] },
    telemetryLoaded:       { required: ['calls'] },
    // ── Automation ──
    automationRulesLoaded: { required: ['rules'] },
    // ── Agent ──
    agentResponse:         { required: ['text'] },
    agentTyping:           { required: [] },
    // ── Wave 2 ──
    intelDataLoaded:       { required: ['intel', 'competitorCount'] },
    hiringForecastLoaded:  { required: ['forecast', 'confidence'] },
    funnelMetricsLoaded:   { required: ['metrics'] },
    attributionDataLoaded: { required: ['channels'] },
    lifecycleDataLoaded:   { required: ['drivers', 'stageDistribution'] },
    retentionSignalsLoaded: { required: ['atRisk'] },
    onboardingStatusLoaded: { required: ['workflows'] },
    // ── Wave 3 ──
    nbaChipsReady:         { required: ['state'] },
    marketSignalsLoaded:   { required: ['condition', 'payAdjustmentFactor'] },
    // ── Wave 4 ──
    agentMemoryLoaded:     { required: ['summaries', 'hasMemory'] },
    proactiveInsightsLoaded: { required: ['insights'] }
  },

  validate(direction, action, payload) {
    if (!window.__ROS_DEV__) return; // production: no-op
    const schema = this[direction]?.[action];
    if (!schema) {
      console.warn(`[ROS Contract] Unknown ${direction} action: ${action}`);
      return;
    }
    if (!schema.required) return;
    const missing = schema.required.filter(k => payload === undefined || payload[k] === undefined);
    if (missing.length > 0) {
      throw new Error(`[ROS Contract] ${direction}.${action} missing required fields: ${missing.join(', ')}`);
    }
  }
};
```

**Step 2: Run test to verify it loads without errors**

Open browser console after a git push + CDN purge. Should see no errors.

**Step 3: Commit**
```bash
git add src/public/recruiter/os/js/ros-contract.js
git commit -m "feat(ros/contract): add canonical bridge message registry v2.0.0"
git push
```

---

### Task 3: Update `ros-bridge.js` to import contract

**File:**
- Modify: `src/public/recruiter/os/js/ros-bridge.js`

**Step 1: Read the current file**

**Step 2: Add validation calls in `send()` and the message receiver**

In the `send(action, payload)` function, before the `postMessage` call:
```javascript
if (window.ROS?.CONTRACT) ROS.CONTRACT.validate('inbound', action, payload || {});
```

In the `onMessage` event listener, after extracting `data.action`:
```javascript
if (window.ROS?.CONTRACT && data.action) ROS.CONTRACT.validate('outbound', data.action, data.payload || {});
```

**Step 3: Commit**
```bash
git add src/public/recruiter/os/js/ros-bridge.js
git commit -m "feat(ros/bridge): validate all messages against ros-contract.js"
git push
```

---

### Task 4: Add `ros-contract.js` to RecruiterOS.html + write contract tests

**Files:**
- Modify: `src/public/recruiter/os/RecruiterOS.html`
- Create: `src/public/__tests__/rosContract.test.js`

**Step 1: Add CDN script tag to RecruiterOS.html**

Insert immediately after the `<body>` tag opening and before `ros-config.js`:
```html
<!-- ═══ Contract (must load before all modules) ═══ -->
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-contract.js"></script>
```

**Step 2: Create `rosContract.test.js`**

```javascript
// rosContract.test.js
// Run by opening in browser with ?test=1 or via test harness

(function() {
  const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('PASS: ' + msg); };

  // Requires ros-contract.js to be loaded
  assert(typeof ROS.CONTRACT !== 'undefined', 'ROS.CONTRACT is defined');
  assert(typeof ROS.CONTRACT.version === 'string', 'CONTRACT.version is a string');
  assert(typeof ROS.CONTRACT.inbound === 'object', 'CONTRACT.inbound is an object');
  assert(typeof ROS.CONTRACT.outbound === 'object', 'CONTRACT.outbound is an object');

  // Validate function exists
  assert(typeof ROS.CONTRACT.validate === 'function', 'CONTRACT.validate is a function');

  // Dev mode validation
  window.__ROS_DEV__ = true;

  // Valid inbound action passes
  let threw = false;
  try { ROS.CONTRACT.validate('inbound', 'agentMessage', { text: 'hello' }); }
  catch(e) { threw = true; }
  assert(!threw, 'valid inbound action passes validation');

  // Missing required field throws
  threw = false;
  try { ROS.CONTRACT.validate('inbound', 'agentMessage', {}); }
  catch(e) { threw = true; }
  assert(threw, 'missing required field throws in dev mode');

  // Wave 2 actions are registered
  assert(ROS.CONTRACT.inbound['getIntelData'] !== undefined, 'getIntelData is registered');
  assert(ROS.CONTRACT.inbound['getFunnelMetrics'] !== undefined, 'getFunnelMetrics is registered');
  assert(ROS.CONTRACT.inbound['getRetentionSignals'] !== undefined, 'getRetentionSignals is registered');

  // Wave 3 actions are registered
  assert(ROS.CONTRACT.inbound['getMarketSignals'] !== undefined, 'getMarketSignals is registered');
  assert(ROS.CONTRACT.inbound['refreshNBAChips'] !== undefined, 'refreshNBAChips is registered');

  // Wave 4 actions are registered
  assert(ROS.CONTRACT.inbound['getProactiveInsights'] !== undefined, 'getProactiveInsights is registered');
  assert(ROS.CONTRACT.inbound['getAgentMemory'] !== undefined, 'getAgentMemory is registered');

  // Outbound structure
  assert(ROS.CONTRACT.outbound['intelDataLoaded'] !== undefined, 'intelDataLoaded outbound is registered');
  assert(ROS.CONTRACT.outbound['marketSignalsLoaded'] !== undefined, 'marketSignalsLoaded outbound is registered');

  window.__ROS_DEV__ = false;
  console.log('✅ All ros-contract tests passed');
})();
```

**Step 3: Commit**
```bash
git add src/public/recruiter/os/RecruiterOS.html
git add src/public/__tests__/rosContract.test.js
git commit -m "feat(ros/contract): add contract to html shell + contract tests"
git push
```

**Step 4: Purge CDN**
```bash
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-contract.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-bridge.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/RecruiterOS.html
```

**Wave 1 complete.** Signal J2, J3, J4 to begin Wave 2.

---

## Wave 2 — Data Wiring Sprint (J2, J3, J4 in parallel)

> All three devs start simultaneously after Wave 1 merges. Each dev works independently on their assigned views. No dependencies between J2/J3/J4 tasks.

---

### Task 5 (J2): Wire `ros-view-intel.js` to real backend

**Files:**
- Modify: `src/public/recruiter/os/js/views/ros-view-intel.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`

**Step 1: Read the current `ros-view-intel.js`**

Find where data is currently hardcoded or returning empty. Note the render function names.

**Step 2: Add bridge send in the view's load function**

Replace any stub data with:
```javascript
function loadIntelData(carrierId) {
  showIntelSkeleton(); // show loading state
  ROS.bridge.send('getIntelData', { carrierId: carrierId || null, refresh: false });
}

ROS.bridge.on('intelDataLoaded', function({ intel, competitorCount, generatedAt }) {
  hideIntelSkeleton();
  renderIntelCards(intel);
  updateCompetitorCount(competitorCount);
  if (generatedAt) updateTimestamp(generatedAt);
});
```

Call `loadIntelData()` at view mount (inside the view's init or render function).

**Step 3: Add `getIntelData` handler to Recruiter Console page code**

Read `src/pages/Recruiter Console.zriuj.js` and find the `routeMessage` switch statement.

Add after the last existing `case`:
```javascript
// === WAVE 2: CONSOLIDATE TOOL WIRING ===
case 'getIntelData': {
  try {
    const { carrierId, refresh } = message;
    const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
    const intel = await recruiter_service.getCompetitorIntel(recruiterDot, carrierId, refresh);
    safeSend(component, {
      action: 'intelDataLoaded',
      payload: {
        intel: intel.competitors || [],
        competitorCount: intel.competitorCount || 0,
        generatedAt: intel.generatedAt || new Date().toISOString()
      }
    });
  } catch (err) {
    safeSend(component, { action: 'actionError', payload: { message: 'Failed to load intel: ' + err.message } });
  }
  break;
}
```

**Step 4: Verify**

Navigate to Intel view in RecruiterOS. Real competitor cards should render. Check console for errors.

**Step 5: Commit**
```bash
git add src/public/recruiter/os/js/views/ros-view-intel.js
git add "src/pages/Recruiter Console.zriuj.js"
git commit -m "feat(ros/intel): wire intel view to real competitor data"
git push
```

---

### Task 6 (J2): Wire `ros-view-predict.js` to real backend

**Files:**
- Modify: `src/public/recruiter/os/js/views/ros-view-predict.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`

Follow the same pattern as Task 5. Action: `getHiringForecast` / `hiringForecastLoaded`.

Page code calls `recruiterAnalyticsService.getHiringForecast(recruiterDot, horizon, driverType)`.

**Step 5: Commit**
```bash
git add src/public/recruiter/os/js/views/ros-view-predict.js
git add "src/pages/Recruiter Console.zriuj.js"
git commit -m "feat(ros/predict): wire predict view to real hiring forecast data"
git push
```

---

### Task 7 (J3): Wire `ros-view-funnel.js` + `ros-view-attribution.js`

**Files:**
- Modify: `src/public/recruiter/os/js/views/ros-view-funnel.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-attribution.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`

Follow same pattern. J3 adds two `case` blocks:

```javascript
case 'getFunnelMetrics': {
  const { period, breakdown } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const metrics = await recruiterAnalyticsService.getFunnelMetrics(recruiterDot, period || '30d', breakdown);
  safeSend(component, {
    action: 'funnelMetricsLoaded',
    payload: { metrics, period: period || '30d', bottleneck: metrics.bottleneck || null }
  });
  break;
}

case 'getAttributionData': {
  const { period, channel } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const data = await recruiterAnalyticsService.getSourceAttribution(recruiterDot, period || '30d', channel);
  safeSend(component, {
    action: 'attributionDataLoaded',
    payload: { channels: data.channels || [], topChannel: data.topChannel || null, period: period || '30d' }
  });
  break;
}
```

**Step 5: Commit**
```bash
git add src/public/recruiter/os/js/views/ros-view-funnel.js
git add src/public/recruiter/os/js/views/ros-view-attribution.js
git add "src/pages/Recruiter Console.zriuj.js"
git commit -m "feat(ros/analytics): wire funnel + attribution views to real backend data"
git push
```

---

### Task 8 (J4): Wire lifecycle + retention + onboard views

**Files:**
- Modify: `src/public/recruiter/os/js/views/ros-view-lifecycle.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-retention.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-onboard.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`

J4 adds three `case` blocks (see `plan.md` W2J4-T2 through W2J4-T6 for full code).

**Step 5: Commit**
```bash
git add src/public/recruiter/os/js/views/ros-view-lifecycle.js
git add src/public/recruiter/os/js/views/ros-view-retention.js
git add src/public/recruiter/os/js/views/ros-view-onboard.js
git add "src/pages/Recruiter Console.zriuj.js"
git commit -m "feat(ros/onboard): wire lifecycle + retention + onboard views to real backend data"
git push
```

---

### Task 9: Gate 1 CDN Purge + Verification

**Step 1: Purge all Wave 2 modified CDN files**
```bash
for path in \
  "src/public/recruiter/os/js/views/ros-view-intel.js" \
  "src/public/recruiter/os/js/views/ros-view-predict.js" \
  "src/public/recruiter/os/js/views/ros-view-funnel.js" \
  "src/public/recruiter/os/js/views/ros-view-attribution.js" \
  "src/public/recruiter/os/js/views/ros-view-lifecycle.js" \
  "src/public/recruiter/os/js/views/ros-view-retention.js" \
  "src/public/recruiter/os/js/views/ros-view-onboard.js"; do
  curl "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/$path"
done
```

**Step 2: Run Gate 1 verification checklist** (see `verification_matrix.md` Gate 1 section)

**Step 3: Senior reviewer signs off in `progress.md`**

---

## Wave 3 — Intelligence Layer (J5, J6, J7 in parallel)

> All three devs start simultaneously after Gate 1 sign-off.

---

### Task 10 (J5): Create `ros-nba.js` — NBA chip system

**Files:**
- Create: `src/public/recruiter/os/js/ros-nba.js`
- Modify: `src/public/recruiter/os/js/ros-config.js`
- Modify: `src/public/recruiter/os/js/ros-shell.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`
- Modify: `src/public/recruiter/os/RecruiterOS.html`
- Create: `src/public/__tests__/rosNBA.test.js`

**Step 1: Write failing test for NBA evaluate logic**

```javascript
// In rosNBA.test.js
(function() {
  const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('PASS: ' + msg); };

  // Requires ros-nba.js loaded
  assert(typeof ROS.nba !== 'undefined', 'ROS.nba is defined');
  assert(typeof ROS.nba.evaluate === 'function', 'ROS.nba.evaluate is a function');

  // No chips when no conditions met
  const empty = ROS.nba.evaluate({});
  assert(Array.isArray(empty), 'evaluate returns array');
  assert(empty.length === 0, 'empty state returns 0 chips');

  // Alerts chip fires
  const withAlerts = ROS.nba.evaluate({ firedAlerts: 3 });
  assert(withAlerts.length === 1, 'alerts-fired chip triggers');
  assert(withAlerts[0].id === 'alerts-fired', 'correct chip id');

  // Max 3 chips returned
  const all = ROS.nba.evaluate({ firedAlerts: 1, stalledPipeline: 5, atRiskDrivers: 2, marketCondition: 'HOT' });
  assert(all.length <= 3, 'max 3 chips enforced');

  // Priority ordering
  assert(all[0].id === 'alerts-fired', 'alerts-fired is highest priority');

  console.log('✅ All NBA tests passed');
})();
```

**Step 2: Run test — it should fail (ROS.nba is undefined)**

**Step 3: Create `ros-nba.js`** (see full code in `plan.md` W3J5-T2)

**Step 4: Run test — should pass**

**Step 5: Update `ros-config.js`**: change `NBA_ENABLED: false` to `NBA_ENABLED: true`

**Step 6: Update `ros-shell.js`**: add NBA chip render call and `nbaChipsReady` listener

**Step 7: Add `refreshNBAChips` handler to Recruiter Console page code**

**Step 8: Add script tag to RecruiterOS.html**

**Step 9: Commit**
```bash
git add src/public/recruiter/os/js/ros-nba.js
git add src/public/recruiter/os/js/ros-config.js
git add src/public/recruiter/os/js/ros-shell.js
git add "src/pages/Recruiter Console.zriuj.js"
git add src/public/recruiter/os/RecruiterOS.html
git add src/public/__tests__/rosNBA.test.js
git commit -m "feat(ros/nba): enable NBA chip system with 4 chip types"
git push
```

---

### Task 11 (J6): View-aware agent context

**Files:**
- Modify: `src/public/recruiter/os/js/ros-views.js`
- Modify: `src/public/recruiter/os/js/ros-chat.js`
- Modify: all 29 `ros-view-*.js` files (add snapshot registration to each)
- Modify: `src/pages/Recruiter Console.zriuj.js`

**Step 1: Add `getViewSnapshot()` to `ros-views.js`** (code in `plan.md` W3J6-T1)

**Step 2: For each view module that has a data load callback**, add a snapshot at the end:
```javascript
// Example for ros-view-funnel.js:
ROS.views.snapshots = ROS.views.snapshots || {};
ROS.views.snapshots['funnel'] = {
  view: 'funnel',
  period: metrics.period,
  totalApplicants: metrics.metrics?.totalApplicants,
  conversionRate: metrics.metrics?.conversionRate,
  bottleneck: metrics.bottleneck
};
```

Use max 5 fields. No arrays or nested objects.

**Step 3: Update `ros-chat.js` `sendMessage()`** to include context snapshot (code in `plan.md` W3J6-T3)

**Step 4: Update Recruiter Console `agentMessage` case** to pass context to `handleAgentTurn` (code in `plan.md` W3J6-T4)

**Step 5: Manual QA**

On funnel view, open agent chat. Ask "what's my conversion rate?" Agent must reference funnel view context in response.

**Step 6: Commit**
```bash
git add src/public/recruiter/os/js/ros-views.js
git add src/public/recruiter/os/js/ros-chat.js
git add src/public/recruiter/os/js/views/*.js
git add "src/pages/Recruiter Console.zriuj.js"
git commit -m "feat(ros/agent): agent receives view-aware context snapshot on every message"
git push
```

---

### Task 12 (J7): Market signals ticker

**Files:**
- Create: `src/public/recruiter/os/js/ros-market.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-home.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-funnel.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-predict.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-cost-analysis.js`
- Modify: `src/public/recruiter/os/css/recruiter-os.css`
- Modify: `src/public/recruiter/os/RecruiterOS.html`
- Create: `src/public/__tests__/rosMarketSignals.test.js`

**Step 1: Write failing tests**

```javascript
// rosMarketSignals.test.js
(function() {
  const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('PASS: ' + msg); };

  assert(typeof ROS.market !== 'undefined', 'ROS.market is defined');
  assert(typeof ROS.market._tickerHtml === 'function', '_tickerHtml is a function');

  // Simulate loaded state
  ROS.market.condition = 'HOT';
  const html = ROS.market._tickerHtml();
  assert(html.includes('local_fire_department'), 'HOT shows fire icon');
  assert(html.includes('Market HOT'), 'HOT shows correct label');

  ROS.market.condition = 'SOFT';
  const softHtml = ROS.market._tickerHtml();
  assert(softHtml.includes('trending_down'), 'SOFT shows trending down icon');

  ROS.market.condition = 'NEUTRAL';
  const neutralHtml = ROS.market._tickerHtml();
  assert(neutralHtml.includes('trending_flat'), 'NEUTRAL shows flat icon');

  console.log('✅ All market signals tests passed');
})();
```

**Step 2: Create `ros-market.js`** (full code in `plan.md` W3J7-T1)

**Step 3: Add `getMarketSignals` page code handler** (code in `plan.md` W3J7-T2)

Remember to add the import at the top of the page code:
```javascript
import { getMarketContext } from 'backend/marketSignalsService';
```

**Step 4: Add `[data-market-ticker]` div to home, funnel, predict, cost-analysis views**

In each view's HTML template string, add in the section header area:
```javascript
`<div data-market-ticker class="market-ticker"></div>`
```

**Step 5: Add CSS to `recruiter-os.css`** (code in `plan.md` W3J7-T4)

**Step 6: Add script tag to RecruiterOS.html + init call in bootstrap**

**Step 7: Commit**
```bash
git add src/public/recruiter/os/js/ros-market.js
git add "src/pages/Recruiter Console.zriuj.js"
git add src/public/recruiter/os/js/views/ros-view-home.js
git add src/public/recruiter/os/js/views/ros-view-funnel.js
git add src/public/recruiter/os/js/views/ros-view-predict.js
git add src/public/recruiter/os/js/views/ros-view-cost-analysis.js
git add src/public/recruiter/os/css/recruiter-os.css
git add src/public/recruiter/os/RecruiterOS.html
git add src/public/__tests__/rosMarketSignals.test.js
git commit -m "feat(ros/market): add HOT/SOFT/NEUTRAL market signals ticker to home, funnel, predict, cost-hire"
git push
```

---

### Task 13: Gate 2 CDN Purge + Verification

**Step 1: Purge Wave 3 files**
```bash
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-nba.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-market.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-config.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-shell.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-chat.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-views.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/css/recruiter-os.css
```

**Step 2: Run Gate 2 checklist** (see `verification_matrix.md` Gate 2 section)

**Step 3: Senior reviewer signs off in `progress.md`**

---

## Wave 4 — Proactive AI + Memory (J1, J2)

---

### Task 14 (J1): Agent memory module

**Files:**
- Create: `src/public/recruiter/os/js/ros-memory.js`
- Modify: `src/public/recruiter/os/js/ros-chat.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`
- Modify: `src/public/recruiter/os/RecruiterOS.html`

**Step 1: Add `getAgentMemory` handler to page code**

(Full code in `plan.md` W4J1-T1)

Remember import: `import { retrieveContext } from 'backend/ragService';`

**Step 2: Create `ros-memory.js`** (full code in `plan.md` W4J1-T2)

**Step 3: Update `ros-chat.js`** to call `ROS.memory.load(userId)` when chat FAB opens

**Step 4: Add script tag to RecruiterOS.html + init call**

**Step 5: Test with recruiter that has memory**

Open chat. "Previous sessions" section should appear if memory exists.

**Step 6: Commit + signal J2**
```bash
git add src/public/recruiter/os/js/ros-memory.js
git add src/public/recruiter/os/js/ros-chat.js
git add "src/pages/Recruiter Console.zriuj.js"
git add src/public/recruiter/os/RecruiterOS.html
git commit -m "feat(ros/memory): load agent conversation memory from Pinecone on chat open"
git push
```

---

### Task 15 (J2): Proactive AI push

**Files:**
- Create: `src/public/recruiter/os/js/ros-proactive.js`
- Modify: `src/public/recruiter/os/js/views/ros-view-home.js`
- Modify: `src/pages/Recruiter Console.zriuj.js`
- Modify: `src/public/recruiter/os/css/recruiter-os.css`
- Modify: `src/public/recruiter/os/RecruiterOS.html`
- Create: `src/public/__tests__/rosProactiveAI.test.js`

**Step 1: Write failing tests**

```javascript
// rosProactiveAI.test.js
(function() {
  const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('PASS: ' + msg); };

  assert(typeof ROS.proactive !== 'undefined', 'ROS.proactive is defined');
  assert(typeof ROS.proactive.trigger === 'function', 'trigger is a function');

  // Empty insights stays hidden
  const target = document.createElement('div');
  target.id = 'ros-proactive-insights';
  target.className = 'hidden';
  document.body.appendChild(target);
  ROS.proactive._renderInsights([]);
  assert(target.classList.contains('hidden'), 'empty insights stays hidden');

  // Non-empty insights removes hidden
  ROS.proactive._renderInsights(['💡 3 candidates need follow-up', '📊 Funnel conversion dropped 12%']);
  assert(!target.classList.contains('hidden'), 'non-empty insights shows section');
  assert(target.querySelectorAll('.ros-insight-card').length === 2, 'renders 2 insight cards');

  // Loaded guard: trigger() twice only processes once
  ROS.proactive.loaded = false;
  let callCount = 0;
  const origSend = ROS.bridge?.send;
  if (ROS.bridge) {
    ROS.bridge.send = (action) => { if (action === 'getProactiveInsights') callCount++; };
    ROS.proactive.trigger({});
    ROS.proactive.trigger({}); // second call — should be ignored after first fires
    assert(callCount <= 1, 'trigger only fires bridge once');
    ROS.bridge.send = origSend;
  }
  document.body.removeChild(target);

  console.log('✅ All proactive AI tests passed');
})();
```

**Step 2: Create `ros-proactive.js`** (full code in `plan.md` W4J2-T2)

**Step 3: Add `getProactiveInsights` handler to page code** (code in `plan.md` W4J2-T1)

**Step 4: Update `ros-view-home.js`**: add `#ros-proactive-insights` div and trigger call

**Step 5: Add insight card CSS to `recruiter-os.css`**

**Step 6: Add script tag to RecruiterOS.html + init call**

**Step 7: Test**: Load home view. Wait 4 seconds. Insight cards should appear.

**Step 8: Commit**
```bash
git add src/public/recruiter/os/js/ros-proactive.js
git add src/public/recruiter/os/js/views/ros-view-home.js
git add "src/pages/Recruiter Console.zriuj.js"
git add src/public/recruiter/os/css/recruiter-os.css
git add src/public/recruiter/os/RecruiterOS.html
git add src/public/__tests__/rosProactiveAI.test.js
git commit -m "feat(ros/proactive): proactive AI pushes 2-3 insight bullets to home view on load"
git push
```

---

## Wave 5 — Evidence Pack + Hardening

### Task 16: Run Evidence Pack

**Step 1: Run Evidence Pack agent**
```bash
claude --agent evidence-pack
```

Target all 7 critical paths in `verification_matrix.md` Wave 5 section.

**Step 2: Review `artifacts/devtools/<run_id>/quality_gate.json`**

Must show `"pass": true`. If not, proceed to Task 17.

**Step 3: Review `console_audit.json` and `network_audit.json`**

Fix any P0 errors or HTTP 500s.

---

### Task 17: Fix any Evidence Pack failures

For each failure in `quality_gate.json`:

1. Read the relevant screenshot — identify what's wrong visually
2. Read `console_audit.json` — find the P0 error
3. Trace the error to the source file
4. Fix the bug
5. Commit the fix:
```bash
git commit -m "fix(ros): <describe the fix>"
git push
```
6. Purge CDN for the fixed file
7. Re-run Evidence Pack

Repeat until `quality_gate.json: { "pass": true }`.

---

### Task 18: Final metadata update + track completion

**Files:**
- Modify: `Conductor/tracks/recruiter_os_convergence_20260228/metadata.json`
- Modify: `Conductor/tracks/recruiter_os_convergence_20260228/progress.md`
- Modify: `Conductor/tracks.md`

**Step 1: Update `metadata.json`**

Set:
- `"status": "complete"`
- `"completion_percentage": 100`
- `"verification_run": "<run_id>"`
- `"updated_at": "<today's date>"`

**Step 2: Update `progress.md`**

Fill in all wave completion dates and gate sign-offs.

**Step 3: Update `Conductor/tracks.md`**

Find the track entry and change `[ ]` to `[x]` and `Completion: 0%` to `Completion: 100%`.

**Step 4: Final commit**
```bash
git add Conductor/tracks/recruiter_os_convergence_20260228/metadata.json
git add Conductor/tracks/recruiter_os_convergence_20260228/progress.md
git add Conductor/tracks.md
git commit -m "feat(ros): RecruiterOS Intelligence Convergence complete — all views live, NBA, market signals, proactive AI, agent memory"
git push
```

---

## Execution Summary

| Wave | Dev(s) | Tasks | Key Outputs |
|------|--------|-------|-------------|
| Pre-start | Any | Task 0 | Backend export confirmation |
| Wave 1 | J1 | 1-4 | `ros-contract.js`, `bridge_inventory.md` |
| Wave 2 | J2/J3/J4 | 5-9 | 7 views wired, Gate 1 |
| Wave 3 | J5/J6/J7 | 10-13 | NBA chips, agent context, market ticker, Gate 2 |
| Wave 4 | J1/J2 | 14-15 | Agent memory, proactive AI |
| Wave 5 | J3 | 16-18 | Evidence Pack pass, track complete |
