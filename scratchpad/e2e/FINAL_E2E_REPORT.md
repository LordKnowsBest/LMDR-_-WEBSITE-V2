# E2E Test Report: Driver Matching Path
## Date: 2026-02-09 | Tester: Automated (Claude Code + Chrome DevTools)

---

## Executive Summary

**Overall Verdict: FAIL — P0 Backend Timeout Blocks Core Flow**

The driver matching E2E path was tested from Landing Page through AI Matching form submission. The frontend (HTML, postMessage bridge, form collection, error handling) works correctly. However, the backend `findMatchingCarriers()` function consistently returns a **504 Gateway Timeout**, completely blocking the search → results → application → data persistence pipeline.

| Leg | Test | Result | Blocking? |
|-----|------|--------|-----------|
| 1 | Landing Page → AI Matching | **PASS** | No |
| 2 | Form Fill → Carrier Search | **FAIL (504)** | **YES — P0** |
| 3 | Application Submission | **BLOCKED** | Depends on LEG 2 |
| 4 | Airtable Data Verification | **BLOCKED** | Depends on LEG 3 |

---

## LEG 1: Landing Page → AI Matching Navigation — PASS

### What Worked
- Landing page loaded at `https://www.lastmiledr.app`
- "Start My Match" CTA found and clicked (opens in new tab)
- AI Matching page loaded at `/ai-matching`
- Velo↔HTML bridge fully verified: `carrierMatchingReady → pageReady → ping/pong → CONNECTION VERIFIED`
- V7 Message Validation active with Message Registry
- OCR handler initialized (3 document types)
- HTML component discovered on `#html4`

### Issues Found (Non-Blocking)

| # | Issue | Severity | Page | Detail |
|---|-------|----------|------|--------|
| 1 | Failed to load featured carriers | P2 | Landing | Backend fetch error — empty section on homepage |
| 2 | Failed to load platform stats | P2 | Landing | Backend fetch error — missing counters |
| 3 | Failed to load recent placements | P2 | Landing | Backend fetch error — empty section |
| 4 | flushOnReadyCallbacks timeout (25s) | P1 | Landing | Wix platform-level timeout, page still renders |
| 5 | Meta pixel blocked | P3 | Both | Facebook traffic permission config issue |
| 6 | Tailwind CDN warning | P3 | Both | Expected for Wix iframe approach |
| 7 | User not logged in | Info | AI Matching | Anonymous session — affects application flow |

---

## LEG 2: Form Fill + Carrier Search — FAIL (P0)

### What Worked
- Form fields populated correctly (ZIP, commute, CPM, run type, turnover, truck age)
- `findMatches` message routed correctly through postMessage bridge
- User tier correctly detected (free / not premium)
- Error handling worked (`matchError` sent back, alert shown)

### What Failed

**`findMatchingCarriers()` → 504 Gateway Timeout (CONFIRMED SYSTEMIC)**

- **Attempt 1:** ZIP=75001, 100mi, 0.55 CPM, Regional, Turnover<50%, TruckAge<3yr → **504**
- **Attempt 2:** ZIP=75001, Nationwide, No preference, No Limit, Any age → **504**

**Network Trace:**
```
POST /_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/carrierMatching.jsw/findMatchingCarriers.ajax
→ Status: 504 (Gateway Timeout)
→ Duration: ~17 seconds (exceeds Wix 14s limit)
```

### Root Cause Analysis (from code investigation)

The `findMatchingCarriers()` function makes **~19-22 sequential Airtable API calls**, estimated at ~12s wall-clock time:

| Operation | Airtable Calls | Est. Time | Purpose |
|-----------|---------------|-----------|---------|
| Observability (log/trace) | ~10 | ~6,000ms | **startTrace + 4x log() + endTrace** — ALL AWAITED |
| Carrier query (500 limit) | 5 | ~3,500ms | Paginated at 100/page, NO pre-filtering |
| Config weights | 1 | ~600ms | `getCarrierMatchingWeights()` |
| Enrichments + Stats | 3 | ~1,800ms | `getExistingEnrichments` + 2x `getRecruiterStats` |
| **TOTAL** | **~19-22** | **~12,000ms** | Exceeds 14s Wix timeout on cold start |

**PRIMARY CAUSE:** Observability calls (logging/tracing) are `await`ed inline, adding ~6 seconds of pure overhead.

**SECONDARY CAUSE:** Carrier query fetches 500 records with NO geographic filter, requiring 5 paginated Airtable API calls.

### UX Issue
Error is shown via `alert()` dialog which blocks the entire page. Should use inline error UI instead.

---

## LEG 3: Application Submission — BLOCKED

Could not test. No search results returned due to LEG 2 504.

**Code analysis confirms the application flow exists and is wired:**
- Application modal accessible from search results
- `submitApplication` action registered in message registry
- Backend: `applicationService.jsw` → writes to `v2_Driver Carrier Interests` + updates `v2_Driver Profiles`
- Post-submission: lifecycle logging, confirmation email, achievement check, XP award

---

## LEG 4: Airtable Data Verification — BLOCKED

Could not verify. No application data was persisted.

**Expected tables (from code analysis):**
- `v2_Driver Carrier Interests` — application record with status='applied'
- `v2_Driver Profiles` — updated driver profile with submitted docs

---

## Prioritized Action Items

### P0 — Must Fix (Blocks Core Product)

| # | Action | File | Impact | Effort |
|---|--------|------|--------|--------|
| **1** | **Fire-and-forget observability** — Remove `await` from all `log()`, `startTrace()`, `logDatabase()`, `endTrace()` calls in `carrierMatching.jsw` | `src/backend/carrierMatching.jsw` L71-76, L81, L114, L214-222 | **-6,000ms** (12s→6s) | Low |
| **2** | **Add geographic filter to carrier query** — Pre-filter by state/region before fetching | `src/backend/carrierMatching.jsw` L106-107 | **-2,000ms** (6s→4s) | Medium |
| **3** | **Parallelize independent queries** — `Promise.all` the carrier query + config weights fetch | `src/backend/carrierMatching.jsw` L106, L120 | **-1,500ms** | Low |

### P1 — Should Fix (Degrades UX)

| # | Action | File | Impact |
|---|--------|------|--------|
| 4 | Replace `alert()` error dialog with inline error UI in AI Matching HTML | `src/public/driver/AI_MATCHING.html` | Prevents page-blocking modal on search failure |
| 5 | Fix landing page data fetch failures (featured carriers, platform stats, recent placements) | Landing page code + backend services | 3 empty sections on homepage |
| 6 | Investigate 25s `flushOnReadyCallbacks` timeout on landing page | masterPage.js / landing page code | Slow initial page experience |

### P2 — Nice to Have

| # | Action | File | Impact |
|---|--------|------|--------|
| 7 | Cache `getCarrierMatchingWeights()` with 5-min TTL | `src/backend/admin_config_service.jsw` | -500ms per search |
| 8 | Reduce carrier fetch limit for free tier (500→100-200) | `src/backend/carrierMatching.jsw` | -500ms + less data transfer |
| 9 | Fix Meta pixel traffic permissions | Facebook Business Manager config | Analytics gap |

---

## Estimated Recovery

| Fixes Applied | Search Time | Within Timeout? |
|---------------|-------------|-----------------|
| None (current) | ~12-17s | NO (504) |
| P0 #1 only | ~6s | YES |
| P0 #1 + #2 | ~4s | YES (comfortable) |
| P0 #1 + #2 + #3 | ~3s | YES (fast) |

**After applying P0 Fix #1 alone, the E2E test should be re-runnable end-to-end.**

---

## Test Artifacts

| File | Description |
|------|-------------|
| `scratchpad/e2e/leg1_landing_page.png` | Landing page screenshot |
| `scratchpad/e2e/leg1_ai_matching_loaded.png` | AI Matching page loaded |
| `scratchpad/e2e/leg2_form_filled.png` | Form with test data |
| `scratchpad/e2e/leg2_504_error_state.png` | Post-error state |
| `scratchpad/e2e/leg1_console_landing.md` | Landing page console logs |
| `scratchpad/e2e/leg1_console_ai_matching.md` | AI Matching console logs |
| `scratchpad/e2e/leg1_watcher_report.md` | Console watcher analysis (LEG 1) |
| `scratchpad/e2e/leg2_console_search.md` | Search attempt 1 console |
| `scratchpad/e2e/leg2_console_retry.md` | Search attempt 2 console |
| `scratchpad/e2e/leg2_504_investigation.md` | Full 504 root cause analysis |

---

## Re-Test Plan

Once P0 Fix #1 is applied:
1. Re-run LEG 2 (form fill + search) — expect carrier results
2. Execute LEG 3 (application submission from results)
3. Execute LEG 4 (verify `v2_Driver Carrier Interests` + `v2_Driver Profiles` in Airtable)
4. Full regression on LEG 1 landing page data fetches
