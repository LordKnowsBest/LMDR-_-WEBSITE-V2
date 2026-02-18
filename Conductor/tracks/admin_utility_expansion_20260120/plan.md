# Track Plan: Admin Utility Expansion

## Overview

This track implements three features to maximize the utility of existing admin tools:
1. **Phase 1:** Cost Optimizer Mode
2. **Phase 2:** Anomaly Alerts
3. **Phase 3:** Compliance Reports

---

## Phase 1: Cost Optimizer Mode

### 1.1 Data Model & Collection Setup
- [x] Task: Create `AIProviderCosts` collection with schema (providerId, modelId, costPer1kInputTokens, costPer1kOutputTokens, qualityScore, avgLatencyMs, availabilityRate, lastUpdated, isActive)
- [x] Task: Create `CostOptimizerConfig` collection (singleton pattern) with schema (enabled, qualityThreshold, maxCostPerRequest, preferredProviders, excludedProviders)
- [x] Task: Seed initial provider cost data for Claude, Gemini, Perplexity, OpenAI, Groq, Mistral
- [x] Task: Set default config values (enabled: false, qualityThreshold: 0.80, maxCostPerRequest: 0.10)

### 1.2 Backend: Cost Tracking Functions
- [x] Task: Add `getCostOptimizerConfig()` function in `aiRouterService.jsw`
- [x] Task: Add `updateCostOptimizerConfig(config)` function with admin validation
- [x] Task: Add `getProviderCostMetrics()` function to return all provider cost/quality data
- [x] Task: Add `updateProviderCostData(providerId, costData)` function for scheduled updates
- [x] Task: Add `calculateQualityScore(providerId)` helper based on success rate and latency

### 1.3 Backend: Cost-Optimized Routing Logic
- [x] Task: Modify `routeAIRequest()` to check if cost optimizer is enabled
- [x] Task: Implement `selectOptimalProvider(functionId, request)` that:
  - Filters providers by quality threshold
  - Filters providers by max cost
  - Excludes blocked providers
  - Sorts by cost ascending
  - Returns cheapest eligible provider
- [x] Task: Add cost logging to each AI request (actual cost, would-be cost with default, savings)
- [x] Task: Handle fallback when optimal provider fails (try next cheapest eligible)

### 1.4 Backend: Savings Reporting
- [x] Task: Add `getCostSavingsReport(period)` function calculating:
  - Total cost with optimizer
  - Estimated cost without optimizer
  - Total savings
  - Requests optimized count
  - Average savings per request
- [x] Task: Add daily cost aggregation for trend analysis
- [x] Task: Create `updateProviderCosts` scheduler job (hourly) to refresh quality scores

### 1.5 Frontend: ADMIN_AI_ROUTER.html Updates
- [x] Task: Add "Cost Optimizer" section with ON/OFF toggle
- [x] Task: Add quality threshold slider (0.5 to 1.0, step 0.05)
- [x] Task: Add max cost per request input field
- [x] Task: Add excluded providers checkboxes
- [x] Task: Create provider cost comparison table (sortable by cost, quality, latency)
- [x] Task: Add savings dashboard cards (total savings, requests optimized, avg savings)
- [x] Task: Add period selector for savings (day, week, month)
- [x] Task: Add cost by provider bar chart (optimized vs default)

### 1.6 Integration & Testing
- [x] Task: Add cost optimizer integration to existing AI enrichment flow
- [x] Task: Write unit tests for `selectOptimalProvider()` edge cases
- [x] Task: Write integration test verifying cost savings calculation
- [x] Task: Add audit logging for cost optimizer config changes
- [x] Task: Conductor - User Manual Verification 'Phase 1' [checkpoint: 5a4a857]

---

## Phase 2: Anomaly Alerts

### 2.1 Data Model & Collection Setup
- [x] Task: Create `AnomalyAlerts` collection with schema (type, severity, source, metric, expectedValue, actualValue, deviation, message, detectedAt, resolvedAt, resolvedBy, acknowledged, autoResolved)
- [x] Task: Create `AnomalyRules` collection with schema (name, type, metric, condition, threshold, windowMinutes, severity, enabled, cooldownMinutes, notifyEmail, notifyDashboard)
- [x] Task: Create `BaselineMetrics` collection with schema (metric, source, hourOfDay, dayOfWeek, mean, stdDev, sampleCount, lastUpdated)
- [x] Task: Seed default anomaly rules:
  - API Error Spike (>2 std dev, 15 min window, critical)
  - Latency Drift (>3x avg, 1 hour window, warning)
  - Cost Spike (>150% avg, 1 hour window, warning)
  - Traffic Drop (<50% avg, 30 min window, info)
  - Job Failure (missed run, immediate, critical)

### 2.2 Backend: Baseline Calculation
- [x] Task: Add `calculateBaseline(metric, windowDays)` function in `observabilityService.jsw`
- [x] Task: Implement hourly/daily pattern detection (account for time-of-day variance)
- [x] Task: Create `updateBaselines` scheduler job (runs daily at midnight)
- [x] Task: Store baseline metrics with hour-of-day and day-of-week segmentation
- [x] Task: Implement rolling window calculation (exponential moving average)

### 2.3 Backend: Anomaly Detection Engine
- [x] Task: Add `runAnomalyDetection()` function (called by scheduler every 5 min)
- [x] Task: Implement error spike detection:
  - Query SystemLogs for errors in time window
  - Compare to baseline error rate
  - Trigger if deviation > threshold
- [x] Task: Implement latency drift detection:
  - Query SystemTraces for average latency
  - Compare to baseline latency
  - Trigger if ratio > threshold
- [x] Task: Implement cost spike detection:
  - Query AIProviderCosts for hourly cost
  - Compare to average hourly cost
  - Trigger if ratio > threshold
- [x] Task: Implement traffic drop detection:
  - Query request volume in window
  - Compare to baseline volume
  - Trigger if ratio < threshold
- [x] Task: Implement pattern break detection:
  - Check for missed scheduled job runs
  - Trigger immediately on detection
- [x] Task: Add cooldown logic to prevent alert spam

### 2.4 Backend: Alert Management Functions
- [x] Task: Add `getActiveAnomalies(options)` function with filters (severity, type, acknowledged)
- [x] Task: Add `acknowledgeAnomaly(alertId)` function
- [x] Task: Add `resolveAnomaly(alertId, notes)` function
- [x] Task: Add `getAnomalyRules()` function
- [x] Task: Add `updateAnomalyRule(ruleId, updates)` function with admin validation
- [x] Task: Add `createAnomalyRule(rule)` function for custom rules
- [x] Task: Add `deleteAnomalyRule(ruleId)` function
- [x] Task: Add `getAnomalyHistory(period)` function for trend analysis

### 2.5 Backend: Alert Notifications
- [x] Task: Implement email notification for critical alerts
- [x] Task: Add dashboard notification count to SystemAlerts collection
- [x] Task: Implement auto-resolve logic when metrics return to normal
- [x] Task: Add alert escalation for unacknowledged critical alerts (>15 min)

### 2.6 Frontend: ADMIN_OBSERVABILITY.html Updates
- [x] Task: Add "Active Alerts" section with alert cards:
  - Severity indicator (color-coded icon)
  - Alert message with metric details
  - Deviation from baseline
  - Acknowledge and Resolve buttons
  - Link to relevant logs/traces
- [x] Task: Add "Detection Rules" section:
  - Table of all rules (name, type, threshold, status)
  - Edit rule modal
  - Enable/disable toggle per rule
  - Add custom rule button
- [x] Task: Add "Anomaly Trends" section:
  - Alerts by type bar chart
  - Alerts by severity pie chart
  - Timeline view (day/week/month)
- [x] Task: Add real-time alert badge in header (unread count)
- [x] Task: Add alert sound option for critical alerts

### 2.7 Integration & Testing
- [x] Task: Register `runAnomalyDetection` in jobs.config (every 5 minutes)
- [x] Task: Register `updateBaselines` in jobs.config (daily at midnight)
- [x] Task: Write unit tests for each anomaly detection type
- [x] Task: Write integration test simulating error spike
- [x] Task: Add audit logging for rule changes
- [x] Task: Conductor - User Manual Verification 'Phase 2'

---

## Phase 3: Compliance Reports

### 3.1 Data Model & Collection Setup
- [x] Task: Create `ComplianceReports` collection with schema (reportType, name, description, dateRangeStart, dateRangeEnd, filters, format, status, fileUrl, fileSize, recordCount, requestedBy, requestedAt, completedAt, expiresAt, scheduledId)
- [x] Task: Create `ScheduledReports` collection with schema (name, reportType, frequency, dayOfWeek, dayOfMonth, timeOfDay, format, filters, recipients, enabled, lastRun, nextRun, createdBy)
- [x] Task: Define report type templates:
  - admin_activity: All AdminAuditLog entries with action type 'admin'
  - data_access: All profile views, searches, data exports
  - system_changes: Config changes, permission changes, rule updates
  - security_events: Failed logins, anomaly alerts, rate limit hits
  - full_audit: Complete AdminAuditLog
  - custom: User-defined filters

### 3.2 Backend: Report Generation Engine
- [x] Task: Add `generateComplianceReport(options)` function in `admin_audit_service.jsw`:
  - Validate admin permissions (Super Admin or Compliance Admin)
  - Create report record with status 'generating'
  - Query relevant collections based on reportType
  - Apply date range and filters
  - Format output (CSV, JSON, or PDF)
  - Store file and update record with URL
  - Set expiration (7 days)
- [x] Task: Implement CSV generation with proper escaping
- [x] Task: Implement JSON generation with nested structure
- [x] Task: Implement PDF generation (table format with headers)
- [x] Task: Add PII masking option (last 4 of email, masked phone)
- [x] Task: Handle large reports (>10K records) with pagination/streaming

### 3.3 Backend: Report Template Functions
- [x] Task: Add `getReportTemplates()` function returning all report type definitions
- [x] Task: Add `getReportStatus(reportId)` function for checking generation progress
- [x] Task: Add `listComplianceReports(options)` function with pagination
- [x] Task: Add `deleteComplianceReport(reportId)` function (admin only)
- [x] Task: Add `downloadReport(reportId)` function with expiration check

### 3.4 Backend: Scheduled Reports
- [x] Task: Add `createScheduledReport(schedule)` function
- [x] Task: Add `updateScheduledReport(scheduleId, updates)` function
- [x] Task: Add `deleteScheduledReport(scheduleId)` function
- [x] Task: Add `getScheduledReports()` function
- [x] Task: Add `runScheduledReports()` scheduler function:
  - Query due schedules (nextRun <= now)
  - Generate report for each
  - Email to recipients
  - Update lastRun and calculate nextRun
- [x] Task: Implement frequency calculations (daily, weekly, monthly)

### 3.5 Backend: Data Aggregation
- [x] Task: Create helper `aggregateAdminActivity(dateRange, filters)`:
  - Query AdminAuditLog by category
  - Group by admin, action type
  - Include action counts
- [x] Task: Create helper `aggregateDataAccess(dateRange, filters)`:
  - Query CarrierDriverViews
  - Query ProfileViews
  - Include search queries from logs
- [x] Task: Create helper `aggregateSecurityEvents(dateRange, filters)`:
  - Query failed login attempts from SystemLogs
  - Include AnomalyAlerts
  - Include rate limit events

### 3.6 Frontend: ADMIN_AUDIT_LOG.html Updates
- [x] Task: Add "Quick Reports" section with 6 report type cards:
  - Admin Activity
  - Data Access
  - System Changes
  - Security Events
  - Full Audit Trail
  - Custom Report
  - Each with Generate button
- [x] Task: Add "Report Configuration" panel:
  - Date range picker (presets: 7d, 30d, 90d, custom)
  - Category checkboxes
  - Format radio buttons (CSV, JSON, PDF)
  - Include options (IP addresses, user agents, full PII)
  - Generate button
- [x] Task: Add "Scheduled Reports" section:
  - Table of schedules (name, type, frequency, next run)
  - Edit/delete actions
  - New schedule modal:
    - Name input
    - Report type dropdown
    - Frequency selection (daily/weekly/monthly)
    - Time selection
    - Recipients input
    - Format selection
- [x] Task: Add "Recent Reports" section:
  - Table of generated reports (name, date, records, size)
  - Download button per report
  - Status indicator (generating, complete, failed, expired)
- [x] Task: Add progress indicator for report generation
- [x] Task: Add toast notification when report ready

### 3.7 Integration & Testing
- [x] Task: Register `runScheduledReports` in jobs.config (daily at 6 AM UTC)
- [x] Task: Configure file storage for report files (Wix Media Manager or external)
- [x] Task: Write unit tests for report generation (each type)
- [x] Task: Write integration test for scheduled report execution
- [x] Task: Add audit logging for report generation and downloads
- [x] Task: Test PII masking accuracy
- [x] Task: Conductor - User Manual Verification 'Phase 3'

---

## Phase 4: Polish & Launch

### 4.1 Performance Optimization
- [x] Task: Add caching for provider cost metrics (5 min TTL)
- [x] Task: Optimize baseline calculation queries with indexes
- [x] Task: Implement report generation queuing for concurrent requests
- [x] Task: Add loading states and progress indicators to all UI sections

### 4.2 Documentation
- [x] Task: Document cost optimizer configuration options
- [x] Task: Document anomaly rule creation and thresholds
- [x] Task: Document compliance report types and fields
- [x] Task: Create admin user guide for new features
- [x] Task: Update CLAUDE.md with new collections and functions

### 4.3 Security Review
- [x] Task: Verify admin role checks on all new endpoints
- [x] Task: Verify audit logging for all config changes
- [x] Task: Verify PII handling in compliance reports
- [x] Task: Test report download link expiration

### 4.4 Final Verification
- [x] Task: End-to-end test: Enable cost optimizer, verify routing changes
- [x] Task: End-to-end test: Simulate error spike, verify alert appears
- [x] Task: End-to-end test: Generate all report types, verify downloads
- [x] Task: Conductor - Final Verification & Launch [checkpoint: 1d24d6c]

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Cost Optimizer | 1 week | admin_portal complete |
| Phase 2: Anomaly Alerts | 1.5 weeks | observability_gaps complete |
| Phase 3: Compliance Reports | 1 week | admin_portal complete |
| Phase 4: Polish & Launch | 0.5 week | Phases 1-3 complete |

**Total Estimated Duration:** 4 weeks

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Cost optimizer routes to low-quality provider | Quality threshold prevents routing below acceptable level; fallback to default on failure |
| Anomaly detection generates too many false positives | Cooldown periods; tunable thresholds; easy disable per rule |
| Large compliance reports time out | Async generation with status polling; file streaming for large datasets |
| Scheduled reports fail silently | Failure logging; admin notification on consecutive failures |

---

## Success Criteria

- [x] Cost optimizer reduces AI costs by >15% with <5% quality degradation
- [x] Anomaly alerts detect test error spike within 5 minutes
- [x] All 6 compliance report types generate successfully
- [x] Scheduled reports execute on time with email delivery
- [x] All features accessible only to authorized admin roles
- [x] All configuration changes logged to audit trail

