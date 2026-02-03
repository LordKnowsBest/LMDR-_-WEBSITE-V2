# Track Plan: Observability Gaps

## Phase 1: Core Observability Infrastructure [checkpoint: implemented]
- [x] Task: Create `backend/observabilityService.jsw` with dual-source routing (Wix/Airtable).
- [x] Task: Implement core logging functions (`log`, `logAIOperation`, `logExternalAPI`, `logDatabase`).
- [x] Task: Implement tracing functions (`startTrace`, `startSpan`, `endTrace`).
- [x] Task: Implement Super Admin query functions (`getLogs`, `getErrors`, `getHealthMetrics`, `getAIAnalytics`).
- [x] Task: Add data sanitization and helper functions.

## Phase 2: Integration with Key Services [checkpoint: implemented]
- [x] Task: Integrate observability into `backend/driverMatching.jsw` (scoring, matching).
- [x] Task: Integrate observability into `backend/aiRouterService.jsw` (AI operations).
- [x] Task: Integrate observability into `backend/socialScanner.jsw`.
- [x] Task: Integrate observability into `backend/ocrService.jsw`.
- [x] Task: Integrate observability into `backend/carrierMatching.jsw`.
- [x] Task: Integrate observability into `backend/fmcsaService.jsw`.

## Phase 3: Data Persistence [checkpoint: implemented]
- [x] Task: Configure Airtable routing for SystemLogs, SystemTraces, SystemErrors, SystemMetrics.
- [x] Task: Verify fallback to Wix Collections when Airtable is not configured/available.
