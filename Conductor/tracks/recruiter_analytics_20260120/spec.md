# Specification: Recruiter Analytics - Source Attribution & Predictive Hiring

## 1. Overview

This track implements a comprehensive analytics suite for recruiters, enabling data-driven recruiting decisions through source attribution tracking, funnel analytics, cost-per-hire calculations, competitor intelligence gathering, and ML-powered predictive hiring models.

### Business Context

| Capability | Current State | Target State |
|------------|---------------|--------------|
| **Source Attribution** | None - no tracking of driver origins | Full UTM tracking, first/last touch models |
| **Cost-Per-Hire** | Manual spreadsheet calculations | Automated ROI by channel with spend import |
| **Funnel Analytics** | Basic stage counts in pipeline | Full conversion rates, bottleneck detection |
| **Competitor Intel** | Ad-hoc research | Structured database of competitor offerings |
| **Predictive Hiring** | Reactive hiring | AI-forecasted hiring needs with alerts |

### Value Proposition

- **Recruiters**: Know exactly which channels deliver the best drivers at the lowest cost
- **Carriers**: Optimize recruiting spend and never miss seasonal hiring windows
- **Platform**: Increased stickiness through irreplaceable analytics insights

---

## 2. Architecture

### 2.1 System Architecture

```
+------------------------------------------------------------------+
|                    RECRUITER ANALYTICS PLATFORM                   |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------+     +--------------------+                 |
|  |   DATA INGESTION   |     |    ML PIPELINE     |                 |
|  +--------------------+     +--------------------+                 |
|  |                    |     |                    |                 |
|  | - UTM Capture      |     | - Feature Eng.     |                 |
|  | - Spend Import     |     | - Model Training   |                 |
|  | - Event Tracking   |     | - Predictions      |                 |
|  | - Scraper Jobs     |     | - Alert Generation |                 |
|  |                    |     |                    |                 |
|  +---------+----------+     +---------+----------+                 |
|            |                          |                            |
|            v                          v                            |
|  +--------------------------------------------------+             |
|  |              ANALYTICS DATA LAYER                 |             |
|  +--------------------------------------------------+             |
|  | SourceAttribution | RecruitingSpend | FunnelEvents|             |
|  | CompetitorIntel   | HiringForecasts | DriverViews |             |
|  +--------------------------------------------------+             |
|            |                                                       |
|            v                                                       |
|  +--------------------------------------------------+             |
|  |              ANALYTICS ENGINE                     |             |
|  +--------------------------------------------------+             |
|  | - Attribution Calc  | - Cost Analysis            |             |
|  | - Funnel Metrics    | - Trend Detection          |             |
|  | - Forecast Engine   | - Alert Rules              |             |
|  +--------------------------------------------------+             |
|            |                                                       |
|            v                                                       |
|  +--------------------------------------------------+             |
|  |           RECRUITER ANALYTICS DASHBOARD           |             |
|  +--------------------------------------------------+             |
|  | Source ROI | Funnel | Competitors | Predictions  |             |
|  +--------------------------------------------------+             |
|                                                                    |
+------------------------------------------------------------------+
```

### 2.2 Data Flow Architecture

```
                    +-------------------+
                    |   Driver Signup   |
                    |   (with UTM)      |
                    +--------+----------+
                             |
                             v
+------------+      +--------+----------+      +------------------+
|  Indeed    |      |                   |      |                  |
|  Facebook  +----->+ SourceAttribution +----->+ Attribution Calc |
|  Referral  |      |    Collection     |      |    Service       |
|  Organic   |      |                   |      |                  |
+------------+      +--------+----------+      +--------+---------+
                             |                          |
                             v                          v
                    +--------+----------+      +--------+---------+
                    |  FunnelEvents     |      |  Cost-Per-Hire   |
                    |  (stage changes)  |      |  Calculator      |
                    +--------+----------+      +--------+---------+
                             |                          |
                             v                          v
+------------+      +--------+----------+      +--------+---------+
| Recruiter  |      | RecruitingSpend   |      |  ROI Analytics   |
|  Manual    +----->+ (ad costs import) +----->+  Dashboard       |
|  Import    |      |                   |      |                  |
+------------+      +-------------------+      +------------------+

                    +-------------------+
                    |  Job Postings     |
                    |  (competitors)    |
                    +--------+----------+
                             |
                             v
+------------+      +--------+----------+      +------------------+
| Web Scrape |      | CompetitorIntel   |      |  Intel Dashboard |
| Manual     +----->+ Collection        +----->+  & Alerts        |
| Entry      |      |                   |      |                  |
+------------+      +-------------------+      +------------------+

                    +-------------------+
                    |  Historical Data  |
                    |  + Seasonality    |
                    +--------+----------+
                             |
                             v
                    +--------+----------+      +------------------+
                    | ML Prediction     |      |  Hiring Forecast |
                    | Pipeline          +----->+  & Ramp Alerts   |
                    | (Claude/Gemini)   |      |                  |
                    +-------------------+      +------------------+
```

---

## 3. Data Model

### 3.1 SourceAttribution Collection

Tracks the origin of every driver in the system.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | Reference | FK to DriverProfiles |
| `carrier_dot` | String | Carrier that hired (if applicable) |
| `utm_source` | String | Traffic source (indeed, facebook, google, referral, organic) |
| `utm_medium` | String | Marketing medium (cpc, cpm, email, social, organic) |
| `utm_campaign` | String | Campaign name/ID |
| `utm_content` | String | Ad variation identifier |
| `utm_term` | String | Keyword (for search campaigns) |
| `referrer_url` | String | Full referrer URL |
| `landing_page` | String | First page visited |
| `first_touch_source` | String | Original source (never changes) |
| `first_touch_date` | DateTime | Original visit date |
| `last_touch_source` | String | Source at conversion |
| `last_touch_date` | DateTime | Last touch before conversion |
| `conversion_date` | DateTime | When driver applied/registered |
| `hire_date` | DateTime | When driver was hired (if applicable) |
| `attribution_model` | String | 'first_touch', 'last_touch', 'linear', 'position_based' |
| `touchpoint_count` | Number | Number of touchpoints before conversion |
| `touchpoint_history` | Array | Full touchpoint journey [{source, date, page}] |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last modified |

### 3.2 RecruitingSpend Collection

Tracks advertising spend per channel for ROI calculations.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Carrier DOT number |
| `recruiter_id` | Reference | FK to Members (recruiter) |
| `period_start` | DateTime | Spend period start |
| `period_end` | DateTime | Spend period end |
| `channel` | String | indeed, facebook, google, linkedin, referral_bonus, job_boards, other |
| `campaign_name` | String | Optional campaign identifier |
| `spend_amount` | Number | Amount in cents |
| `currency` | String | Currency code (default: USD) |
| `impressions` | Number | Ad impressions (if available) |
| `clicks` | Number | Ad clicks (if available) |
| `applications` | Number | Applications from this spend |
| `hires` | Number | Hires attributed to this spend |
| `cost_per_application` | Number | Calculated: spend / applications |
| `cost_per_hire` | Number | Calculated: spend / hires |
| `import_method` | String | 'manual', 'csv_upload', 'api_sync' |
| `notes` | String | Optional notes |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last modified |

### 3.3 FunnelEvents Collection

Tracks every pipeline stage transition for funnel analytics.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `driver_id` | Reference | FK to DriverProfiles |
| `carrier_dot` | String | Carrier DOT number |
| `recruiter_id` | Reference | FK to Members (recruiter) |
| `from_stage` | String | Previous stage (null if new) |
| `to_stage` | String | New stage |
| `stage_order` | Number | Numeric stage position (for funnel viz) |
| `entered_at` | DateTime | When entered this stage |
| `exited_at` | DateTime | When left this stage (null if current) |
| `time_in_stage_hours` | Number | Calculated duration |
| `drop_reason` | String | If dropped: unqualified, ghosted, rejected, withdrew, other |
| `source_attribution_id` | Reference | FK to SourceAttribution |
| `is_conversion` | Boolean | True if this is a hire event |
| `event_metadata` | Object | Additional context |
| `_createdDate` | DateTime | Record created |

**Valid Stages (ordered):**
1. `lead` - Initial contact/application
2. `screening` - Initial qualification
3. `phone_screen` - Phone interview
4. `application` - Formal application
5. `interview` - In-person/video interview
6. `offer` - Offer extended
7. `hired` - Offer accepted, start date set
8. `dropped` - Dropped out (terminal)

### 3.4 CompetitorIntel Collection

Stores intelligence about competitor carrier offerings.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `competitor_name` | String | Carrier name |
| `competitor_dot` | String | DOT number (if known) |
| `intel_date` | DateTime | Date information was gathered |
| `source_url` | String | Job posting URL or source |
| `source_type` | String | 'job_posting', 'driver_report', 'manual_entry', 'scrape' |
| `region` | String | Geographic region |
| `job_type` | String | OTR, regional, local, dedicated |
| `cpm_min` | Number | Minimum CPM advertised |
| `cpm_max` | Number | Maximum CPM advertised |
| `weekly_min` | Number | Minimum weekly pay |
| `weekly_max` | Number | Maximum weekly pay |
| `sign_on_bonus` | Number | Sign-on bonus amount |
| `sign_on_terms` | String | Bonus terms/conditions |
| `benefits_summary` | String | Benefits highlights |
| `home_time` | String | Home time policy |
| `equipment_age` | String | Truck/equipment age |
| `requirements` | Object | CDL class, endorsements, experience required |
| `verified` | Boolean | Has this been verified? |
| `verified_by` | Reference | FK to Members who verified |
| `notes` | String | Additional notes |
| `_createdDate` | DateTime | Record created |
| `_updatedDate` | DateTime | Last modified |

### 3.5 HiringForecasts Collection

Stores ML-generated hiring predictions.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Carrier DOT number |
| `forecast_date` | DateTime | Date forecast was generated |
| `forecast_period_start` | DateTime | Start of forecast period |
| `forecast_period_end` | DateTime | End of forecast period |
| `predicted_hires_needed` | Number | Forecasted hiring need |
| `confidence_level` | Number | 0-100 confidence score |
| `drivers_at_risk` | Number | Predicted turnover |
| `growth_hires` | Number | Hires needed for growth |
| `replacement_hires` | Number | Hires needed for turnover |
| `seasonal_factor` | Number | Seasonality adjustment (1.0 = neutral) |
| `model_version` | String | ML model version used |
| `model_inputs` | Object | Input features used |
| `alert_level` | String | 'none', 'info', 'warning', 'critical' |
| `alert_message` | String | Generated alert message |
| `recommended_action` | String | Suggested action |
| `ramp_start_date` | DateTime | When to start recruiting ramp |
| `_createdDate` | DateTime | Record created |

---

## 4. API Design

### 4.1 recruiterAnalyticsService.jsw

```javascript
// ============================================================
// SOURCE ATTRIBUTION
// ============================================================

/**
 * Record a driver touchpoint (call on every page visit with UTM)
 * @param {string} driverId - Driver ID (or session ID for anonymous)
 * @param {Object} utmParams - { source, medium, campaign, content, term }
 * @param {string} pageUrl - Current page URL
 * @returns {Object} { success, touchpointId }
 */
export async function recordTouchpoint(driverId, utmParams, pageUrl)

/**
 * Convert session to driver attribution (call on registration)
 * @param {string} sessionId - Anonymous session ID
 * @param {string} driverId - New driver ID
 * @returns {Object} { success, attributionId }
 */
export async function convertSessionToDriver(sessionId, driverId)

/**
 * Record hire and attribute to source
 * @param {string} driverId - Driver ID
 * @param {string} carrierDot - Hiring carrier
 * @param {string} attributionModel - 'first_touch' | 'last_touch'
 * @returns {Object} { success, attributedSource }
 */
export async function recordHireAttribution(driverId, carrierDot, attributionModel)

/**
 * Get attribution breakdown for carrier
 * @param {string} carrierDot - Carrier DOT
 * @param {Object} dateRange - { start, end }
 * @param {string} metric - 'applications' | 'hires'
 * @returns {Object} { bySource: {}, byMedium: {}, byCampaign: {} }
 */
export async function getAttributionBreakdown(carrierDot, dateRange, metric)

// ============================================================
// COST-PER-HIRE ANALYTICS
// ============================================================

/**
 * Import recruiting spend (manual entry)
 * @param {Object} spendData - Spend record data
 * @returns {Object} { success, spendId }
 */
export async function recordRecruitingSpend(spendData)

/**
 * Bulk import spend from CSV
 * @param {string} carrierDot - Carrier DOT
 * @param {Array} spendRecords - Array of spend data
 * @returns {Object} { success, imported, errors }
 */
export async function bulkImportSpend(carrierDot, spendRecords)

/**
 * Calculate cost-per-hire by channel
 * @param {string} carrierDot - Carrier DOT
 * @param {Object} dateRange - { start, end }
 * @returns {Object} { byChannel: { channel: { spend, hires, cph } } }
 */
export async function calculateCostPerHire(carrierDot, dateRange)

/**
 * Get channel ROI comparison
 * @param {string} carrierDot - Carrier DOT
 * @param {Object} dateRange - { start, end }
 * @returns {Object} { channels: [{ name, spend, hires, cph, roi_score }] }
 */
export async function getChannelROI(carrierDot, dateRange)

// ============================================================
// FUNNEL ANALYTICS
// ============================================================

/**
 * Record pipeline stage change
 * @param {string} driverId - Driver ID
 * @param {string} carrierDot - Carrier DOT
 * @param {string} toStage - New stage
 * @param {string} dropReason - If dropping, reason
 * @returns {Object} { success, eventId }
 */
export async function recordStageChange(driverId, carrierDot, toStage, dropReason)

/**
 * Get funnel metrics for carrier
 * @param {string} carrierDot - Carrier DOT
 * @param {Object} dateRange - { start, end }
 * @returns {Object} { stages: [], conversions: [], dropoffs: [] }
 */
export async function getFunnelMetrics(carrierDot, dateRange)

/**
 * Get bottleneck analysis
 * @param {string} carrierDot - Carrier DOT
 * @param {Object} dateRange - { start, end }
 * @returns {Object} { bottlenecks: [{ stage, avgTime, dropRate, recommendation }] }
 */
export async function getBottleneckAnalysis(carrierDot, dateRange)

/**
 * Get time-in-stage metrics
 * @param {string} carrierDot - Carrier DOT
 * @returns {Object} { stages: { stage: { avg, median, p90 } } }
 */
export async function getTimeInStageMetrics(carrierDot)

// ============================================================
// COMPETITOR INTELLIGENCE
// ============================================================

/**
 * Add competitor intel record
 * @param {Object} intelData - Intel record data
 * @returns {Object} { success, intelId }
 */
export async function addCompetitorIntel(intelData)

/**
 * Get competitor comparison for region
 * @param {string} region - Geographic region
 * @param {string} jobType - OTR, regional, local
 * @returns {Object} { competitors: [{ name, pay, bonuses, benefits }] }
 */
export async function getCompetitorComparison(region, jobType)

/**
 * Get market pay benchmarks
 * @param {string} region - Geographic region
 * @param {string} jobType - Job type
 * @returns {Object} { min, max, avg, median, percentiles }
 */
export async function getPayBenchmarks(region, jobType)

/**
 * Trigger competitor scrape job (admin only)
 * @param {Array} urls - URLs to scrape
 * @returns {Object} { success, jobId }
 */
export async function triggerCompetitorScrape(urls)

// ============================================================
// PREDICTIVE HIRING
// ============================================================

/**
 * Generate hiring forecast for carrier
 * @param {string} carrierDot - Carrier DOT
 * @param {number} monthsAhead - How many months to forecast
 * @returns {Object} { forecasts: [], alerts: [] }
 */
export async function generateHiringForecast(carrierDot, monthsAhead)

/**
 * Get current forecast and alerts
 * @param {string} carrierDot - Carrier DOT
 * @returns {Object} { current: {}, alerts: [] }
 */
export async function getHiringForecast(carrierDot)

/**
 * Get turnover risk analysis
 * @param {string} carrierDot - Carrier DOT
 * @returns {Object} { atRisk: [], riskFactors: [], recommendations: [] }
 */
export async function getTurnoverRiskAnalysis(carrierDot)

/**
 * Update forecast with manual adjustments
 * @param {string} forecastId - Forecast ID
 * @param {Object} adjustments - Manual adjustments
 * @returns {Object} { success, updatedForecast }
 */
export async function adjustForecast(forecastId, adjustments)
```

### 4.2 Jobs Configuration (jobs.config)

```json
{
  "jobs": [
    {
      "functionLocation": "/backend/recruiterAnalyticsService.jsw",
      "functionName": "runDailyAttributionRollup",
      "description": "Roll up daily attribution metrics",
      "executionConfig": {
        "cronExpression": "0 2 * * *"
      }
    },
    {
      "functionLocation": "/backend/recruiterAnalyticsService.jsw",
      "functionName": "runWeeklyForecastGeneration",
      "description": "Generate hiring forecasts weekly",
      "executionConfig": {
        "cronExpression": "0 3 * * 0"
      }
    },
    {
      "functionLocation": "/backend/recruiterAnalyticsService.jsw",
      "functionName": "runCompetitorIntelScrape",
      "description": "Scrape competitor job postings",
      "executionConfig": {
        "cronExpression": "0 4 * * 1,4"
      }
    }
  ]
}
```

---

## 5. UI Components

### 5.1 Source Attribution Dashboard

```
+------------------------------------------------------------------------+
|  SOURCE ATTRIBUTION                                    [Last 30 Days v] |
+------------------------------------------------------------------------+
|                                                                         |
|  ATTRIBUTION MODEL: [First Touch v]    METRIC: [Hires v]               |
|                                                                         |
|  +---------------------------+  +------------------------------------+  |
|  |  HIRES BY SOURCE          |  |  TREND OVER TIME                   |  |
|  +---------------------------+  +------------------------------------+  |
|  |                           |  |                                    |  |
|  |  Indeed        ████ 45    |  |    50|     *                       |  |
|  |  Facebook      ███  32    |  |      |   *   *                     |  |
|  |  Referral      ██   18    |  |    25| *       *   *               |  |
|  |  Google        █    12    |  |      |           *   *   *         |  |
|  |  Organic       █     8    |  |     0+---+---+---+---+---+---+     |  |
|  |  Other              3     |  |       W1  W2  W3  W4  W5  W6       |  |
|  |                           |  |                                    |  |
|  |  [View Details]           |  |  ─ Indeed  ─ Facebook  ─ Referral  |  |
|  +---------------------------+  +------------------------------------+  |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  CAMPAIGN PERFORMANCE                                             |  |
|  +------------------------------------------------------------------+  |
|  | Campaign            | Source   | Clicks | Apps | Hires | Conv %  |  |
|  |---------------------|----------|--------|------|-------|---------|  |
|  | Jan_OTR_Texas       | Indeed   | 1,245  | 89   | 23    | 25.8%   |  |
|  | Regional_Southeast  | Facebook | 892    | 56   | 14    | 25.0%   |  |
|  | Referral_Bonus_Q1   | Referral | -      | 34   | 12    | 35.3%   |  |
|  | Brand_Awareness     | Google   | 2,341  | 42   | 8     | 19.0%   |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
+------------------------------------------------------------------------+
```

### 5.2 Cost-Per-Hire Dashboard

```
+------------------------------------------------------------------------+
|  COST-PER-HIRE ANALYTICS                               [Last 90 Days v] |
+------------------------------------------------------------------------+
|                                                                         |
|  TOTAL SPEND: $24,500       TOTAL HIRES: 118       AVG CPH: $207.63    |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  CHANNEL ROI COMPARISON                                           |  |
|  +------------------------------------------------------------------+  |
|  |                                                                   |  |
|  |  Channel      Spend      Hires    CPH       ROI Score             |  |
|  |  ─────────────────────────────────────────────────────            |  |
|  |  Referral     $2,400      18     $133      ██████████ 94          |  |
|  |  Indeed       $12,000     52     $231      ███████░░░ 72          |  |
|  |  Facebook     $6,500      32     $203      ████████░░ 78          |  |
|  |  Google       $2,800      12     $233      ███████░░░ 68          |  |
|  |  LinkedIn     $800        4      $200      ████████░░ 76          |  |
|  |                                                                   |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +-----------------------------+  +----------------------------------+  |
|  |  SPEND BREAKDOWN            |  |  CPH TREND                       |  |
|  +-----------------------------+  +----------------------------------+  |
|  |       ┌────────┐            |  |                                  |  |
|  |      /  Indeed  \           |  |  $300|                           |  |
|  |     │    49%     │          |  |      |  *                        |  |
|  |    /   Facebook   \         |  |  $200|     *   *   *   *         |  |
|  |   │      27%       │        |  |      |                   *       |  |
|  |  │  Referral 10%    │       |  |  $100|                           |  |
|  |  │  Google 11%      │       |  |      +---+---+---+---+---+       |  |
|  |   \  Other 3%      /        |  |        Jan Feb Mar Apr May       |  |
|  |                             |  |                                  |  |
|  +-----------------------------+  +----------------------------------+  |
|                                                                         |
|  [+ Add Spend Record]  [Import CSV]  [Export Report]                   |
|                                                                         |
+------------------------------------------------------------------------+
```

### 5.3 Funnel Analytics Dashboard

```
+------------------------------------------------------------------------+
|  RECRUITING FUNNEL                                     [Last 30 Days v] |
+------------------------------------------------------------------------+
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  CONVERSION FUNNEL                                                |  |
|  +------------------------------------------------------------------+  |
|  |                                                                   |  |
|  |  Lead          ████████████████████████████████████████  1,245   |  |
|  |                              |                                    |  |
|  |                            72.0%                                  |  |
|  |                              v                                    |  |
|  |  Screening     ██████████████████████████████           897      |  |
|  |                              |                                    |  |
|  |                            58.2%                                  |  |
|  |                              v                                    |  |
|  |  Phone Screen  ████████████████████                     522      |  |
|  |                              |                                    |  |
|  |                            67.4%                                  |  |
|  |                              v                                    |  |
|  |  Application   ██████████████                           352      |  |
|  |                              |                                    |  |
|  |                            53.1%                                  |  |
|  |                              v                                    |  |
|  |  Interview     ████████                                 187      |  |
|  |                              |                                    |  |
|  |                            74.3%                                  |  |
|  |                              v                                    |  |
|  |  Offer         ██████                                   139      |  |
|  |                              |                                    |  |
|  |                            84.9%    <-- Excellent!                |  |
|  |                              v                                    |  |
|  |  Hired         █████                                    118      |  |
|  |                                                                   |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  BOTTLENECK ANALYSIS                                              |  |
|  +------------------------------------------------------------------+  |
|  |                                                                   |  |
|  |  ! WARNING: Screening -> Phone Screen has 41.8% drop-off         |  |
|  |    Avg time in stage: 4.2 days (industry avg: 2.1 days)          |  |
|  |    Recommendation: Speed up initial contact                       |  |
|  |                                                                   |  |
|  |  ! WARNING: Application -> Interview has 46.9% drop-off          |  |
|  |    Top drop reason: "Ghosted" (62%)                              |  |
|  |    Recommendation: Implement automated follow-up sequence        |  |
|  |                                                                   |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
+------------------------------------------------------------------------+
```

### 5.4 Competitor Intelligence Dashboard

```
+------------------------------------------------------------------------+
|  COMPETITOR INTELLIGENCE                            [Southeast Region v] |
+------------------------------------------------------------------------+
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  MARKET PAY BENCHMARKS (OTR)                                      |  |
|  +------------------------------------------------------------------+  |
|  |                                                                   |  |
|  |  YOUR OFFER: $0.58/mi     Market Position: 67th percentile       |  |
|  |                                                                   |  |
|  |  $0.45 |----[====|=======YOUR======|==]----| $0.72               |  |
|  |        Min     25th     50th      75th    Max                    |  |
|  |                         $0.54     $0.61                          |  |
|  |                                                                   |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  COMPETITOR COMPARISON                                            |  |
|  +------------------------------------------------------------------+  |
|  | Carrier        | CPM Range   | Sign-On | Home Time | Equipment   |  |
|  |----------------|-------------|---------|-----------|-------------|  |
|  | Werner         | $0.52-0.62  | $5,000  | Weekly    | 2-3 yrs     |  |
|  | Schneider      | $0.55-0.68  | $7,500  | Bi-weekly | 1-2 yrs     |  |
|  | Swift          | $0.48-0.58  | $3,000  | 10-14 days| 3-4 yrs     |  |
|  | Knight         | $0.54-0.65  | $6,000  | Weekly    | 2-3 yrs     |  |
|  | Your Offer     | $0.58       | $4,500  | Weekly    | 2 yrs       |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  RECENT CHANGES                                                   |  |
|  +------------------------------------------------------------------+  |
|  |  ! Schneider increased sign-on bonus from $5,000 to $7,500       |  |
|  |    (Detected: Jan 15, 2026)                                       |  |
|  |                                                                   |  |
|  |  ! Werner advertising new dedicated routes with 70 CPM           |  |
|  |    (Detected: Jan 18, 2026)                                       |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  [+ Add Intel]  [View All Competitors]  [Set Alerts]                   |
|                                                                         |
+------------------------------------------------------------------------+
```

### 5.5 Predictive Hiring Dashboard

```
+------------------------------------------------------------------------+
|  PREDICTIVE HIRING                                                      |
+------------------------------------------------------------------------+
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  ! ALERT: Hiring Ramp Recommended                                 |  |
|  |    Based on seasonal patterns and current turnover, you should    |  |
|  |    begin recruiting ramp by February 15 to meet Q2 demand.        |  |
|  |                                                                   |  |
|  |    [View Details]  [Dismiss]  [Snooze 1 Week]                    |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  6-MONTH HIRING FORECAST                                          |  |
|  +------------------------------------------------------------------+  |
|  |                                                                   |  |
|  |  Drivers|                              ████                       |  |
|  |   Needed|                        ████  ████                       |  |
|  |      30 |                  ████  ████  ████                       |  |
|  |         |            ████  ████  ████  ████                       |  |
|  |      20 |      ████  ████  ████  ████  ████  ████                 |  |
|  |         |████  ████  ████  ████  ████  ████  ████                 |  |
|  |      10 |████  ████  ████  ████  ████  ████  ████                 |  |
|  |         |████  ████  ████  ████  ████  ████  ████                 |  |
|  |       0 +-----+-----+-----+-----+-----+-----+-----                |  |
|  |          Jan   Feb   Mar   Apr   May   Jun   Jul                  |  |
|  |                                                                   |  |
|  |  ▓ Replacement (turnover)    ░ Growth                            |  |
|  |                                                                   |  |
|  |  Confidence: 78%    Model: v2.3    Last Updated: Jan 20, 2026    |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +-----------------------------+  +----------------------------------+  |
|  |  TURNOVER RISK              |  |  FORECAST FACTORS               |  |
|  +-----------------------------+  +----------------------------------+  |
|  |                             |  |                                  |  |
|  |  Drivers at Risk: 8        |  |  + Seasonal uptick (Mar-May)     |  |
|  |                             |  |  + Contract renewals (Apr)       |  |
|  |  ██████░░░░ 12% of fleet   |  |  - Lower freight volume (Jan)    |  |
|  |                             |  |  + 2 drivers retiring (Feb)      |  |
|  |  Top Risk Factors:         |  |  + Growth target: +15 drivers    |  |
|  |  - Tenure < 6mo (4)        |  |                                  |  |
|  |  - Pay below market (2)    |  |  [Adjust Assumptions]            |  |
|  |  - Recent complaints (2)   |  |                                  |  |
|  |                             |  |                                  |  |
|  |  [View At-Risk Drivers]    |  |                                  |  |
|  +-----------------------------+  +----------------------------------+  |
|                                                                         |
+------------------------------------------------------------------------+
```

---

## 6. ML Model Approach

### 6.1 Predictive Hiring Model Architecture

```
+------------------------------------------------------------------+
|                    HIRING PREDICTION PIPELINE                      |
+------------------------------------------------------------------+
|                                                                    |
|  +-----------------------+                                         |
|  |    DATA COLLECTION    |                                         |
|  +-----------------------+                                         |
|  | - Historical hires    |                                         |
|  | - Turnover events     |                                         |
|  | - Seasonality data    |                                         |
|  | - Fleet size changes  |                                         |
|  | - Market conditions   |                                         |
|  +-----------+-----------+                                         |
|              |                                                     |
|              v                                                     |
|  +-----------------------+                                         |
|  |  FEATURE ENGINEERING  |                                         |
|  +-----------------------+                                         |
|  | - Rolling turnover %  |                                         |
|  | - Seasonal indicators |                                         |
|  | - Tenure distribution |                                         |
|  | - Pay competitiveness |                                         |
|  | - Driver satisfaction |                                         |
|  +-----------+-----------+                                         |
|              |                                                     |
|              v                                                     |
|  +-----------------------+     +---------------------------+       |
|  |    LLM SYNTHESIS      |     |    CLAUDE/GEMINI API      |       |
|  +-----------------------+     +---------------------------+       |
|  | Structured prompt     |---->| - Pattern recognition     |       |
|  | with features +       |     | - Trend extrapolation     |       |
|  | historical context    |     | - Anomaly detection       |       |
|  +-----------------------+     | - Natural language alerts |       |
|              |                 +---------------------------+       |
|              v                                                     |
|  +-----------------------+                                         |
|  |   FORECAST OUTPUT     |                                         |
|  +-----------------------+                                         |
|  | - Monthly predictions |                                         |
|  | - Confidence scores   |                                         |
|  | - Risk alerts         |                                         |
|  | - Recommendations     |                                         |
|  +-----------------------+                                         |
|                                                                    |
+------------------------------------------------------------------+
```

### 6.2 Model Inputs (Feature Vector)

| Feature | Type | Description |
|---------|------|-------------|
| `turnover_rate_3mo` | Float | 3-month rolling turnover rate |
| `turnover_rate_12mo` | Float | 12-month rolling turnover rate |
| `avg_tenure_months` | Float | Average driver tenure |
| `tenure_distribution` | Array | Drivers per tenure bucket |
| `seasonal_month` | Int | Month (1-12) for seasonality |
| `seasonal_quarter` | Int | Quarter (1-4) |
| `pay_vs_market` | Float | Pay relative to market (1.0 = at market) |
| `fleet_size` | Int | Current fleet size |
| `fleet_growth_target` | Float | Annual growth target % |
| `satisfaction_score` | Float | Average driver satisfaction (if available) |
| `complaints_30d` | Int | Driver complaints last 30 days |
| `pending_retirements` | Int | Known upcoming retirements |
| `historical_hires_m` | Array | Hires per month (last 24mo) |
| `historical_departures_m` | Array | Departures per month (last 24mo) |

### 6.3 Model Output Schema

```json
{
  "forecasts": [
    {
      "month": "2026-02",
      "predicted_hires_needed": 18,
      "breakdown": {
        "replacement": 12,
        "growth": 6
      },
      "confidence": 0.82,
      "drivers": [
        "Historical Feb average: 15 hires",
        "3 drivers with < 6mo tenure at risk",
        "Growth target contribution: 6"
      ]
    }
  ],
  "alerts": [
    {
      "level": "warning",
      "message": "Begin recruiting ramp by Feb 15 to meet March demand",
      "recommended_action": "Increase job posting budget by 25%",
      "deadline": "2026-02-15"
    }
  ],
  "at_risk_drivers": [
    {
      "driver_id": "...",
      "risk_score": 0.73,
      "risk_factors": ["tenure_low", "pay_below_market"]
    }
  ]
}
```

### 6.4 Prompt Template (for LLM synthesis)

```
You are a trucking industry workforce analyst. Analyze the following carrier
data and provide a 6-month hiring forecast.

CARRIER PROFILE:
- Fleet Size: {fleet_size} drivers
- Current Turnover Rate (12mo): {turnover_rate_12mo}%
- Average Tenure: {avg_tenure_months} months
- Pay vs Market: {pay_vs_market}x market rate
- Growth Target: {fleet_growth_target}% annually

HISTORICAL DATA:
- Monthly Hires (last 12mo): {historical_hires}
- Monthly Departures (last 12mo): {historical_departures}
- Seasonal Pattern: Peak hiring in {peak_months}

CURRENT RISK FACTORS:
- Drivers with < 6mo tenure: {low_tenure_count}
- Drivers with pay complaints: {pay_complaints}
- Known retirements (next 6mo): {pending_retirements}

Provide a JSON response with:
1. Monthly hiring forecast for next 6 months
2. Confidence level (0-1) for each prediction
3. Key risk alerts
4. Recommended actions with deadlines

Focus on actionable insights the recruiting team can act on.
```

---

## 7. Security Considerations

### 7.1 Data Access Controls

| Data Type | Access Level |
|-----------|--------------|
| Own carrier attribution | Carrier + Recruiter |
| Own spend data | Carrier + Recruiter |
| Own funnel data | Carrier + Recruiter |
| Competitor intel | All subscribers (aggregated) |
| Individual competitor records | Pro+ subscribers |
| ML forecasts | Enterprise subscribers |
| Platform-wide benchmarks | Admin only (for aggregation) |

### 7.2 PII Handling

- Driver names/IDs in attribution are only visible to their carrier
- Aggregated stats strip PII before display
- Competitor intel must not contain driver PII

### 7.3 API Rate Limits

| Endpoint | Free | Pro | Enterprise |
|----------|------|-----|------------|
| Attribution queries | 10/day | 100/day | Unlimited |
| Forecast generation | N/A | 1/week | 1/day |
| Competitor intel | N/A | 50/month | Unlimited |

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Attribution coverage | >90% | Drivers with known source / Total drivers |
| Spend tracking adoption | >60% | Carriers tracking spend / Active carriers |
| Funnel completion | >80% | Stage changes recorded / Expected changes |
| Forecast accuracy | >75% | Within 20% of actual hires |
| Feature engagement | >40% | Carriers using analytics weekly |
| Cost savings | >15% | Reduction in CPH for engaged carriers |

---

## 9. Integration Points

### 9.1 Existing Services

| Service | Integration |
|---------|-------------|
| `driverProfiles.jsw` | Source attribution on signup |
| `applicationService.jsw` | Funnel event recording |
| `driverMatching.jsw` | Attribution on hire |
| `retentionService.jsw` | Risk data for predictions |
| `recruiter_service.jsw` | Dashboard integration |
| `aiEnrichment.jsw` | Competitor intel via AI |

### 9.2 External APIs

| API | Purpose |
|-----|---------|
| Perplexity | Competitor job posting research |
| Claude | ML forecast synthesis |
| Indeed API | (Future) Direct spend import |
| Facebook Ads API | (Future) Direct spend import |

---

## 10. Open Questions

1. **Attribution Window**: How long should we track touchpoints before conversion? (7 days? 30 days?)
2. **Multi-Touch Attribution**: Should we support linear or position-based models initially?
3. **Competitor Scraping**: Legal considerations for automated job posting scraping?
4. **Forecast Frequency**: Daily vs weekly forecast regeneration?
5. **Benchmark Sharing**: Should carriers see anonymized peer benchmarks?
