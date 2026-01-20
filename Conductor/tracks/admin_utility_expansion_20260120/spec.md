# Specification: Admin Utility Expansion

## 1. Overview

This track expands the utility of existing admin features to provide cost optimization, proactive anomaly detection, and compliance reporting capabilities. Rather than building new infrastructure, we enhance three existing admin tools:

1. **Cost Optimizer Mode** - Auto-route AI requests to the cheapest provider meeting quality thresholds
2. **Anomaly Alerts** - Auto-detect unusual patterns (error spikes, latency drift, usage anomalies)
3. **Compliance Reports** - One-click export of audit logs for compliance audits

**Key Principle:** Maximize ROI by extending existing infrastructure rather than building new systems.

---

## 2. Architecture Overview

```
+------------------------------------------------------------------+
|                        ADMIN PORTAL                               |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------+  +-------------------+  +----------------+ |
|  | ADMIN_AI_ROUTER   |  | ADMIN_OBSERV...   |  | ADMIN_AUDIT... | |
|  | .html             |  | .html             |  | .html          | |
|  +--------+----------+  +--------+----------+  +-------+--------+ |
|           |                      |                     |          |
+------------------------------------------------------------------+
            |                      |                     |
            v                      v                     v
+------------------------------------------------------------------+
|                        BACKEND SERVICES                           |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------+  +-------------------+  +----------------+ |
|  | aiRouterService   |  | observability...  |  | admin_audit... | |
|  | .jsw              |  | .jsw              |  | .jsw           | |
|  |                   |  |                   |  |                | |
|  | + getCostMetrics  |  | + getAnomalies    |  | + exportCompli | |
|  | + setCostMode     |  | + setAlertRules   |  |   anceReport   | |
|  | + getProviderCost |  | + detectSpikes    |  | + scheduleRpt  | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                  |
+------------------------------------------------------------------+
            |                      |                     |
            v                      v                     v
+------------------------------------------------------------------+
|                        WIX COLLECTIONS                            |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------+  +-------------------+  +----------------+ |
|  | AIProviderCosts   |  | AnomalyAlerts     |  | Compliance-    | |
|  | (NEW)             |  | (NEW)             |  | Reports (NEW)  | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                  |
|  +-------------------+  +-------------------+  +----------------+ |
|  | SystemLogs        |  | SystemTraces      |  | AdminAuditLog  | |
|  | (EXISTING)        |  | (EXISTING)        |  | (EXISTING)     | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 3. Feature 1: Cost Optimizer Mode

### 3.1 Overview

Automatically route AI requests to the most cost-effective provider that meets a configurable quality threshold. This builds on the existing `aiRouterService.jsw` which already tracks provider usage.

### 3.2 Architecture

```
                        AI Request Flow (Cost-Optimized)
+------------------------------------------------------------------------+
|                                                                        |
|  Incoming Request                                                      |
|       |                                                                |
|       v                                                                |
|  +--------------------+                                                |
|  | routeAIRequest()   |                                                |
|  +--------------------+                                                |
|       |                                                                |
|       v                                                                |
|  +--------------------+     +-------------------------+                |
|  | getCostMode()      |---->| CostOptimizerConfig     |                |
|  +--------------------+     | - enabled: boolean      |                |
|       |                     | - qualityThreshold: 0-1 |                |
|       | if enabled          | - maxCostPerRequest: $  |                |
|       v                     +-------------------------+                |
|  +--------------------+                                                |
|  | getEligibleProviders() |                                            |
|  +--------------------+                                                |
|       |                                                                |
|       v                                                                |
|  +------------------------+     +-------------------------+            |
|  | For each provider:     |     | AIProviderCosts         |            |
|  | - Check quality score  |---->| - providerId            |            |
|  | - Get cost per 1K tok  |     | - costPer1kInput        |            |
|  | - Check availability   |     | - costPer1kOutput       |            |
|  +------------------------+     | - qualityScore (0-1)    |            |
|       |                         | - avgLatencyMs          |            |
|       v                         | - lastUpdated           |            |
|  +------------------------+     +-------------------------+            |
|  | Sort by cost ASC       |                                            |
|  | Filter by quality >=   |                                            |
|  +------------------------+                                            |
|       |                                                                |
|       v                                                                |
|  +------------------------+                                            |
|  | Select cheapest        |                                            |
|  | meeting threshold      |                                            |
|  +------------------------+                                            |
|       |                                                                |
|       v                                                                |
|  +------------------------+                                            |
|  | Execute request        |                                            |
|  | Log cost savings       |                                            |
|  +------------------------+                                            |
|                                                                        |
+------------------------------------------------------------------------+
```

### 3.3 Data Model

**New Collection: `AIProviderCosts`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `providerId` | String | claude, perplexity, gemini, openai, groq, mistral |
| `modelId` | String | Specific model identifier |
| `costPer1kInputTokens` | Number | Cost in USD per 1K input tokens |
| `costPer1kOutputTokens` | Number | Cost in USD per 1K output tokens |
| `qualityScore` | Number | 0-1 score based on task success rate |
| `avgLatencyMs` | Number | Rolling average response latency |
| `availabilityRate` | Number | 0-1 uptime percentage (last 24h) |
| `lastUpdated` | DateTime | Last cost/quality update |
| `isActive` | Boolean | Whether provider is currently usable |

**New Collection: `CostOptimizerConfig`** (Single-record config)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | "config" (singleton) |
| `enabled` | Boolean | Master toggle for cost optimizer |
| `qualityThreshold` | Number | Minimum quality score (0-1) |
| `maxCostPerRequest` | Number | Maximum allowed cost per request |
| `preferredProviders` | Array | Ordered preference list (tiebreaker) |
| `excludedProviders` | Array | Providers to never use |
| `updatedBy` | Reference | Admin who last modified |
| `updatedAt` | DateTime | Last modification time |

### 3.4 API Design

**New Functions in `aiRouterService.jsw`:**

```javascript
/**
 * Get current cost optimizer configuration
 * @returns {Object} { enabled, qualityThreshold, maxCostPerRequest, ... }
 */
export async function getCostOptimizerConfig()

/**
 * Update cost optimizer settings
 * @param {Object} config - New configuration
 * @returns {Object} Updated config
 */
export async function updateCostOptimizerConfig(config)

/**
 * Get cost metrics for all providers
 * @returns {Array} Provider cost/quality data
 */
export async function getProviderCostMetrics()

/**
 * Update provider cost data (called by scheduled job or admin)
 * @param {String} providerId - Provider to update
 * @param {Object} costData - New cost/quality metrics
 */
export async function updateProviderCostData(providerId, costData)

/**
 * Calculate cost savings from optimizer mode
 * @param {String} period - 'day', 'week', 'month'
 * @returns {Object} { totalSavings, requestsOptimized, avgSavingsPerRequest }
 */
export async function getCostSavingsReport(period)
```

### 3.5 UI Mockup - Cost Optimizer Panel

```
+------------------------------------------------------------------------+
|  ADMIN_AI_ROUTER.html - Cost Optimizer Mode                            |
+------------------------------------------------------------------------+
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  COST OPTIMIZER                                    [ON] Toggle   |  |
|  +------------------------------------------------------------------+  |
|  |                                                                  |  |
|  |  Quality Threshold          Max Cost/Request                     |  |
|  |  [====|====] 0.85          [$0.05           ]                    |  |
|  |   0.5      1.0                                                   |  |
|  |                                                                  |  |
|  |  Excluded Providers: [ ] Claude  [ ] GPT-4  [x] Mistral         |  |
|  |                                                                  |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  PROVIDER COST COMPARISON                                        |  |
|  +------------------------------------------------------------------+  |
|  |  Provider    | Input/1K | Output/1K | Quality | Latency | Status |  |
|  |  ------------|----------|-----------|---------|---------|--------|  |
|  |  Claude 3    | $0.015   | $0.075    | 0.95    | 1.2s    | Active |  |
|  |  Gemini 2    | $0.002   | $0.008    | 0.88    | 0.8s    | Active |  |
|  |  Perplexity  | $0.001   | $0.001    | 0.82    | 1.5s    | Active |  |
|  |  GPT-4o      | $0.005   | $0.015    | 0.92    | 1.1s    | Active |  |
|  |  Groq        | $0.0003  | $0.0003   | 0.78    | 0.3s    | Active |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  SAVINGS DASHBOARD                        Period: [This Week v]  |  |
|  +------------------------------------------------------------------+  |
|  |                                                                  |  |
|  |  +----------------+  +----------------+  +------------------+    |  |
|  |  | Total Savings  |  | Requests       |  | Avg Savings/Req  |    |  |
|  |  |    $127.45     |  | Optimized      |  |     $0.032       |    |  |
|  |  |   +18% vs last |  |    3,982       |  |                  |    |  |
|  |  +----------------+  +----------------+  +------------------+    |  |
|  |                                                                  |  |
|  |  Cost by Provider (Optimized vs Default):                        |  |
|  |  +===========================================+                   |  |
|  |  | Claude    ||||||||||||||||||||  $89.20    |                   |  |
|  |  | Gemini    ||||||               $28.40    |                   |  |
|  |  | Groq      ||||                 $9.85     |                   |  |
|  |  +===========================================+                   |  |
|  |                                                                  |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## 4. Feature 2: Anomaly Alerts

### 4.1 Overview

Automatically detect unusual patterns in system metrics and alert admins proactively. This extends `observabilityService.jsw` with statistical anomaly detection.

### 4.2 Architecture

```
                     Anomaly Detection Pipeline
+------------------------------------------------------------------------+
|                                                                        |
|  +------------------+      +------------------+     +--------------+   |
|  | SystemLogs       |----->| Baseline         |     | AnomalyAlerts|   |
|  | SystemTraces     |      | Calculator       |     | Collection   |   |
|  | AIProviderCosts  |      +------------------+     +--------------+   |
|  +------------------+             |                        ^           |
|                                   v                        |           |
|                          +------------------+              |           |
|                          | Anomaly Detector |              |           |
|                          | (Scheduled Job)  |--------------+           |
|                          +------------------+                          |
|                                   |                                    |
|                                   v                                    |
|                          +------------------+                          |
|                          | Alert Router     |                          |
|                          +------------------+                          |
|                             |    |    |                                |
|                             v    v    v                                |
|                    +------+ +----+ +----------+                        |
|                    |Email | |UI  | |Dashboard |                        |
|                    |Notif | |Bell| |Highlight |                        |
|                    +------+ +----+ +----------+                        |
|                                                                        |
+------------------------------------------------------------------------+

                     Anomaly Types Detected
+------------------------------------------------------------------------+
|                                                                        |
|  +-------------------+  +-------------------+  +-------------------+   |
|  | ERROR SPIKE       |  | LATENCY DRIFT     |  | USAGE ANOMALY     |   |
|  |-------------------|  |-------------------|  |-------------------|   |
|  | Detect: Error     |  | Detect: Response  |  | Detect: Unusual   |   |
|  | rate > 2x std dev |  | time > 3x normal  |  | API call patterns |   |
|  | Window: 15 min    |  | Window: 1 hour    |  | Window: 1 day     |   |
|  +-------------------+  +-------------------+  +-------------------+   |
|                                                                        |
|  +-------------------+  +-------------------+  +-------------------+   |
|  | COST SPIKE        |  | TRAFFIC DROP      |  | PATTERN BREAK     |   |
|  |-------------------|  |-------------------|  |-------------------|   |
|  | Detect: Hourly    |  | Detect: Request   |  | Detect: Missing   |   |
|  | cost > 150% avg   |  | vol < 50% normal  |  | scheduled jobs    |   |
|  | Window: 1 hour    |  | Window: 30 min    |  | Window: Immediate |   |
|  +-------------------+  +-------------------+  +-------------------+   |
|                                                                        |
+------------------------------------------------------------------------+
```

### 4.3 Data Model

**New Collection: `AnomalyAlerts`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `type` | String | error_spike, latency_drift, usage_anomaly, cost_spike, traffic_drop, pattern_break |
| `severity` | String | critical, warning, info |
| `source` | String | Service or component that triggered |
| `metric` | String | Specific metric name |
| `expectedValue` | Number | Baseline expected value |
| `actualValue` | Number | Detected anomalous value |
| `deviation` | Number | Standard deviations from normal |
| `message` | String | Human-readable description |
| `detectedAt` | DateTime | When anomaly was detected |
| `resolvedAt` | DateTime | When marked resolved (null if active) |
| `resolvedBy` | Reference | Admin who resolved |
| `acknowledged` | Boolean | Whether admin has seen |
| `autoResolved` | Boolean | Whether system auto-resolved |

**New Collection: `AnomalyRules`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `name` | String | Rule name (e.g., "API Error Spike") |
| `type` | String | error_spike, latency_drift, etc. |
| `metric` | String | Metric to monitor |
| `condition` | String | gt, lt, deviation |
| `threshold` | Number | Trigger threshold |
| `windowMinutes` | Number | Time window for calculation |
| `severity` | String | Alert severity when triggered |
| `enabled` | Boolean | Whether rule is active |
| `cooldownMinutes` | Number | Min time between alerts |
| `notifyEmail` | Boolean | Send email notification |
| `notifyDashboard` | Boolean | Show in dashboard |

**New Collection: `BaselineMetrics`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `metric` | String | Metric name |
| `source` | String | Service source |
| `hourOfDay` | Number | 0-23 for hourly patterns |
| `dayOfWeek` | Number | 0-6 for weekly patterns |
| `mean` | Number | Rolling average |
| `stdDev` | Number | Rolling standard deviation |
| `sampleCount` | Number | Number of samples |
| `lastUpdated` | DateTime | Last recalculation |

### 4.4 API Design

**New Functions in `observabilityService.jsw`:**

```javascript
/**
 * Get active anomaly alerts
 * @param {Object} options - { severity, type, acknowledged }
 * @returns {Array} Active alerts
 */
export async function getActiveAnomalies(options = {})

/**
 * Acknowledge an anomaly alert
 * @param {String} alertId - Alert to acknowledge
 * @returns {Object} Updated alert
 */
export async function acknowledgeAnomaly(alertId)

/**
 * Resolve an anomaly alert
 * @param {String} alertId - Alert to resolve
 * @param {String} notes - Resolution notes
 * @returns {Object} Updated alert
 */
export async function resolveAnomaly(alertId, notes)

/**
 * Get anomaly detection rules
 * @returns {Array} All configured rules
 */
export async function getAnomalyRules()

/**
 * Update an anomaly detection rule
 * @param {String} ruleId - Rule to update
 * @param {Object} updates - Rule updates
 * @returns {Object} Updated rule
 */
export async function updateAnomalyRule(ruleId, updates)

/**
 * Run anomaly detection (called by scheduler)
 * @returns {Array} New alerts generated
 */
export async function runAnomalyDetection()

/**
 * Calculate baseline metrics for a time window
 * @param {String} metric - Metric name
 * @param {Number} windowDays - Days to analyze
 * @returns {Object} { mean, stdDev, samples }
 */
export async function calculateBaseline(metric, windowDays)

/**
 * Get anomaly history for trending
 * @param {String} period - 'day', 'week', 'month'
 * @returns {Array} Historical anomalies
 */
export async function getAnomalyHistory(period)
```

### 4.5 UI Mockup - Anomaly Alerts Panel

```
+------------------------------------------------------------------------+
|  ADMIN_OBSERVABILITY.html - Anomaly Alerts                             |
+------------------------------------------------------------------------+
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  ACTIVE ALERTS                                         [3 New]   |  |
|  +------------------------------------------------------------------+  |
|  |                                                                  |  |
|  |  [!] CRITICAL - Error Spike Detected                  2 min ago  |  |
|  |      Source: aiRouterService                                     |  |
|  |      Error rate: 15.2% (baseline: 2.1%, +6.2 std dev)           |  |
|  |      [Acknowledge]  [Resolve]  [View Logs]                       |  |
|  |  -----------------------------------------------------------------|  |
|  |  [*] WARNING - Latency Drift                         15 min ago  |  |
|  |      Source: driverMatching                                      |  |
|  |      Avg latency: 4.2s (baseline: 1.1s, +2.8 std dev)           |  |
|  |      [Acknowledge]  [Resolve]  [View Traces]                     |  |
|  |  -----------------------------------------------------------------|  |
|  |  [i] INFO - Unusual Usage Pattern                    1 hour ago  |  |
|  |      Source: carrierEnrichment                                   |  |
|  |      Enrichment requests: 340/hr (baseline: 45/hr)               |  |
|  |      [Acknowledge]  [Resolve]  [View Details]                    |  |
|  |                                                                  |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  DETECTION RULES                              [+ Add Rule]       |  |
|  +------------------------------------------------------------------+  |
|  |  Rule Name           | Type        | Threshold  | Status         |  |
|  |  --------------------|-------------|------------|----------------|  |
|  |  API Error Spike     | error_spike | >2 std dev | [ON]          |  |
|  |  Latency Alert       | latency     | >3x avg    | [ON]          |  |
|  |  Cost Spike          | cost        | >150% avg  | [ON]          |  |
|  |  Traffic Drop        | traffic     | <50% avg   | [OFF]         |  |
|  |  Job Failure         | pattern     | missed run | [ON]          |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  ANOMALY TRENDS                            Period: [7 Days v]    |  |
|  +------------------------------------------------------------------+  |
|  |                                                                  |  |
|  |  Alerts by Type:                  Alerts by Severity:            |  |
|  |  Error Spike    |||||||| 12      Critical  |||| 4               |  |
|  |  Latency        ||||| 8          Warning   |||||||| 14          |  |
|  |  Cost           ||| 5            Info      |||||| 10            |  |
|  |  Traffic        || 3                                             |  |
|  |                                                                  |  |
|  |  Timeline:                                                       |  |
|  |  Mon  Tue  Wed  Thu  Fri  Sat  Sun                              |  |
|  |   *    *         *                  *   Critical                |  |
|  |   **   *    *    **   *        *   **   Warning                 |  |
|  |   *    **   *    *    *    *   *    *   Info                    |  |
|  |                                                                  |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## 5. Feature 3: Compliance Reports

### 5.1 Overview

Provide one-click export of audit logs in formats suitable for compliance audits (SOC 2, HIPAA-adjacent requirements, internal audits). This extends `admin_audit_service.jsw`.

### 5.2 Architecture

```
                     Compliance Report Generation
+------------------------------------------------------------------------+
|                                                                        |
|  +-----------------+     +------------------+     +----------------+   |
|  | Report Request  |---->| Report Generator |---->| File Storage   |   |
|  | (UI or Schedule)|     +------------------+     +----------------+   |
|  +-----------------+            |                        |             |
|                                 |                        v             |
|                                 |                 +----------------+   |
|                                 |                 | ComplianceRpts |   |
|                                 |                 | Collection     |   |
|                                 |                 +----------------+   |
|                                 v                                      |
|  +------------------------------------------------------------------+  |
|  |                      Data Sources                                 |  |
|  +------------------------------------------------------------------+  |
|  |  +--------------+  +---------------+  +----------------+          |  |
|  |  | AdminAuditLog|  | SystemLogs    |  | DriverCarrier- |          |  |
|  |  | (all admin   |  | (system       |  | Interests      |          |  |
|  |  |  actions)    |  |  operations)  |  | (data access)  |          |  |
|  |  +--------------+  +---------------+  +----------------+          |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+

                        Report Types
+------------------------------------------------------------------------+
|                                                                        |
|  +--------------------+  +--------------------+  +------------------+  |
|  | ADMIN ACTIVITY     |  | DATA ACCESS        |  | SYSTEM CHANGES   |  |
|  | REPORT             |  | REPORT             |  | REPORT           |  |
|  |--------------------|  |--------------------|  |------------------|  |
|  | - Login events     |  | - PII access logs  |  | - Config changes |  |
|  | - User management  |  | - Profile views    |  | - Rule updates   |  |
|  | - Permission chgs  |  | - Data exports     |  | - API key rotates|  |
|  | - Content moderat. |  | - Search queries   |  | - Permission chg |  |
|  +--------------------+  +--------------------+  +------------------+  |
|                                                                        |
|  +--------------------+  +--------------------+  +------------------+  |
|  | SECURITY EVENTS    |  | FULL AUDIT TRAIL   |  | CUSTOM REPORT    |  |
|  | REPORT             |  | (All Categories)   |  | BUILDER          |  |
|  |--------------------|  |--------------------|  |------------------|  |
|  | - Failed logins    |  | - Complete log     |  | - Select events  |  |
|  | - Suspicious IPs   |  | - All categories   |  | - Date range     |  |
|  | - Rate limit hits  |  | - Chronological    |  | - Filter actors  |  |
|  | - Anomaly alerts   |  | - Searchable       |  | - Custom format  |  |
|  +--------------------+  +--------------------+  +------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

### 5.3 Data Model

**New Collection: `ComplianceReports`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `reportType` | String | admin_activity, data_access, system_changes, security_events, full_audit, custom |
| `name` | String | Report display name |
| `description` | String | Report purpose |
| `dateRangeStart` | DateTime | Start of audit period |
| `dateRangeEnd` | DateTime | End of audit period |
| `filters` | Object | Applied filters |
| `format` | String | csv, json, pdf |
| `status` | String | pending, generating, complete, failed |
| `fileUrl` | String | Download URL when complete |
| `fileSize` | Number | File size in bytes |
| `recordCount` | Number | Number of records included |
| `requestedBy` | Reference | Admin who requested |
| `requestedAt` | DateTime | Request timestamp |
| `completedAt` | DateTime | Generation completion time |
| `expiresAt` | DateTime | When download link expires (7 days) |
| `scheduledId` | String | If from scheduled report |

**New Collection: `ScheduledReports`**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `name` | String | Schedule name |
| `reportType` | String | Type of report |
| `frequency` | String | daily, weekly, monthly |
| `dayOfWeek` | Number | 0-6 for weekly |
| `dayOfMonth` | Number | 1-31 for monthly |
| `timeOfDay` | String | HH:MM in UTC |
| `format` | String | csv, json, pdf |
| `filters` | Object | Report filters |
| `recipients` | Array | Email addresses |
| `enabled` | Boolean | Whether schedule is active |
| `lastRun` | DateTime | Last execution |
| `nextRun` | DateTime | Next scheduled execution |
| `createdBy` | Reference | Admin who created |

### 5.4 API Design

**New Functions in `admin_audit_service.jsw`:**

```javascript
/**
 * Generate a compliance report
 * @param {Object} options - Report configuration
 * @returns {Object} { reportId, status }
 */
export async function generateComplianceReport(options)

/**
 * Get available report templates
 * @returns {Array} Report type definitions
 */
export async function getReportTemplates()

/**
 * Get report generation status
 * @param {String} reportId - Report to check
 * @returns {Object} Report status and download URL if ready
 */
export async function getReportStatus(reportId)

/**
 * List generated reports
 * @param {Object} options - { limit, offset, type }
 * @returns {Array} Report history
 */
export async function listComplianceReports(options)

/**
 * Create scheduled report
 * @param {Object} schedule - Schedule configuration
 * @returns {Object} Created schedule
 */
export async function createScheduledReport(schedule)

/**
 * Update scheduled report
 * @param {String} scheduleId - Schedule to update
 * @param {Object} updates - Schedule updates
 * @returns {Object} Updated schedule
 */
export async function updateScheduledReport(scheduleId, updates)

/**
 * Delete scheduled report
 * @param {String} scheduleId - Schedule to delete
 * @returns {Boolean} Success
 */
export async function deleteScheduledReport(scheduleId)

/**
 * Get scheduled reports
 * @returns {Array} All schedules
 */
export async function getScheduledReports()

/**
 * Run scheduled reports (called by scheduler job)
 * @returns {Array} Reports generated
 */
export async function runScheduledReports()
```

### 5.5 UI Mockup - Compliance Reports Panel

```
+------------------------------------------------------------------------+
|  ADMIN_AUDIT_LOG.html - Compliance Reports                             |
+------------------------------------------------------------------------+
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  QUICK REPORTS                                                   |  |
|  +------------------------------------------------------------------+  |
|  |                                                                  |  |
|  |  +-------------------+  +-------------------+  +---------------+ |  |
|  |  | Admin Activity    |  | Data Access       |  | Security      | |  |
|  |  |                   |  |                   |  | Events        | |  |
|  |  | All admin actions |  | PII access, views |  | Failed logins | |  |
|  |  | from audit log    |  | exports, searches |  | anomalies     | |  |
|  |  |                   |  |                   |  |               | |  |
|  |  | [Generate CSV]    |  | [Generate CSV]    |  | [Generate]    | |  |
|  |  +-------------------+  +-------------------+  +---------------+ |  |
|  |                                                                  |  |
|  |  +-------------------+  +-------------------+  +---------------+ |  |
|  |  | System Changes    |  | Full Audit Trail  |  | Custom        | |  |
|  |  |                   |  |                   |  | Report        | |  |
|  |  | Config, rules,    |  | Complete audit    |  | Build your    | |  |
|  |  | permissions       |  | log export        |  | own report    | |  |
|  |  |                   |  |                   |  |               | |  |
|  |  | [Generate CSV]    |  | [Generate CSV]    |  | [Configure]   | |  |
|  |  +-------------------+  +-------------------+  +---------------+ |  |
|  |                                                                  |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  REPORT CONFIGURATION                                            |  |
|  +------------------------------------------------------------------+  |
|  |                                                                  |  |
|  |  Date Range:  [2026-01-01] to [2026-01-20]     [Last 30 Days]   |  |
|  |                                                                  |  |
|  |  Categories:  [x] Admin  [x] System  [ ] Carrier  [ ] Driver    |  |
|  |                                                                  |  |
|  |  Format:      ( ) CSV   (x) JSON   ( ) PDF                       |  |
|  |                                                                  |  |
|  |  Include:     [x] IP Addresses  [x] User Agents  [ ] Full PII   |  |
|  |                                                                  |  |
|  |                                        [Generate Report]         |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  SCHEDULED REPORTS                           [+ New Schedule]    |  |
|  +------------------------------------------------------------------+  |
|  |  Name               | Type          | Frequency | Next Run      |  |
|  |  -------------------|---------------|-----------|---------------|  |
|  |  Weekly Admin Audit | admin_activity| Weekly    | Mon 6:00 AM   |  |
|  |  Monthly Full Audit | full_audit    | Monthly   | Feb 1, 6:00AM |  |
|  |  Daily Security     | security      | Daily     | Tomorrow 6AM  |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  +------------------------------------------------------------------+  |
|  |  RECENT REPORTS                                                  |  |
|  +------------------------------------------------------------------+  |
|  |  Report              | Generated    | Records | Size  | Action  |  |
|  |  --------------------|--------------|---------|-------|---------|  |
|  |  Admin Activity Jan  | 2026-01-19   | 1,247   | 2.4MB | [Download]|
|  |  Security Events     | 2026-01-18   | 89      | 124KB | [Download]|
|  |  Full Audit Q4 2025  | 2026-01-01   | 45,892  | 28MB  | [Download]|
|  +------------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## 6. Integration Points

### 6.1 Existing Services Extended

| Service | New Functions | Purpose |
|---------|---------------|---------|
| `aiRouterService.jsw` | `getCostOptimizerConfig`, `updateCostOptimizerConfig`, `getProviderCostMetrics`, `getCostSavingsReport` | Cost optimization |
| `observabilityService.jsw` | `getActiveAnomalies`, `acknowledgeAnomaly`, `resolveAnomaly`, `getAnomalyRules`, `runAnomalyDetection`, `calculateBaseline` | Anomaly detection |
| `admin_audit_service.jsw` | `generateComplianceReport`, `getReportTemplates`, `getReportStatus`, `createScheduledReport`, `runScheduledReports` | Compliance reports |

### 6.2 Existing HTML Files Extended

| File | New Features |
|------|--------------|
| `ADMIN_AI_ROUTER.html` | Cost optimizer toggle, provider cost table, savings dashboard |
| `ADMIN_OBSERVABILITY.html` | Anomaly alerts panel, detection rules, trends chart |
| `ADMIN_AUDIT_LOG.html` | Quick report cards, report configuration, scheduled reports |

### 6.3 New Scheduled Jobs

```javascript
// jobs.config additions
{
  "functionLocation": "/scheduler.jsw",
  "functionName": "runAnomalyDetection",
  "description": "Check for system anomalies",
  "executionConfig": {
    "cronExpression": "*/5 * * * *"  // Every 5 minutes
  }
},
{
  "functionLocation": "/scheduler.jsw",
  "functionName": "updateProviderCosts",
  "description": "Update AI provider cost metrics",
  "executionConfig": {
    "cronExpression": "0 * * * *"  // Every hour
  }
},
{
  "functionLocation": "/scheduler.jsw",
  "functionName": "runScheduledReports",
  "description": "Generate scheduled compliance reports",
  "executionConfig": {
    "cronExpression": "0 6 * * *"  // Daily at 6 AM UTC
  }
}
```

---

## 7. Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Cost Optimizer | Monthly AI cost reduction | >15% |
| Cost Optimizer | Quality maintenance | >95% of baseline |
| Anomaly Alerts | MTTD (mean time to detect) | <5 minutes |
| Anomaly Alerts | False positive rate | <10% |
| Compliance Reports | Report generation time | <30 seconds |
| Compliance Reports | Audit prep time reduction | >50% |

---

## 8. Security Considerations

1. **Cost Optimizer**
   - Provider credentials remain in Secrets Manager
   - Cost data is non-sensitive, stored in collection
   - Changes logged to audit trail

2. **Anomaly Alerts**
   - Alert rules modifiable only by Super Admin
   - Email notifications use verified admin addresses
   - No sensitive data in alert messages

3. **Compliance Reports**
   - Reports require Super Admin or Compliance Admin role
   - Download links expire after 7 days
   - PII masking available in report options
   - Generation logged to audit trail
