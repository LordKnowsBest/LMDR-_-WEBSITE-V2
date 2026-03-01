# Plan — RecruiterOS Intelligence Convergence

**Track:** `recruiter_os_convergence_20260228`
**Model:** 5 Waves · 2 Gates · 7 Junior Devs · 2 Senior Reviewers

---

## Pre-Start Checklist

Before Wave 1 begins, verify:

- [ ] `ros-config.js` TOOL_REGISTRY consulted — confirm which tools have `status: 'consolidate'`
- [ ] `Recruiter Console.zriuj.js` page code read — understand current action handler count
- [ ] `recruiterAnalyticsService.jsw` confirms `getFunnelMetrics`, `getSourceAttribution`, `getHiringForecast` are exported
- [ ] `recruiterRetentionService.jsw` confirms `getLifecycleMetrics`, `getAtRiskDrivers` are exported
- [ ] `recruiterOnboardingService.jsw` confirms `getOnboardingDashboard` is exported
- [ ] `marketSignalsService.jsw` confirms `getMarketContext` is exported
- [ ] `ragService.jsw` confirms `retrieveContext` is exported and lmdr-memory namespace is functional
- [ ] `agentService.jsw` confirms `handleAgentTurn('recruiter', userId, text, context)` signature

---

## Wave 1 — Contract Foundation

**Dev:** J1
**Unblocks:** All other waves
**Estimated effort:** 1 dev-day

### W1-T1: Audit existing bridge messages

Read:
- `src/public/recruiter/os/js/ros-bridge.js` — all `send()` calls and `onMessage` handlers
- `src/pages/Recruiter Console.zriuj.js` — all `case` branches in the message router
- Every view module in `src/public/recruiter/os/js/views/` — all `ROS.bridge.send()` calls

Record findings in `bridge_inventory.md` (template in this track folder).

### W1-T2: Create `ros-contract.js`

Create `src/public/recruiter/os/js/ros-contract.js` with:
- `ROS.CONTRACT.version` string
- `ROS.CONTRACT.inbound` — every inbound action with required/optional payload schema
- `ROS.CONTRACT.outbound` — every outbound action with required/optional payload schema
- `ROS.CONTRACT.validate(direction, action, payload)` — throws on schema violation in dev mode

Include all existing messages catalogued in W1-T1 PLUS the 11 new messages defined in spec.md §7.

### W1-T3: Update `ros-bridge.js` to validate

In `ros-bridge.js` `send()` function, add:
```javascript
if (ROS.CONTRACT && window.__ROS_DEV__) {
  ROS.CONTRACT.validate('inbound', action, payload);
}
```

In `onMessage` handler, add:
```javascript
if (ROS.CONTRACT && window.__ROS_DEV__) {
  ROS.CONTRACT.validate('outbound', data.action, data.payload);
}
```

### W1-T4: Write contract tests

Create `src/public/__tests__/rosContract.test.js`:
- Test: valid inbound action passes validation
- Test: missing required field throws
- Test: unknown action throws in dev mode
- Test: valid outbound action passes validation

### W1-T5: Add `ros-contract.js` to RecruiterOS.html

Add CDN script tag before `ros-bridge.js`:
```html
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-contract.js"></script>
```

### W1-T6: Populate `bridge_inventory.md`

Fill the inventory table with all discovered messages. Mark `wired: false` for the 7 consolidate tools.

### W1-T7: Commit and open PR

```bash
git add src/public/recruiter/os/js/ros-contract.js
git add src/public/recruiter/os/RecruiterOS.html
git add src/public/recruiter/os/js/ros-bridge.js
git add src/public/__tests__/rosContract.test.js
git add Conductor/tracks/recruiter_os_convergence_20260228/bridge_inventory.md
git commit -m "feat(ros): add canonical bridge contract + full message audit"
git push
```

**Wave 1 complete when:** `bridge_inventory.md` has ≥95% of messages documented, `ros-contract.js` is on CDN and validates without errors.

---

## Wave 2 — Data Wiring Sprint

**Devs:** J2, J3, J4 (parallel after Wave 1 merges)
**Gate required after:** Gate 1

---

### Wave 2 — J2: Intel + Predict

#### W2J2-T1: Wire `ros-view-intel.js`

Add to the view's render function:
```javascript
function loadIntelData(carrierId) {
  ROS.bridge.send('getIntelData', { carrierId, refresh: false });
}
```

Add listener for `intelDataLoaded` response:
```javascript
ROS.bridge.on('intelDataLoaded', ({ intel, competitorCount }) => {
  renderIntelCards(intel);
  updateCompetitorCount(competitorCount);
});
```

Replace any stub/static data with these calls.

#### W2J2-T2: Add `getIntelData` handler to Recruiter Console page code

In `Recruiter Console.zriuj.js`, inside the message router, add:
```javascript
case 'getIntelData': {
  const { carrierId, refresh } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const intel = await recruiter_service.getCompetitorIntel(recruiterDot, carrierId, refresh);
  safeSend(component, { action: 'intelDataLoaded', payload: intel });
  break;
}
```

#### W2J2-T3: Wire `ros-view-predict.js`

Same pattern — send `getHiringForecast`, receive `hiringForecastLoaded`.

#### W2J2-T4: Add `getHiringForecast` handler to page code

```javascript
case 'getHiringForecast': {
  const { horizon, driverType } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const forecast = await recruiterAnalyticsService.getHiringForecast(recruiterDot, horizon, driverType);
  safeSend(component, { action: 'hiringForecastLoaded', payload: forecast });
  break;
}
```

#### W2J2-T5: Update `bridge_inventory.md` — mark intel and predict as `wired: true`

#### W2J2-T6: Commit
```bash
git commit -m "feat(ros/intel): wire intel + predict views to real backend data"
git push
```

---

### Wave 2 — J3: Funnel + Attribution

#### W2J3-T1: Wire `ros-view-funnel.js`

Send `getFunnelMetrics` on view load with `period: '30d'` default.
Receive `funnelMetricsLoaded` and call `renderFunnelChart(metrics)`.

#### W2J3-T2: Add `getFunnelMetrics` handler to page code

```javascript
case 'getFunnelMetrics': {
  const { period, breakdown } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const metrics = await recruiterAnalyticsService.getFunnelMetrics(recruiterDot, period, breakdown);
  safeSend(component, { action: 'funnelMetricsLoaded', payload: metrics });
  break;
}
```

#### W2J3-T3: Wire `ros-view-attribution.js`

Send `getAttributionData`, receive `attributionDataLoaded`, render attribution chart.

#### W2J3-T4: Add `getAttributionData` handler to page code

```javascript
case 'getAttributionData': {
  const { period, channel } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const data = await recruiterAnalyticsService.getSourceAttribution(recruiterDot, period, channel);
  safeSend(component, { action: 'attributionDataLoaded', payload: data });
  break;
}
```

#### W2J3-T5: Update bridge_inventory.md + commit
```bash
git commit -m "feat(ros/analytics): wire funnel + attribution views to real backend data"
git push
```

---

### Wave 2 — J4: Lifecycle + Retention + Onboard

#### W2J4-T1: Wire `ros-view-lifecycle.js`

Send `getLifecycleData` on view load.
Receive `lifecycleDataLoaded` and render driver stage distribution chart.

#### W2J4-T2: Add `getLifecycleData` handler to page code

```javascript
case 'getLifecycleData': {
  const { recruiterDot } = message;
  const dot = recruiterDot || await recruiter_service.getRecruiterDot(currentUser);
  const data = await recruiterRetentionService.getLifecycleMetrics(dot);
  safeSend(component, { action: 'lifecycleDataLoaded', payload: data });
  break;
}
```

#### W2J4-T3: Wire `ros-view-retention.js`

Send `getRetentionSignals`, receive `retentionSignalsLoaded`, render at-risk driver cards.

#### W2J4-T4: Add `getRetentionSignals` handler to page code

```javascript
case 'getRetentionSignals': {
  const { recruiterDot, limit } = message;
  const dot = recruiterDot || await recruiter_service.getRecruiterDot(currentUser);
  const signals = await recruiterRetentionService.getAtRiskDrivers(dot, limit || 10);
  safeSend(component, { action: 'retentionSignalsLoaded', payload: signals });
  break;
}
```

#### W2J4-T5: Wire `ros-view-onboard.js`

Send `getOnboardingStatus`, receive `onboardingStatusLoaded`, render workflow cards.

#### W2J4-T6: Add `getOnboardingStatus` handler to page code

```javascript
case 'getOnboardingStatus': {
  const { carrierId, limit } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const status = await recruiterOnboardingService.getOnboardingDashboard(recruiterDot, carrierId, limit || 20);
  safeSend(component, { action: 'onboardingStatusLoaded', payload: status });
  break;
}
```

#### W2J4-T7: Update bridge_inventory.md + commit
```bash
git commit -m "feat(ros/onboard): wire lifecycle + retention + onboard views to real backend data"
git push
```

---

## ═══ GATE 1 ═══

**Senior reviewer sign-off required before Wave 3.**

Checklist:
- [ ] Open RecruiterOS. Navigate to each of the 7 newly-wired views. Verify real data renders (not empty/stub).
- [ ] Open browser console. Confirm zero P0 errors across search, pipeline, messages, intel, predict, funnel, attribution, lifecycle, retention, onboard.
- [ ] Open `bridge_inventory.md`. Confirm all 7 consolidate tools show `wired: true`.
- [ ] Run `src/public/__tests__/rosContract.test.js`. All tests pass.
- [ ] Verify `ros-contract.js` validates messages without throwing for all 7 new actions.

**Gate 1 pass → start Wave 3.**

---

## Wave 3 — Intelligence Layer

**Devs:** J5, J6, J7 (parallel after Gate 1)
**Gate required after:** Gate 2

---

### Wave 3 — J5: NBA Chip System

#### W3J5-T1: Update `ros-config.js`

Change `NBA_ENABLED: false` to `NBA_ENABLED: true`.

#### W3J5-T2: Create `ros-nba.js`

Create `src/public/recruiter/os/js/ros-nba.js` with the chip registry defined in spec.md §4.2.

Include 4 chip types: `alerts-fired`, `pipeline-stalled`, `market-hot`, `retention-risk`.

`evaluate(state)` returns max 3 chips sorted by priority. Empty array if no conditions met.

#### W3J5-T3: Add `refreshNBAChips` bridge action

In `ros-nba.js`:
```javascript
ROS.nba.refresh = function(stateSnapshot) {
  const chips = ROS.nba.evaluate(stateSnapshot);
  ROS.bridge.send('refreshNBAChips', { stateSnapshot });
  return chips; // local chips for immediate render
};
```

Add contract entry for `refreshNBAChips` / `nbaChipsReady`.

Add page code handler:
```javascript
case 'refreshNBAChips': {
  // Page code has authoritative data — evaluate from real state
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  const [alerts, pipeline, retention] = await Promise.all([
    recruiterAlertsService.getFiredAlerts(recruiterDot),
    recruiterPipelineService.getStalledCount(recruiterDot),
    recruiterRetentionService.getAtRiskCount(recruiterDot)
  ]);
  const state = { firedAlerts: alerts.count, stalledPipeline: pipeline.count, atRiskDrivers: retention.count };
  safeSend(component, { action: 'nbaChipsReady', payload: { state } });
  break;
}
```

#### W3J5-T4: Update `ros-shell.js` to render NBA chips

In `ros-shell.js`, in the home view render path, call:
```javascript
if (ROS.config.features.NBA_ENABLED && typeof ROS.nba !== 'undefined') {
  ROS.nba.refresh({}); // trigger chip evaluation
}
```

Add `nbaChipsReady` listener in shell:
```javascript
ROS.bridge.on('nbaChipsReady', ({ state }) => {
  const chips = ROS.nba.evaluate(state);
  renderNBAChips(chips); // renders in home view header
});
```

Implement `renderNBAChips(chips)` — renders pill-shaped chip buttons with icon + text + dismiss X.

Dismissed chips stored in `sessionStorage` as `ros-dismissed-chips` array.

#### W3J5-T5: Add `ros-nba.js` to RecruiterOS.html

```html
<!-- Wave 3: NBA -->
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-nba.js"></script>
```

Add after `ros-config.js`.

#### W3J5-T6: Write NBA tests

Create `src/public/__tests__/rosNBA.test.js`:
- Test: `evaluate({})` returns empty array when no conditions met
- Test: `evaluate({ firedAlerts: 3 })` returns `alerts-fired` chip
- Test: `evaluate({ firedAlerts: 1, stalledPipeline: 5, atRiskDrivers: 2, marketCondition: 'HOT' })` returns max 3 chips
- Test: chips sorted by priority (alerts before pipeline before market before retention)

#### W3J5-T7: Commit
```bash
git commit -m "feat(ros/nba): add Next Best Action chip system with 4 chip types"
git push
```

---

### Wave 3 — J6: View-Aware Agent Context

#### W3J6-T1: Add `getViewSnapshot()` to `ros-views.js`

```javascript
ROS.views.getViewSnapshot = function() {
  const view = ROS.views.currentView;
  // Each view module optionally exposes ROS.views.snapshots[viewId]
  return ROS.views.snapshots?.[view] || { view, data: null };
};
```

#### W3J6-T2: Add snapshot registration per view module

In each of the 29 view modules, at the end of each data load callback, register a snapshot:
```javascript
// Example in ros-view-funnel.js, after funnelMetricsLoaded:
ROS.views.snapshots = ROS.views.snapshots || {};
ROS.views.snapshots['funnel'] = {
  view: 'funnel',
  period: metrics.period,
  totalApplicants: metrics.totalApplicants,
  conversionRate: metrics.conversionRate,
  bottleneck: metrics.bottleneck
};
```

Each view exposes only the 3-5 most relevant data points (not full payload).

#### W3J6-T3: Update `ros-chat.js` to augment messages

In the `sendMessage()` function:
```javascript
function sendMessage(text) {
  const context = {
    currentView: ROS.views.currentView,
    viewSnapshot: ROS.views.getViewSnapshot(),
    recruiterDot: ROS.bridge.state?.recruiterDot,
    marketCondition: ROS.market?.condition || null
  };
  ROS.bridge.send('agentMessage', { text, context });
}
```

#### W3J6-T4: Update Recruiter Console page code `handleAgentMessage`

In the existing `case 'agentMessage':` handler, pass context to the agent:
```javascript
case 'agentMessage': {
  const { text, context } = message;
  const recruiterDot = await recruiter_service.getRecruiterDot(currentUser);
  // Build enhanced context
  const enrichedContext = {
    ...context,
    recruiterDot,
    role: 'recruiter'
  };
  const response = await agentService.handleAgentTurn('recruiter', currentUser.id, text, enrichedContext);
  safeSend(component, { action: 'agentResponse', payload: response });
  break;
}
```

#### W3J6-T5: Manual QA

Test: Open funnel view → open agent chat → ask "what's my top bottleneck?"
Expected: Agent references funnel data visible on screen.

Test: Open retention view → ask "which drivers should I call first?"
Expected: Agent references at-risk drivers.

#### W3J6-T6: Commit
```bash
git commit -m "feat(ros/agent): agent receives current view + data snapshot on every message"
git push
```

---

### Wave 3 — J7: Market Signals Ticker

#### W3J7-T1: Create `ros-market.js`

```javascript
window.ROS = window.ROS || {};
ROS.market = {
  condition: null,
  payAdjustmentFactor: 1.0,
  dieselIndex: null,
  loaded: false,

  init() {
    ROS.bridge.on('marketSignalsLoaded', ({ condition, payAdjustmentFactor, dieselIndex }) => {
      ROS.market.condition = condition;
      ROS.market.payAdjustmentFactor = payAdjustmentFactor;
      ROS.market.dieselIndex = dieselIndex;
      ROS.market.loaded = true;
      ROS.market._renderAll();
    });
    ROS.bridge.send('getMarketSignals', {});
  },

  _renderAll() {
    document.querySelectorAll('[data-market-ticker]').forEach(el => {
      el.innerHTML = ROS.market._tickerHtml();
      el.className = `market-ticker market-${ROS.market.condition.toLowerCase()}`;
    });
  },

  _tickerHtml() {
    const icons = { HOT: 'local_fire_department', SOFT: 'trending_down', NEUTRAL: 'trending_flat' };
    const labels = { HOT: 'Market HOT', SOFT: 'Market SOFT', NEUTRAL: 'Market Neutral' };
    return `<span class="material-symbols-outlined">${icons[ROS.market.condition]}</span>
            <span>${labels[ROS.market.condition]}</span>`;
  }
};
```

#### W3J7-T2: Add `getMarketSignals` handler to page code

```javascript
case 'getMarketSignals': {
  const signals = await marketSignalsService.getMarketContext();
  safeSend(component, {
    action: 'marketSignalsLoaded',
    payload: {
      condition: signals.marketCondition,
      payAdjustmentFactor: signals.payAdjustmentFactor,
      dieselIndex: signals.dieselPriceIndex
    }
  });
  break;
}
```

Import at top of page code: `import { getMarketContext } from 'backend/marketSignalsService';`

#### W3J7-T3: Add `[data-market-ticker]` slot to relevant views

In `ros-view-home.js`, add in the header section:
```javascript
`<div data-market-ticker class="market-ticker"></div>`
```

In `ros-view-funnel.js`, `ros-view-predict.js`, `ros-view-cost-analysis.js` — add the same data attribute to their respective header sections.

#### W3J7-T4: Add market ticker CSS to `recruiter-os.css`

```css
.market-ticker { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; }
.market-ticker.market-hot { background: rgba(239,68,68,0.12); color: #dc2626; }
.market-ticker.market-soft { background: rgba(37,99,235,0.12); color: #2563eb; }
.market-ticker.market-neutral { background: rgba(15,23,42,0.08); color: #475569; }
```

#### W3J7-T5: Add `ros-market.js` to RecruiterOS.html and call `init()`

Add script tag. In the bootstrap block, add:
```javascript
if (ROS.market) ROS.market.init();
```

#### W3J7-T6: Write market signals tests

Create `src/public/__tests__/rosMarketSignals.test.js`:
- Test: `_tickerHtml()` returns correct icon for HOT
- Test: `_tickerHtml()` returns correct icon for SOFT
- Test: `_renderAll()` sets correct class on `[data-market-ticker]` elements

#### W3J7-T7: Commit
```bash
git commit -m "feat(ros/market): add market signals ticker to home, funnel, cost-hire, predict views"
git push
```

---

## ═══ GATE 2 ═══

**Senior reviewer sign-off required before Wave 4.**

Checklist:
- [ ] Open RecruiterOS home view. Verify 1-3 NBA chips render. Click a chip — verify navigation.
- [ ] Dismiss a chip. Refresh page. Verify it stays dismissed (sessionStorage).
- [ ] Open funnel view. Verify market ticker visible.
- [ ] Open agent chat on funnel view. Ask "what's my conversion rate?" Verify agent references funnel data.
- [ ] Open agent chat on retention view. Ask "who's at risk?" Verify agent names at-risk drivers.
- [ ] Open home view. Verify market condition pill visible (HOT/SOFT/NEUTRAL).
- [ ] Smoke test: search, pipeline, messages, carriers views — verify no regressions.
- [ ] Run `rosNBA.test.js` and `rosMarketSignals.test.js`. All pass.

**Gate 2 pass → start Wave 4.**

---

## Wave 4 — Proactive AI + Memory

**Devs:** J1, J2 (J2 starts after J1's memory endpoint is callable)
**No gate after this wave — verified in Wave 5 Evidence Pack.**

---

### Wave 4 — J1: Agent Memory

#### W4J1-T1: Add `getAgentMemory` handler to page code

```javascript
case 'getAgentMemory': {
  const { userId } = message;
  const hashedUserId = hashUserId(userId); // sha256
  try {
    const result = await ragService.retrieveContext(
      'recent recruiter activity',
      ['conversation_memory'],
      'recruiter',
      { user_id: hashedUserId },
      500
    );
    const summaries = result.chunks.map(c => c.text.split('\n')[0]).slice(0, 3);
    safeSend(component, { action: 'agentMemoryLoaded', payload: { summaries, hasMemory: summaries.length > 0 } });
  } catch (e) {
    safeSend(component, { action: 'agentMemoryLoaded', payload: { summaries: [], hasMemory: false } });
  }
  break;
}
```

#### W4J1-T2: Create `ros-memory.js`

```javascript
window.ROS = window.ROS || {};
ROS.memory = {
  loaded: false,
  summaries: [],

  init() {
    ROS.bridge.on('agentMemoryLoaded', ({ summaries, hasMemory }) => {
      ROS.memory.summaries = summaries;
      ROS.memory.loaded = true;
      if (hasMemory) ROS.memory._renderInChat(summaries);
    });
  },

  load(userId) {
    if (ROS.memory.loaded) return;
    ROS.bridge.send('getAgentMemory', { userId });
  },

  _renderInChat(summaries) {
    const chatPanel = document.querySelector('#ros-chat-panel');
    if (!chatPanel) return;
    const memEl = document.createElement('div');
    memEl.className = 'ros-memory-section';
    memEl.innerHTML = `
      <details class="ros-memory-details">
        <summary class="ros-memory-toggle">Previous sessions (${summaries.length})</summary>
        <ul class="ros-memory-list">
          ${summaries.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </details>`;
    chatPanel.prepend(memEl);
  }
};
```

#### W4J1-T3: Trigger memory load when chat FAB opens

In `ros-chat.js`, in the panel open handler:
```javascript
if (ROS.memory && ROS.bridge.state?.userId) {
  ROS.memory.load(ROS.bridge.state.userId);
}
```

#### W4J1-T4: Add `ros-memory.js` to RecruiterOS.html + init

```html
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-memory.js"></script>
```

In bootstrap: `if (ROS.memory) ROS.memory.init();`

#### W4J1-T5: Commit
```bash
git commit -m "feat(ros/memory): load agent conversation memory from Pinecone on chat open"
git push
```

Signal to J2: memory endpoint is available.

---

### Wave 4 — J2: Proactive AI Push

#### W4J2-T1: Add `getProactiveInsights` handler to page code

```javascript
case 'getProactiveInsights': {
  const { context } = message;
  const userId = currentUser?.id;
  const enrichedContext = {
    ...context,
    recruiterDot: await recruiter_service.getRecruiterDot(currentUser),
    role: 'recruiter',
    trigger: '__proactive__'
  };
  try {
    const response = await agentService.handleAgentTurn('recruiter', userId,
      'Surface 2-3 brief insight bullets for this recruiter based on their current data. Each bullet should be 1 sentence with an emoji. Only include actionable items.',
      enrichedContext
    );
    const insights = parseInsightBullets(response.text); // split on newlines, max 3
    safeSend(component, { action: 'proactiveInsightsLoaded', payload: { insights, generatedAt: new Date().toISOString() } });
  } catch (e) {
    safeSend(component, { action: 'proactiveInsightsLoaded', payload: { insights: [], generatedAt: null } });
  }
  break;
}
```

#### W4J2-T2: Create `ros-proactive.js`

```javascript
window.ROS = window.ROS || {};
ROS.proactive = {
  loaded: false,

  init() {
    ROS.bridge.on('proactiveInsightsLoaded', ({ insights }) => {
      ROS.proactive.loaded = true;
      if (insights && insights.length > 0) {
        ROS.proactive._renderInsights(insights);
      }
    });
  },

  trigger(context) {
    if (ROS.proactive.loaded) return;
    // 2 second delay — don't block initial render
    setTimeout(() => {
      ROS.bridge.send('getProactiveInsights', { context });
    }, 2000);
  },

  _renderInsights(insights) {
    const target = document.querySelector('#ros-proactive-insights');
    if (!target) return;
    target.innerHTML = insights.map(text =>
      `<div class="ros-insight-card">${text}</div>`
    ).join('');
    target.classList.remove('hidden');
  }
};
```

#### W4J2-T3: Update `ros-view-home.js` to trigger proactive insights

Add `<div id="ros-proactive-insights" class="hidden"></div>` to the home view template.

At end of `renderHomeView()`:
```javascript
if (ROS.proactive) {
  const context = {
    currentView: 'home',
    viewSnapshot: ROS.views.getViewSnapshot(),
    marketCondition: ROS.market?.condition
  };
  ROS.proactive.trigger(context);
}
```

#### W4J2-T4: Add insight card CSS

In `recruiter-os.css`:
```css
.ros-insight-card { padding: 8px 12px; border-radius: 8px; font-size: 12px; line-height: 1.5;
  background: var(--ros-surface); box-shadow: var(--neu-s); margin-bottom: 6px; }
```

#### W4J2-T5: Add `ros-proactive.js` to RecruiterOS.html + init

```html
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-proactive.js"></script>
```

In bootstrap: `if (ROS.proactive) ROS.proactive.init();`

#### W4J2-T6: Write proactive tests

Create `src/public/__tests__/rosProactiveAI.test.js`:
- Test: `trigger()` called twice only sends one bridge message (loaded guard)
- Test: `_renderInsights([])` keeps target hidden
- Test: `_renderInsights(['insight 1', 'insight 2'])` renders 2 cards

#### W4J2-T7: Commit
```bash
git commit -m "feat(ros/proactive): add proactive AI insight push to home view"
git push
```

---

## Wave 5 — Evidence Pack + Hardening

**Dev:** J3
**Final gate — marks track DONE.**

### W5-T1: Run Evidence Pack

```bash
claude --agent evidence-pack
```

Target 7 critical paths:
1. RecruiterOS home view — NBA chips + market ticker + proactive insights all visible
2. Driver search (`ros-view-search.js`) — results render correctly
3. Pipeline kanban (`ros-view-pipeline.js`) — columns render with live driver data
4. Agent chat — response includes view context acknowledgment
5. Market ticker — HOT/SOFT/NEUTRAL visible in home and funnel views
6. Intel view — competitor data cards render (not empty)
7. Retention view — at-risk driver cards render (not empty)

### W5-T2: Fix any P0 console errors found

Address every error in Evidence Pack console_audit.json that is P0 (fatal).

### W5-T3: Fix any HTTP 500s found

Review network_audit.json. Fix any LMDR endpoint returning 500.

### W5-T4: Attach verification run to metadata.json

Update `metadata.json`:
- `"verification_run": "<run_id from artifacts/devtools/>"``
- `"status": "complete"`
- `"completion_percentage": 100`

### W5-T5: Update `Conductor/tracks.md`

Mark track as `[x]` complete with 100% completion.

### W5-T6: Final commit
```bash
git commit -m "feat(ros): RecruiterOS Intelligence Convergence complete — all views live, NBA, market signals, proactive AI"
git push
```

---

## Progress Monitoring

Update `progress.md` at the end of each wave:
- Wave N complete date
- Gate N sign-off date + senior name
- Any blockers encountered
- `bridge_inventory.md` coverage %
- Evidence Pack run ID (Wave 5 only)

---

## Sync After Each Wave

After every wave merge and push, run CDN purge for all modified files:
```bash
# Purge all ROS modules
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-contract.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-config.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-bridge.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-shell.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-chat.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-nba.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-market.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-proactive.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/ros-memory.js
# Purge modified view modules
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-intel.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-predict.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-funnel.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-attribution.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-lifecycle.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-retention.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-onboard.js
curl https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/js/views/ros-view-home.js
```
