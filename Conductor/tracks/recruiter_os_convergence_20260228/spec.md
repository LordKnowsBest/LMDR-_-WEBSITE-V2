# Specification — RecruiterOS Intelligence Convergence

**Track:** `recruiter_os_convergence_20260228`
**Priority:** Critical
**Status:** Planned
**Created:** 2026-02-28

---

## 1. Objective

Transform RecruiterOS from a well-structured CDN-first shell with partial data wiring into a fully-live, context-aware operating system where every surface is data-backed, the agent knows which view the recruiter is on, and the platform proactively surfaces insights before the recruiter knows to ask.

This track implements **everything described in `recruiter-os-map-v2.html`** and goes further: NBA chips active, proactive AI push to home view, and agent conversation memory that persists across sessions.

---

## 2. Surfaces in Scope

### 2.1 HTML Shell

- `src/public/recruiter/os/RecruiterOS.html` — bootloader, receives new CDN script tags for Wave 3-4 modules

### 2.2 CDN Core Modules (modified)

| Module | Change |
|--------|--------|
| `ros-config.js` | `NBA_ENABLED: true`, feature flags updated |
| `ros-bridge.js` | Imports and validates against `ros-contract.js` |
| `ros-chat.js` | Sends `currentView` + `viewData` snapshot with every agent message |
| `ros-shell.js` | Renders NBA chips and market ticker in home header |

### 2.3 CDN Core Modules (new)

| Module | Purpose |
|--------|---------|
| `ros-contract.js` | Canonical inbound/outbound message registry with schema helpers |
| `ros-nba.js` | Next Best Action chip system — registry, render, dismiss, persist |
| `ros-market.js` | Market signals fetcher + HOT/SOFT/NEUTRAL banner renderer |
| `ros-proactive.js` | Proactive AI — pushes insights to home view on load |
| `ros-memory.js` | Loads recent conversation memory from Pinecone lmdr-memory namespace |

### 2.4 CDN View Modules (closing consolidate status)

These 7 views currently render layout but lack real backend data connections:

| View | Current Status | Required Backend Service |
|------|---------------|--------------------------|
| `ros-view-intel.js` | consolidate | `recruiter_service.jsw` (competitorIntel functions) |
| `ros-view-predict.js` | consolidate | `recruiterAnalyticsService.jsw` (hiring forecasts) |
| `ros-view-funnel.js` | consolidate | `recruiterAnalyticsService.jsw` (funnel metrics) |
| `ros-view-attribution.js` | consolidate | `recruiterAnalyticsService.jsw` (source attribution) |
| `ros-view-lifecycle.js` | consolidate | `recruiterRetentionService.jsw` (lifecycle health) |
| `ros-view-retention.js` | consolidate | `recruiterRetentionService.jsw` (at-risk signals) |
| `ros-view-onboard.js` | consolidate | `recruiterOnboardingService.jsw` (onboarding workflows) |

### 2.5 Wix Page Code

- `src/pages/Recruiter Console.zriuj.js` — receives new action handlers for all 7 consolidate tools, agent context, NBA chip refresh, market signals fetch, proactive AI trigger

### 2.6 Backend Services (called, not rewritten)

All backend services are already implemented. This track wires the frontend to them:

- `recruiterAnalyticsService.jsw` — funnel, attribution, forecasts
- `recruiterRetentionService.jsw` — lifecycle, at-risk
- `recruiterOnboardingService.jsw` — post-hire workflows
- `recruiter_service.jsw` — competitor intel
- `agentService.jsw` — agent orchestration (extended with view context)
- `marketSignalsService.jsw` — market condition + pay adjustment factor
- `ragService.jsw` — conversation memory retrieval (lmdr-memory namespace)

---

## 3. Why This Track Exists

RecruiterOS achieved structural completeness through the Feature Parity track — all 29 view modules exist, the CDN bootloader pattern is proven, and the bridge is bidirectional. But completing the *structure* is not the same as completing the *product*.

The architecture map v2 describes the complete live system. The current gap is:

1. **7 tools render layout but not data.** Recruiters see chrome, not content.
2. **NBA chips are disabled.** `NBA_ENABLED: false` in config. The chip registry is empty.
3. **Agent has no context about which view you're on.** `agentMessage` carries only the text, never `currentView` or what data is visible.
4. **Market signals exist in the backend but never reach the recruiter.** `marketSignalsService.jsw` has `getMarketContext()` — nothing calls it from ROS.
5. **The agent starts fresh every session.** Conversation memory in the lmdr-memory Pinecone namespace is never fetched at chat init.
6. **The platform is reactive, not proactive.** Recruiter must ask for everything. No surface pushes insights.

---

## 4. Architecture Decisions

### 4.1 Contract-First (Wave 1 is a prerequisite)

Wave 2 cannot start until `ros-contract.js` is frozen. Every new message type added in Waves 2-4 is defined in the contract *first*, then implemented.

**Pattern:**
```javascript
// ros-contract.js
window.ROS = window.ROS || {};
ROS.CONTRACT = {
  version: '2.0.0',
  inbound: {
    getIntelData:     { required: ['carrierId'], optional: ['refresh'] },
    getFunnelMetrics: { required: ['period'], optional: ['breakdown'] },
    // ... all 119+ actions
  },
  outbound: {
    intelDataLoaded:    { required: ['intel', 'competitorCount'] },
    funnelMetricsLoaded: { required: ['metrics', 'period'] },
    // ... all 105+ actions
  },
  validate(direction, action, payload) { /* schema check */ }
};
```

### 4.2 NBA Chip Architecture

NBA chips are declarative: a registry array where each chip defines its trigger condition, render function, and action. The system checks conditions on view load and pushes chips to the home view header.

```javascript
// ros-nba.js
ROS.nba = {
  registry: [
    {
      id: 'alerts-fired',
      condition: (state) => state.firedAlerts > 0,
      render: (state) => `${state.firedAlerts} saved alert${state.firedAlerts > 1 ? 's' : ''} fired`,
      icon: 'bookmark',
      action: () => ROS.views.showView('alerts'),
      priority: 1
    },
    {
      id: 'pipeline-stalled',
      condition: (state) => state.stalledPipeline > 0,
      render: (state) => `${state.stalledPipeline} candidates stalled 5+ days`,
      icon: 'warning',
      action: () => ROS.views.showView('pipeline'),
      priority: 2
    },
    {
      id: 'market-hot',
      condition: (state) => state.marketCondition === 'HOT',
      render: () => 'Market is HOT — driver demand is high',
      icon: 'local_fire_department',
      action: () => ROS.views.showView('funnel'),
      priority: 3
    },
    {
      id: 'retention-risk',
      condition: (state) => state.atRiskDrivers > 0,
      render: (state) => `${state.atRiskDrivers} driver${state.atRiskDrivers > 1 ? 's' : ''} at retention risk`,
      icon: 'shield',
      action: () => ROS.views.showView('retention'),
      priority: 4
    }
  ],
  evaluate(state) {
    return this.registry
      .filter(chip => chip.condition(state))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3); // max 3 chips
  }
};
```

### 4.3 View-Aware Agent Context

Every `agentMessage` from `ros-chat.js` is augmented with a context snapshot:

```javascript
// In ros-chat.js sendMessage():
const context = {
  currentView: ROS.views.currentView,
  viewData: ROS.views.getViewSnapshot(), // last known data for that view
  recruiterDot: ROS.bridge.state.recruiterDot,
  activePipeline: ROS.bridge.state.pipelineCount,
  marketCondition: ROS.market?.condition
};
ROS.bridge.send('agentMessage', { text, context });
```

The page code passes `context` to `agentService.handleAgentTurn(role, userId, text, context)`.

### 4.4 Proactive AI

On home view load (after a 2-second delay to avoid blocking render), `ros-proactive.js` sends a `getProactiveInsights` action to the page code. The page calls `agentService.handleAgentTurn('recruiter', userId, '__proactive__', context)` with a special system prompt that generates 2-3 brief insight bullets. These render as non-dismissible insight cards at the top of the home view.

### 4.5 Market Signals Ticker

`ros-market.js` sends `getMarketSignals` on load, receives `{ condition, payAdjustmentFactor, dieselIndex, notes }`, and:
- Renders a top banner pill on home view: HOT (red), SOFT (blue), NEUTRAL (gray)
- Passes `{ condition, payAdjustmentFactor }` to funnel, cost-hire, and predict views as context

### 4.6 Agent Memory

`ros-memory.js` sends `getAgentMemory` on chat FAB open. Page code calls `ragService.retrieveContext(lastMessage, ['conversation_memory'], 'recruiter', { user_id: hashedUserId }, 500)`. Returns recent context bullets rendered as collapsed "Previous sessions" in the chat panel.

---

## 5. Goals

### 5.1 Primary Goals

- All 29 views render live backend data with no stubs.
- `NBA_ENABLED` is active with 4+ chip types, max 3 chips visible.
- Agent knows `currentView`, `viewData`, and `marketCondition` on every message.
- Market condition (HOT/SOFT/NEUTRAL) surfaces in home, funnel, cost-hire, predict views.
- Proactive AI pushes 2-3 insight bullets to home view on load.
- Agent chat loads the last 3 conversation summaries from lmdr-memory on open.
- Evidence Pack passes (`quality_gate.json: pass: true`) across 7 critical paths.

### 5.2 Non-Goals

- No new Wix pages created.
- No redesign of any existing view's layout.
- No changes to backend service logic — only calling them from the frontend.
- No Railway microservice changes.
- No changes to the driver or admin surfaces.

---

## 6. Wave Structure

### Wave 1 — Contract Foundation (1 dev: J1)

**Prerequisite for all other waves.**

Deliverables:
- `src/public/recruiter/os/js/ros-contract.js` — canonical message registry
- `Conductor/tracks/recruiter_os_convergence_20260228/bridge_inventory.md` — full audit of all messages
- `ros-bridge.js` updated to validate messages against contract
- `src/public/__tests__/rosContract.test.js`

Gate to start: None. Unblocks Wave 2.

---

### Wave 2 — Data Wiring Sprint (3 devs in parallel: J2, J3, J4)

**Starts after Wave 1 is merged.**

J2 tasks (intel + predict):
- Wire `ros-view-intel.js` to `getIntelData` / `intelDataLoaded` bridge actions
- Wire `ros-view-predict.js` to `getHiringForecast` / `hiringForecastLoaded` bridge actions
- Add handlers in Recruiter Console page code for both actions

J3 tasks (funnel + attribution):
- Wire `ros-view-funnel.js` to `getFunnelMetrics` / `funnelMetricsLoaded`
- Wire `ros-view-attribution.js` to `getAttributionData` / `attributionDataLoaded`
- Add handlers in Recruiter Console page code for both actions

J4 tasks (lifecycle + retention + onboard):
- Wire `ros-view-lifecycle.js` to `getLifecycleData` / `lifecycleDataLoaded`
- Wire `ros-view-retention.js` to `getRetentionSignals` / `retentionSignalsLoaded`
- Wire `ros-view-onboard.js` to `getOnboardingStatus` / `onboardingStatusLoaded`
- Add handlers for all three in Recruiter Console page code

**GATE 1 after Wave 2:**
- All 29 views render real data (manual spot-check by senior)
- `bridge_inventory.md` coverage column updated: all 7 tools show `wired: true`
- No P0 console errors

---

### Wave 3 — Intelligence Layer (3 devs in parallel: J5, J6, J7)

**Starts after Gate 1 sign-off.**

J5 tasks (NBA chip system):
- Create `ros-nba.js` — chip registry with 4 chip types, evaluate(), render()
- Update `ros-config.js`: `NBA_ENABLED: true`
- Update `ros-shell.js` to call `ROS.nba.evaluate()` on home view load and render chips
- Add `refreshNBAChips` bridge action (page code sends chip state)
- Create `src/public/__tests__/rosNBA.test.js`

J6 tasks (view-aware agent context):
- Update `ros-chat.js`: augment every `agentMessage` with `context` snapshot
- Update `ros-views.js`: add `getViewSnapshot()` function per view
- Update Recruiter Console page code `handleAgentTurn` call to pass `context`
- Verify agent response quality improves with view context (manual test)

J7 tasks (market signals ticker):
- Create `ros-market.js` — fetches market signals, exposes `ROS.market.condition`
- Add `getMarketSignals` / `marketSignalsLoaded` to contract
- Add handler in Recruiter Console page code calling `marketSignalsService.getMarketContext()`
- Update `ros-view-home.js`: render HOT/SOFT/NEUTRAL pill in header
- Update `ros-view-funnel.js`, `ros-view-predict.js`, `cost-analysis`: inject market context
- Create `src/public/__tests__/rosMarketSignals.test.js`

**GATE 2 after Wave 3:**
- NBA chips visible on home view, dismissible, max 3 shown
- Agent response includes view context acknowledgment
- Market ticker visible in home, funnel, and cost-hire views
- No regressions on search, pipeline, messages views (manual smoke test)

---

### Wave 4 — Proactive AI + Memory (2 devs: J1, J2)

**Starts after Gate 2 sign-off. J2 starts after J1's memory store is queryable.**

J1 tasks (agent memory):
- Create `ros-memory.js` — on chat open, sends `getAgentMemory`, receives recent summaries
- Add `getAgentMemory` / `agentMemoryLoaded` to contract
- Add handler in Recruiter Console calling `ragService.retrieveContext(...)` for `conversation_memory` namespace
- Update `ros-chat.js`: render collapsed "Previous sessions" accordion in panel header

J2 tasks (proactive AI push):
- Create `ros-proactive.js` — on home view load (2s delay), sends `getProactiveInsights`
- Add `getProactiveInsights` / `proactiveInsightsLoaded` to contract
- Add handler in Recruiter Console calling `agentService.handleAgentTurn` with `__proactive__` trigger
- Update `ros-view-home.js`: render 2-3 insight cards in dedicated section above NBA chips
- Create `src/public/__tests__/rosProactiveAI.test.js`

---

### Wave 5 — Evidence Pack + Hardening (1 dev: J3)

**Starts after Wave 4. Final gate.**

J3 tasks:
- Run `claude --agent evidence-pack` targeting RecruiterOS across 7 critical paths:
  1. Home view loads with NBA chips + market ticker + proactive insights
  2. Driver search returns real results
  3. Pipeline kanban renders with live data
  4. Agent chat responds with view-aware context
  5. Market signals HOT/SOFT/NEUTRAL visible
  6. Intel view shows competitor data
  7. Retention view shows at-risk signals
- Fix any P0 console errors found
- Attach `verification_run` ID to `metadata.json`
- Mark track DONE

---

## 7. Message Contract (Additions)

All existing messages are inherited from the current bridge. New messages added by this track:

### Inbound (HTML → Page Code)

| Action | Payload | Handler |
|--------|---------|---------|
| `getIntelData` | `{ carrierId?, refresh? }` | `recruiter_service.getCompetitorIntel()` |
| `getFunnelMetrics` | `{ period, breakdown? }` | `recruiterAnalyticsService.getFunnelMetrics()` |
| `getAttributionData` | `{ period, channel? }` | `recruiterAnalyticsService.getSourceAttribution()` |
| `getHiringForecast` | `{ horizon, driverType? }` | `recruiterAnalyticsService.getHiringForecast()` |
| `getLifecycleData` | `{ recruiterDot }` | `recruiterRetentionService.getLifecycleMetrics()` |
| `getRetentionSignals` | `{ recruiterDot, limit? }` | `recruiterRetentionService.getAtRiskDrivers()` |
| `getOnboardingStatus` | `{ carrierId, limit? }` | `recruiterOnboardingService.getOnboardingDashboard()` |
| `getMarketSignals` | `{}` | `marketSignalsService.getMarketContext()` |
| `refreshNBAChips` | `{ stateSnapshot }` | Evaluates NBA registry, returns chips |
| `getAgentMemory` | `{ userId }` | `ragService.retrieveContext(...)` |
| `getProactiveInsights` | `{ context }` | `agentService.handleAgentTurn('recruiter', userId, '__proactive__', context)` |

### Outbound (Page Code → HTML)

| Action | Payload |
|--------|---------|
| `intelDataLoaded` | `{ intel, competitorCount, generatedAt }` |
| `funnelMetricsLoaded` | `{ metrics, period, bottleneck }` |
| `attributionDataLoaded` | `{ channels, topChannel, period }` |
| `hiringForecastLoaded` | `{ forecast, confidence, horizon }` |
| `lifecycleDataLoaded` | `{ drivers, stageDistribution }` |
| `retentionSignalsLoaded` | `{ atRisk, riskFactors, count }` |
| `onboardingStatusLoaded` | `{ workflows, pending, overdue }` |
| `marketSignalsLoaded` | `{ condition, payAdjustmentFactor, dieselIndex }` |
| `nbaChipsReady` | `{ chips: ChipDef[] }` |
| `agentMemoryLoaded` | `{ summaries: string[], hasMemory: bool }` |
| `proactiveInsightsLoaded` | `{ insights: string[], generatedAt }` |

---

## 8. Acceptance Criteria

### 8.1 Data completeness

- All 7 previously-consolidate views render real backend data on load.
- No view returns an empty state due to missing bridge handler.
- Loading states show while data is in-flight (no blank flash).

### 8.2 NBA chips

- `NBA_ENABLED: true` in `ros-config.js`.
- Home view header renders 1-3 NBA chips based on live state.
- Chips are individually dismissible (persist dismissal for the session).
- Chip actions navigate to the relevant view.

### 8.3 Agent intelligence

- Every `agentMessage` payload includes `context.currentView` and `context.viewData`.
- Agent response references the current view when answering view-specific questions.
- Agent chat panel shows "Previous sessions" section if memory exists.

### 8.4 Market signals

- `marketSignalsLoaded` fires within 3 seconds of RecruiterOS load.
- Condition pill visible in home, funnel, cost-hire, and predict views.
- `HOT` renders in red/amber, `SOFT` in blue, `NEUTRAL` in gray.

### 8.5 Proactive AI

- Insight cards appear on home view within 4 seconds of load (non-blocking).
- 2-3 insight bullets visible, each with a relevant icon and CTA.
- If the agent returns no insights or errors, the section stays hidden (no blank state).

### 8.6 Evidence Pack

- `quality_gate.json: { "pass": true }` across all 7 critical paths.
- Zero P0 console errors.
- Zero HTTP 500s on LMDR endpoints.
- All 7 screenshots non-blank and showing expected content.

---

## 9. Risk Summary

See `risk_register.md` for full details. Top risks:

1. **Recruiter Console page code size** — the file is already very large (2,700+ lines). Adding 11 new handlers may make it unmaintainable. Mitigation: group new handlers under a clearly-marked section, consider extraction if file exceeds 3,500 lines.

2. **Proactive AI latency** — agent call is asynchronous but if the Railway microservice is cold-starting, the 2-second delay may not be enough. Mitigation: render a skeleton loader for the insight section, remove it if no response within 8 seconds.

3. **lmdr-memory namespace availability** — if the Pinecone memory index has no data yet (new recruiter), `getAgentMemory` returns empty. Mitigation: `agentMemoryLoaded` with `{ hasMemory: false }` hides the "Previous sessions" section gracefully.

4. **NBA chip state staleness** — chips are evaluated against a state snapshot. If the recruiter's data changes mid-session, chips may be stale. Mitigation: re-evaluate chips on every view change.

---

## 10. Success Metrics

- 7 views go from stub to live: tracked in `bridge_inventory.md` `wired` column
- NBA chip render rate: `featureAdoptionService` logs `nba_chip_rendered` events
- Agent context accuracy: manual QA — 5 questions per view, agent should reference view in 4+
- Market signals load time: `marketSignalsLoaded` latency logged to observability
- Proactive insight engagement: `featureAdoptionService` logs `proactive_insight_clicked`
