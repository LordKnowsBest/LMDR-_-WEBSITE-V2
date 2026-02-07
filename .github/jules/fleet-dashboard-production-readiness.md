# Jules Task: Fleet Dashboard Production Readiness — Verification Report Action Items

## Context

Read the report at `VERIFICATION_REPORT.md` in the repo root. This is the Carrier Fleet Dashboard verification report (Track: `carrier_fleet_dashboard_20260120`). All unit tests, static analysis, integration, UI/UX, and security checks passed. However, the report identifies **3 critical action items** that must be resolved before production readiness.

Also read the track plan at `Conductor/tracks/carrier_fleet_dashboard_20260120/plan.md` for full context on what has been built.

## Your Objective

Implement the 3 action items from the "Action Items for Production" section of the verification report.

---

## Action Item 1: ELD Integration — Replace Mock Data

**Report Finding:** `eldIntegrationService.jsw` currently returns mock/stubbed data instead of real API calls.

**What to do:**

1. Open `src/backend/eldIntegrationService.jsw` and identify all functions returning mock data.
2. Implement real API integration with Motive (KeepTruckin) and/or Samsara ELD providers:
   - Add API client configuration (base URL, auth headers) using Wix Secrets Manager for API keys.
   - Replace mock location data with real GPS polling from the ELD provider.
   - Replace mock HOS (Hours of Service) data with real driver status fetches.
   - Replace mock vehicle diagnostics with real fault code retrieval.
3. Implement proper error handling:
   - Graceful fallback when ELD provider is unreachable (return last-known data with a `stale: true` flag).
   - Rate limiting to stay within provider API quotas.
   - Retry logic with exponential backoff for transient failures.
4. Write unit tests mocking the external API responses:
   - Test successful data fetch and transformation.
   - Test error/timeout scenarios return graceful fallbacks.
   - Test rate limiting behavior.

**Key files:**
- `src/backend/eldIntegrationService.jsw` — Main file to modify.
- `src/backend/fleetService.jsw` — Calls ELD service; verify integration still works.
- `Conductor/tracks/carrier_fleet_dashboard_20260120/spec.md` — Reference for expected data shapes.

---

## Action Item 2: TMS Integration — Connect Capacity Planning to Real Load Data

**Report Finding:** `capacityPlanningService.jsw` needs a real load source instead of mock data.

**What to do:**

1. Open `src/backend/capacityPlanningService.jsw` and identify where load/shipment data is mocked.
2. Implement a TMS data adapter:
   - Create a `tmsIntegrationService.jsw` if one doesn't exist.
   - Define a normalized load data interface (load_id, origin, destination, pickup_date, delivery_date, equipment_type, status, weight, miles).
   - Implement fetching active/upcoming loads from external TMS or from the platform's internal load board.
   - If no external TMS is configured for a carrier, fall back to pulling from the `v2_Loads` or `v2_JobPostings` Airtable collection if it exists.
3. Update `capacityPlanningService.jsw`:
   - Replace mock load arrays with calls to the TMS adapter.
   - Ensure utilization calculations (`calculateUtilization`) use real driver-to-load ratios.
   - Ensure capacity forecasting uses real historical data.
4. Write unit tests:
   - Test utilization calculation with various driver/load ratios.
   - Test forecast accuracy with known historical data sets.
   - Test fallback behavior when TMS is unavailable.

**Key files:**
- `src/backend/capacityPlanningService.jsw` — Main file to modify.
- `src/backend/dataAccess.jsw` — For Airtable collection queries.
- `src/backend/config.jsw` / `src/public/config/configData.js` — For collection name mappings.

---

## Action Item 3: Performance Monitoring — Sync Job Timeout Protection

**Report Finding:** The `syncAllFleetLocations` job runs every 5 minutes and may timeout as fleet sizes grow.

**What to do:**

1. Open the sync function (likely in `src/backend/fleetService.jsw` or `src/backend/eldIntegrationService.jsw`) that handles `syncAllFleetLocations`.
2. Implement batch processing:
   - Instead of syncing all drivers in one pass, process in batches of 25-50 drivers.
   - Add a batch cursor/offset so if the job times out, the next run picks up where it left off.
   - Store `lastSyncCursor` and `lastSyncTimestamp` in a config collection or Wix Secrets.
3. Add execution time guard:
   - Track elapsed time within the job.
   - If approaching the Wix scheduled job timeout limit (~30 seconds for Wix backend jobs), gracefully stop and save progress.
   - Log a warning: `"Sync incomplete: processed X of Y drivers. Will resume next cycle."`
4. Add monitoring/observability:
   - Log batch completion metrics: `{ batchSize, processedCount, totalDrivers, elapsedMs }`.
   - If a sync cycle consistently fails to complete, flag it for admin attention.
5. Write unit tests:
   - Test batch processing correctly splits large fleets.
   - Test cursor resume picks up from last position.
   - Test timeout guard triggers at the right threshold.
   - Test metrics logging output.

**Key files:**
- `src/backend/fleetService.jsw` or `src/backend/eldIntegrationService.jsw` — Sync function.
- `src/backend/jobs.config` — Scheduled job configuration.

---

## Workflow

Follow the project's TDD workflow from `Conductor/workflow.md`:
1. For each action item, write failing tests first (Red phase).
2. Implement the minimum code to pass (Green phase).
3. Refactor for clarity.
4. Commit with format: `feat(fleet): <description>` for new features or `fix(fleet): <description>` for corrections.
5. Attach git notes summarizing changes per the workflow.

## Success Criteria

- ELD service makes real (or properly configured) API calls, with graceful fallbacks.
- Capacity planning uses real load data, with fallback to internal collections.
- Sync job processes in batches with timeout protection and resume capability.
- All existing fleet dashboard tests still pass (no regressions).
- New tests cover all three action items with >80% coverage.
