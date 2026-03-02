# Execution Plan — DriverOS Mobile-First Convergence

**Track:** `driver_os_convergence_20260302`
**Created:** 2026-03-02

---

## Pre-Start Checklist

Before any wave begins, verify these backend services exist and export the expected methods:

```
src/backend/driverMatching.jsw         → findMatches(), getCarrierDetail()
src/backend/driverCockpitService.jsw   → searchJobs(), getJobDetails(), applyToJob(), saveJob(), getSavedJobs(), getDashboardSummary(), getMessages()
src/backend/driverProfiles.jsw         → getDriverProfile(), uploadDocument(), getDocuments()
src/backend/driverProfileService.jsw   → updateProfile(), getProfileStrength()
src/backend/driverScorecardService.jsw → getDriverScorecard()
src/backend/driverLifecycleService.jsw → getDriverTimeline(), addLifecycleEvent()
src/backend/driverInsightsService.jsw  → getWhoViewedMe()
src/backend/driverFinancialService.jsw → logExpense(), getExpenseSummary()
src/backend/matchExplanationService.jsw → getMatchExplanationForDriver()
src/backend/gamificationService.jsw    → getPlayerState(), awardPoints(), getLeaderboard()
src/backend/badgeService.jsw           → getPlayerBadges()
src/backend/achievementService.jsw     → getAchievements(), getProgress()
src/backend/streakService.jsw          → getStreakState(), recordActivity()
src/backend/healthService.jsw          → getResourcesByCategory(), submitTip()
src/backend/petFriendlyService.jsw     → searchLocations(), submitReview()
src/backend/agentService.jsw           → handleAgentTurn()
src/backend/agentConversationService.jsw → getRecentContext()
src/backend/voiceService.jsw           → createAssistant(), getVoiceConfig()
src/backend/marketSignalsService.jsw   → getMarketContext(), getPayAdjustmentFactor()
src/backend/aiEnrichment.jsw           → enrichCarrier()
src/backend/semanticSearchService.jsw  → semanticSearch()
src/backend/retentionService.jsw       → getRetentionRisk()
```

If any method is missing, note it in `bridge_inventory.md` as `backend_gap` and create a stub handler that returns `{ status: 'not_implemented' }`.

---

## Wave 1 — Contract & Bridge Inventory

### W1-T1: Audit existing bridge files (J1)

Read each of these 11 files and list every postMessage action sent/received:

```
src/public/driver/js/ai-matching-bridge.js
src/public/driver/js/driver-dashboard-bridge.js
src/public/driver/js/driver-my-career-bridge.js
src/public/driver/js/document-upload-bridge.js
src/public/driver/js/surveys-bridge.js
src/public/driver/js/road-utilities-bridge.js
src/public/driver/js/driver-announcements-bridge.js
src/public/driver/js/driver-policies-bridge.js
src/public/driver/js/retention-bridge.js
src/public/driver/js/ai-matching-agent.js
src/public/driver/js/ai-matching-contract.js
```

For each file, record:
- Every `parent.postMessage()` or `window.parent.postMessage()` call → inbound action
- Every `onMessage` or `addEventListener('message')` handler → outbound action
- Whether it uses `action` key or `type` key

### W1-T2: Audit existing page code files (J1)

Read each of these page code files and list every handled action:

```
src/pages/AI - MATCHING.rof4w.js
src/pages/DRIVER_OS.nd0gp.js (expected: empty stub)
src/pages/TRUCK DRIVERS.gsx0g.js
src/pages/Driver Jobs (Item).s0js1.js
src/pages/Driver Opportunities - Your Next Career .lb0uy.js
```

For each file, record every `case` branch in the message router.

### W1-T3: Create driver-os-contract.js (J1)

File: `src/public/driver/os/js/driver-os-contract.js`

Build the canonical registry using the audit results from T1 + T2. Include:
- All existing actions (ported from 11 bridge files)
- All new actions needed for views without bridges (gamification, forums, mentorship, etc.)
- Required/optional field schemas for each action
- `validate(direction, action, payload)` function

### W1-T4: Complete bridge_inventory.md (J1)

Update `Conductor/tracks/driver_os_convergence_20260302/bridge_inventory.md`:
- Fill in all "Unknown" backed-by-page-code entries
- Mark protocol mismatches
- Set initial `wired` status for all 60+ actions

### W1-T5: Create contract test (J1)

File: `src/public/__tests__/driverOsContract.test.js`

Tests:
- Every inbound action has a matching outbound response
- validate() returns `{ valid: true }` for correct payloads
- validate() returns `{ valid: false, error }` for missing required fields
- No duplicate action names

### W1-T6: Commit

```bash
git add src/public/driver/os/js/driver-os-contract.js
git add src/public/__tests__/driverOsContract.test.js
git add Conductor/tracks/driver_os_convergence_20260302/bridge_inventory.md
git commit -m "feat(driver-os): wave 1 — contract foundation + bridge inventory"
git push
```

---

## Wave 2 — Mobile Shell + Core CDN Modules

### W2J2-T1: Create DriverOS.html (J2)

File: `src/public/driver/DriverOS.html`

Target: <= 90 lines. Must follow the HTML shell pattern from CLAUDE.md.

Structure:
```
<head>
  - viewport meta (mobile, no-scale, viewport-fit=cover)
  - Inter font
  - Material Symbols Outlined
  - Tailwind CDN with LMDR inline config
  - CDN link: driver-os.css
  - CDN link: dos-mobile.css
</head>
<body class="bg-slate-50 font-d">
  <div id="app-root" class="flex flex-col min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))]"></div>
  <nav id="bottom-nav"></nav>
  <div id="agent-overlay"></div>

  CDN scripts (ordered):
    1. driver-os-contract.js
    2. driver-os-config.js
    3. driver-os-bridge.js
    4. driver-os-core.js
    5. driver-agent.js (Wave 5, but load tag present)
    6. dos-nba.js (Wave 5)
    7. dos-market.js (Wave 5)
    8. dos-proactive.js (Wave 5)
    9. dos-memory.js (Wave 5)

  Bootstrap (<10 lines):
    document.addEventListener('DOMContentLoaded', function() {
      DOS.init();
    });
</body>
```

LMDR branding: title "LMDR | Driver OS", LM logo reference.

Mobile constraints:
- `<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">`
- `bg-slate-50` background (per mobile guide)
- Body padding: none (bottom nav handles safe area)

### W2J2-T2: Create driver-os-config.js (J2)

File: `src/public/driver/os/js/driver-os-config.js`

Contents:
- `DOS.config.VIEW_REGISTRY` — 19 entries mapping viewId to CDN URL
- `DOS.config.NAV_ZONES` — 5 bottom nav zone definitions
- `DOS.config.VIEW_CLUSTERS` — which views belong to which nav zone (for swipe navigation)
- `DOS.config.SESSION_CONTEXT` — initialized with nulls, populated by bridge on init
- `DOS.config.FEATURE_FLAGS` — per-view flags (voice_enabled, proactive_push, nba_enabled)
- `DOS.config.VERSION` — semantic version for CDN staleness detection

### W2J2-T3: Create driver-os.css (J2)

File: `src/public/driver/os/css/driver-os.css`

Contents:
- `.pt-safe { padding-top: env(safe-area-inset-top); }`
- `.pb-safe { padding-bottom: env(safe-area-inset-bottom); }`
- Bottom nav: fixed, 56px, flex, justify-around, shadow, bg-white, border-t
- Nav button states: active (text-lmdr-blue), inactive (text-slate-400)
- View transitions: `.dos-slide-left`, `.dos-slide-right`, `.dos-fade`
- Agent FAB: fixed, bottom-[72px], right-4, 48x48, rounded-full, bg-lmdr-blue, shadow-lg
- Agent chat panel: fixed, inset-x-0, bottom-0, h-[85vh], bg-white, rounded-t-2xl, shadow-2xl
- Skeleton loader: `.dos-skeleton` (pulse animation, bg-slate-200, rounded)

### W2J2-T4: Create dos-mobile.css (J2)

File: `src/public/driver/os/css/dos-mobile.css`

Contents:
- Default (mobile-first): single column, px-4, full-width cards
- `@media (min-width: 768px)`: 2-column grid, larger padding
- `.dos-touch-target { min-width: 44px; min-height: 44px; }` (applied to all interactive elements)
- Form inputs: `h-12 text-base` (16px prevents iOS zoom)
- Pull-to-refresh: `.dos-ptr` (overscroll-behavior, transform animation)
- Thumb-zone helper: `.dos-thumb-primary` (positioned in lower 40% of viewport)

### W2J2-T5: Commit (J2)

```bash
git add src/public/driver/DriverOS.html
git add src/public/driver/os/js/driver-os-config.js
git add src/public/driver/os/css/driver-os.css
git add src/public/driver/os/css/dos-mobile.css
git commit -m "feat(driver-os): wave 2a — mobile shell + config + CSS"
git push
# Purge CDN for new files
```

### W2J3-T1: Create driver-os-bridge.js (J3)

File: `src/public/driver/os/js/driver-os-bridge.js`

Pattern:
```
DOS.bridge = {
  component: null,   // Set by init when Wix page code sends 'init'
  pending: {},       // Map of action -> resolve/reject for request-response pattern
  listeners: {},     // Map of action -> callback for push messages

  init() {
    window.addEventListener('message', (event) => this.handleInbound(event));
  },

  send(action, payload) {
    // Validate against DOS.CONTRACT.inbound
    // Send via parent.postMessage({ action, payload }, '*')
  },

  handleInbound(event) {
    const { action, payload } = event.data || {};
    // Validate against DOS.CONTRACT.outbound
    // Route to active view via DOS.viewModules[DOS.views.current]?.onMessage(action, payload)
    // Handle proactive push messages (agent-initiated)
    // Handle streaming responses
  },

  on(action, callback) { /* Register listener */ },
  off(action) { /* Unregister listener */ }
};
```

Includes backward-compatibility adapter for `type`-key protocol:
```
// In handleInbound:
if (event.data.type && !event.data.action) {
  // Translate type/data to action/payload
  event.data = { action: event.data.type, payload: event.data.data };
}
```

### W2J3-T2: Create driver-os-core.js (J3)

File: `src/public/driver/os/js/driver-os-core.js`

Contains:
- `DOS.views` — VLM (mount, unmount, lazy-load script, getViewSnapshot, context bus)
- `DOS.nav` — bottom nav renderer (5 zones, active state, tap handlers)
- `DOS.gestures` — swipe left/right detection for sibling view navigation, swipe-up for drawer
- `DOS.init()` — bootstrap: config loaded -> bridge init -> nav render -> mount default view (matching)
- `DOS.refresh()` — pull-to-refresh: re-send last data request for current view

VLM lazy-load pattern:
```
async loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
```

### W2J3-T3: Create shell test (J3)

File: `src/public/__tests__/driverOsShell.test.js`

Tests:
- `DOS.init()` creates bottom nav with 5 children
- `DOS.views.mount('matching')` loads the matching view module
- `DOS.views.unmount()` clears #app-root
- `DOS.nav.setActive('career')` updates CSS classes
- Bridge validates against contract (valid payload passes, invalid fails)

### W2J3-T4: Commit (J3)

```bash
git add src/public/driver/os/js/driver-os-bridge.js
git add src/public/driver/os/js/driver-os-core.js
git add src/public/__tests__/driverOsShell.test.js
git commit -m "feat(driver-os): wave 2b — bridge + VLM + gesture nav"
git push
# Purge CDN
```

---

## ═══ GATE 1 — Shell Bootstrap ═══

Run verification_matrix.md checks G1.1 through G1.8.

- [ ] G1.1: Shell loads < 2s on 3G throttle
- [ ] G1.2: Bottom nav renders 5 zones (44px targets)
- [ ] G1.3: VLM mounts placeholder view without errors
- [ ] G1.4: Safe-area padding on iOS
- [ ] G1.5: Zero P0 console errors
- [ ] G1.6: No horizontal scroll on 390px
- [ ] G1.7: Shell <= 100 lines
- [ ] G1.8: Viewport meta correct

**STOP. Do not proceed to Wave 3 until all Gate 1 checks pass.**

---

## Wave 3 — View Module Extraction

### View Module Interface Contract

Every `dos-view-*.js` file MUST export this interface:

```
DOS.viewModules = DOS.viewModules || {};
DOS.viewModules['viewId'] = {
  mount(root) {
    // 1. Clear root
    // 2. Build mobile-first DOM using document.createElement (NO innerHTML)
    // 3. Append to root
    // 4. Attach event listeners
    // 5. Call DOS.bridge.send() to fetch initial data
  },

  unmount() {
    // 1. Remove event listeners
    // 2. Abort any pending fetches
    // 3. Clear any timers
  },

  onMessage(action, payload) {
    // Handle responses from bridge (e.g., 'matchesLoaded', 'profileLoaded')
    // Update DOM with received data
  },

  getSnapshot() {
    // Return current view state for agent context
    // Example: { resultCount: 5, selectedCarrier: 'dot:123456' }
    return {};
  }
};
```

### Mobile-First DOM Construction Rules

1. **All DOM via `document.createElement`** — never use innerHTML (XSS prevention)
2. **Use `textContent` for text** — never insert HTML strings
3. **Single-column by default** — `grid-cols-1`, add `md:grid-cols-2` for tablet
4. **Touch targets: 44px minimum** — every button, link, card action area
5. **Input font: 16px (text-base)** — prevents iOS auto-zoom
6. **Padding: px-4** — 16px on each side leaves 358px content width on 390px viewport
7. **No hover effects** — use `:active` or tap handlers instead
8. **Loading states** — show skeleton while data loads, never blank flash

### W3J4 — Discovery + Career (6 views)

For `dos-view-matching.js`: This is the most complex view. The existing 10 CDN modules
(`ai-matching-state/helpers/renderers/results/accordion/modals/bootstrap/bridge/contract/agent`)
should be loaded as dependencies by this view module. The view module itself orchestrates
mounting and wiring them to the VLM interface.

```
mount(root):
  - Load dependency scripts (ai-matching-*.js) if not already loaded
  - Build search form (full-width, stacked fields, 44px inputs)
  - Build result container
  - Initialize existing modules with root element
  - Mobile: carrier cards expand on tap (not hover)
  - Mobile: sticky "Search" button in thumb zone

unmount():
  - Clear result state
  - Remove search event listeners
```

For `dos-view-dashboard.js`: Similar pattern — loads existing `driver-dashboard-*.js`
modules as dependencies.

For remaining views (`opportunities`, `jobs`, `career`, `documents`):
Extract logic from monolithic HTML into the view module interface.

### W3J5 — Gamification + Community (6 views)

**These are FULL EXTRACTIONS — no existing CDN modules to lean on.**

For `dos-view-gamification.js`:
- Extract from `DRIVER_GAMIFICATION.html` (807 lines of inline code)
- DOM: XP progress bar (full-width), tier badge (centered), level info, event feed (scrollable list)
- Mobile: no `text-5xl` — use `text-2xl` for tier name, `text-base` for XP numbers
- Bridge: `getGamificationState` -> `gamificationStateLoaded`

For `dos-view-badges.js`:
- Extract from `DRIVER_BADGES.html` (659 lines)
- DOM: 2-column grid of badges, each 44px minimum, earned vs locked states
- Bridge: `getBadges` -> `badgesLoaded`

For `dos-view-challenges.js`:
- Extract from `CHALLENGES.html` (806 lines)
- DOM: Tab pills (Active/Completed), challenge cards full-width, progress bars
- Bridge: `getChallenges` -> `challengesLoaded`

For `dos-view-forums.js`:
- Extract from `DRIVER_FORUMS.html` (588 lines)
- Include `marked.js` as a dependency for markdown rendering
- DOM: Category filter pills, thread list (full-width), reply form
- Mobile: swipe left on thread for quick actions (upvote/bookmark)
- Bridge: `getForumThreads` -> `forumThreadsLoaded`

For `dos-view-announcements.js`:
- Extract from `DRIVER_ANNOUNCEMENTS.html` + 2 CDN modules
- **MIGRATE protocol: change all `type` keys to `action` keys**
- Bridge: `getAnnouncements` -> `announcementsLoaded`

For `dos-view-surveys.js`:
- Lift from `DRIVER_SURVEYS.html` (51 lines) + 4 CDN modules
- Mobile: rating stars at 44px each, full-width question cards
- Bridge: `getSurveys` -> `surveysLoaded`

### W3J6 — Road + Compliance + Mentorship + Retention (7 views)

For `dos-view-road.js`:
- Extract from `DRIVER_ROAD_UTILITIES.html` + 4 CDN modules
- **Critical**: Leaflet map lifecycle handling
  - On mount: create map div, init Leaflet with `{ zoomControl: false }` (gesture zoom only)
  - After mount (100ms delay): `map.invalidateSize()`
  - On unmount: `map.remove()` to prevent memory leak
- Mobile: full-viewport map, bottom sheet for search results (slide up from bottom)
- Bridge: `getRoadData` -> `roadDataLoaded` (25 sub-actions via toolType parameter)

For `dos-view-health.js`:
- Extract from `HEALTH_WELLNESS.html` (396 lines)
- Include `marked.js` for community tip markdown
- DOM: horizontal scroll category pills, tip cards full-width
- Bridge: `getHealthResources` -> `healthResourcesLoaded`

For `dos-view-pet-friendly.js`:
- Extract from `PET_FRIENDLY.html` (306 lines)
- DOM: list view with distance badges, tap for detail modal, review submission form
- Bridge: `getPetFriendlyLocations` -> `petFriendlyLocationsLoaded`

For `dos-view-policies.js`:
- Extract from `DRIVER_POLICIES.html` + 2 CDN modules
- **MIGRATE protocol: `type` -> `action`**
- DOM: policy list, full-text viewer, signature pad (full-width on mobile)
- Bridge: `getDriverPolicies` -> `driverPoliciesLoaded`

For `dos-view-mentors.js`:
- Extract from `MENTOR_PROGRAM.html` (839 lines)
- DOM: mentor cards stacked, CDL class filter, "Request Session" button (44px)
- Bridge: `getMentors` -> `mentorsLoaded`

For `dos-view-mentor-profile.js`:
- Extract from `MENTOR_PROFILE.html` (521 lines)
- DOM: profile header, experience section, availability calendar, contact button
- Bridge: `getMentorProfile` -> `mentorProfileLoaded`

For `dos-view-retention.js`:
- Extract from `Driver Retention Best Practices.html` + 2 CDN modules
- DOM: accordion sections for retention framework, best practices cards
- Bridge: uses existing retention-bridge.js patterns

---

## ═══ GATE 2 — View Completeness ═══

Run verification_matrix.md checks G2.1 through G2.8.

- [ ] G2.1: All 19 views mount via VLM
- [ ] G2.2: All views render real backend data
- [ ] G2.3: Zero type-key messages in new bridge
- [ ] G2.4: Bridge inventory >= 95% wired
- [ ] G2.5: Single-column on mobile
- [ ] G2.6: Touch targets >= 44px
- [ ] G2.7: Gamification views extracted
- [ ] G2.8: Community views extracted

**STOP. Do not proceed to Wave 4 until all Gate 2 checks pass.**

---

## Wave 4 — Unified Page Code Bridge

### W4J7-T0: Create driverOSFacade.jsw (J7) — MUST BE FIRST

**CRITICAL: This task MUST complete before T1. See spec.md §4.0 for why.**

File: `src/backend/driverOSFacade.jsw`

The RecruiterOS convergence proved that page code with 40+ direct backend imports
causes a **silent bundler crash** — `$w.onReady` never fires, zero errors, dead page.
This consumed 2 hours of debugging. The fix is a single facade `.jsw` file.

Additionally, `backend/*.js` files (non-`.jsw`, like `configData.js`) get bundled
CLIENT-SIDE and kill the bundler if they're large. The facade imports them server-side.

Pattern (mirrors `recruiterOSFacade.jsw` and `aiMatchingFacade.jsw`):

```javascript
// src/backend/driverOSFacade.jsw
// Single entry-point for ALL DriverOS backend calls.
// Page code imports from ONE file to avoid Wix bundler crash.

// --- Matching & Search ---
import { findMatches, getCarrierDetail } from 'backend/driverMatching.jsw';
import { searchJobs, getJobDetails, applyToJob, saveJob, getSavedJobs,
         getDashboardSummary, getMessages } from 'backend/driverCockpitService.jsw';
import { enrichCarrier } from 'backend/aiEnrichment.jsw';
import { getMatchExplanationForDriver } from 'backend/matchExplanationService.jsw';

// --- Profile & Lifecycle ---
import { getDriverProfile, uploadDocument, getDocuments } from 'backend/driverProfiles.jsw';
import { updateProfile } from 'backend/driverProfileService.jsw';
import { getDriverScorecard } from 'backend/driverScorecardService.jsw';
import { getDriverTimeline, addLifecycleEvent } from 'backend/driverLifecycleService.jsw';
import { getWhoViewedMe } from 'backend/driverInsightsService.jsw';

// --- Gamification ---
import { getPlayerState, awardPoints, getLeaderboard } from 'backend/gamificationService.jsw';
import { getPlayerBadges } from 'backend/badgeService.jsw';
import { getAchievements, getProgress } from 'backend/achievementService.jsw';
import { getStreakState, recordActivity } from 'backend/streakService.jsw';

// --- Community & Wellness ---
import { getResourcesByCategory, submitTip } from 'backend/healthService.jsw';
import { searchLocations, submitReview } from 'backend/petFriendlyService.jsw';

// --- Agent + Voice ---
import { handleAgentTurn } from 'backend/agentService.jsw';
import { getRecentContext } from 'backend/agentConversationService.jsw';
import { getMarketContext } from 'backend/marketSignalsService.jsw';
import { createAssistant, getVoiceConfig } from 'backend/voiceService.jsw';

// --- Feature Flags (MUST go through facade — configData.js is non-.jsw!) ---
import { FEATURE_FLAGS } from 'backend/configData';

// Re-export with dos* prefix (thin async wrappers)
export function dosFindMatches(prefs) { return findMatches(prefs); }
export function dosGetCarrierDetail(dot) { return getCarrierDetail(dot); }
export function dosSearchJobs(filters) { return searchJobs(filters); }
// ... ~60 more wrappers following this pattern
export function dosGetFeatureFlags() { return FEATURE_FLAGS; }
```

Commit: `feat(driver-os): wave 4 prereq — driverOSFacade.jsw (single import entry-point)`

### W4J7-T1: Wire DRIVER_OS.nd0gp.js (J7)

File: `src/pages/DRIVER_OS.nd0gp.js`

**IMPORT FROM FACADE ONLY — never import directly from backend services.**
The `enforce-jsw-facade-imports.ps1` hook will BLOCK any direct `backend/*.js` import.

```javascript
// CORRECT — single facade import
import {
  dosFindMatches, dosGetCarrierDetail, dosApplyToCarrier,
  dosGetMatchExplanation, dosEnrichCarrier,
  dosSearchJobs, dosGetJobDetails, dosSaveJob, dosGetSavedJobs,
  dosGetDashboardSummary, dosGetMessages,
  dosGetProfile, dosUpdateProfile, dosGetScorecard,
  dosUploadDocument, dosGetDocuments,
  dosGetDriverTimeline, dosAddLifecycleEvent, dosGetWhoViewedMe,
  dosGetPlayerState, dosGetBadges, dosGetChallenges, dosGetStreaks,
  dosGetHealthResources, dosSubmitTip,
  dosSearchPetFriendly, dosSubmitPetReview,
  dosHandleAgentTurn, dosGetRecentContext,
  dosGetMarketContext, dosGetFeatureFlags
  // ... all 60+ methods from ONE file
} from 'backend/driverOSFacade.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(function () {
  initBridge();
});

function initBridge() {
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const el = $w(id);
      if (el.rendered && typeof el.onMessage === 'function') {
        el.onMessage(async (event) => routeMessage(el, event?.data));
        safeSend(el, { action: 'init' });
        return; // Found the component
      }
    } catch (e) { /* Component not on page */ }
  }
}

function safeSend(component, data) {
  try { component.postMessage(data); } catch (e) { /* detached */ }
}

async function routeMessage(component, message) {
  if (!message?.action) return;

  try {
    switch (message.action) {
      // ═══ Discovery & Matching ═══
      case 'findMatches': { /* ... */ break; }
      case 'getCarrierDetail': { /* ... */ break; }
      // ... (12 actions)

      // ═══ Career & Profile ═══
      case 'getProfile': { /* ... */ break; }
      // ... (10 actions)

      // ═══ Gamification ═══
      case 'getGamificationState': { /* ... */ break; }
      // ... (8 actions)

      // ═══ Community ═══
      case 'getForumThreads': { /* ... */ break; }
      // ... (8 actions)

      // ═══ Road & Wellness ═══
      case 'getRoadData': { /* ... */ break; }
      // ... (8 actions)

      // ═══ Compliance ═══
      case 'getDriverPolicies': { /* ... */ break; }
      // ... (3 actions)

      // ═══ Agent + Voice ═══
      case 'agentMessage': { /* ... */ break; }
      // ... (4 actions)

      // ═══ Market + NBA ═══
      case 'getMarketSignals': { /* ... */ break; }
      // ... (2 actions)

      // ═══ Navigation ═══
      case 'viewChanged': { /* analytics/context tracking */ break; }

      default:
        console.warn('[DriverOS] Unknown action:', message.action);
    }
  } catch (error) {
    safeSend(component, { action: 'actionError', message: error.message });
  }
}
```

Each case branch calls the backend service, then `safeSend(component, { action: 'xxxLoaded', payload })`.

### W4J1-T1: Remove DEV_MODE flags (J1)

In `src/backend/driverMatching.jsw`:
- Find `DEV_MODE_BYPASS_ROLES = true` -> set to `false` or remove entirely
- Find `DEV_MODE_BYPASS_CARRIER = true` -> set to `false` or remove entirely

In `src/backend/driverOutreach.jsw`:
- Find similar DEV_MODE flags -> remove

### W4J1-T2: Update bridge inventory (J1)

Mark all 60+ actions as `wired: true` in `bridge_inventory.md`.

### W4J1-T3: Create view smoke test (J1)

File: `src/public/__tests__/driverOsViews.test.js`

Tests each of the 19 view modules:
- Has `mount()` function
- Has `unmount()` function
- Has `onMessage()` function
- Has `getSnapshot()` function
- `mount()` creates at least one child in root container

---

## Wave 5 — Intelligence Layer

### W5J2-T1: Create driver-agent.js (J2)

File: `src/public/driver/os/js/driver-agent.js`

Agent overlay component:
- FAB: 48x48 circle, bg-lmdr-blue, "LM" text (or Material icon `smart_toy`)
- Position: `position: fixed; bottom: 72px; right: 16px;` (above bottom nav)
- On tap: slide up chat panel
- Chat panel (mobile): full-width bottom sheet, 85vh height, rounded-t-2xl
- Chat panel (tablet+): right side panel, 380px width
- Message list with driver/agent bubbles
- Input bar at bottom with send button + voice orb toggle
- Context injection: every send includes `DOS.views.current`, `DOS.views.getViewSnapshot()`, `DOS.market?.condition`
- Voice orb: lazy-loads VAPI Web SDK on first voice tap

### W5J3-T1: Create dos-nba.js (J3)

File: `src/public/driver/os/js/dos-nba.js`

6-chip registry (see spec.md 4.5). Renders as horizontal scrollable chips in dashboard header.
Each chip: icon + text + dismiss X button. Tap navigates to relevant view.
Dismissed chips stored in `sessionStorage` to prevent re-showing within session.

### W5J3-T2: Create dos-market.js (J3)

File: `src/public/driver/os/js/dos-market.js`

On shell load, sends `getMarketSignals`. Stores `DOS.market.condition` and `DOS.market.payFactor`.
Renders pill in matching + dashboard view headers:
- HOT: red/amber bg, fire icon
- SOFT: blue bg, trending_down icon
- NEUTRAL: gray bg, trending_flat icon

### W5J4-T1: Create dos-proactive.js (J4)

File: `src/public/driver/os/js/dos-proactive.js`

On dashboard mount, 2s delay, sends `getProactiveInsights`. Renders 2-3 insight cards
above NBA chips. Each card: icon + text (created via createElement, textContent).
Skeleton loader while waiting. Hidden if no response in 8s or empty array.

### W5J4-T2: Create dos-memory.js (J4)

File: `src/public/driver/os/js/dos-memory.js`

On chat panel open, sends `getAgentMemory`. If `hasMemory: true`, renders collapsed
"Previous sessions" accordion at top of chat. Summaries shown as faded italic text.
If `hasMemory: false`, section not rendered at all.

---

## ═══ GATE 3 — Intelligence Correctness ═══

Run verification_matrix.md checks G3.1 through G3.11.

- [ ] G3.1: Agent FAB visible on all 19 views
- [ ] G3.2: Agent receives view context
- [ ] G3.3-G3.5: Voice orb on matching, dashboard, road
- [ ] G3.6-G3.7: NBA chips on dashboard (max 3, dismissible)
- [ ] G3.8-G3.9: Market condition pill on matching + dashboard
- [ ] G3.10-G3.11: Proactive insights within 4s (or hidden gracefully)

**STOP. Do not proceed to Wave 6 until all Gate 3 checks pass.**

---

## Wave 6 — Evidence Pack + Mobile Hardening

### W6-T1: Run Evidence Pack (J5)

```bash
claude --agent evidence-pack
```

5 critical paths:
1. Dashboard: NBA chips + market ticker + proactive insights
2. Matching: search + result cards with enrichment
3. Gamification: XP hub with real data
4. Agent: view-aware response
5. Road: Leaflet map + geolocation

### W6-T2: Mobile Viewport Audit (J5)

Chrome DevTools Responsive Mode at 390x844:
- Navigate to every view
- Check: no horizontal scroll, text >= 14px, touch targets >= 44px
- Check: bottom nav visible, safe-area padding correct
- Check: primary CTAs in thumb zone
- Check: landscape rotation does not break layout

### W6-T3: Performance Budget (J5)

- Shell load: DOMContentLoaded < 2s on Slow 3G
- View switch: measure time from nav tap to view rendered < 500ms
- Agent response: measure time from send to first response token < 3s

### W6-T4: CDN Purge (J5)

Run full purge template from spec.md section 7.

### W6-T5: Finalize (J5)

```bash
# Update metadata.json with verification_run
# Mark track status: complete
git add -A
git commit -m "chore(driver-os): wave 6 — evidence pack pass + mobile hardening"
git push
```

---

## Sync After Each Wave

After every commit + push, run CDN purge for all modified files:

```bash
# Template — replace <files> with actual changed file paths
for f in <files>; do
  curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/$f"
done
```
