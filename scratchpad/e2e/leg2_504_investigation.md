# LEG 2: 504 Gateway Timeout Investigation

**Date:** 2026-02-09
**Scenario:** Anonymous free-tier user submits AI Matching preferences (ZIP=75001, 100mi, 0.55 CPM, Regional, Turnover<50%, TruckAge<3yr)
**Symptom:** 504 Gateway Timeout on `findMatchingCarriers()` call

---

## 1. Full Call Chain (Page Code -> Backend -> Airtable)

### Entry Point: `AI - Matching.rof4w.js` (page code)

```
handleFindMatches(driverPrefs, freshStatus)
  |
  +---> findMatchingCarriers(driverPrefs, isPremium=false)   // BACKEND - carrierMatching.jsw
  |
  +---> getMutualInterestForDriver(driverId)                 // ONLY if logged in (skipped for anon)
  |
  +---> enrichCarriersSequentially(needsEnrichment)          // AFTER results sent (non-blocking for 504)
```

For an **anonymous free-tier user**, only `findMatchingCarriers()` is in the critical path. The mutual interest and enrichment steps either don't execute (anon) or happen after results are already sent to the HTML.

### Inside `findMatchingCarriers()` (carrierMatching.jsw:67-258)

This is the function that times out. Here is every async call it makes, in order:

| Step | Function | Airtable Queries | Blocking? | Notes |
|------|----------|-----------------|-----------|-------|
| 0 | `startTrace()` | 1 INSERT to `systemTraces` | YES | Writes a trace record to Airtable before any work |
| 0b | `log()` (INFO) | 1-2 INSERTS (`systemLogs` + conditionally `systemErrors`) | YES | Awaited log call at line 81 |
| 1 | `updateDriverPreferences()` | 1 QUERY `driverProfiles` + 1 UPDATE `driverProfiles` | YES | **FAILS for anon user** (not logged in), caught gracefully |
| 2 | `dataAccess.queryRecords('carriers', {limit:500})` | **1 QUERY to Carriers (Master)** - up to 500 records, paginated at 100/page = **5 Airtable API calls** | YES | **THE BIG ONE** - ~25k record table, limit 500 |
| 2b | `logDatabase()` -> `log()` | 1-2 INSERTS | YES | Awaited at line 114 |
| 3 | `getCarrierMatchingWeights()` | 1 QUERY to `platformSettings` | YES | `findByField('platformSettings', 'settingKey', ...)` |
| 4 | `calculateMatchScore()` x 500 | 0 (pure CPU) | YES | Synchronous scoring loop - fast |
| 5 | `getExistingEnrichments(dotNumbers)` | 1 QUERY to `carrierEnrichments` (hasSome filter on 2 DOTs) | YES | Only top 2 results for free tier |
| 6 | `getRecruiterStats(dot)` x 2 via **Promise.all()** | **2 QUERIES** to `driverCarrierInterests` (1 per DOT) | YES | **Parallel request burst** |
| 7 | `log()` (completion) | 1-2 INSERTS | YES | |
| 8 | `endTrace()` | 1 QUERY `systemTraces` + 1 UPDATE `systemTraces` | YES | Fetches trace by trace_id, then updates |

### Total Airtable API Call Count (Free-Tier Anonymous User)

| Category | Count | Detail |
|----------|-------|--------|
| Observability (startTrace, log, logDatabase, endTrace) | **~10** | 1 trace insert + 4 log inserts + 1 trace query + 1 trace update + logDatabase calls |
| updateDriverPreferences (anon - fails fast) | **1** | Checks currentUser, fails before querying (0 Airtable calls for anon) |
| Carrier query (500 limit) | **5** | Airtable paginates at 100/page, so 500 records = 5 sequential API requests |
| Carrier query logDatabase | **1-2** | |
| getCarrierMatchingWeights | **1** | findByField -> queryRecords |
| getExistingEnrichments | **1** | Single hasSome query for 2 DOTs |
| getRecruiterStats x2 (Promise.all) | **2** | Parallel, but each queries driverCarrierInterests |
| **TOTAL** | **~19-22** | Sequential chain, with rate limiting (200ms between calls) |

### Estimated Wall-Clock Time

```
Airtable rate limit: 200ms between requests (configured in airtableClient.jsw)
API round-trip: ~300-800ms per request (Wix -> Airtable API)

Carrier query alone (5 pages):
  5 pages x (200ms delay + 500ms RTT) = ~3,500ms

Observability overhead:
  ~10 calls x (200ms delay + 400ms RTT) = ~6,000ms

Config/enrichment/stats:
  ~4 calls x (200ms delay + 400ms RTT) = ~2,400ms

TOTAL ESTIMATED: ~12,000ms (12 seconds)
```

**Wix backend function timeout is typically 14 seconds (web modules).** We are dangerously close.

---

## 2. Root Cause Analysis

### PRIMARY CAUSE: Observability Overhead (Inline Awaited Logging)

The `findMatchingCarriers` function **awaits** every single observability call:

- **Line 71-76**: `await startTrace(...)` -- inserts a record to Airtable BEFORE any work starts
- **Line 81**: `await log(...)` -- inserts to systemLogs BEFORE querying carriers
- **Line 114**: `await logDatabase(...)` -- inserts after carrier query
- **Lines 214-222**: `await log(...)` and `await endTrace(...)` -- inserts/updates AFTER results built

Each `log()` call at minimum does 1 `insertRecord` to Airtable (systemLogs). The `startTrace` does 1 insert. The `endTrace` does 1 query + 1 update. That's **~10 Airtable API calls just for observability**, all awaited sequentially.

### SECONDARY CAUSE: Carrier Query Fetches 500 Records Without Filters

```javascript
const result = await dataAccess.queryRecords('carriers', {
  limit: 500   // Line 106-107
});
```

This queries the `Carriers (Master)` table (~25k records) with **no filter formula**. Airtable paginates at 100 records per page, so this is **5 sequential API requests** with 200ms rate-limit delays between them.

There is NO pre-filtering by:
- ZIP code or region
- State
- Operation type
- Active/hiring status

All 500 carriers are fetched, then scored in-memory. The scoring itself is fast (pure CPU), but the data fetch is slow.

### TERTIARY CAUSE: Recruiter Stats `Promise.all()` Burst

```javascript
await Promise.all(dotNumbers.map(async (dot) => {
  const stats = await getRecruiterStats(dot);  // Line 187-190
  responsivenessStats[dot] = stats;
}));
```

For free tier (2 results), this fires 2 parallel Airtable queries. Each `getRecruiterStats` queries `driverCarrierInterests` with a limit of 1000. This is a moderate concern but not the primary bottleneck with only 2 DOTs.

### MITIGATING FACTOR: Anonymous User Skips Some Paths

For anonymous users:
- `updateDriverPreferences()` fails immediately (no currentUser) -- saves ~1-2 API calls
- `getMutualInterestForDriver()` is skipped in page code (not logged in) -- saves potentially **hundreds** of API calls
- Only 2 match results (free tier) -- limits enrichment/stats overhead

Even with these savings, the observability + carrier fetch overhead pushes us to ~12s, right at the timeout edge.

---

## 3. The Observability Tax - Detailed Breakdown

Every `log()` call in `observabilityService.jsw` does this:

```javascript
export async function log(logEntry) {
    // For ERROR/CRITICAL: insertRecord to 'systemErrors' (1 Airtable call)
    // ALWAYS: insertRecord to 'systemLogs' (1 Airtable call)
}
```

And `logDatabase()` calls `log()` internally with level DEBUG, which still inserts to systemLogs.

`startTrace()`:
```javascript
await dataAccess.insertRecord(COLLECTION_KEYS.traces, trace);  // 1 Airtable insert
```

`endTrace()`:
```javascript
await dataAccess.queryRecords(COLLECTION_KEYS.traces, { filters: { trace_id } });  // 1 query
// ... then update
await dataAccess.updateRecord(COLLECTION_KEYS.traces, updated);  // 1 update
```

**For the carrier matching flow, there are 5+ awaited observability calls = ~10 Airtable API requests purely for logging.**

---

## 4. Recommendations (Ordered by Impact)

### FIX 1 (Critical): Fire-and-Forget Observability
Convert all `await log(...)`, `await startTrace(...)`, `await logDatabase(...)`, and `await endTrace(...)` calls to non-blocking:

```javascript
// BEFORE (blocking):
await log({ level: 'INFO', source: 'carrier-matching', message: 'Starting carrier match', ... });

// AFTER (non-blocking):
log({ level: 'INFO', source: 'carrier-matching', message: 'Starting carrier match', ... }).catch(() => {});
```

**Impact: Removes ~6,000ms from critical path. Single biggest win.**

### FIX 2 (High): Add Airtable Filter Formula for Carrier Query
Pre-filter carriers by state or ZIP prefix before fetching:

```javascript
// BEFORE:
const result = await dataAccess.queryRecords('carriers', { limit: 500 });

// AFTER: Add filterByFormula to reduce result set
const result = await dataAccess.queryRecords('carriers', {
  filters: { phy_state: driverPrefs.state },  // Or ZIP prefix region
  limit: 200
});
```

With a state filter, a typical query might return 50-200 carriers instead of 500, reducing from 5 pages to 1-2 pages.

**Impact: Saves ~1,500-2,500ms.**

### FIX 3 (Medium): Parallelize Independent Operations
Several operations are independent and can run in parallel:

```javascript
// These can all run simultaneously:
const [carrierResult, globalWeights] = await Promise.all([
  dataAccess.queryRecords('carriers', { limit: 500 }),
  getCarrierMatchingWeights()
]);

// After scoring, these can also run in parallel:
const [cachedEnrichments, recruiterStatsResults] = await Promise.all([
  getExistingEnrichments(dotNumbers),
  Promise.all(dotNumbers.map(dot => getRecruiterStats(dot)))
]);
```

**Impact: Saves ~1,000-2,000ms by overlapping independent queries.**

### FIX 4 (Low): Cache Config Weights
`getCarrierMatchingWeights()` queries Airtable every single search. These weights rarely change. Cache them in-memory with a 5-minute TTL.

**Impact: Saves ~500ms per search after first call.**

### FIX 5 (Low): Reduce Carrier Limit for Free Tier
Free users only see 2 results. There's no need to fetch and score 500 carriers. A limit of 100-200 with geographic filtering would be sufficient.

---

## 5. Estimated Impact Summary

| Fix | Time Saved | Complexity | Priority |
|-----|-----------|------------|----------|
| Fire-and-forget observability | ~6,000ms | Low (remove `await`) | P0 |
| Filter carriers by geography | ~2,000ms | Medium (need ZIP-to-state mapping) | P1 |
| Parallelize independent queries | ~1,500ms | Low (Promise.all refactor) | P1 |
| Cache config weights | ~500ms | Low (module-level cache) | P2 |
| Reduce carrier fetch limit | ~500ms | Low (config change) | P2 |

**After FIX 1 alone:** ~12s -> ~6s (well within 14s timeout)
**After FIX 1+2+3:** ~12s -> ~3-4s (comfortable margin)

---

## 6. Why It Might Work Sometimes

The 504 is intermittent because:
1. **Airtable API latency varies** (300-800ms per call depending on load)
2. **Carrier table pagination** - if there are <100 carriers that match, it's 1 page instead of 5
3. **Rate limit backoff** - if other concurrent requests triggered rate limiting, exponential backoff adds seconds
4. The **Wix Velo runtime cold start** can add 1-3s on first invocation

On a warm runtime with fast Airtable responses, it might complete in ~8-10s. On a cold start with slow Airtable, it blows past 14s.

---

## 7. Files Involved

| File | Role | Key Lines |
|------|------|-----------|
| `src/pages/AI - Matching.rof4w.js` | Page code entry point | L506-589 (handleFindMatches) |
| `src/backend/carrierMatching.jsw` | Main matching service | L67-258 (findMatchingCarriers) |
| `src/backend/dataAccess.jsw` | Data routing layer | L37-79 (queryRecords) |
| `src/backend/airtableClient.jsw` | Airtable API client | L1951-2005 (queryRecords), L22-42 (CONFIG) |
| `src/backend/configData.js` | Collection routing config | L32 (carriers -> 'airtable'), L556 (carriers -> 'Carriers') |
| `src/backend/observabilityService.jsw` | Logging/tracing | L81-133 (log), L190-211 (startTrace), L246+ (endTrace) |
| `src/backend/recruiterStats.jsw` | Carrier responsiveness | L7-51 (getRecruiterStats) |
| `src/backend/scoring.js` | Pure scoring functions | L227-262 (calculateMatchScore) |
| `src/backend/admin_config_service.jsw` | Config weights | L152-154 (getCarrierMatchingWeights) |
| `src/backend/driverProfiles.jsw` | Driver profile updates | L215-263 (updateDriverPreferences) |
| `src/backend/mutualInterestService.jsw` | Mutual interest check | Not in critical path for anon users |
