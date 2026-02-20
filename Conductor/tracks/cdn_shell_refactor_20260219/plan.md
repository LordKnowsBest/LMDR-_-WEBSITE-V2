# CDN Shell Pattern Refactor — All HTML Pages

> **STATUS: PLANNED** — 103 legacy/monolithic HTML files to refactor
>
> **Last Updated**: 2026-02-19
>
> **Audit Summary**:
> - 140 total HTML files scanned
> - 14 compliant (10%), 19 partial (14%), 103 legacy/monolithic (74%)
> - 102 files exceed 80-line single inline `<script>` block limit
> - 89 files exceed 150-line total inline JS limit
> - 28 files use relative paths instead of absolute CDN URLs
> - Gold standard: `recruiter/os/RecruiterOS.html` (104 lines, 28 CDN modules)

---

## CDN Shell Pattern Requirements (from CLAUDE.md)

Every compliant HTML file must satisfy:

| Rule | Limit |
|------|-------|
| Total HTML file | < 200 lines (250 max with justification) |
| Single inline `<script>` block | 80 lines max |
| Total inline JS across all blocks | 150 lines max |
| CDN modules | >= 1 external `<script src>` via jsDelivr |
| Relative paths | 0 (`../`, `./` forbidden) |
| Tailwind config | Inline in `<head>`, NOT external `lmdr-config.js` |
| Module load order | config -> bridge -> render -> logic -> views |
| Bootstrap block | < 10 lines in `DOMContentLoaded` |

**CDN URL Pattern:**
```
https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/<surface>/js/<module>.js
```

---

## Phase 1 — Truck Driver Page (Pilot)

> Goal: Refactor `Truck_Driver_Page.html` from 1,240-line monolith to CDN shell pattern. This page is the pilot — establishes the landing page refactoring template.

### Current State

| Metric | Value | Limit | Status |
|--------|-------|-------|--------|
| Total lines | 1,240 | < 200 | FAIL |
| Inline CSS | 386 lines | 0 (external) | FAIL |
| Inline JS (GSAP) | 81 lines | 80 max | FAIL |
| Inline JS (App) | 268 lines | 80 max | FAIL |
| Total inline JS | 349 lines | 150 max | FAIL |
| CDN modules | 0 | >= 1 | FAIL |
| Relative paths | 0 | 0 | PASS |

### Target Structure

```
src/public/landing/
├── Truck_Driver_Page.html              (~120 lines — shell only)
├── css/
│   └── truck-driver.css                (~390 lines — all styles)
└── js/
    ├── truck-driver-config.js          (~30 lines — constants, weight defaults, message registry)
    ├── truck-driver-bridge.js          (~40 lines — sendToWix, message listener, pageReady)
    ├── truck-driver-render.js          (~80 lines — renderMatches, showResults, showLoading, hideLoading)
    ├── truck-driver-logic.js           (~120 lines — form submit, weight UI, reset, interest handler)
    └── truck-driver-animations.js      (~80 lines — GSAP ScrollTrigger setup)
```

### Tasks

- [ ] **1.1** Create `src/public/landing/css/truck-driver.css`
  - Extract all inline `<style>` content (lines 49-435) into this file
  - Keep CSS custom properties (`:root` variables) at the top
  - Organize sections: variables, core, form, loading, results, match-cards, modal, animations

- [ ] **1.2** Create `src/public/landing/js/truck-driver-config.js`
  - Export constants: `MESSAGE_REGISTRY`, `WEIGHT_DEFAULTS`, `WEIGHT_LABELS`
  - Export DOM selector IDs as constants
  - No dependencies

- [ ] **1.3** Create `src/public/landing/js/truck-driver-bridge.js`
  - `sendToWix(action, data)` function
  - `window.addEventListener('message', ...)` listener for `matchResults` and `matchError`
  - `pageReady` signal on init
  - Depends on: config

- [ ] **1.4** Create `src/public/landing/js/truck-driver-render.js`
  - `showLoading()` — step animation with timeouts
  - `hideLoading()` — remove active class
  - `showResults(data)` — populate results section
  - `renderMatches(matches)` — build match card HTML
  - Depends on: config

- [ ] **1.5** Create `src/public/landing/js/truck-driver-logic.js`
  - Form submit handler with preference collection
  - Advanced priorities toggle and weight slider UI
  - Reset button handler
  - `window.handleInterest(btn)` — interest modal + sendToWix
  - Modal close handler
  - Depends on: config, bridge, render

- [ ] **1.6** Create `src/public/landing/js/truck-driver-animations.js`
  - GSAP `ScrollTrigger` registration
  - All scroll-triggered animations: stats, fade-ups, steps, benefits, slide-ins
  - Depends on: GSAP CDN (loaded in HTML head)

- [ ] **1.7** Rewrite `Truck_Driver_Page.html` as thin shell
  - Keep: `<head>` meta, Tailwind CDN + inline config, font/icon links, GSAP CDN links
  - Replace `<style>` block with CDN `<link>` to `truck-driver.css`
  - Replace both `<script>` blocks with CDN `<script src>` tags
  - Add `DOMContentLoaded` bootstrap (< 10 lines): `TruckDriverApp.init()`
  - Target: ~120 lines total

- [ ] **1.8** Verify in Wix iframe
  - Confirm form submission sends `findMatches` postMessage
  - Confirm match results render correctly
  - Confirm interest modal works
  - Confirm GSAP scroll animations fire
  - Confirm 4-second fallback redirect to `/ai-matching` works

- [ ] **1.9** Purge jsDelivr CDN cache
  - Purge all 7 new CDN URLs after git push

**Acceptance Criteria (Phase 1):**
- [ ] `Truck_Driver_Page.html` < 150 lines
- [ ] Zero inline `<style>` blocks (all in external CSS)
- [ ] Zero inline `<script>` blocks > 10 lines
- [ ] 6 CDN module references (1 CSS + 5 JS)
- [ ] All functionality preserved (form, matching, results, modal, animations)
- [ ] No relative paths

---

## Phase 2 — Critical Severity (Top 10 Monoliths)

> Goal: Refactor the 10 largest monolithic HTML files (>1,000 lines inline JS)

### Files (ordered by severity)

| # | File | Lines | Inline JS | Surface |
|---|------|-------|-----------|---------|
| 1 | `driver/DRIVER_ROAD_UTILITIES.html` | 2,970 | 2,045 | driver |
| 2 | `recruiter/RecruiterDashboard.html` | 2,916 | 1,644 | recruiter |
| 3 | `admin/ADMIN_DASHBOARD.html` | 2,723 | 1,620 | admin |
| 4 | `recruiter/RECRUITER_DRIVER_SEARCH.html` | 2,621 | 1,209 | recruiter |
| 5 | `admin/ADMIN_DRIVERS.html` | 1,745 | 1,007 | admin |
| 6 | `admin/ADMIN_OBSERVABILITY.html` | 1,620 | 1,001 | admin |
| 7 | `admin/ADMIN_CARRIERS.html` | 1,643 | 918 | admin |
| 8 | `admin/ADMIN_AUDIT_LOG.html` | 1,388 | 897 | admin |
| 9 | `recruiter/RECRUITER_ONBOARDING_DASHBOARD.html` | 1,397 | 872 | recruiter |
| 10 | `driver/DRIVER_DASHBOARD.html` | 1,387 | 854 | driver |

### Tasks

- [ ] **2.1** Refactor `DRIVER_ROAD_UTILITIES.html` (2,970 lines -> ~120 shell)
  - Extract to `driver/js/road-utilities-{config,bridge,render,logic}.js`
  - Extract to `driver/css/road-utilities.css`
- [ ] **2.2** Refactor `RecruiterDashboard.html` (2,916 lines -> ~120 shell)
  - Extract to `recruiter/js/dashboard-{config,bridge,render,logic}.js`
  - Extract to `recruiter/css/dashboard.css`
  - Fix 2 relative path references
- [ ] **2.3** Refactor `ADMIN_DASHBOARD.html` (2,723 lines -> ~120 shell)
  - Extract to `admin/js/dashboard-{config,bridge,render,logic}.js`
  - Extract to `admin/css/dashboard.css`
- [ ] **2.4** Refactor `RECRUITER_DRIVER_SEARCH.html` (2,621 lines -> ~120 shell)
  - Fix 1 relative path reference
- [ ] **2.5** Refactor `ADMIN_DRIVERS.html` (1,745 lines -> ~120 shell)
- [ ] **2.6** Refactor `ADMIN_OBSERVABILITY.html` (1,620 lines -> ~120 shell)
- [ ] **2.7** Refactor `ADMIN_CARRIERS.html` (1,643 lines -> ~120 shell)
- [ ] **2.8** Refactor `ADMIN_AUDIT_LOG.html` (1,388 lines -> ~120 shell)
- [ ] **2.9** Refactor `RECRUITER_ONBOARDING_DASHBOARD.html` (1,397 lines -> ~120 shell)
- [ ] **2.10** Refactor `DRIVER_DASHBOARD.html` (1,387 lines -> ~120 shell)
  - Fix 2 relative path references

**Acceptance Criteria (Phase 2):**
- [ ] All 10 files < 200 lines
- [ ] Zero inline `<script>` blocks > 80 lines
- [ ] All JS/CSS served via jsDelivr CDN
- [ ] All functionality preserved (verified per-page)

---

## Phase 3 — Relative Path Cleanup (28 files)

> Goal: Replace all relative path imports (`../`, `./`) with absolute CDN URLs across 28 files

### Files with Relative Paths

**Admin (4 files):**
- [ ] `ADMIN_AB_TESTS.html` — `../js/lmdr-html-bridge.js`
- [ ] `ADMIN_EMAIL_TEMPLATES.html` — `../js/lmdr-html-bridge.js`
- [ ] `ADMIN_FEATURE_FLAGS.html` — `../js/lmdr-html-bridge.js`
- [ ] `ADMIN_NOTIFICATION_RULES.html` — `../js/lmdr-html-bridge.js`

**Carrier (5 files):**
- [ ] `CARRIER_COMPLIANCE_CALENDAR.html` — `../../theme-utils.js`
- [ ] `CARRIER_CSA_MONITOR.html` — `../../theme-utils.js`
- [ ] `CARRIER_DOCUMENT_VAULT.html` — `../../theme-utils.js`
- [ ] `CARRIER_DQ_TRACKER.html` — `../../theme-utils.js`, `../../theme-styles.css`
- [ ] `CARRIER_INCIDENT_REPORTING.html` — `../../theme-utils.js`

**Driver (2 files):**
- [ ] `DRIVER_DASHBOARD.html` — `../theme-styles.css`, `../js/feature-tracker.js`
- [ ] `MENTOR_PROGRAM.html` — `../theme-styles.css`

**Landing (2 files):**
- [ ] `Quick Apply - Upload Your CDL & Resume.html` — `../lmdr-config.js`
- [ ] `lmdr-cdl-driver-landing-iframe-optimized.html` — relative path

**Recruiter (5 files):**
- [ ] `RecruiterDashboard.html` — `../theme-styles.css`, `../js/feature-tracker.js` (if not done in Phase 2)
- [ ] `RECRUITER_DRIVER_SEARCH.html` — relative path (if not done in Phase 2)
- [ ] `Recruiter_Pipeline_Page.html` — relative path
- [ ] `Recruiter_Pricing.html` — relative path
- [ ] `Recruiter_Retention_Dashboard.html` — relative path

**Utility (8 files):**
- [ ] `DQF_Compliance_Portal.html` — `../theme-utils.js`
- [ ] `Office_Management.html` — `../theme-utils.js`
- [ ] `Orientation_Scheduler.html` — `../theme-utils.js`
- [ ] `PRICING PAGE TEMPLATE.html` — relative path
- [ ] `Placement_Success.html` — relative path
- [ ] `SETTINGS_SIDEBAR.html` — `../theme-utils.js`
- [ ] `Sidebar.html` — `../theme-utils.js`
- [ ] `Subscription_Canceled.html` — relative path
- [ ] `_TEMPLATE_Carrier_Staffing_Form.html` — relative path

### Replacement Pattern

```html
<!-- BEFORE (relative) -->
<script src="../js/lmdr-html-bridge.js"></script>
<link rel="stylesheet" href="../theme-styles.css">
<script src="../../theme-utils.js"></script>

<!-- AFTER (CDN absolute) -->
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/js/lmdr-html-bridge.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/theme-styles.css">
<script src="https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/theme-utils.js"></script>
```

**Acceptance Criteria (Phase 3):**
- [ ] Zero `../` or `./` references in any HTML file
- [ ] All replaced URLs resolve to existing files in repo
- [ ] No functional regressions

---

## Phase 4 — Admin Surface (Remaining ~25 files)

> Goal: Refactor remaining admin HTML files not covered in Phase 2

### Files (by inline JS size, descending)

| File | Lines | Inline JS |
|------|-------|-----------|
| `ADMIN_MATCHES.html` | ~1,200 | ~800 |
| `ADMIN_AI_ROUTER.html` | ~1,100 | ~750 |
| `ADMIN_FEATURE_ADOPTION.html` | ~1,000 | ~700 |
| `ADMIN_AB_TESTS.html` | ~900 | ~600 |
| `ADMIN_EMAIL_TEMPLATES.html` | ~850 | ~550 |
| `ADMIN_FEATURE_FLAGS.html` | ~800 | ~500 |
| `ADMIN_NOTIFICATION_RULES.html` | ~750 | ~450 |
| `ADMIN_RUN_MONITOR.html` | ~700 | ~400 |
| `ADMIN_WEBHOOKS.html` | ~650 | ~350 |
| `B2B_DASHBOARD.html` | ~800 | ~500 |
| `B2B_ACCOUNT_DETAIL.html` | ~900 | ~600 |
| + remaining admin files | varies | varies |

### Tasks

- [ ] **4.1** Audit remaining admin files — get exact line counts
- [ ] **4.2** Batch refactor admin files 500-800 inline JS (medium complexity)
- [ ] **4.3** Batch refactor admin files < 500 inline JS (simpler)
- [ ] **4.4** Verify all admin pages in Wix iframe

**Acceptance Criteria (Phase 4):**
- [ ] All admin HTML files < 200 lines
- [ ] All use CDN pattern
- [ ] All postMessage bridges preserved

---

## Phase 5 — Driver + Recruiter + Carrier Surfaces

> Goal: Refactor remaining driver, recruiter, and carrier HTML files

### Driver (~10 remaining)
- [ ] **5.1** Audit + refactor driver files (AI_MATCHING already partial CDN)
- [ ] **5.2** Verify driver pages in Wix iframe

### Recruiter (~15 remaining)
- [ ] **5.3** Audit + refactor recruiter files
- [ ] **5.4** Verify recruiter pages in Wix iframe

### Carrier (~8 remaining)
- [ ] **5.5** Audit + refactor carrier files
- [ ] **5.6** Verify carrier pages in Wix iframe

**Acceptance Criteria (Phase 5):**
- [ ] All driver/recruiter/carrier HTML files < 200 lines
- [ ] All use CDN pattern
- [ ] Zero relative paths

---

## Phase 6 — Landing + Utility + Collateral

> Goal: Refactor remaining landing pages, utility pages, and collateral

### Landing (~8 remaining after Phase 1)
- [ ] **6.1** Refactor landing page monoliths
- [ ] **6.2** Verify landing pages

### Utility (~12 remaining)
- [ ] **6.3** Refactor utility page monoliths
- [ ] **6.4** Verify utility pages

### Collateral (~3 files)
- [ ] **6.5** Refactor collateral files (one-pagers, etc.)
- [ ] **6.6** Final audit — confirm 0 legacy files remain

**Acceptance Criteria (Phase 6):**
- [ ] 100% of HTML files compliant with CDN shell pattern
- [ ] Zero inline `<script>` blocks > 80 lines across entire codebase
- [ ] Zero relative path imports
- [ ] All pages verified functional in Wix iframes

---

## Dependencies Map

```
Phase 1 (Truck Driver Page — Pilot)
    |
    v
Phase 2 (Top 10 Monoliths) ----+
    |                           |
    v                           v
Phase 3 (Relative Paths)    Phase 4 (Admin Surface)
    |                           |
    +---------------------------+
    |
    v
Phase 5 (Driver + Recruiter + Carrier)
    |
    v
Phase 6 (Landing + Utility + Collateral)
```

Phase 1 is the pilot — patterns established here apply to all subsequent phases.
Phases 2-3 can run in parallel. Phase 4 can start after Phase 2.
Phases 5-6 run after Phase 3 + 4 patterns are proven.

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [ ] All HTML shell files < 200 lines
- [ ] Zero inline `<script>` blocks > 80 lines
- [ ] Total inline JS < 150 lines per file
- [ ] All JS/CSS loaded via jsDelivr CDN
- [ ] Zero relative path imports (`../`, `./`)
- [ ] Inline Tailwind config present (not external `lmdr-config.js`)
- [ ] `DOMContentLoaded` bootstrap < 10 lines
- [ ] All postMessage bridges functional
- [ ] CDN cache purged after git push
- [ ] No visual regressions in Wix iframe

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking postMessage bridge during refactor | Extract bridge code first, test in isolation before removing inline version |
| CDN cache serving stale files | Always purge jsDelivr after push; use `@main` tag (not commit hashes) |
| GSAP animations breaking | Keep GSAP CDN in HTML `<head>`; only move init code to external module |
| Wix iframe fails to load CDN modules | Verify Content Security Policy allows jsdelivr; test in Wix preview mode |
| Scope creep — too many files at once | Strict phase boundaries; pilot Phase 1 validates approach before scaling |
| Regression in form submission / matching | Phase 1 acceptance criteria includes Wix iframe verification |

---

## Success Criteria

- [ ] 100% of HTML files follow CDN shell pattern (0 legacy/monolithic remaining)
- [ ] Average HTML file < 150 lines (from current average ~800)
- [ ] Zero relative path imports across entire `src/public/`
- [ ] All UI updates deployable via git push + CDN purge (no Wix Editor needed)
- [ ] Performance improvement measurable via Lighthouse (reduced inline JS parsing)
