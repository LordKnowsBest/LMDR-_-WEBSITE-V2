# Verification Matrix — DriverOS Mobile-First Convergence

**Track:** `driver_os_convergence_20260302`
**Last Updated:** 2026-03-02

---

## Automated Tests

| Test File | Wave | What It Verifies | Pass? |
|-----------|------|-----------------|-------|
| `driverOsContract.test.js` | W1 | Contract schema completeness, validate() function, all 60+ actions registered | |
| `driverOsShell.test.js` | W2 | Shell bootstrap, VLM mount/unmount, nav rendering, safe-area classes present | |
| `driverOsViews.test.js` | W4 | All 19 views export mount/unmount/onMessage/getSnapshot interface | |
| `driverOsNBA.test.js` | W5 | NBA chip registry, evaluate() with mock state, max 3 chips, dismiss persistence | |
| `driverOsMobile.test.js` | W5 | Viewport meta present, touch targets >= 44px, no horizontal overflow at 390px | |

---

## Gate 1 — Shell Bootstrap (after Wave 2)

| # | Check | Method | Pass? |
|---|-------|--------|-------|
| G1.1 | `DriverOS.html` loads in < 2s on 3G throttle | Chrome DevTools Network Throttle (Slow 3G), measure DOMContentLoaded | |
| G1.2 | Bottom nav renders 5 zone icons (48px targets) | DOM inspect: `nav` has 5 `button` children, each `offsetWidth >= 48 && offsetHeight >= 48` | |
| G1.3 | Touch spacing >= 8px between nav icons | Compute gap between adjacent buttons >= 8px | |
| G1.4 | VLM mounts a placeholder view without console errors | DevTools Console: mount test view, check for zero errors | |
| G1.5 | `env(safe-area-inset-bottom)` is non-zero on notch device | iOS Simulator (iPhone 12): computed style of `.pb-safe` shows non-zero padding. Requires `viewport-fit=cover`. | |
| G1.6 | Fixed header uses `top: env(safe-area-inset-top)` | Inspect header element: `top` is NOT `0px` on notch device (prevents content sliding behind notch on scroll) | |
| G1.7 | Bottom nav height = `calc(56px + env(safe-area-inset-bottom))` | On iPhone 12: computed height ~90px (56 + 34) | |
| G1.8 | Zero P0 console errors | DevTools Console filter: error level only | |
| G1.9 | No horizontal scroll on 390px viewport | DevTools Responsive mode at 390x844: `document.documentElement.scrollWidth <= 390` | |
| G1.10 | Shell file is <= 100 lines | `wc -l DriverOS.html` | |
| G1.11 | Viewport meta tag correct | Verify: `width=device-width,initial-scale=1.0,viewport-fit=cover,user-scalable=yes` (NOT user-scalable=no) | |
| G1.12 | Pinch zoom works | On iOS Simulator, pinch to zoom succeeds (WCAG accessibility requirement) | |

---

## Gate 2 — View Completeness (after Wave 3)

| # | Check | Method | Pass? |
|---|-------|--------|-------|
| G2.1 | All 19 views mount via VLM | Script: iterate VIEW_REGISTRY, call `DOS.views.mount(id)` for each, verify `#app-root` has children | |
| G2.2 | All views render real backend data | Manual: mount each view, verify non-empty data sections (not "Loading..." stuck states) | |
| G2.3 | Zero `type`-key messages in new bridge | Grep: `driver-os-bridge.js` and all `dos-view-*.js` for `type:` in postMessage sends — must find zero | |
| G2.4 | Bridge inventory coverage | Count `wired` entries in `bridge_inventory.md` / total entries >= 95% | |
| G2.5 | Single-column on mobile | Each view at 390px viewport: no element wider than viewport, no horizontal scrollbar | |
| G2.6 | Touch targets >= 48px | Each view: all buttons, links, inputs computed `offsetWidth >= 48 && offsetHeight >= 48` (Material Design 3) | |
| G2.6b | Touch spacing >= 8px | Adjacent interactive elements have >= 8px gap (prevents accidental taps) | |
| G2.7 | Gamification views extracted | `dos-view-gamification.js`, `dos-view-badges.js`, `dos-view-challenges.js` exist and mount without inline `<style>` blocks | |
| G2.8 | Community views extracted | `dos-view-forums.js`, `dos-view-announcements.js`, `dos-view-surveys.js` exist and mount | |

---

## Gate 3 — Intelligence Correctness (after Wave 5)

| # | Check | Method | Pass? |
|---|-------|--------|-------|
| G3.1 | Agent FAB visible on all views | Navigate to each of 19 views, verify `.dos-agent-fab` element is visible and positioned above bottom nav | |
| G3.2 | Agent receives view context | Open agent chat, send "what view am I on?" — response must reference the current view name | |
| G3.3 | Voice orb on matching | Mount matching view, tap agent FAB, verify voice orb toggle is visible | |
| G3.4 | Voice orb on dashboard | Mount dashboard view, verify voice orb toggle | |
| G3.5 | Voice orb on road | Mount road view, verify voice orb toggle | |
| G3.6 | NBA chips on dashboard | Mount dashboard view, verify 1-3 chips render in header area | |
| G3.7 | NBA chips dismissible | Click dismiss on a chip, verify it disappears and does not return within session | |
| G3.8 | Market condition pill on matching | Mount matching view, verify HOT/SOFT/NEUTRAL pill in header | |
| G3.9 | Market condition pill on dashboard | Mount dashboard view, verify market pill | |
| G3.10 | Proactive insights within 4s | Mount dashboard, start timer, verify insight cards appear before 4s mark | |
| G3.11 | Proactive section hidden on timeout | Mock backend to return no insights, verify section does not render (no blank box) | |

---

## Final — Evidence Pack (Wave 6)

| # | Path | Expected Result | Pass? |
|---|------|-----------------|-------|
| EP.1 | Dashboard loads | NBA chips + market ticker + proactive insight cards visible | |
| EP.2 | Carrier matching search | Search executes, result cards render with enrichment data | |
| EP.3 | Gamification XP hub | XP bar, level badge, event feed render with real data | |
| EP.4 | Agent chat | Send message, receive view-aware response | |
| EP.5 | Road utilities map | Leaflet map loads, geolocation marker visible, utility tools responsive | |

### Evidence Pack Artifacts

| Artifact | Location | Status |
|----------|----------|--------|
| `quality_gate.json` | `artifacts/devtools/{run_id}/quality_gate.json` | |
| `console_audit.json` | `artifacts/devtools/{run_id}/console_audit.json` | |
| `network_audit.json` | `artifacts/devtools/{run_id}/network_audit.json` | |
| Screenshot 1 (Dashboard) | `artifacts/devtools/{run_id}/screenshot_1.png` | |
| Screenshot 2 (Matching) | `artifacts/devtools/{run_id}/screenshot_2.png` | |
| Screenshot 3 (Gamification) | `artifacts/devtools/{run_id}/screenshot_3.png` | |
| Screenshot 4 (Agent) | `artifacts/devtools/{run_id}/screenshot_4.png` | |
| Screenshot 5 (Road) | `artifacts/devtools/{run_id}/screenshot_5.png` | |

---

## Mobile-Specific Checks (all waves)

| # | Check | Pass? |
|---|-------|-------|
| M.1 | Body text >= 16px, secondary text >= 13px, no text < 13px | |
| M.2 | All inputs are 16px font (prevents iOS Safari auto-zoom on focus) | |
| M.3 | Bottom nav is always visible (not scrolled away) | |
| M.4 | Bottom nav height = `calc(56px + env(safe-area-inset-bottom))` | |
| M.5 | Header uses `top: env(safe-area-inset-top)` not `top: 0` | |
| M.6 | Left/right safe areas respected in landscape mode | |
| M.7 | Primary CTA buttons in thumb zone (lower 40%) | |
| M.8 | No hover-dependent interactions (all tap/swipe) | |
| M.9 | Landscape rotation does not break layout | |
| M.10 | Pull-to-refresh works on all views | |
| M.11 | Agent chat panel covers full viewport on mobile | |
| M.12 | All touch targets >= 48x48px (Apple HIG 44pt + Material Design 48dp) | |
| M.13 | Touch spacing >= 8px between all interactive elements | |
| M.14 | `viewport-fit=cover` present (required for env() to return non-zero) | |
| M.15 | `user-scalable=yes` present (Apple HIG + WCAG accessibility) | |
| M.16 | Pinch-to-zoom works without breaking layout | |
| M.17 | Full-width backgrounds extend under safe areas (no padding on bg elements) | |
