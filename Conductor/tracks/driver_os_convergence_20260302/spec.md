# Specification — DriverOS Mobile-First Convergence

**Track:** `driver_os_convergence_20260302`
**Priority:** Critical
**Status:** Planned
**Created:** 2026-03-02

---

## 1. Objective

Consolidate 19 fragmented driver HTML pages into a single **mobile-first** `DriverOS.html` shell with lazy-loaded CDN view modules, a unified postMessage bridge, context-aware AI companion, proactive push intelligence, and voice-on-every-surface — closing every gap identified in `driver-os-map.html`.

The aspirational architecture describes: **388 tools, LLM on every surface, zero dead zones**. Today's reality: 19 separate HTML files (many monolithic), 11 disconnected page code bridges, no unified shell, no proactive AI, no voice outside matching, and 8 pages with no CDN modules at all.

**Mobile-first is non-negotiable.** Drivers use phones while on the road. Every design decision flows from the iPhone 12/13 (390x844) viewport.

---

## 2. Gap Analysis — Aspirational vs. Current

### 2.1 Architecture Gaps

| Aspirational (driver-os-map.html) | Current State | Gap Severity |
|---|---|---|
| Single `DriverOS.html` bootloader (~90 lines) | 19 separate HTML files, largest 2,177 lines | **Critical** |
| `driver-os-config.js` — VIEW_REGISTRY (19), TOOL_REGISTRY (388), SESSION_CONTEXT | No unified config; `ai-matching-contract.js` covers matching only | **Critical** |
| `driver-os-bridge.js` — single postMessage bridge with streaming + proactive push | 11 separate bridge files, 2 different protocols (`action` vs `type`) | **Critical** |
| View Lifecycle Manager — lazy-loads 19 views, context bus | No VLM; each page mounts independently | **Critical** |
| `DRIVER_OS.nd0gp.js` — single page code with 60+ action handlers | Empty stub (10 lines of Wix boilerplate) | **Critical** |
| LMDR AI Overlay — chat FAB + voice orb on ALL views | `ai-matching-agent.js` only covers matching page | **High** |
| Proactive push — agent pushes insights without driver prompting | No proactive system exists | **High** |
| Voice on every surface via VAPI Web SDK | Voice only partially wired via agent overlay on matching | **High** |
| `action`-key protocol everywhere | Announcements + Policies use `type`-key protocol | **Medium** |
| DEV_MODE flags removed for production | `driverMatching.jsw` + `driverOutreach.jsw` have `DEV_MODE_BYPASS = true` | **Medium** |

### 2.2 Page-Level Gaps

| Page | Current State | Gap |
|---|---|---|
| `AI_MATCHING.html` (2,177 lines) | 10 CDN JS modules exist but shell is monolithic | Extract to thin shell + reuse existing modules |
| `DRIVER_DASHBOARD.html` (329 lines) | 4 CDN modules, moderate shell | Extract to view module |
| `DRIVER_MY_CAREER.html` (119 lines) | 2 CDN modules, missing render + config | Add render/config modules |
| `DRIVER_DOCUMENT_UPLOAD.html` (163 lines) | 4 CDN modules, good shell | Extract to view module |
| `DRIVER_SURVEYS.html` (51 lines) | Gold-standard thin shell, 4 CDN modules | Lift into VLM directly |
| `DRIVER_ROAD_UTILITIES.html` (618 lines) | 4 CDN modules but thick shell | Extract to view module |
| `DRIVER_GAMIFICATION.html` (807 lines) | **Zero CDN modules**, all inline | **Full extraction needed** |
| `DRIVER_BADGES.html` (659 lines) | **Zero CDN modules**, all inline | **Full extraction needed** |
| `CHALLENGES.html` (806 lines) | **Zero CDN modules**, all inline | **Full extraction needed** |
| `DRIVER_FORUMS.html` (588 lines) | **Zero CDN modules**, all inline | **Full extraction needed** |
| `DRIVER_ANNOUNCEMENTS.html` (113 lines) | 2 CDN modules, `type`-key protocol | Protocol fix + extract |
| `DRIVER_POLICIES.html` (137 lines) | 2 CDN modules, `type`-key protocol | Protocol fix + extract |
| `MENTOR_PROGRAM.html` (839 lines) | **Zero CDN modules**, dark mode default | **Full extraction needed** |
| `MENTOR_PROFILE.html` (521 lines) | **Zero CDN modules**, all inline | **Full extraction needed** |
| `PET_FRIENDLY.html` (306 lines) | **Zero CDN modules**, inline styles | **Full extraction needed** |
| `HEALTH_WELLNESS.html` (396 lines) | **Zero CDN modules**, uses marked.js | **Full extraction needed** |
| `Driver Opportunities.html` (791 lines) | **Zero CDN modules**, empty page code stub | **Full extraction needed** |
| `Driver Jobs.html` (1,698 lines) | **Zero CDN modules**, holiday animations | **Full extraction needed** |
| `Driver Retention.html` (250 lines) | 2 CDN modules (retention-bridge/logic) | Extract to view module |

**Summary: 8 of 19 pages have ZERO CDN modules — full extraction required.**

### 2.3 Mobile Gaps

| Issue | Impact |
|---|---|
| No unified bottom navigation | Drivers must use browser back/forward or Wix nav |
| No safe-area padding on most pages | Content hidden behind iPhone notch/home indicator |
| Gamification pages have `text-5xl` headings | Word-wrapping on 390px viewport |
| `AI_MATCHING.html` has complex hover effects | Performance lag on mobile, no touch equivalents |
| No thumb-zone priority | Primary actions not in thumb reach |
| No gesture navigation | Swipe-to-switch-view not available |
| Forums/mentorship pages have desktop-first grids | Horizontal overflow on mobile |

---

## 3. Mobile-First Design Principles

### 3.1 Inviolable Constraints (Apple HIG + Material Design 3 + WCAG 2.1)

Sources: [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/), [Material Design 3](https://m3.material.io/), [WebKit — Designing for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/), [WCAG 2.1 AAA](https://www.w3.org/WAI/WCAG21/quickref/)

| Constraint | Value | Rationale |
|---|---|---|
| Target viewport | 390 x 844px (iPhone 12-16, covers ~95% of iPhone market) | CSS pixel width for modern iPhones |
| Safe area top | `env(safe-area-inset-top)` ~47px | iPhone Dynamic Island / notch clearance |
| Safe area bottom | `env(safe-area-inset-bottom)` ~34px | Home indicator on all Face ID iPhones |
| Safe area left/right | `env(safe-area-inset-left/right)` | Landscape mode on notch devices |
| **Min touch target** | **48x48px** | Apple HIG = 44pt, Material Design 3 = 48dp. **We use 48px to satisfy both platforms.** Content within may be 24px with padding filling the rest. |
| **Min touch spacing** | **8px between targets** | Material Design minimum. Prevents accidental taps (rage taps). |
| Min body font | 16px (Inter) | Android default = 16px Roboto, iOS default = 17px SF Pro. 16px is safe floor. |
| Min input font | **16px (CRITICAL)** | Below 16px, iOS Safari auto-zooms on focus — user must manually zoom out. Non-negotiable. |
| Min secondary font | 13-14px | Captions, metadata, timestamps. Never below 13px. |
| Viewport meta | `width=device-width,initial-scale=1.0,viewport-fit=cover,user-scalable=yes` | `viewport-fit=cover` is **required** for `env()` safe-area values to work. `user-scalable=yes` for accessibility (Apple + WCAG require zoom capability). |
| Layout default | `grid-cols-1` (single column), `md:grid-cols-2` breakpoint | Mobile-first stacked layouts |
| Padding | `px-4` default (16px sides = 358px content on 390px), `md:px-8` breakup | |

**IMPORTANT change from previous plan:** Touch targets increased from 44px to **48px** to satisfy Material Design 3 (Android). Viewport meta changed from `user-scalable=no` to `user-scalable=yes` per Apple HIG and WCAG accessibility requirements.

### 3.1.1 Safe Area CSS Implementation (Critical for Notch Devices)

Source: [WebKit Blog](https://webkit.org/blog/7929/designing-websites-for-iphone-x/), [MDN env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

**Without `viewport-fit=cover`, all `env()` values return 0px.** This is the #1 mistake in mobile web apps.

Required CSS utilities in `driver-os.css`:
```
/* Safe area utilities */
.pt-safe { padding-top: env(safe-area-inset-top, 0px); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
.pl-safe { padding-left: env(safe-area-inset-left, 0px); }
.pr-safe { padding-right: env(safe-area-inset-right, 0px); }
```

**Fixed header gotcha:** Use `top: env(safe-area-inset-top, 0px)` NOT `top: 0`. Without this, the header slides behind the notch on scroll.

**Fixed bottom nav:** Height must be `calc(56px + env(safe-area-inset-bottom, 0px))`. On iPhone 12+, effective height = 90px (56 + 34).

**Content area:** Must have `padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px))` so content is never hidden behind the nav.

**Full-width backgrounds:** Let them extend under safe areas (don't add safe-area padding to background elements — only to content/interactive elements).

### 3.1.2 Platform-Specific Differences

| Aspect | iOS (Apple HIG) | Android (Material 3) | Our Decision |
|---|---|---|---|
| Touch target | 44pt (44px CSS) | 48dp (48px CSS) | **48px** (satisfies both) |
| Touch spacing | 10px recommended | 8dp minimum | **8px** minimum |
| Body font | 17px SF Pro (default) | 16px Roboto (default) | **16px** Inter (safe for both) |
| Bottom nav height | No standard (varies) | 80dp with labels | **56px + safe-area** (compact for mobile, labels below icons) |
| System gesture zones | Bottom swipe = home | Bottom swipe = home (gesture nav) / back (3-button) | Bottom nav sits above gesture zone via `pb-safe` |
| Notch/cutout handling | `env(safe-area-inset-*)` | `env(safe-area-inset-*)` (Chrome 69+) | `env()` with fallback `0px` |
| Zoom behavior | Pinch zoom required by HIG | Pinch zoom expected | `user-scalable=yes` |
| Input focus zoom | Auto-zoom if font < 16px | No auto-zoom | **16px minimum on all inputs** |

### 3.2 Bottom Navigation Bar

The DriverOS shell has a **persistent bottom nav** with 5 zones mapped to the 8 view clusters:

```
┌─────────────────────────────────────┐
│                                     │
│         [Active View Content]       │
│                                     │
├─────┬─────┬─────┬─────┬────────────┤
│ 🔍  │ 📊  │ 🎮  │ 🛣️  │    💬     │  44px tall, pb-safe
│Match│Career│Play │Road │   Agent   │
└─────┴─────┴─────┴─────┴────────────┘
```

| Zone | Icon (Material) | View Cluster | Views |
|------|-----------------|--------------|-------|
| Match | `search` | Discovery & Matching | matching, opportunities, jobs |
| Career | `dashboard` | Career & Profile | dashboard, career, documents |
| Play | `emoji_events` | Gamification | gamification, badges, challenges |
| Road | `directions_car` | Road & Wellness | road, health, pet-friendly |
| Agent | `smart_toy` | AI Companion | Opens chat overlay (not a view) |

**Community** (forums, announcements, surveys), **Compliance** (policies), **Mentorship** (mentors, mentor-profile), and **Retention** views are accessed via a **swipe-up drawer** from the bottom nav or through the AI agent ("show me forums").

### 3.3 View Switching

- **Tap** a bottom nav icon: VLM mounts the default view in that cluster
- **Swipe left/right** within a cluster: navigates between sibling views
- **Pull down** on any view: refreshes data
- **Swipe up** from bottom nav: opens secondary nav drawer (community, compliance, mentorship, retention)

### 3.4 Agent FAB Position

The LMDR AI overlay FAB sits at **bottom-right, 16px above the bottom nav bar**, so it is always accessible but never overlaps nav. On chat open, the panel slides up from the bottom as a full-height sheet (mobile) or side panel (tablet+).

### 3.5 Touch-Optimized Components

| Component | Mobile Adaptation |
|---|---|
| Carrier cards (matching) | Full-width stacked, expand on tap (no hover), 48px action buttons |
| Gamification XP bar | Horizontal progress bar spanning full width |
| Badge grid | 2-column grid with 48px touch targets, 8px gap |
| Forum threads | Full-width list items, swipe actions, 48px tap zones |
| Road map | Full-viewport Leaflet with gesture zoom |
| Survey questions | Full-width rating stars (48px each, 8px spacing) |
| Document upload | Full-width drop zones, camera capture button (48px) |
| Bottom nav icons | 48px touch zone per icon, 10px label below |
| Agent FAB | 52px diameter (above 48px minimum), raised shadow |
| Input fields | `h-12` (48px), `text-base` (16px), full-width |

---

## 4. Architecture Decisions

### 4.0 Facade Import Pattern (MANDATORY — Learned from RecruiterOS)

**This is the single most important technical lesson from the RecruiterOS convergence. Violating it caused a 2-hour debugging session with zero error messages.**

#### The Problem

The Wix page bundler silently crashes when page code (`src/pages/*.js`) has:
1. **40+ direct backend imports** — the bundler chokes on the import graph
2. **Any import from `backend/*.js` (non-`.jsw`)** — `.js` files get bundled **client-side** instead of resolving server-side. Large files like `configData.js` (1,384 lines) kill the bundler silently.

When it crashes: `$w.onReady` **never fires**. Zero console errors. Zero network errors. The page is completely dead — the HTML component bridge never connects.

#### The Fix: Single Facade `.jsw` File

Every OS page code must import from **exactly one facade `.jsw` file** that re-exports all needed backend functions:

```
// BAD — killed RecruiterOS for 2 hours, zero error messages
import { findMatches } from 'backend/driverMatching.jsw';
import { getPlayerState } from 'backend/gamificationService.jsw';
import { FEATURE_FLAGS } from 'backend/configData';        // ← THIS ONE IS FATAL
import { getResourcesByCategory } from 'backend/healthService.jsw';
// ... 35 more imports → bundler silently dies

// GOOD — proven pattern from both RecruiterOS and AI Matching
import {
  rosFindMatches,
  rosGetPlayerState,
  rosGetFeatureFlags,
  rosGetHealthResources
  // ... all 60+ methods from ONE file
} from 'backend/driverOSFacade.jsw';
```

The facade `.jsw` file imports from individual services server-side (where import count doesn't matter) and re-exports thin async wrappers:

```
// src/backend/driverOSFacade.jsw
import { findMatches } from 'backend/driverMatching.jsw';
import { FEATURE_FLAGS } from 'backend/configData';  // ← Safe here (.jsw resolves server-side)

export function dosFindMatches(prefs) { return findMatches(prefs); }
export function dosGetFeatureFlags() { return FEATURE_FLAGS; }
```

#### Enforcement

The hook `enforce-jsw-facade-imports.ps1` blocks any Write/Edit to page code that imports from `backend/*.js` (non-`.jsw`). This hook was created specifically after the RecruiterOS incident and is active in `.claude/settings.local.json`.

#### Key File to Create: `src/backend/driverOSFacade.jsw`

This file is a **Wave 4 prerequisite**. It must be created before any page code wiring begins. Expected size: ~200-300 lines (importing from ~29 backend services, re-exporting ~60+ thin wrappers).

### 4.1 Contract-First (Wave 1 is prerequisite)

Wave 2 cannot start until `driver-os-contract.js` is frozen. Every message type is defined in the contract first, then implemented.

**Pattern:** `DOS.CONTRACT` object with `inbound` and `outbound` dictionaries, each action listing `required` and `optional` fields. A `validate(direction, action, payload)` method enforces schema at runtime.

Full registry: 60+ inbound actions, 60+ outbound responses. See `bridge_inventory.md` for the complete matrix.

### 4.2 View Lifecycle Manager (VLM)

`driver-os-core.js` exposes `DOS.views`:
- `mount(viewId)` — lazy-loads CDN module for that view, calls `viewModule.mount(root)`
- `unmount()` — calls `viewModule.unmount()` for cleanup
- `getViewSnapshot()` — returns current view state for agent context
- View modules are cached after first load (no re-download on revisit)
- Every mount triggers `DOS.bridge.send('viewChanged', { viewId })` for analytics/agent context

### 4.3 Mobile Bottom Navigation

`DOS.nav` renders a fixed-bottom nav bar:
- 56px total height (44px touch zone + 12px label)
- `pb-safe` for home indicator clearance
- Each zone button uses Material Symbols Outlined icon + 10px label
- Active state: `text-lmdr-blue`, inactive: `text-slate-400`
- Agent zone opens overlay instead of mounting a view

All buttons are created via `document.createElement` with `textContent` and class assignment (no innerHTML). Icons use `<span class="material-symbols-outlined">` elements.

### 4.4 Proactive Push System

`dos-proactive.js` fires 2s after dashboard mount (non-blocking). Sends `getProactiveInsights` with driver context. Renders 2-3 insight cards as DOM elements above NBA chips. Skeleton loader during wait, section hidden if no response within 8s.

### 4.5 NBA Chip System (Driver-Specific)

`dos-nba.js` has a 6-chip registry:
1. `new-matches` — new carrier matches since last visit
2. `streak-risk` — login streak at risk (approaching midnight)
3. `doc-expiring` — documents expiring within 30 days
4. `market-hot` — market condition is HOT (driver demand high)
5. `who-viewed` — carriers viewed driver's profile
6. `app-update` — pending application status changes

Evaluates on dashboard mount. Max 3 chips shown. Each chip is dismissible (session-persisted). Tapping a chip navigates to the relevant view.

### 4.6 Context-Aware Agent

Every `agentMessage` sent from `driver-agent.js` includes:
```
{
  text: "user message",
  context: {
    currentView: DOS.views.current,
    viewData: DOS.views.getViewSnapshot(),
    driverId: DOS.config.SESSION_CONTEXT.driverId,
    marketCondition: DOS.market?.condition
  }
}
```

Page code passes this full context to `agentService.handleAgentTurn('driver', userId, text, context)`.

---

## 5. Goals

### 5.1 Primary Goals

- Single `DriverOS.html` shell replaces all 19 separate HTML pages.
- Mobile-first: no horizontal scroll, no text < 14px, no touch targets < 44px on 390px viewport.
- Bottom nav with 5 zones — every view reachable in 2 taps max.
- All 19 views mount via VLM with real backend data (no stubs).
- Unified `action`-key protocol across all views (Announcements + Policies migrated from `type`-key).
- LMDR Agent FAB visible on all views, context-aware (sends currentView + viewData).
- Voice orb available on matching, dashboard, and road views.
- NBA chips render on dashboard (max 3, dismissible, driver-specific).
- Market signals (HOT/SOFT/NEUTRAL) visible on matching and dashboard.
- Proactive insights render on dashboard within 4s.
- `DEV_MODE_BYPASS` flags removed from `driverMatching.jsw` and `driverOutreach.jsw`.
- Evidence Pack passes across 5 critical paths.

### 5.2 Non-Goals

- No new Wix pages created — `DRIVER_OS` page already exists in Wix.
- No redesign of any existing view's content or visual language.
- No changes to backend service logic — only calling them from the new unified bridge.
- No Railway microservice changes.
- No changes to recruiter, admin, carrier, or B2B surfaces.
- No auth gating (per project convention — Wix handles auth via Editor settings).
- Existing 19 HTML files are **not deleted** — they remain for backward compatibility during migration. Deprecation happens in a follow-up track.

---

## 6. Wave Structure

### Wave 1 — Contract & Bridge Inventory (1 dev: J1)

**Prerequisite for all other waves.**

Tasks:
1. Audit all 11 existing driver bridge files (list every sendToVelo/postMessage call)
2. Audit all existing page code files (list every case/handler)
3. Create `driver-os-contract.js` — canonical inbound + outbound message registry (60+ actions)
4. Create `bridge_inventory.md` — full matrix with `wired` status column
5. Identify protocol mismatches (Announcements/Policies use `type` instead of `action`)
6. Create `driverOsContract.test.js`
7. Commit: `feat(driver-os): wave 1 — contract foundation + bridge inventory`

---

### Wave 2 — Mobile Shell + Core CDN Modules (2 devs: J2, J3)

**Starts after Wave 1 is merged.**

**J2 tasks (Shell + Config + CSS):**
1. Create `DriverOS.html` — thin bootloader shell (~90 lines), LMDR branding
   - iPhone viewport meta (no-scale, viewport-fit=cover)
   - Safe-area padding utilities (`.pt-safe`, `.pb-safe`)
   - Inter font + Material Symbols
   - Tailwind CDN with LMDR inline config
   - CDN script tags for 5 core modules + 4 intelligence modules
   - `<div id="app-root">` + `<nav id="bottom-nav">` + `<div id="agent-overlay">`
   - DOMContentLoaded bootstrap: `DOS.init()`
2. Create `driver-os-config.js`:
   - `VIEW_REGISTRY` — 19 view IDs mapped to CDN module URLs
   - `NAV_ZONES` — 5 bottom nav zone definitions
   - `SESSION_CONTEXT` — driver ID, carrier context, active workflow
   - `FEATURE_FLAGS` — `voice_enabled`, `proactive_push`, `nba_enabled` per view
3. Create `driver-os.css`:
   - Safe-area utilities
   - Bottom nav styles (56px height, pb-safe, shadow)
   - View transition animations (slide-in-left, slide-in-right, fade)
   - Agent FAB positioning (above bottom nav)
   - Active/inactive nav icon states
4. Create `dos-mobile.css`:
   - Responsive breakpoints (`@media (min-width: 768px)` for tablet)
   - Full-width card styles
   - Touch-optimized form elements (h-12, text-base)
   - Thumb-zone priority positioning
   - Pull-to-refresh visual feedback
5. Commit: `feat(driver-os): wave 2a — mobile shell + config + CSS`

**J3 tasks (Bridge + VLM):**
1. Create `driver-os-bridge.js`:
   - Central postMessage hub (`DOS.bridge`)
   - Validates against `DOS.CONTRACT` on send/receive
   - Routes inbound responses to active view module
   - Proactive push receiver (agent-initiated messages)
   - Streaming response handler for real-time agent output
   - Error envelope pattern with user-friendly fallback
2. Create `driver-os-core.js`:
   - `DOS.views` — View Lifecycle Manager (mount, unmount, lazy-load, context bus)
   - `DOS.nav` — bottom nav renderer with active-state management
   - `DOS.init()` — bootstrap sequence (config -> bridge -> nav -> mount default view)
   - Gesture handlers: swipe left/right for sibling view navigation
   - Pull-to-refresh hook on all views
3. Create `driverOsShell.test.js` — tests for shell bootstrap, VLM mount/unmount, nav rendering
4. Commit: `feat(driver-os): wave 2b — bridge + VLM + gesture nav`

**GATE 1 after Wave 2** (see metadata.json for criteria)

---

### Wave 3 — View Module Extraction (3 devs: J4, J5, J6)

**Starts after Gate 1 sign-off.**

Each view module follows this interface:
```
DOS.viewModules[viewId] = {
  mount(root)      -- Build mobile-first DOM, fetch data via DOS.bridge.send()
  unmount()        -- Cleanup listeners, abort pending fetches
  onMessage(a, p)  -- Handle bridge responses
  getSnapshot()    -- Return current state for agent context
}
```

**J4 tasks (Discovery + Career cluster — 6 views):**
1. `dos-view-matching.js` — Extract from AI_MATCHING + 10 existing CDN modules
   - Reuse ai-matching-state/helpers/renderers/results/accordion/modals modules
   - Replace monolithic HTML with VLM-compatible mount/unmount
   - Mobile: full-width carrier cards, tap-to-expand (no hover)
2. `dos-view-opportunities.js` — Extract from Driver Opportunities
   - Mobile: stacked job cards, filter chips at top
3. `dos-view-jobs.js` — Extract from Driver Jobs
   - Mobile: single-column job detail, sticky apply button
4. `dos-view-dashboard.js` — Extract from DRIVER_DASHBOARD + 4 CDN modules
   - Reuse existing driver-dashboard-* modules
   - Mobile: stacked KPI cards, full-width application list
5. `dos-view-career.js` — Extract from DRIVER_MY_CAREER + 2 CDN modules
   - Mobile: timeline as vertical list, profile strength as horizontal bar
6. `dos-view-documents.js` — Extract from DRIVER_DOCUMENT_UPLOAD + 4 CDN modules
   - Mobile: camera capture prominent, drag-drop de-emphasized
7. Commit: `feat(driver-os): wave 3a — discovery + career views (6 modules)`

**J5 tasks (Gamification + Community cluster — 6 views):**
1. `dos-view-gamification.js` — FULL EXTRACTION from DRIVER_GAMIFICATION (807 lines inline)
   - Mobile: XP bar full-width, tier badge centered, event feed as scrollable list
2. `dos-view-badges.js` — FULL EXTRACTION from DRIVER_BADGES (659 lines)
   - Mobile: 2-column badge grid with 44px targets
3. `dos-view-challenges.js` — FULL EXTRACTION from CHALLENGES (806 lines)
   - Mobile: tab pills (Active/Completed), full-width challenge cards
4. `dos-view-forums.js` — FULL EXTRACTION from DRIVER_FORUMS (588 lines)
   - Mobile: full-width thread list, swipe to upvote
   - Include marked.js for markdown rendering
5. `dos-view-announcements.js` — Extract from DRIVER_ANNOUNCEMENTS + 2 CDN modules
   - MIGRATE from `type`-key to `action`-key protocol
6. `dos-view-surveys.js` — Lift from DRIVER_SURVEYS (already thin shell, 4 CDN modules)
   - Mobile: full-width rating stars (44px each)
7. Commit: `feat(driver-os): wave 3b — gamification + community views (6 modules)`

**J6 tasks (Road + Compliance + Mentorship + Retention — 7 views):**
1. `dos-view-road.js` — Extract from DRIVER_ROAD_UTILITIES + 4 CDN modules
   - Mobile: full-viewport Leaflet map, gesture zoom, bottom sheet for results
2. `dos-view-health.js` — FULL EXTRACTION from HEALTH_WELLNESS (396 lines)
   - Mobile: category tabs as horizontal scroll pills, tip cards full-width
3. `dos-view-pet-friendly.js` — FULL EXTRACTION from PET_FRIENDLY (306 lines)
   - Mobile: list view with distance badges, tap for detail
4. `dos-view-policies.js` — Extract from DRIVER_POLICIES + 2 CDN modules
   - MIGRATE from `type`-key to `action`-key protocol
   - Mobile: full-width policy cards, signature pad full-width
5. `dos-view-mentors.js` — FULL EXTRACTION from MENTOR_PROGRAM (839 lines)
   - Mobile: mentor cards stacked, filter by CDL class
6. `dos-view-mentor-profile.js` — FULL EXTRACTION from MENTOR_PROFILE (521 lines)
   - Mobile: profile header + availability calendar
7. `dos-view-retention.js` — Extract from Driver Retention + 2 CDN modules
   - Mobile: retention framework as accordion sections
8. Commit: `feat(driver-os): wave 3c — road + compliance + mentorship + retention (7 modules)`

**GATE 2 after Wave 3** (see metadata.json for criteria)

---

### Wave 4 — Unified Page Code Bridge (2 devs: J7, J1)

**Starts after Gate 2 sign-off.**

**J7 tasks (Page code wiring — 60+ action handlers):**
1. Wire `DRIVER_OS.nd0gp.js` as the single Wix page code:
   - HTML component discovery (`#html1`..`#html5`, `#htmlEmbed1`)
   - `component.onMessage(async (event) => routeMessage(component, event?.data))`
   - `safeSend(component, { action, payload })` helper with try-catch
   - `switch(message.action)` router with 60+ case branches grouped by cluster:
     - Discovery & Matching (12 actions)
     - Career & Profile (10 actions)
     - Gamification (8 actions)
     - Community (8 actions)
     - Road & Wellness (8 actions)
     - Compliance (3 actions)
     - Agent + Voice (4 actions)
     - Market + NBA (2 actions)
     - Navigation (1 action)
2. Import all required backend service functions
3. Context threading: pass driverId, carrier context, currentView to ALL service calls
4. Commit: `feat(driver-os): wave 4a — unified page code with 60+ action handlers`

**J1 tasks (DEV_MODE cleanup + integration test):**
1. Remove `DEV_MODE_BYPASS_ROLES = true` from `driverMatching.jsw`
2. Remove `DEV_MODE_BYPASS_CARRIER = true` from `driverOutreach.jsw`
3. Update `bridge_inventory.md` — mark all 60+ actions as `wired: true`
4. Create `driverOsViews.test.js` — smoke test for all 19 views mounting via VLM
5. Commit: `fix(driver-os): wave 4b — remove DEV_MODE flags + view smoke tests`

---

### Wave 5 — Intelligence Layer (3 devs: J2, J3, J4)

**Starts after Wave 4 merge.**

**J2 tasks (LMDR Agent + Voice):**
1. Create `driver-agent.js`:
   - Floating "LM" FAB (LMDR branding) — positioned bottom-[72px] right-4 (above bottom nav)
   - Sliding chat panel — mobile: full-screen bottom sheet; tablet: right side panel
   - Context-aware: sends currentView + viewData + marketCondition with every agentMessage
   - Voice orb integration — VAPI Web SDK, hands-free toggle
   - Proactive insight cards pushed to chat panel without driver prompting
2. Add agent + voice handlers to DRIVER_OS page code (if not already in Wave 4)
3. Commit: `feat(driver-os): wave 5a — LMDR agent overlay + voice on every surface`

**J3 tasks (NBA chips + Market signals):**
1. Create `dos-nba.js` — chip registry (6 driver-specific chip types), evaluate(), render()
2. Create `dos-market.js`:
   - Sends `getMarketSignals` on shell load
   - Exposes `DOS.market.condition` for agent context
   - Renders condition pill in dashboard + matching view headers
   - HOT = red/amber, SOFT = blue, NEUTRAL = gray
3. Wire NBA chip refresh to dashboard view mount
4. Add `getMarketSignals` handler in page code calling `marketSignalsService.getMarketContext()`
5. Create `driverOsNBA.test.js`
6. Commit: `feat(driver-os): wave 5b — NBA chips + market signals ticker`

**J4 tasks (Proactive AI + Memory):**
1. Create `dos-proactive.js`:
   - On dashboard mount (2s delay), sends `getProactiveInsights`
   - Renders 2-3 insight bullets as cards above NBA chips
   - Skeleton loader while waiting, hidden if no response in 8s
2. Create `dos-memory.js`:
   - On chat panel open, sends `getAgentMemory`
   - Renders "Previous sessions" collapsed accordion if memory exists
   - Hidden gracefully if no memory (hasMemory: false)
3. Wire handlers in page code for `getProactiveInsights` and `getAgentMemory`
4. Create `driverOsMobile.test.js` — viewport tests, touch target validation
5. Commit: `feat(driver-os): wave 5c — proactive AI push + conversation memory`

**GATE 3 after Wave 5** (see metadata.json for criteria)

---

### Wave 6 — Evidence Pack + Mobile Hardening (1 dev: J5)

**Starts after Gate 3 sign-off. Final gate.**

Tasks:
1. Run `claude --agent evidence-pack` targeting DriverOS across 5 critical paths:
   - Dashboard loads with NBA chips + market ticker + proactive insights
   - Carrier matching search returns results with enrichment cards
   - Gamification XP hub renders with real data
   - Agent chat responds with view-aware context
   - Road utilities map loads with geolocation
2. Mobile viewport audit (390px):
   - No horizontal scrollbar on any view
   - All text >= 14px
   - All touch targets >= 44px
   - Bottom nav visible and functional
   - Safe-area padding correct
   - Thumb-zone: primary actions reachable with one-hand grip
3. Performance budget check:
   - Shell load < 2s on 3G throttle
   - View switch < 500ms (lazy-load from CDN cache)
   - Agent response < 3s
4. Fix any P0 console errors found
5. Attach `verification_run` ID to `metadata.json`
6. CDN purge all new files
7. Mark track DONE
8. Commit: `chore(driver-os): wave 6 — evidence pack pass + mobile hardening`

---

## 7. CDN Purge Template (after each wave sync)

```bash
# Core modules
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/driver-os-config.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/driver-os-bridge.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/driver-os-core.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/driver-os-contract.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/driver-agent.js"

# CSS
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/css/driver-os.css"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/css/dos-views.css"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/css/dos-mobile.css"

# Intelligence
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/dos-nba.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/dos-market.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/dos-proactive.js"
curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/dos-memory.js"

# Views (19 modules)
for view in matching opportunities jobs dashboard career documents gamification badges challenges forums announcements surveys road health pet-friendly policies mentors mentor-profile retention; do
  curl -s "https://purge.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/views/dos-view-${view}.js"
done
```

---

## 8. Acceptance Criteria

### 8.1 Mobile-First (Apple HIG + Material Design 3 Compliant)

- **Zero horizontal scroll** on 390px viewport across all 19 views.
- All touch targets >= **48x48px** (Material Design 3 standard, exceeds Apple 44pt).
- All touch target spacing >= **8px** (prevents rage taps / accidental taps).
- All input fonts >= **16px** (prevents iOS Safari auto-zoom on focus).
- All body text >= **16px**, secondary text >= **13px**.
- Bottom nav renders with **pb-safe** padding (`env(safe-area-inset-bottom)`).
- Header uses `top: env(safe-area-inset-top)` (not `top: 0`) to avoid notch occlusion.
- Left/right safe areas respected in landscape (`env(safe-area-inset-left/right)`).
- Primary actions are in the **thumb zone** (lower 40% of screen).
- No hover-dependent interactions — everything is tap/swipe.
- `user-scalable=yes` in viewport meta (Apple HIG + WCAG accessibility requirement).
- `viewport-fit=cover` in viewport meta (required for `env()` to return non-zero values).

### 8.2 Shell Consolidation

- `DriverOS.html` is <= 100 lines.
- All 19 views lazy-load via VLM from CDN.
- Shell loads in < 2s on 3G throttle.
- Bottom nav renders 5 zones with correct active states.

### 8.3 View Completeness

- All 19 views mount and render real backend data.
- Bridge inventory shows `wired: true` for all 60+ actions.
- All views use `action`-key protocol (zero `type`-key messages).
- Loading states show while data is in-flight.

### 8.4 Intelligence

- LMDR Agent FAB visible on all views (bottom-right, above nav).
- Agent receives `currentView` + `viewData` + `marketCondition` on every message.
- NBA chips render on dashboard (max 3, dismissible).
- Market condition pill visible on matching + dashboard.
- Proactive insights appear on dashboard within 4s.
- Voice orb functional on matching, dashboard, road views.

### 8.5 Evidence Pack

- `quality_gate.json: { "pass": true }` across 5 critical paths.
- Zero P0 console errors.
- Zero HTTP 500s on LMDR endpoints.
- All 5 screenshots non-blank and showing expected content.

---

## 9. Risk Summary

See `risk_register.md` for full details. Top risks:

1. **Monolithic extraction complexity** — 8 pages have zero CDN modules and must be fully extracted. AI_MATCHING at 2,177 lines is the largest single extraction. Mitigation: AI_MATCHING already has 10 CDN modules; the view module wraps them rather than rewriting.

2. **Protocol migration breakage** — Announcements + Policies use `type`-key. Changing to `action`-key could break if any external system sends the old format. Mitigation: adapter layer in bridge that translates `type` to `action` for backward compatibility.

3. **Bottom nav occlusion** — Fixed bottom nav may hide content on short viewports. Mitigation: `padding-bottom: calc(56px + env(safe-area-inset-bottom))` on `#app-root`.

4. **Leaflet map in VLM** — Road utilities map requires special lifecycle handling (resize events, tile loading). Mitigation: `dos-view-road.js` hooks into VLM mount/unmount for proper Leaflet `invalidateSize()`.

5. **CDN cache staleness** — After each wave, stale CDN files could cause version mismatch between shell and view modules. Mitigation: purge template runs after every `git push`.

6. **DEV_MODE flag removal** — removing bypass flags may break functionality if the auth/role system is not ready. Mitigation: test with real driver accounts before removing flags; keep a revert branch.
