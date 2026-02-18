# Track Plan: Admin Utility Expansion

## Overview

This track implements three features to maximize the utility of existing admin tools:
1. **Phase 1:** Cost Optimizer Mode
2. **Phase 2:** Anomaly Alerts
3. **Phase 3:** Compliance Reports

---

## Phase 1: Cost Optimizer Mode

### 1.1 Data Model & Collection Setup
- [~] Task: Create `AIProviderCosts` collection with schema (providerId, modelId, costPer1kInputTokens, costPer1kOutputTokens, qualityScore, avgLatencyMs, availabilityRate, lastUpdated, isActive)
- [ ] Task: Create `CostOptimizerConfig` collection (singleton pattern) with schema (enabled, qualityThreshold, maxCostPerRequest, preferredProviders, excludedProviders)
- [ ] Task: Seed initial provider cost data for Claude, Gemini, Perplexity, OpenAI, Groq, Mistral
- [ ] Task: Set default config values (enabled: false, qualityThreshold: 0.80, maxCostPerRequest: 0.10)

### 1.2 Backend: Cost Tracking Functions
- [ ] Task: Add `getCostOptimizerConfig()` function in `aiRouterService.jsw`
- [ ] Task: Add `updateCostOptimizerConfig(config)` function with admin validation
- [ ] Task: Add `getProviderCostMetrics()` function to return all provider cost/quality data
- [ ] Task: Add `updateProviderCostData(providerId, costData)` function for scheduled updates
- [ ] Task: Add `calculateQualityScore(providerId)` helper based on success rate and latency

### 1.3 Backend: Cost-Optimized Routing Logic
- [ ] Task: Modify `routeAIRequest()` to check if cost optimizer is enabled
- [ ] Task: Implement `selectOptimalProvider(functionId, request)` that:
  - Filters providers by quality threshold
  - Filters providers by max cost
  - Excludes blocked providers
  - Sorts by cost ascending
  - Returns cheapest eligible provider
- [ ] Task: Add cost logging to each AI request (actual cost, would-be cost with default, savings)
- [ ] Task: Handle fallback when optimal provider fails (try next cheapest eligible)

### 1.4 Backend: Savings Reporting
- [ ] Task: Add `getCostSavingsReport(period)` function calculating:
  - Total cost with optimizer
  - Estimated cost without optimizer
  - Total savings
  - Requests optimized count
  - Average savings per request
- [ ] Task: Add daily cost aggregation for trend analysis
- [ ] Task: Create `updateProviderCosts` scheduler job (hourly) to refresh quality scores

### 1.5 Frontend: ADMIN_AI_ROUTER.html Updates
- [ ] Task: Add "Cost Optimizer" section with ON/OFF toggle
- [ ] Task: Add quality threshold slider (0.5 to 1.0, step 0.05)
- [ ] Task: Add max cost per request input field
- [ ] Task: Add excluded providers checkboxes
- [ ] Task: Create provider cost comparison table (sortable by cost, quality, latency)
- [ ] Task: Add savings dashboard cards (total savings, requests optimized, avg savings)
- [ ] Task: Add period selector for savings (day, week, month)
- [ ] Task: Add cost by provider bar chart (optimized vs default)

### 1.6 Integration & Testing
- [ ] Task: Add cost optimizer integration to existing AI enrichment flow
- [ ] Task: Write unit tests for `selectOptimalProvider()` edge cases
- [ ] Task: Write integration test verifying cost savings calculation
- [ ] Task: Add audit logging for cost optimizer config changes
- [ ] Task: Conductor - User Manual Verification 'Phase 1'

---

## Phase 2: Anomaly Alerts

### 2.1 Data Model & Collection Setup
- [ ] Task: Create `AnomalyAlerts` collection with schema (type, severity, source, metric, expectedValue, actualValue, deviation, message, detectedAt, resolvedAt, resolvedBy, acknowledged, autoResolved)
- [ ] Task: Create `AnomalyRules` collection with schema (name, type, metric, condition, threshold, windowMinutes, severity, enabled, cooldownMinutes, notifyEmail, notifyDashboard)
- [ ] Task: Create `BaselineMetrics` collection with schema (metric, source, hourOfDay, dayOfWeek, mean, stdDev, sampleCount, lastUpdated)
- [ ] Task: Seed default anomaly rules:
  - API Error Spike (>2 std dev, 15 min window, critical)
  - Latency Drift (>3x avg, 1 hour window, warning)
  - Cost Spike (>150% avg, 1 hour window, warning)
  - Traffic Drop (<50% avg, 30 min window, info)
  - Job Failure (missed run, immediate, critical)

### 2.2 Backend: Baseline Calculation
- [ ] Task: Add `calculateBaseline(metric, windowDays)` function in `observabilityService.jsw`
- [ ] Task: Implement hourly/daily pattern detection (account for time-of-day variance)
- [ ] Task: Create `updateBaselines` scheduler job (runs daily at midnight)
- [ ] Task: Store baseline metrics with hour-of-day and day-of-week segmentation
- [ ] Task: Implement rolling window calculation (exponential moving average)

### 2.3 Backend: Anomaly Detection Engine
- [ ] Task: Add `runAnomalyDetection()` function (called by scheduler every 5 min)
- [ ] Task: Implement error spike detection:
  - Query SystemLogs for errors in time window
  - Compare to baseline error rate
  - Trigger if deviation > threshold
- [ ] Task: Implement latency drift detection:
  - Query SystemTraces for average latency
  - Compare to baseline latency
  - Trigger if ratio > threshold
- [ ] Task: Implement cost spike detection:
  - Query AIProviderCosts for hourly cost
  - Compare to average hourly cost
  - Trigger if ratio > threshold
- [ ] Task: Implement traffic drop detection:
  - Query request volume in window
  - Compare to baseline volume
  - Trigger if ratio < threshold
- [ ] Task: Implement pattern break detection:
  - Check for missed scheduled job runs
  - Trigger immediately on detection
- [ ] Task: Add cooldown logic to prevent alert spam

### 2.4 Backend: Alert Management Functions
- [ ] Task: Add `getActiveAnomalies(options)` function with filters (severity, type, acknowledged)
- [ ] Task: Add `acknowledgeAnomaly(alertId)` function
- [ ] Task: Add `resolveAnomaly(alertId, notes)` function
- [ ] Task: Add `getAnomalyRules()` function
- [ ] Task: Add `updateAnomalyRule(ruleId, updates)` function with admin validation
- [ ] Task: Add `createAnomalyRule(rule)` function for custom rules
- [ ] Task: Add `deleteAnomalyRule(ruleId)` function
- [ ] Task: Add `getAnomalyHistory(period)` function for trend analysis

### 2.5 Backend: Alert Notifications
- [ ] Task: Implement email notification for critical alerts
- [ ] Task: Add dashboard notification count to SystemAlerts collection
- [ ] Task: Implement auto-resolve logic when metrics return to normal
- [ ] Task: Add alert escalation for unacknowledged critical alerts (>15 min)

### 2.6 Frontend: ADMIN_OBSERVABILITY.html Updates
- [ ] Task: Add "Active Alerts" section with alert cards:
  - Severity indicator (color-coded icon)
  - Alert message with metric details
  - Deviation from baseline
  - Acknowledge and Resolve buttons
  - Link to relevant logs/traces
- [ ] Task: Add "Detection Rules" section:
  - Table of all rules (name, type, threshold, status)
  - Edit rule modal
  - Enable/disable toggle per rule
  - Add custom rule button
- [ ] Task: Add "Anomaly Trends" section:
  - Alerts by type bar chart
  - Alerts by severity pie chart
  - Timeline view (day/week/month)
- [ ] Task: Add real-time alert badge in header (unread count)
- [ ] Task: Add alert sound option for critical alerts

### 2.7 Integration & Testing
- [ ] Task: Register `runAnomalyDetection` in jobs.config (every 5 minutes)
- [ ] Task: Register `updateBaselines` in jobs.config (daily at midnight)
- [ ] Task: Write unit tests for each anomaly detection type
- [ ] Task: Write integration test simulating error spike
- [ ] Task: Add audit logging for rule changes
- [ ] Task: Conductor - User Manual Verification 'Phase 2'

---

## Phase 3: Compliance Reports

### 3.1 Data Model & Collection Setup
- [ ] Task: Create `ComplianceReports` collection with schema (reportType, name, description, dateRangeStart, dateRangeEnd, filters, format, status, fileUrl, fileSize, recordCount, requestedBy, requestedAt, completedAt, expiresAt, scheduledId)
- [ ] Task: Create `ScheduledReports` collection with schema (name, reportType, frequency, dayOfWeek, dayOfMonth, timeOfDay, format, filters, recipients, enabled, lastRun, nextRun, createdBy)
- [ ] Task: Define report type templates:
  - admin_activity: All AdminAuditLog entries with action type 'admin'
  - data_access: All profile views, searches, data exports
  - system_changes: Config changes, permission changes, rule updates
  - security_events: Failed logins, anomaly alerts, rate limit hits
  - full_audit: Complete AdminAuditLog
  - custom: User-defined filters

### 3.2 Backend: Report Generation Engine
- [ ] Task: Add `generateComplianceReport(options)` function in `admin_audit_service.jsw`:
  - Validate admin permissions (Super Admin or Compliance Admin)
  - Create report record with status 'generating'
  - Query relevant collections based on reportType
  - Apply date range and filters
  - Format output (CSV, JSON, or PDF)
  - Store file and update record with URL
  - Set expiration (7 days)
- [ ] Task: Implement CSV generation with proper escaping
- [ ] Task: Implement JSON generation with nested structure
- [ ] Task: Implement PDF generation (table format with headers)
- [ ] Task: Add PII masking option (last 4 of email, masked phone)
- [ ] Task: Handle large reports (>10K records) with pagination/streaming

### 3.3 Backend: Report Template Functions
- [ ] Task: Add `getReportTemplates()` function returning all report type definitions
- [ ] Task: Add `getReportStatus(reportId)` function for checking generation progress
- [ ] Task: Add `listComplianceReports(options)` function with pagination
- [ ] Task: Add `deleteComplianceReport(reportId)` function (admin only)
- [ ] Task: Add `downloadReport(reportId)` function with expiration check

### 3.4 Backend: Scheduled Reports
- [ ] Task: Add `createScheduledReport(schedule)` function
- [ ] Task: Add `updateScheduledReport(scheduleId, updates)` function
- [ ] Task: Add `deleteScheduledReport(scheduleId)` function
- [ ] Task: Add `getScheduledReports()` function
- [ ] Task: Add `runScheduledReports()` scheduler function:
  - Query due schedules (nextRun <= now)
  - Generate report for each
  - Email to recipients
  - Update lastRun and calculate nextRun
- [ ] Task: Implement frequency calculations (daily, weekly, monthly)

### 3.5 Backend: Data Aggregation
- [ ] Task: Create helper `aggregateAdminActivity(dateRange, filters)`:
  - Query AdminAuditLog by category
  - Group by admin, action type
  - Include action counts
- [ ] Task: Create helper `aggregateDataAccess(dateRange, filters)`:
  - Query CarrierDriverViews
  - Query ProfileViews
  - Include search queries from logs
- [ ] Task: Create helper `aggregateSecurityEvents(dateRange, filters)`:
  - Query failed login attempts from SystemLogs
  - Include AnomalyAlerts
  - Include rate limit events

### 3.6 Frontend: ADMIN_AUDIT_LOG.html Updates
- [ ] Task: Add "Quick Reports" section with 6 report type cards:
  - Admin Activity
  - Data Access
  - System Changes
  - Security Events
  - Full Audit Trail
  - Custom Report
  - Each with Generate button
- [ ] Task: Add "Report Configuration" panel:
  - Date range picker (presets: 7d, 30d, 90d, custom)
  - Category checkboxes
  - Format radio buttons (CSV, JSON, PDF)
  - Include options (IP addresses, user agents, full PII)
  - Generate button
- [ ] Task: Add "Scheduled Reports" section:
  - Table of schedules (name, type, frequency, next run)
  - Edit/delete actions
  - New schedule modal:
    - Name input
    - Report type dropdown
    - Frequency selection (daily/weekly/monthly)
    - Time selection
    - Recipients input
    - Format selection
- [ ] Task: Add "Recent Reports" section:
  - Table of generated reports (name, date, records, size)
  - Download button per report
  - Status indicator (generating, complete, failed, expired)
- [ ] Task: Add progress indicator for report generation
- [ ] Task: Add toast notification when report ready

### 3.7 Integration & Testing
- [ ] Task: Register `runScheduledReports` in jobs.config (daily at 6 AM UTC)
- [ ] Task: Configure file storage for report files (Wix Media Manager or external)
- [ ] Task: Write unit tests for report generation (each type)
- [ ] Task: Write integration test for scheduled report execution
- [ ] Task: Add audit logging for report generation and downloads
- [ ] Task: Test PII masking accuracy
- [ ] Task: Conductor - User Manual Verification 'Phase 3'

---

## Phase 4: Polish & Launch

### 4.1 Performance Optimization
- [ ] Task: Add caching for provider cost metrics (5 min TTL)
- [ ] Task: Optimize baseline calculation queries with indexes
- [ ] Task: Implement report generation queuing for concurrent requests
- [ ] Task: Add loading states and progress indicators to all UI sections

### 4.2 Documentation
- [ ] Task: Document cost optimizer configuration options
- [ ] Task: Document anomaly rule creation and thresholds
- [ ] Task: Document compliance report types and fields
- [ ] Task: Create admin user guide for new features
- [ ] Task: Update CLAUDE.md with new collections and functions

### 4.3 Security Review
- [ ] Task: Verify admin role checks on all new endpoints
- [ ] Task: Verify audit logging for all config changes
- [ ] Task: Verify PII handling in compliance reports
- [ ] Task: Test report download link expiration

### 4.4 Final Verification
- [ ] Task: End-to-end test: Enable cost optimizer, verify routing changes
- [ ] Task: End-to-end test: Simulate error spike, verify alert appears
- [ ] Task: End-to-end test: Generate all report types, verify downloads
- [ ] Task: Conductor - Final Verification & Launch

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

- [ ] Cost optimizer reduces AI costs by >15% with <5% quality degradation
- [ ] Anomaly alerts detect test error spike within 5 minutes
- [ ] All 6 compliance report types generate successfully
- [ ] Scheduled reports execute on time with email delivery
- [ ] All features accessible only to authorized admin roles
- [ ] All configuration changes logged to audit trail
