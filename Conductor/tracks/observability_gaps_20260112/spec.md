# Observability Gaps Implementation Plan

**Track:** observability_gaps_20260112
**Created:** 2026-01-12
**Status:** In Progress

## Summary

This track addresses critical observability gaps identified in the recruiter reverse matching system, specifically in `driverMatching.jsw`.

## Gaps Identified

### Gap 1: Missing Distributed Tracing in driverMatching.jsw ✅ FIXED

**Problem:** The `driverMatching.jsw` service had no distributed tracing despite being the primary revenue-driving reverse matching engine. This made it impossible to correlate errors across carrier requests or monitor performance.

**Solution Implemented:**
- Added import of observability functions: `log`, `logDatabase`, `startTrace`, `endTrace`
- Added `startTrace('findMatchingDrivers', {...})` at function entry
- Added `logDatabase({...})` for DriverProfiles query with latency tracking
- Added `log({...})` calls for key events (access denied, no drivers found)
- Added `endTrace(traceId, status, summary)` on all exit paths (success, error, denied)
- Included `traceId` in response for debugging

### Gap 2: Silent Scoring Failures ✅ FIXED

**Problem:** When `calculateDriverMatchScore()` failed, drivers were silently included in results with a 0 score. Users might think 0-score drivers are legitimately low-match when they're actually failed-to-score.

**Solution Implemented:**
- Added `scoringFailures` counter to track failures
- Added `scoringFailed` flag per driver in results
- Changed silent catch to log WARN with driver ID, error message, and available fields
- Added rationale entry: "Scoring calculation failed - default score applied"
- Added summary log when any scoring failures occur with failure rate percentage

## Changes Made

### File: `src/backend/driverMatching.jsw`

**Line 15:** Added import
```javascript
import { log, logDatabase, startTrace, endTrace } from 'backend/observabilityService';
```

**Lines 258-274:** Added trace initialization
```javascript
const startTime = Date.now();
const trace = await startTrace('findMatchingDrivers', {
  carrierDot,
  filterCount: Object.keys(filters).length,
  tags: ['driver-matching', 'search', 'reverse-matching']
});
const traceId = trace.traceId;

await log({
  level: 'INFO',
  source: 'driver-matching',
  message: 'Starting driver search',
  traceId,
  details: { carrierDot, filters: Object.keys(filters), options: Object.keys(options) }
});
```

**Lines 280-282:** Access denied logging
```javascript
await log({ level: 'WARN', source: 'driver-matching', message: `Access denied: ${accessCheck.error}`, traceId });
await endTrace(traceId, 'denied', { error: accessCheck.error, elapsed: Date.now() - startTime });
```

**Lines 318-334:** Database operation logging
```javascript
const queryStartTime = Date.now();
const queryResult = await query.find();
const queryLatency = Date.now() - queryStartTime;

await logDatabase({
  operation: 'query',
  collection: 'DriverProfiles',
  affectedRows: drivers.length,
  latencyMs: queryLatency,
  traceId
});
```

**Lines 370-399:** Scoring failure tracking and logging
```javascript
let scoringFailures = 0;
// ...
} catch (err) {
  scoringFailures++;
  scoringFailed = true;
  score = 0;
  rationale = ['Scoring calculation failed - default score applied'];

  await log({
    level: 'WARN',
    source: 'driver-matching',
    message: `Scoring failed for driver ${driver._id}`,
    traceId,
    details: { driverId: driver._id, error: err.message, driverFields: Object.keys(driver) }
  });
}
```

**Lines 421-429:** Scoring summary log
```javascript
if (scoringFailures > 0) {
  await log({
    level: 'WARN',
    source: 'driver-matching',
    message: `Scoring completed with ${scoringFailures} failures out of ${drivers.length} drivers`,
    traceId,
    details: { scoringFailures, totalDrivers: drivers.length, failureRate: ... }
  });
}
```

**Lines 456-478:** Success completion logging
```javascript
await log({
  level: 'INFO',
  source: 'driver-matching',
  message: `Search complete: ${paginatedResults.length} results returned`,
  traceId,
  duration: elapsed,
  details: { totalDrivers, totalScored, returned, scoringFailures, carrierDot, planType }
});

await endTrace(traceId, 'completed', { totalMatches, totalScored, scoringFailures, elapsed });
```

**Lines 501-509:** Error logging
```javascript
await log({
  level: 'ERROR',
  source: 'driver-matching',
  message: `Search failed: ${err.message}`,
  traceId,
  details: { error: err.message, stack: err.stack }
});
await endTrace(traceId, 'error', { error: err.message, elapsed: Date.now() - startTime });
```

## Remaining Gaps (Future Work)

### Gap 3: No Retry Mechanism
- **Status:** Not yet addressed
- **Impact:** Transient database failures cause immediate failure
- **Recommendation:** Add exponential backoff retry (1s, 2s, 4s max) for database operations

### Gap 4: Incomplete Empty Result Messaging
- **Status:** Not yet addressed
- **Impact:** Users can't distinguish between "no matches" vs "data issue" vs "error"
- **Recommendation:** Return specific message codes for different empty result causes

### Gap 5: subscriptionService.jsw Missing Try-Catch
- **Status:** Not yet addressed
- **Impact:** Database errors could propagate unhandled
- **Recommendation:** Wrap `getSubscription()` queries in try-catch

## Testing

Run existing tests to ensure no regressions:
```bash
npm test -- --testPathPattern=driverMatching
```

## Observability Dashboard

After deployment, verify traces appear in:
- SystemLogs collection (source: 'driver-matching')
- SystemTraces collection (name: 'findMatchingDrivers')
- ADMIN_OBSERVABILITY.html dashboard

Filter by tags: `driver-matching`, `search`, `reverse-matching`
