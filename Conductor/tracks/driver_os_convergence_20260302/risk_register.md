# Risk Register — DriverOS Mobile-First Convergence

**Track:** `driver_os_convergence_20260302`
**Last Updated:** 2026-03-02

---

## Risk Matrix

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Wave |
|----|------|-----------|--------|----------|------------|------|
| R1 | Monolithic extraction fails for 8 pages with zero CDN modules | Medium | High | **Critical** | Extract incrementally: DOM structure first, then event handlers, then data calls. Test each in isolation before VLM integration. AI_MATCHING already has 10 CDN modules to wrap. | W3 |
| R2 | Protocol migration breaks Announcements/Policies | Medium | Medium | **High** | Add adapter in `driver-os-bridge.js` that translates `{ type, data }` to `{ action, payload }` and vice versa. Keep adapter for 1 release cycle. | W3 |
| R3 | Bottom nav hides content on short viewports (iPhone SE) | Medium | Medium | **High** | Add `padding-bottom: calc(56px + env(safe-area-inset-bottom))` on `#app-root`. Test on 375x667 viewport (iPhone SE) in addition to 390x844 target. | W2 |
| R4 | Leaflet map lifecycle breaks in VLM mount/unmount | High | Medium | **High** | `dos-view-road.js` must call `map.invalidateSize()` after mount, and `map.remove()` on unmount. Add 100ms delay after mount before initializing map. | W3 |
| R5 | CDN cache staleness causes version mismatch between shell and views | Medium | High | **High** | Run CDN purge template after every `git push`. Include version sentinel in `driver-os-config.js` that views can check. | All |
| R6 | DEV_MODE flag removal breaks matching/outreach | Medium | High | **High** | Test with real driver accounts in staging before removing. Create a `revert-dev-mode` branch as escape hatch. Remove flags last (Wave 4b). | W4 |
| R7 | Page code exceeds Wix size limits with 60+ handlers | Low | High | **High** | Group handlers by cluster in clearly-marked sections. If file exceeds 3,500 lines, extract helper modules to `.jsw` files that page code imports. | W4 |
| R8 | Agent proactive push causes visible latency on dashboard | Medium | Medium | **Medium** | Fire proactive request 2s after mount (non-blocking). Show skeleton loader. Hide section entirely if no response within 8s. | W5 |
| R9 | Swipe gestures conflict with iOS system gestures | Medium | Low | **Medium** | Only enable horizontal swipe within the content area (not from screen edges). Add `touch-action: pan-y` on bottom nav to prevent vertical swipe conflicts. | W2 |
| R10 | Voice VAPI Web SDK increases bundle size on all views | Low | Medium | **Medium** | Lazy-load VAPI SDK only when driver taps voice orb. Keep SDK URL in `FEATURE_FLAGS` so it can be disabled per view. | W5 |
| R11 | Community pages (forums, mentorship) have no clear backend service wiring | Medium | Medium | **Medium** | Wave 1 audit will identify exact backend methods. If backend gaps exist, create stub handlers that return `{ status: 'coming_soon' }` with a UI placeholder. | W1/W3 |
| R12 | 19 lazy-loaded view modules cause slow first navigation | Low | Medium | **Low** | CDN cache means second load is instant. For first load, show loading skeleton in VLM while script downloads. Each view module should be < 50KB. | W3 |
| R13 | Existing 19 HTML files left in repo confuse developers | Low | Low | **Low** | Add deprecation banner comment to each old HTML file header. Create follow-up track for removal after migration confirmed stable. | W6 |
| R14 | Market signals service returns no data for new drivers | Low | Low | **Low** | `dos-market.js` handles empty response gracefully — condition pill hidden, `DOS.market.condition` set to `null`. Agent context omits market field. | W5 |

---

## Risk by Wave

| Wave | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| W1 | 0 | 0 | 1 (R11) | 0 |
| W2 | 0 | 1 (R3) | 1 (R9) | 0 |
| W3 | 1 (R1) | 2 (R2, R4) | 1 (R12) | 0 |
| W4 | 0 | 2 (R6, R7) | 0 | 0 |
| W5 | 0 | 0 | 2 (R8, R10) | 1 (R14) |
| W6 | 0 | 0 | 0 | 1 (R13) |
| All | 0 | 1 (R5) | 0 | 0 |

---

## Escalation Triggers

- Any **Critical** risk materializes → pause the wave, escalate to senior reviewer
- **Gate fails** on mobile criteria → block until all 390px viewport tests pass
- **DEV_MODE removal** breaks matching → immediate revert from `revert-dev-mode` branch
- **Evidence Pack** fails → fix P0 errors before marking track DONE
