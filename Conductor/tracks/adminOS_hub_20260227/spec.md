# AdminOS Hub — Technical Specification

## 1. Overview & Goals

Replace the current placeholder `src/public/admin/os/AdminOS.html` with a fully functional, production-ready **Single-Page Application (SPA)** hub that consolidates all 44 standalone admin HTML pages into one unified interface.

The AdminOS Hub must:
- Embed as a Wix HTML Component (`HtmlComponent` element) on the Wix admin page
- Communicate with Wix Velo backend via the `window.postMessage` / `window.onmessage` bridge pattern (see `aos-bridge.js`)
- Visually match the **Solarized Neumorphic Design System** used in `RecruiterOS.html`
- Support 3 themes: **light** (default), **solar**, **dark** — toggled via `localStorage['aos-theme']`
- Load entirely from **CDN-hosted files** (jsDelivr via GitHub), never use relative paths

---

## 0. ⚠️ CDN File Loading Pattern — CRITICAL RULE

**All** `<script src>` and `<link href>` tags in `AdminOS.html` and any other HTML file in this project MUST use jsDelivr CDN URLs. Relative paths (`./`, `../`, `src/`) are forbidden inside Wix HTML Components — they will return 404.

### CDN URL Format

```
https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@{ref}/path/to/file
```

Where `{ref}` is one of:
- **`@main`** — Use for ALL new files created in this track. This always resolves to the latest commit on the `main` branch after the file is pushed to GitHub.
- **`@{commit-hash}`** — Only used when pinning to a specific version of an existing file (e.g., `@385f9bb`). Do NOT use pinned hashes for new files.

### Examples (copied from live `RecruiterOS.html`):

```html
<!-- CSS (always @main for AdminOS) -->
<link href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/os/css/admin-os.css" rel="stylesheet">

<!-- Core module scripts -->
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/os/js/aos-config.js"></script>
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/os/js/aos-shell.js"></script>

<!-- View module scripts -->
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/admin/os/js/views/aos-view-home.js"></script>

<!-- Shared resources from recruiter (reuse exact paths from RecruiterOS.html) -->
<link href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os/css/recruiter-os.css" rel="stylesheet">
```

### jsDelivr Cache Note

jsDelivr caches `@main` aggressively. After pushing a new file to GitHub, the CDN may serve a stale 404 for up to **5 minutes**. If a script 404s during testing, wait 5 minutes and hard-refresh. Do NOT change the URL pattern as a workaround.

---

## 1. ⛔ No Mock Data — CRITICAL RULE

**Absolutely NO inline mock data, hardcoded placeholder values, or `const FAKE_DATA = [...]` patterns anywhere in the codebase.** This is a production application. Every piece of data displayed in the UI must come from a real backend pipeline.

### What This Means for the Executing Agent

1. **All data flows through the PostMessage bridge.** View modules call `AOS.bridge.send('AOS_GET_*', {})` on `mount()`. The Wix page code handles the message, calls the real backend `.jsw` service, and sends the response back. The view's `handleMessage()` populates the UI with the real response.

2. **If data doesn't exist yet, create a seeding script.** If a view requires data that hasn't been populated in the Wix collections yet (e.g., no audit log entries exist, no gamification events have been logged), create a clearly labeled seeding script:
   - File: `src/backend/migrations/seed_[collection_name].jsw`
   - The seed script must insert realistic sample records into the appropriate Wix Data collection
   - Mark the seed script as a migration task in the plan (not inline in the view)
   - After seeding, the view must read from the collection through the normal bridge pipeline

3. **Loading states are NOT mock data.** It is acceptable (and required) to show:
   - Loading skeletons / spinners while awaiting the bridge response
   - "No data yet" empty states when the collection returns 0 results
   - Error messages when the bridge call fails
   These are **UI states**, not mock data.

4. **Chart.js charts must render from real data.** Pass the bridge response data directly to Chart.js `data.datasets[0].data`. If the backend returns an empty array, the chart should render with empty axes and a "No data available" overlay — NOT with hardcoded `[10, 20, 30, 40]` sample arrays.

---

## 2. Approved Final Design (Stitch Reference)

**Stitch Project:** VelocityMatch AdminOS Mockups (ID: `9965744049677296293`)
**Canonical Screen:** ADMINOPS Spatial Command Center (ID: `3ffb654a550047b989d39c90158ee910`)  
**Screenshot URL:** `https://lh3.googleusercontent.com/aida/AOfcidUuEvUst5KRC0QoV7LYqmK2ce2aPmGaZMo4c-PVZkD-8WI1ZyeAl2KVms36PHAykqKgzlPJHj8b1cYdNRdgHeYpB5ZlEhceyEKzbAzK5376AHyAPRlw0hU2OT136VkvjWBy-wKnxBgNEIoOESCoTgJDUQAEnZ83ZRBfAalUaBppXN7pX2eNrKq17kjoLWLKmZ5YOtZCXezgC2IwUBCRa7SsKwV4aAHtjvzgTEKzNrXDHSby7m6mIZ69Mog`

### 2.1 Layout Zones (5 Zones)

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR  (h: 44px)  [Logo | Nav | Search ⌘K | Bell | Clock] │
├────────┬────────────────────────────────┬───────────────────┤
│  LEFT  │       CENTRAL WORKSPACE        │   RIGHT COPILOT   │
│  RAIL  │  (dot-grid background, open)   │  SIDEBAR (toggle) │
│ (72px) │  #aos-stage                    │    (300px)        │
│        │                                │                   │
│  9 Orb │  [Active View renders here]    │  [Chat Thread +   │
│  Icons │                                │   Voice Toggle]   │
│        │                                │                   │
├────────┴────────────────────────────────┴───────────────────┤
│  COMMAND BAR  (h: ~100px)                                    │
│  [Quick chips: Run Diagnostics | Audit AI | Find Carrier]    │
│  [🤖 _ input: "Ask AdminOS anything..." _________ [Send] ]  │
├─────────────────────────────────────────────────────────────┤
│  FLOATING DOCK  (centered bottom pill, h: 60px)             │
│  [Home] [Traces] [AI Router] [Drivers] [Carriers]           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Left Rail — 9 Primary Tool Orbs

The left rail is a **narrow vertical strip (72px wide)** containing icon-only tool orbs. Each orb is a raised neumorphic square (~52x52px). Clicking an orb navigates to the corresponding view in `#aos-stage`.

| # | Orb Label | Icon | View ID | Src Page |
|---|-----------|------|---------|----------|
| 1 | Dashboard | `space_dashboard` | `home` | `ADMIN_DASHBOARD.html` |
| 2 | Observability | `monitoring` | `observability` | `ADMIN_OBSERVABILITY.html` |
| 3 | AI Router | `account_tree` | `ai-router` | `ADMIN_AI_ROUTER.html` |
| 4 | Drivers | `group` | `drivers` | `ADMIN_DRIVERS.html` |
| 5 | Carriers | `business_center` | `carriers` | `ADMIN_CARRIERS.html` |
| 6 | Matches | `handshake` | `matches` | `ADMIN_MATCHES.html` |
| 7 | Billing | `payments` | `billing` | `ADMIN_BILLING_MANAGEMENT.html` |
| 8 | Content | `edit_note` | `content` | `ADMIN_CONTENT.html` |
| 9 | Gamification | `emoji_events` | `gamification-analytics` | `ADMIN_GAMIFICATION_ANALYTICS.html` |

Full drawer access (all 44 tools) is maintained in the existing `aos-config.js` TOOL_REGISTRY and accessible via the `#aos-drawer-panel` (see Section 2.3).

### 2.3 Left Rail — Expanded Drawer Panel

Each orb in the left rail has an associated **category drawer** defined in `AOS.config.drawers`. When a user long-presses or clicks an "expand" chevron on an orb group divider, a flyout panel (`#aos-drawer-panel`) slides in from the left, overlaying the workspace. This panel shows the full accordion drawer for that category with all tool orbs (3-column grid, matching RecruiterOS `ros-shell.js` `buildDrawer()` pattern).

### 2.4 Central Workspace — Dot-Grid Canvas

- Background: subtle dot-grid SVG pattern (dark dots on beige/ivory in light mode, light dots on dark in dark mode)
- The pattern creates the "workbench / craftsman" feel from `RecruiterOS.html`
- The active view renders inside `<div id="aos-stage">` with `overflow-y: auto` and `padding: 20px`
- The workspace should feel **spacious and uncrowded** — views render as self-contained panels, not full-bleed pages

### 2.5 Right Copilot Sidebar

- Default state: **hidden** (`display: none` / `transform: translateX(100%)`)  
- Toggled via: the `forum` icon in the topbar, OR the mic/voice button in the command bar  
- Content when open:
  - Header: "Admin Copilot" + green pulsing online dot + close button
  - Chat message history (`#aos-chat-msgs`)
  - Quick action pills: "System Health", "Find Driver #1234", "AI Cost Report", "Audit Log"
  - Input area: deep-inset bar with placeholder `"Message Admin Copilot..."` + microphone toggle icon (for voice mode) + blue send button
- Voice mode: clicking the mic icon transforms the input area into a large pulsing blue orb (active listening state), then collapses back on completion

### 2.6 Command Bar

- Fixed to bottom of screen, `z-index: 30`, sits **above** the dock
- `background: rgba(245,245,220,0.85)` in light mode + `backdrop-filter: blur(12px)` (glassmorphic)
- Row 1: quick chip buttons (`<button>` elements that dispatch chat messages)
  - "Run Diagnostics", "Audit AI Spend", "Find Carrier", "View Logs", "Feature Flags"
- Row 2: main chat input bar (`<input id="aos-cmd-input">`) + robot icon on left + send button on right

### 2.7 Floating Dock

- Centered pill, `position: fixed; bottom: 8px`
- Same neumorphic `.dock-pill` class from `recruiter-os.css`
- 5 items with `data-view` attributes: `home`, `observability`, `ai-router`, `drivers`, `carriers`
- Active state: highlighted with Solar Blue ring

---

## 3. Design Token Reference

All tokens are already defined in `AdminOS.html`'s inline `tailwind.config`. Reference:

| Token | Value | Usage |
|-------|-------|-------|
| `beige` | `#F5F5DC` | Light mode background |
| `beige-d` | `#E8E0C8` | Light mode surfaces |
| `tan` | `#C8B896` | Light mode shadows, muted text |
| `ivory` | `#FFFFF5` | Light mode highlights |
| `solar-base03` | `#002B36` | Dark mode background |
| `solar-base02` | `#073642` | Dark mode surfaces |
| `solar-blue` | `#268bd2` | Primary accent |
| `lmdr-blue` | `#2563eb` | Interactive accent |
| `lmdr-yellow` | `#fbbf24` | Warning / amber accent |

**Neumorphic CSS classes** (from `recruiter-os.css`, already linked in `AdminOS.html`):
- `.neu` — Standard raised card
- `.neu-s` — Small raised card
- `.neu-in` — Inset well
- `.neu-ins` — Inset search / input
- `.neu-x` — Close/x button
- `.ndot` — Notification dot
- `.dock-pill` — Floating dock container
- `.dk-i` — Dock icon item (with `.active` modifier)
- `.dk-tip` — Dock tooltip
- `.dk-badge` — Dock badge dot
- `.drawer-body` — Collapsible drawer body (height transitions)
- `.drawer-chev` — Drawer chevron (rotation on open)

**Theme classes on `<html>` element:**
- `class="light"` — Warm beige neumorphic
- `class="solar"` — Solarized warm
- `class="dark"` — Midnight dark (`solar-base03` bg)

---

## 4. File Structure (Final State)

```
src/public/admin/os/
├── AdminOS.html                 ← Main HTML shell (REWRITTEN — single source of truth)
├── css/
│   └── admin-os.css             ← AdminOS-specific overrides (dot-grid bg, left rail widths, etc.)
└── js/
    ├── aos-config.js            ← Tool registry & drawer config (EXISTS — extend as needed)
    ├── aos-bridge.js            ← PostMessage bridge with Wix Velo (EXISTS — do not modify)
    ├── aos-views.js             ← View lifecycle manager (EXISTS — extend as needed)
    ├── aos-shell.js             ← Layout builder (REWRITE to match final design)
    ├── aos-chat.js              ← NEW — Chat message logic (mirrors ros-chat.js)
    ├── aos-spotlight.js         ← NEW — ⌘K search spotlight (mirrors ros-spotlight.js)
    └── views/
        ├── aos-view-home.js          ← Dashboard (NEW — port from ADMIN_DASHBOARD.html)
        ├── aos-view-observability.js ← Observability (NEW — port from ADMIN_OBSERVABILITY.html)
        ├── aos-view-ai-router.js     ← AI Router (NEW — port from ADMIN_AI_ROUTER.html)
        ├── aos-view-drivers.js       ← Drivers (NEW — port from ADMIN_DRIVERS.html)
        ├── aos-view-carriers.js      ← Carriers (NEW — port from ADMIN_CARRIERS.html)
        ├── aos-view-matches.js       ← Matches (NEW — port from ADMIN_MATCHES.html)
        ├── aos-view-billing.js       ← Billing (NEW — port from ADMIN_BILLING_MANAGEMENT.html)
        ├── aos-view-content.js       ← Content (NEW — port from ADMIN_CONTENT.html)
        ├── aos-view-gamification.js  ← Gamification (NEW — port from ADMIN_GAMIFICATION_ANALYTICS.html)
        ├── [+ 35 more views for remaining tools — see plan.md Phase 4]
```

---

## 5. PostMessage Bridge Protocol

All communication with the Wix Velo page goes through `aos-bridge.js`. The pattern:

**AdminOS → Wix (outbound):**
```javascript
window.parent.postMessage({ action: 'AOS_ACTION', payload: { ... } }, '*');
```

**Wix → AdminOS (inbound):**
```javascript
window.addEventListener('message', (event) => {
  const { type, data } = event.data;
  // dispatch to AOS.views.handleMessage(type, data)
});
```

Existing `aos-bridge.js` already handles this. View modules call `AOS.bridge.send(action, payload)` and listen via `AOS.bridge.on(type, handler)`.

> ⛔ **REMINDER:** Every `AOS.bridge.send()` call MUST go to a real Wix Velo backend function. Do NOT intercept bridge calls with fake local responses. Do NOT add `if (!connected) return MOCK_DATA` fallbacks. If the bridge is not connected (e.g., testing outside Wix), the view should show a loading state indefinitely or display an "Offline — connect to Wix" message.

---

## 6. View Module Pattern

Every view module must follow this exact interface (matches `ros-views.js` pattern):

```javascript
// File: src/public/admin/os/js/views/aos-view-[name].js
(function() {
  'use strict';
  window.AOS = window.AOS || {};
  AOS.views = AOS.views || {};

  AOS.views['[view-id]'] = {
    // Called when the view is first loaded into #aos-stage
    mount(container) {
      container.innerHTML = renderHTML();
      bindEvents(container);
      loadData();
    },
    // Called when the view is navigated away from
    unmount(container) {
      // cleanup: clear timers, event listeners
    },
    // Called when a Wix postMessage arrives for this view
    handleMessage(type, data) {
      // update UI based on data response from Velo
    }
  };

  function renderHTML() { return `...`; }
  function bindEvents(container) { /* attach click handlers etc. */ }
  function loadData() {
    // Request data from Velo via AOS.bridge.send(...)
    AOS.bridge.send('AOS_GET_[DATA]', {});
  }
})();
```

---

## 7. Wix Page Code Integration

The Wix page that hosts AdminOS.html (as an HtmlComponent) must handle these postMessages:

| `action` (inbound from AdminOS) | Handler in Velo | Returns |
|---------------------------------|-----------------|---------|
| `AOS_GET_DASHBOARD_STATS` | `admin_dashboard_service.jsw` → `getDashboardOverview()` | `{drivers, carriers, matches, aiCost}` |
| `AOS_GET_DRIVERS` | `admin_service.jsw` → `getDriversList(filters, pagination)` | `{items, total}` |
| `AOS_GET_CARRIERS` | `admin_service.jsw` → `getCarriersList(filters)` | `{items, total}` |
| `AOS_GET_TRACES` | `observabilityService.jsw` → `getTraces(limit)` | `{traces}` |
| `AOS_GET_AI_PROVIDERS` | `aiRouterService.jsw` → `getProviders()` | `{providers}` |
| `AOS_GET_MATCHES` | `admin_match_service.jsw` → `getMatchStats()` | `{matches}` |
| `AOS_GET_BILLING` | `stripeService.jsw` → subscription data | `{subscriptions}` |
| `AOS_GET_GAMIFICATION` | `gamificationAnalyticsService.jsw` → `getEconomyHealthMetrics()` | `{economy}` |
| `AOS_CHAT_MESSAGE` | AI Router → agent response | `{response, intent}` |
