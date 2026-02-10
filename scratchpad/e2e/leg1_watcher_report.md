# LEG 1 Watcher Report: Landing Page -> AI Matching Navigation

## Verdict: PASS (with warnings)

LEG 1 navigation succeeded. The AI Matching page loaded cleanly with zero errors and a fully verified postMessage bridge. The Landing Page has 3 backend data-fetch failures that degrade the homepage experience but do NOT block the driver matching E2E flow.

---

## Error Severity Classification

| # | Page | Issue | Severity | Blocking? |
|---|------|-------|----------|-----------|
| 1 | Landing | Failed to load featured carriers | **P2** | No -- cosmetic homepage section |
| 2 | Landing | Failed to load platform stats | **P2** | No -- cosmetic homepage section |
| 3 | Landing | Failed to load recent placements | **P2** | No -- cosmetic homepage section |
| 4 | Landing | flushOnReadyCallbacks timeout (25s) | **P1** | No -- page still rendered, but indicates slow Wix platform init |
| 5 | Landing | Meta pixel blocked | **P3** | No -- analytics only, traffic permission config issue |
| 6 | Both | Tailwind CDN production warning | **P3** | No -- expected for Wix iframe approach per CLAUDE.md |
| 7 | AI Matching | User not logged in | **P1** | Potentially -- depends on whether LEG 2+ actions require auth |

---

## Bridge Health Assessment

### Landing Page Bridge
- **Status: HEALTHY** (for carrier staffing form)
- Staffing form bridge attached to `#html1` and `#html5`
- Full handshake: `staffingFormReady` received, resize message processed
- Note: This is the staffing form bridge, not the AI matching bridge. Landing page does not host the matching component.

### AI Matching Bridge
- **Status: FULLY OPERATIONAL**
- Complete lifecycle verified:
  1. `carrierMatchingReady` (HTML -> Velo)
  2. `pageReady` (Velo -> HTML)
  3. `ping` / `pong` exchange
  4. `CONNECTION VERIFIED: Velo<->HTML bridge operational`
- Version: **V7 (Message Validation)** with Message Registry loaded
- HTML component discovered on `#html4`
- OCR handler initialized (3 document types, max 1200px)
- Accordion system initialized (mobile-first)

**Bridge verdict: No issues. The postMessage bridge is healthy and ready for form submission in LEG 2.**

---

## Data Loading Issues

### Landing Page (3 failures)
| Data Endpoint | Status | Impact |
|---------------|--------|--------|
| Featured carriers | FAILED | Empty featured section on homepage |
| Platform stats | FAILED | Missing stats counters on homepage |
| Recent placements | FAILED | Empty placements section on homepage |

**Root cause hypothesis:** All three are backend fetch failures (`JSHandle@error`). Likely causes:
1. Backend services depend on Airtable data that may not be seeded/accessible
2. Possible cold-start timeout compounded by the 25s `flushOnReadyCallbacks` timeout
3. Services may be failing silently without proper error handling

**Impact on E2E flow:** None. These are homepage cosmetic sections. The AI Matching page loads independently.

### AI Matching Page (0 failures)
- All data loaded cleanly
- Applied carriers: 0 (expected for fresh/anonymous session)
- No backend fetch errors

---

## Performance Concerns

| Concern | Severity | Detail |
|---------|----------|--------|
| `flushOnReadyCallbacks` 25s timeout | **P1** | Wix platform-level timeout on Landing Page. Indicates heavy page init. The `timeoutMs: 25000` with context `runApplications` suggests too many Velo modules loading simultaneously. |
| Preload resource warnings (5 total) | **P3** | Wix preloaded resources not consumed within timeout window. Common in Wix sites with many components; not actionable. |
| AI Matching page | Clean | No performance warnings. Page loaded and bridge verified without timeout issues. |

---

## Auth State Assessment

| Property | Value | Risk |
|----------|-------|------|
| Login state | `false` (NOT LOGGED IN) | **Medium** |
| Session type | Anonymous visitor | |
| Applied carriers | 0 | Expected for anonymous |

### Impact on Subsequent Legs

**LEG 2 (Form Submission):** The AI Matching form likely accepts submissions from anonymous users (driver profile intake). The form should work without login. However, if form submission triggers a `dataAccess.insertRecord` with `suppressAuth: false`, it will fail.

**LEG 3+ (Results / Application):** If the flow requires viewing saved matches or applying to carriers, auth will be needed. The test runner should either:
1. Log in before LEG 2 if the form requires auth
2. Verify that the form explicitly handles anonymous submission
3. Watch for auth-related errors in LEG 2 console logs

**Recommendation:** Confirm whether the E2E test expects anonymous or authenticated flow. If authenticated, a login step should be inserted between LEG 1 and LEG 2.

---

## Recommendations

### P1 — Address Before Production

1. **Auth state (P1):** Verify whether LEG 2 form submission works for anonymous users. If not, add a login step to the E2E flow. The page code checks login state (`false`) but does not block page load, so the behavior on form submit is the critical question.

2. **Landing page timeout (P1):** The 25s `flushOnReadyCallbacks` timeout suggests the Landing Page has too many Velo modules or heavy initialization. Consider:
   - Lazy-loading non-critical sections (featured carriers, stats, placements)
   - Deferring non-essential `$w.onReady` callbacks
   - This does NOT block the E2E test but indicates a production UX issue.

### P2 — Fix After E2E Passes

3. **Landing page data failures (P2):** All 3 homepage data fetches failed. Investigate:
   - Are the backend services (`featuredCarriers`, `platformStats`, `recentPlacements`) calling collections that exist in Airtable?
   - Is the Airtable API key/connection healthy?
   - These failures may share a common root cause (e.g., cold start + timeout)

### P3 — Low Priority / Expected

4. **Meta pixel (P3):** Blocked by traffic permission settings. This is a Facebook Business Manager configuration issue, not a code issue.

5. **Tailwind CDN warning (P3):** Expected per CLAUDE.md. The inline config pattern is the accepted approach for Wix iframes. No action needed.

---

## Summary for LEG 2 Handoff

| Check | Status |
|-------|--------|
| Navigation to AI Matching | SUCCESS |
| AI Matching page loaded | SUCCESS |
| PostMessage bridge verified | SUCCESS |
| Form components ready | SUCCESS (OCR, accordion, registry) |
| User authenticated | NO -- anonymous session |
| Backend errors on target page | NONE |
| Ready for form submission | YES (pending auth confirmation) |

**LEG 1 is PASS. Proceed to LEG 2 (form fill + submission) with awareness of anonymous auth state.**
