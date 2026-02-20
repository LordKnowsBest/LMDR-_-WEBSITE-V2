# Track Plan: Recruiter Analytics - Hiring Intelligence

> **STATUS: COMPLETE** - Backend services and UI fully implemented.
>
> **Last Updated**: 2026-02-19
>
> **Specification**: See `spec.md` for technical details

---

## Phase 1: Source Attribution (Foundation)

> **Goal**: Track where drivers come from with UTM parameter capture and first/last touch attribution.
>
> **Dependencies**: None (foundation phase)
>
> **Estimated Effort**: 2 weeks

### 1.1 Collection Setup

- [x] Task: Create `SourceAttribution` collection in Wix
  - Fields: driver_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term
  - Fields: first_touch_source, first_touch_date, last_touch_source, last_touch_date
  - Fields: touchpoint_history (array), conversion_date, hire_date
- [x] Task: Add collection permissions in permissions.json
- [x] Task: Create indexes on driver_id, utm_source, conversion_date

### 1.2 UTM Capture Implementation

- [x] Task: Create `src/public/js/utm-tracker.js` client-side utility
  - Parse UTM params from URL on page load
  - Store in sessionStorage/localStorage for persistence
  - Expose `getUtmParams()` function
- [x] Task: Create `trackTouchpoint()` function in recruiterAnalyticsService.jsw
  - Accept UTM params + page URL
  - Create/update touchpoint history
- [x] Task: Integrate UTM capture into landing pages
  - Driver signup pages
  - Job listing pages
  - Marketing landing pages
  - *Implemented via Global MasterPage Injection*
- [x] Task: Integrate UTM capture into driver registration flow
  - Read UTM from storage on registration
  - Create SourceAttribution record
  - *Implemented via MasterPage onReady attribution sync*

### 1.3 Attribution Models

- [x] Task: Implement `getFirstTouchAttribution(driverId)` function
  - Returns original source that acquired the driver
- [x] Task: Implement `getLastTouchAttribution(driverId)` function
  - Returns most recent source before conversion
- [x] Task: Implement `recordHireAttribution(driverId, carrierDot, model)` function
  - Update attribution record with hire date
  - Link to carrier
- [x] Task: Implement `getAttributionBreakdown(carrierDot, dateRange, metric)` function
  - Aggregate by source, medium, campaign
  - Support both applications and hires metrics

### 1.4 Attribution Dashboard UI

- [x] Task: Create `RECRUITER_ATTRIBUTION.html` component
  - Date range selector
  - Attribution model toggle (first/last touch)
  - Metric toggle (applications/hires)
- [x] Task: Implement "Hires by Source" bar chart visualization
- [x] Task: Implement "Trend over Time" line chart
- [x] Task: Implement "Campaign Performance" data table
- [x] Task: Add PostMessage bridge for Velo integration

### 1.5 Phase 1 Testing

- [x] Test: UTM parameters captured correctly from various sources
- [x] Test: Touchpoint history accumulates across sessions
- [x] Test: First-touch attribution never changes after initial set
- [x] Test: Last-touch attribution updates on new touchpoints
- [x] Test: Hire attribution correctly links driver to carrier
- [x] Test: Dashboard displays correct aggregations

---

## Phase 2: Funnel Analytics

> **Goal**: Visualize pipeline stages with conversion rates, time-in-stage, and bottleneck detection.
>
> **Dependencies**: Phase 1 (for source attribution linking)
>
> **Estimated Effort**: 2 weeks

### 2.1 Collection Setup

- [x] Task: Create `FunnelEvents` collection in Wix
  - Fields: driver_id, carrier_dot, from_stage, to_stage, stage_order
  - Fields: entered_at, exited_at, time_in_stage_hours
  - Fields: drop_reason, source_attribution_id, is_conversion
- [x] Task: Add collection permissions
- [x] Task: Create indexes on carrier_dot, to_stage, entered_at

### 2.2 Stage Tracking Implementation

- [x] Task: Define stage constants and order in shared config
  - lead (1) -> screening (2) -> phone_screen (3) -> application (4)
  - -> interview (5) -> offer (6) -> hired (7) | dropped (terminal)
- [x] Task: Implement `recordStageChange(driverId, carrierDot, toStage, dropReason)` function
  - Auto-calculate from_stage from previous event
  - Calculate time_in_stage for previous stage
  - Link to source attribution
- [x] Task: Integrate with existing applicationService.jsw
  - Hook into application status changes
  - Map existing statuses to funnel stages
- [x] Task: Integrate with recruiter pipeline saves
  - Record stage changes when pipeline updates

### 2.3 Funnel Metrics Calculation

- [x] Task: Implement `getFunnelMetrics(carrierDot, dateRange)` function
  - Count entries per stage
  - Calculate conversion rate stage-to-stage
  - Calculate overall conversion (lead -> hired)
- [x] Task: Implement `getTimeInStageMetrics(carrierDot)` function
  - Calculate avg, median, p90 per stage
  - Compare to platform benchmarks
- [x] Task: Implement `getBottleneckAnalysis(carrierDot, dateRange)` function
  - Identify stages with highest drop-off
  - Identify stages with longest time-in-stage
  - Generate recommendations

### 2.4 Funnel Dashboard UI
- [x] Task: Create `RECRUITER_FUNNEL.html` component
  - Date range selector
  - Funnel visualization with conversion rates
- [x] Task: Implement funnel bar chart visualization
  - Horizontal bars with count labels
  - Conversion percentages between stages
  - Color coding for drop-off warnings
- [x] Task: Implement bottleneck alerts panel
  - Warning cards for problematic stages
  - Recommendations display
- [x] Task: Implement time-in-stage table
  - Per-stage timing metrics
  - Comparison to benchmarks
- [x] Task: Add PostMessage bridge for Velo integration

### 2.5 Phase 2 Testing

- [x] Test: Stage changes recorded correctly on application updates
- [x] Test: Time-in-stage calculated accurately
- [x] Test: Funnel metrics aggregate correctly by date range
- [x] Test: Bottleneck detection identifies correct problem stages
- [x] Test: Dashboard renders funnel with correct proportions
- [x] Test: Source attribution links correctly to funnel events

---

## Phase 3: Cost-Per-Hire by Channel

> **Goal**: Calculate recruiting ROI with spend import and cost-per-hire by channel.
>
> **Dependencies**: Phase 1 (for attribution data)
>
> **Estimated Effort**: 1.5 weeks

### 3.1 Collection Setup

- [x] Task: Create `RecruitingSpend` collection in Wix
  - Fields: carrier_dot, recruiter_id, period_start, period_end
  - Fields: channel, campaign_name, spend_amount, currency
  - Fields: impressions, clicks, applications, hires
  - Fields: cost_per_application, cost_per_hire, import_method
- [x] Task: Add collection permissions
- [x] Task: Create indexes on carrier_dot, channel, period_start

### 3.2 Spend Recording Implementation

- [x] Task: Implement `recordRecruitingSpend(spendData)` function
  - Validate required fields
  - Calculate CPH if hires provided
  - Support manual entry and CSV import
- [x] Task: Implement `bulkImportSpend(carrierDot, spendRecords)` function
  - Parse CSV format
  - Validate and sanitize data
  - Batch insert with error handling
- [x] Task: Implement `updateSpendHires(spendId, hires)` function
  - Update hire count after period ends
  - Recalculate CPH

### 3.3 Cost Analytics Calculation

- [x] Task: Implement `calculateCostPerHire(carrierDot, dateRange)` function
  - Aggregate spend by channel
  - Match hires from attribution data
  - Calculate CPH per channel
- [x] Task: Implement `getChannelROI(carrierDot, dateRange)` function
  - Calculate ROI score (inverse of CPH normalized)
  - Rank channels by effectiveness
  - Include application-to-hire conversion rates
- [x] Task: Implement spend vs hires trend calculation
  - Monthly aggregation
  - Rolling CPH trend

### 3.4 Cost Dashboard UI

- [x] Task: Create `RECRUITER_COST_ANALYSIS.html` component
  - Date range selector
  - Summary metrics (total spend, hires, avg CPH)
- [x] Task: Implement channel ROI comparison table
  - Sortable by spend, hires, CPH, ROI score
  - Visual ROI bar indicator
- [x] Task: Implement spend breakdown pie chart
- [x] Task: Implement CPH trend line chart
- [x] Task: Implement spend entry form
  - Channel dropdown
  - Date range picker
  - Amount, impressions, clicks fields
- [x] Task: Implement CSV import modal
  - File upload
  - Preview and validation
  - Import confirmation
- [x] Task: Add PostMessage bridge for Velo integration

### 3.5 Phase 3 Testing

- [x] Test: Manual spend entry saves correctly
- [x] Test: CSV import parses and validates correctly
- [x] Test: CPH calculation matches spend/hires
- [x] Test: Channel ROI ranks channels correctly
- [x] Test: Dashboard displays correct spend breakdown
- [x] Test: Trend charts render with correct data

---

## Phase 4: Competitor Intelligence

> **Goal**: Track competitor carrier offerings (pay, bonuses, benefits) for market positioning.
>
> **Dependencies**: None (can run parallel)
>
> **Estimated Effort**: 2 weeks

### 4.1 Collection Setup

- [x] Task: Create `CompetitorIntel` collection in Wix
  - Fields: competitor_name, competitor_dot, intel_date, source_url
  - Fields: source_type, region, job_type
  - Fields: cpm_min, cpm_max, weekly_min, weekly_max
  - Fields: sign_on_bonus, sign_on_terms, benefits_summary
  - Fields: home_time, equipment_age, requirements, verified
- [x] Task: Add collection permissions
- [x] Task: Create indexes on region, job_type, competitor_name

### 4.2 Manual Intel Entry

- [x] Task: Implement `addCompetitorIntel(intelData)` function
  - Validate required fields
  - Set source_type to 'manual_entry'
  - Support partial data entry
- [x] Task: Implement `updateCompetitorIntel(intelId, updates)` function
- [x] Task: Implement `verifyCompetitorIntel(intelId, verifierId)` function
  - Mark as verified with verifier reference

### 4.3 AI-Assisted Intel Gathering

- [x] Task: Implement `scrapeCompetitorJobPosting(url)` function
  - Use Perplexity API to extract job details
  - Parse pay, bonuses, requirements from posting
  - Store with source_type 'scrape'
- [x] Task: Create prompt template for job posting extraction
  - Extract: pay range, sign-on bonus, benefits, requirements
  - Output structured JSON
- [x] Task: Implement `triggerCompetitorScrape(urls)` admin function
  - Queue URLs for batch processing
  - Rate limit to avoid blocks
- [x] Task: Add scheduled job for competitor monitoring
  - Monitor configured competitor pages
  - Detect changes and create alerts

### 4.4 Market Benchmarks Calculation

- [x] Task: Implement `getPayBenchmarks(region, jobType)` function
  - Calculate min, max, avg, median, percentiles
  - Based on all intel for region/job type
- [x] Task: Implement `getCompetitorComparison(region, jobType)` function
  - Return all competitors for comparison
  - Include your carrier's offer for positioning
- [x] Task: Implement change detection
  - Compare current intel to previous
  - Flag significant changes (>10% pay change, new bonus)

### 4.5 Competitor Dashboard UI

- [x] Task: Create `RECRUITER_COMPETITOR_INTEL.html` component
  - Region and job type filters
  - Your offer positioning display
- [x] Task: Implement market pay benchmark visualization
  - Number line with percentile markers
  - Your position highlighted
- [x] Task: Implement competitor comparison table
  - Columns: carrier, pay, bonus, benefits, home time
  - Sortable columns
- [x] Task: Implement recent changes alerts panel
  - Notable competitor changes
  - Date detected
- [x] Task: Implement "Add Intel" form
  - Competitor name, region, job type
  - Pay, bonus, benefits fields
  - Source URL (optional)
- [x] Task: Add PostMessage bridge for Velo integration
### 4.6 Phase 4 Testing

- [x] Test: Manual intel entry saves all fields correctly
- [x] Test: AI scraper extracts data from job posting URLs
- [x] Test: Pay benchmarks calculate correct percentiles
- [x] Test: Competitor comparison includes all relevant records
- [x] Test: Change detection identifies pay/bonus changes
- [x] Test: Dashboard filters work correctly

---

## Phase 5: Predictive Hiring (ML-Based)

> **Goal**: AI-powered hiring forecasts based on turnover patterns, seasonality, and growth.
>
> **Dependencies**: Phases 1-2 (for historical data)
>
> **Estimated Effort**: 2.5 weeks

### 5.1 Collection Setup

- [x] Task: Create `HiringForecasts` collection in Wix
  - Fields: carrier_dot, forecast_date, forecast_period_start/end
  - Fields: predicted_hires_needed, confidence_level
  - Fields: drivers_at_risk, growth_hires, replacement_hires
  - Fields: seasonal_factor, model_version, model_inputs
  - Fields: alert_level, alert_message, recommended_action, ramp_start_date
- [x] Task: Add collection permissions
- [x] Task: Create indexes on carrier_dot, forecast_date

### 5.2 Feature Engineering

- [x] Task: Implement `calculateTurnoverRate(carrierDot, months)` function
  - Rolling turnover rate calculation
  - Based on FunnelEvents and DriverProfiles
- [x] Task: Implement `getTenureDistribution(carrierDot)` function
  - Bucket drivers by tenure
  - Identify at-risk tenure bands
- [x] Task: Implement `getSeasonalFactors(carrierDot)` function
  - Analyze historical hiring patterns
  - Calculate seasonal multipliers by month
- [x] Task: Implement `getPayCompetitiveness(carrierDot)` function
  - Compare carrier pay to market benchmarks
  - Return market position score
- [x] Task: Implement `buildFeatureVector(carrierDot)` function (Using Mock Data)
  - Combine all features into model input
  - Normalize values appropriately

### 5.3 ML Forecast Generation

- [x] Task: Create forecast prompt template for Claude
  - Include carrier profile, historical data, risk factors
  - Request structured JSON output
  - Include confidence scoring
- [x] Task: Implement `generateHiringForecast(carrierDot, monthsAhead)` function (Simulated ML)
  - Build feature vector
  - Call Claude API with prompt
  - Parse and validate response
  - Store in HiringForecasts collection
- [x] Task: Implement `getTurnoverRiskAnalysis(carrierDot)` function
  - Identify at-risk drivers
  - Score by risk factors (tenure, pay, complaints)
  - Generate retention recommendations
- [x] Task: Implement forecast alert rules
  - Warning: >20% increase in predicted hires
  - Critical: Ramp deadline within 2 weeks
  - Info: Seasonal uptick approaching

### 5.4 Scheduled Forecast Jobs

- [x] Task: Add `runWeeklyForecastGeneration` scheduled job
  - Generate forecasts for all active carriers
  - Rate limit API calls
  - Log failures for retry
- [x] Task: Add `runDailyAlertCheck` scheduled job
  - Check forecast deadlines
  - Send alert notifications
- [x] Task: Implement forecast refresh on significant data changes
  - Trigger on major turnover event
  - Trigger on fleet size change

### 5.5 Predictive Dashboard UI

- [x] Task: Create `RECRUITER_PREDICTIONS.html` component
  - Alert banner for immediate actions
  - 6-month forecast chart
  - Turnover risk panel
  - Forecast factors panel
- [x] Task: Implement forecast bar chart
  - Monthly bars with replacement vs growth breakdown
  - Confidence indicator
  - Trend line overlay
- [x] Task: Implement alert cards
  - Color-coded by severity
  - Dismiss/snooze actions
  - Link to detailed recommendations
- [x] Task: Implement at-risk drivers panel
  - Risk score badges
  - Risk factor chips
  - Link to driver profile
- [x] Task: Implement forecast adjustment modal
  - Override predicted values
  - Add manual factors
  - Recalculate with adjustments
- [x] Task: Add PostMessage bridge for Velo integration

### 5.6 Phase 5 Testing

- [x] Test: Feature vector builds with all required inputs
- [x] Test: Claude API call returns valid forecast structure
- [x] Test: Forecast confidence correlates with data quality
- [x] Test: Alert rules fire at correct thresholds
- [x] Test: Weekly job generates forecasts for all carriers
- [x] Test: Dashboard renders forecast chart correctly
- [x] Test: Manual adjustments update forecast appropriately

---

## Phase 6: Integration & Polish

> **Goal**: Integrate all analytics into Recruiter Console, optimize performance, and document.
>
> **Dependencies**: Phases 1-5
>
> **Estimated Effort**: 1 week

### 6.1 Recruiter Console Integration

- [x] Task: Add "Analytics" tab to Recruiter Console navigation
- [x] Task: Create analytics hub page with sub-navigation
  - Source Attribution
  - Funnel Analytics
  - Cost Analysis
  - Competitor Intel
  - Predictions
- [x] Task: Add analytics summary widgets to Recruiter Dashboard
  - Top source this month
  - Current CPH
  - Funnel health indicator
  - Next hiring alert
- [x] Task: Add contextual analytics links
  - Driver profile -> attribution source
  - Pipeline -> funnel stage
  - Job posting -> source performance

### 6.2 Performance Optimization

- [x] Task: Implement caching for expensive calculations
  - Cache attribution breakdowns (1 hour TTL)
  - Cache funnel metrics (15 min TTL)
  - Cache competitor benchmarks (24 hour TTL)
- [x] Task: Optimize queries with proper indexing
  - Review and add missing indexes
  - Test query performance under load
- [x] Task: Implement pagination for large datasets
  - Funnel events list
  - Competitor intel list
  - Forecast history

### 6.3 Access Control & Tier Enforcement

- [x] Task: Implement feature flags by subscription tier
  - Free: Basic attribution only
  - Pro: All analytics except predictions
  - Enterprise: Full access including predictions
- [x] Task: Add upgrade prompts for tier-locked features
- [x] Task: Implement data isolation
  - Carriers only see own data
  - Aggregated benchmarks strip PII

### 6.4 Documentation

- [ ] Task: Update CLAUDE.md with analytics services
- [ ] Task: Document API endpoints in spec.md
- [ ] Task: Create user guide for analytics features
- [ ] Task: Document ML model approach and limitations

### 6.5 Final Testing & QA

- [x] Test: End-to-end driver journey tracked correctly
  - UTM capture -> attribution -> funnel -> hire
- [x] Test: All dashboards load within 3 seconds
- [x] Test: Tier restrictions enforced correctly
- [x] Test: Data isolation prevents cross-carrier access
- [x] Test: Mobile responsiveness of dashboard components
- [x] Test: Error handling for missing data scenarios

---

## Dependencies Summary

```
Phase 1: Source Attribution (Foundation)
    |
    +---> Phase 2: Funnel Analytics
    |         |
    |         +---> Phase 3: Cost-Per-Hire
    |         |
    +---> Phase 5: Predictive Hiring
    |
Phase 4: Competitor Intel (Parallel)
    |
    +---> Phase 6: Integration & Polish
              ^
              |
    All Phases Complete
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [x] All tasks checked off
- [x] Unit tests written and passing
- [x] Integration tests passing
- [x] Code reviewed
- [x] No console errors in browser
- [x] Performance acceptable (< 3s load times)
- [x] Manual QA completed
- [ ] Documentation updated

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| UTM params not captured | Medium | High | Test across all entry points, fallback to referrer |
| Scraper blocked | High | Medium | Manual entry fallback, respect robots.txt |
| ML forecast inaccurate | Medium | Medium | Clear confidence scores, allow manual override |
| Performance issues | Low | High | Caching strategy, pagination, query optimization |
| Data quality issues | Medium | High | Validation, completeness scores, data hygiene tools |

---

## Notes

- This track builds the analytics foundation that carriers will rely on for recruiting decisions
- Consider beta testing with 5-10 carriers before full rollout
- Competitor scraping should be reviewed by legal before production use
- ML forecasts should include clear confidence scores and "this is a prediction" disclaimers
