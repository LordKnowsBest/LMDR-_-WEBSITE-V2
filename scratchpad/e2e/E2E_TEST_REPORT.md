# E2E Test Report: Anonymous Driver Matching Flow

**Date:** 2026-02-09
**Environment:** Production (https://www.lastmiledr.app)
**Test Persona:** Anonymous free-tier user (not logged in)
**Test Data:** ZIP=75001, 100mi commute, 0.55 CPM, Regional, Turnover<50%, TruckAge<3yr, Fleet=Any

---

## Executive Summary

| Leg | Description | Verdict | Blocking Issues |
|-----|-------------|---------|-----------------|
| LEG 1 | Landing Page -> AI Matching navigation | **PASS** | None |
| LEG 2 | AI Matching form fill + carrier search | **FAIL** | 504 Gateway Timeout on `findMatchingCarriers()` |
| LEG 3 | Application submission from search results | **BLOCKED** | Cannot proceed without LEG 2 results |
| LEG 4 | Data verification in Airtable | **BLOCKED** | Cannot proceed without LEG 2/3 data |

**Overall Verdict: FAIL -- P0 blocker in LEG 2 prevents completion of the core user flow.**

---

## LEG 1: Landing Page -> AI Matching Navigation

### Result: PASS (with warnings)

**What worked:**
- Landing page rendered correctly with hero section, "For Drivers" and "For Carriers" CTAs
- "Start My Match" button navigated successfully to `/ai-matching`
- AI Matching page loaded with all form fields visible
- PostMessage bridge completed full lifecycle:
  `carrierMatchingReady` -> `pageReady` -> `ping/pong` -> `CONNECTION VERIFIED`
- HTML component discovered on `#html4`
- V7 Message Validation active with registry
- OCR handler initialized (3 document types)
- Accordion system initialized (mobile-first)

**Issues found (non-blocking):**

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | Featured carriers fetch failed | P2 | `JSHandle@error` -- empty homepage section |
| 2 | Platform stats fetch failed | P2 | `JSHandle@error` -- missing stats counters |
| 3 | Recent placements fetch failed | P2 | `JSHandle@error` -- empty placements section |
| 4 | `flushOnReadyCallbacks` 25s timeout | P1 | Wix platform-level timeout on landing page init |
| 5 | Meta pixel blocked | P3 | Facebook Business Manager config issue |
| 6 | Tailwind CDN production warning | P3 | Expected per CLAUDE.md (inline config pattern) |

**Screenshots:**
- `leg1_landing_page.png` -- Landing page with hero section and CTAs rendered correctly
- `leg1_ai_matching_loaded.png` -- AI Matching form loaded with all fields empty

---

## LEG 2: AI Matching Form Fill + Carrier Search

### Result: FAIL -- P0 BLOCKER

**What worked:**
- Form fields populated correctly (ZIP=75001, 100mi, 0.55 CPM, Regional, Under 50%, 3yr, Any fleet, "E2E Test Driver")
- `findMatches` message routed correctly through postMessage bridge
- User tier detection worked (free/not premium)
- Error handling worked (matchError sent back to HTML, alert shown)

**What failed:**

```
CRITICAL: 504 Gateway Timeout on findMatchingCarriers()
```

The backend function `carrierMatching.jsw:findMatchingCarriers()` exceeded the Wix Velo ~14-second timeout limit.

**Reproduction:** 100% consistent. Retried with broadest possible criteria (Nationwide, No preference, No limit, Any age) -- same 504 result.

**Console flow trace:**
```
[HTML->Velo] findMatches (form data sent)
[Velo] Checking user login state: false
[Velo] Running backend search with preferences
[Velo] User tier: free | isPremium: false
[Velo] SEARCH ERROR: 504 Gateway Timeout
[Velo->HTML] matchError
[HTML] Alert dialog: "Error finding matches: Request failed with status code 504."
```

**Screenshots:**
- `leg2_form_filled.png` -- Form correctly populated with test data
- `leg2_504_error_state.png` -- Post-error state showing "FIND MY MATCHES" button and empty results area

### Root Cause Analysis (Full Detail in `leg2_504_investigation.md`)

The `findMatchingCarriers()` function makes **~19-22 sequential Airtable API calls** totaling ~12 seconds, right at the 14-second timeout edge.

**Three contributing factors:**

| Factor | Time Added | Detail |
|--------|-----------|--------|
| **Awaited observability calls** | ~6,000ms | 10+ `await log()`, `await startTrace()`, `await logDatabase()`, `await endTrace()` calls each insert/query Airtable records synchronously in the critical path |
| **Unfiltered carrier query** | ~3,500ms | `queryRecords('carriers', {limit:500})` fetches from 25k-record Carriers (Master) table with NO filter, requiring 5 paginated Airtable API calls at 100 records/page |
| **Sequential independent operations** | ~1,500ms | Carrier query, config weights, enrichment cache, and recruiter stats run sequentially despite being independent |

**Call chain inventory:**

| Step | Function | Airtable Calls | Awaited? |
|------|----------|---------------|----------|
| startTrace() | Insert to systemTraces | 1 | YES |
| log() (start) | Insert to systemLogs | 1 | YES |
| updateDriverPreferences() | Fails fast for anon (0 calls) | 0 | YES |
| queryRecords('carriers', {limit:500}) | 5 paginated GETs to Carriers (Master) | 5 | YES |
| logDatabase() -> log() | Insert to systemLogs | 1 | YES |
| getCarrierMatchingWeights() | Query platformSettings | 1 | YES |
| calculateMatchScore() x 500 | Pure CPU (synchronous) | 0 | -- |
| getExistingEnrichments() | Query carrierEnrichments | 1 | YES |
| getRecruiterStats() x 2 | 2 queries via Promise.all | 2 | YES |
| log() (end) | Insert to systemLogs | 1 | YES |
| endTrace() | Query + Update systemTraces | 2 | YES |
| dataAccess internal logDatabase calls | Additional log inserts | ~3-4 | YES |
| **TOTAL** | | **~19-22** | |

**Estimated wall-clock time:** ~12,000ms (with 200ms rate-limit delays between Airtable requests)

---

## LEG 3: Application Submission

### Result: BLOCKED

Cannot proceed -- LEG 3 depends on carrier match results from LEG 2 to display carrier cards with "Apply" buttons. With LEG 2 returning a 504, no results are rendered and no application can be submitted.

---

## LEG 4: Data Verification in Airtable

### Result: BLOCKED

Cannot proceed -- LEG 4 verifies that match events and application records were written to Airtable. Since LEG 2 timed out before completing, no data was written.

---

## Console Error Summary (All Legs)

| # | Page | Error | Severity | Count | Blocking? |
|---|------|-------|----------|-------|-----------|
| 1 | AI Matching | **504 Gateway Timeout** on `findMatchingCarriers()` | **P0** | 2/2 attempts | **YES** |
| 2 | Landing | Failed to load featured carriers | P2 | 1 | No |
| 3 | Landing | Failed to load platform stats | P2 | 1 | No |
| 4 | Landing | Failed to load recent placements | P2 | 1 | No |
| 5 | Landing | `flushOnReadyCallbacks` 25s timeout | P1 | 1 | No |
| 6 | Both | Meta pixel blocked (traffic permissions) | P3 | 2 | No |
| 7 | Both | Tailwind CDN production warning | P3 | 3 | No |
| 8 | Both | Wix preload resource not used | P3 | 5 | No |

**Total errors:** 1 critical (P0), 3 moderate (P2), 1 performance concern (P1), 8 informational (P3)

---

## Network / API Analysis

| Endpoint | Method | Status | Latency | Notes |
|----------|--------|--------|---------|-------|
| `findMatchingCarriers()` | Wix backend call | **504** | >14s | Timeout -- too many sequential Airtable API calls |
| Landing page data fetches (x3) | Wix backend calls | Error | Unknown | Featured carriers, stats, placements all failed |
| PostMessage bridge (AI Matching) | Internal | **200** | <100ms | Healthy -- full ping/pong verified |
| PostMessage bridge (Landing) | Internal | **200** | <100ms | Healthy -- staffing form bridge operational |

---

## Bridge Health Assessment

| Page | Bridge | Status | Components |
|------|--------|--------|------------|
| Landing Page | Carrier Staffing Form | HEALTHY | `#html1`, `#html5` |
| AI Matching | Carrier Matching V7 | HEALTHY | `#html4` |

Both bridges completed full handshake and are fully operational. The 504 failure is purely a backend timeout, not a bridge issue.

---

## UI/UX Issues Observed

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | `alert()` used for error display | P2 | JavaScript `alert()` blocks the page thread and provides poor UX. Should use an inline error banner within the matching card. |
| 2 | No loading timeout feedback | P2 | After clicking "FIND MY MATCHES", the user sees no progress indicator or timeout warning before the 504 error. A loading spinner with "This may take a moment..." would improve perceived responsiveness. |
| 3 | No retry mechanism | P3 | After 504 error, user must manually click "FIND MY MATCHES" again. Auto-retry with exponential backoff would help. |

---

## Recommended Fixes (Prioritized)

### P0 -- Must Fix Before Next E2E Run

| # | Fix | File | Effort | Impact |
|---|-----|------|--------|--------|
| 1 | **Fire-and-forget observability** -- Remove `await` from all `log()`, `startTrace()`, `logDatabase()`, `endTrace()` calls in `findMatchingCarriers()` | `src/backend/carrierMatching.jsw` lines 71-81, 114, 214-222 | 10 min | **Saves ~6,000ms** -- resolves 504 alone |
| 2 | **Parallelize independent operations** -- `Promise.all()` for carrier query + config weights fetch, and for enrichment cache + recruiter stats | `src/backend/carrierMatching.jsw` lines 104-195 | 30 min | **Saves ~1,500ms** |

### P1 -- Fix Before Production

| # | Fix | File | Effort | Impact |
|---|-----|------|--------|--------|
| 3 | **Add carrier query filter** -- Pre-filter by state or ZIP prefix | `src/backend/carrierMatching.jsw` line 106 | 1 hour | Saves ~2,000ms, reduces from 5 pages to 1-2 |
| 4 | **Cache config weights** -- In-memory cache with 5-min TTL for `getCarrierMatchingWeights()` | `src/backend/admin_config_service.jsw` | 30 min | Saves ~500ms per search |
| 5 | **Landing page data failures** -- Investigate why featured carriers, stats, and placements all fail | Landing page code + backend services | 1-2 hours | Fix 3 homepage sections |
| 6 | **Landing page `flushOnReadyCallbacks` timeout** -- Defer non-critical Velo module init | `src/pages/masterPage.js` or landing page code | 1 hour | Reduce 25s platform timeout |

### P2 -- Fix for Quality

| # | Fix | File | Effort | Impact |
|---|-----|------|--------|--------|
| 7 | **Replace `alert()` with inline error** -- Use error banner in matching card | `src/public/driver/AI_MATCHING.html` | 30 min | Better UX on error |
| 8 | **Add loading state with timeout warning** -- Show progress during search | `src/public/driver/AI_MATCHING.html` | 30 min | Better perceived performance |
| 9 | **Reduce carrier limit for free tier** -- 100-200 instead of 500 | `src/backend/carrierMatching.jsw` line 107 | 5 min | Marginal speed improvement |

### P3 -- Low Priority

| # | Fix | File | Effort | Impact |
|---|-----|------|--------|--------|
| 10 | Meta pixel configuration | Facebook Business Manager | 15 min | Analytics tracking |
| 11 | Auto-retry on 504 with backoff | AI_MATCHING.html | 1 hour | Resilience |

---

## Estimated Fix Impact on Timeline

```
Current state:    ~12,000ms (504 timeout at 14s limit)

After Fix #1:     ~6,000ms  (fire-and-forget logging)     -> PASS
After Fix #1+#2:  ~4,500ms  (+ parallelization)           -> COMFORTABLE
After Fix #1-#4:  ~2,000ms  (+ filtering + caching)       -> FAST
```

**Fix #1 alone resolves the P0 blocker.** All other fixes provide progressively better margins.

---

## Test Artifacts

| File | Description |
|------|-------------|
| `leg1_landing_page.png` | Landing page screenshot -- hero section with CTAs |
| `leg1_ai_matching_loaded.png` | AI Matching form -- empty state after navigation |
| `leg1_console_landing.md` | Landing page console logs (3 errors, 5 warnings) |
| `leg1_console_ai_matching.md` | AI Matching console logs (0 errors, bridge verified) |
| `leg1_watcher_report.md` | LEG 1 watcher analysis with severity classification |
| `leg2_form_filled.png` | Form populated with test data |
| `leg2_504_error_state.png` | Post-error state after 504 timeout |
| `leg2_console_search.md` | First search attempt console logs (504) |
| `leg2_console_retry.md` | Retry with broadest criteria (same 504) |
| `leg2_504_investigation.md` | Deep-dive root cause analysis with call chain audit |

---

## Next Steps

1. Apply Fix #1 (fire-and-forget observability) to `carrierMatching.jsw`
2. Re-run LEG 2 to confirm 504 is resolved
3. If LEG 2 passes, proceed through LEGs 3-4 to complete the E2E flow
4. Address P1/P2 items before production launch
