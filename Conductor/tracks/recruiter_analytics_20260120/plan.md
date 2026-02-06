> **STATUS: IN PROGRESS** - Backend largely implemented. Phase 1 UI complete.
>
> **Last Updated**: 2026-02-05 (Automated Audit)
>
> **Last Updated**: 2026-01-20
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

- [ ] Test: UTM parameters captured correctly from various sources
- [ ] Test: Touchpoint history accumulates across sessions
- [ ] Test: First-touch attribution never changes after initial set
- [ ] Test: Last-touch attribution updates on new touchpoints
- [ ] Test: Hire attribution correctly links driver to carrier
- [ ] Test: Dashboard displays correct aggregations

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
- [ ] Task: Add collection permissions
- [ ] Task: Create indexes on carrier_dot, to_stage, entered_at

### 2.2 Stage Tracking Implementation

- [x] Task: Define stage constants and order in shared config
  - lead (1) -> screening (2) -> phone_screen (3) -> application (4)
  - -> interview (5) -> offer (6) -> hired (7) | dropped (terminal)
- [x] Task: Implement `recordStageChange(driverId, carrierDot, toStage, dropReason)` function
  - Auto-calculate from_stage from previous event
  - Calculate time_in_stage for previous stage
  - Link to source attribution
- [ ] Task: Integrate with existing applicationService.jsw
  - Hook into application status changes
  - Map existing statuses to funnel stages
- [ ] Task: Integrate with recruiter pipeline saves
  - Record stage changes when pipeline updates

### 2.3 Funnel Metrics Calculation

- [x] Task: Implement `getFunnelMetrics(carrierDot, dateRange)` function
  - Count entries per stage
  - Calculate conversion rate stage-to-stage
  - Calculate overall conversion (lead -> hired)
- [ ] Task: Implement `getTimeInStageMetrics(carrierDot)` function
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
- [ ] Task: Implement bottleneck alerts panel
  - Warning cards for problematic stages
  - Recommendations display
- [ ] Task: Implement time-in-stage table
  - Per-stage timing metrics
  - Comparison to benchmarks
- [ ] Task: Add PostMessage bridge for Velo integration

### 2.5 Phase 2 Testing

- [ ] Test: Stage changes recorded correctly on application updates
- [ ] Test: Time-in-stage calculated accurately
- [ ] Test: Funnel metrics aggregate correctly by date range
- [ ] Test: Bottleneck detection identifies correct problem stages
- [ ] Test: Dashboard renders funnel with correct proportions
- [ ] Test: Source attribution links correctly to funnel events

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
- [ ] Task: Add collection permissions
- [ ] Task: Create indexes on carrier_dot, channel, period_start

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

- [ ] Task: Create `RECRUITER_COST_ANALYSIS.html` component
  - Date range selector
  - Summary metrics (total spend, hires, avg CPH)
- [ ] Task: Implement channel ROI comparison table
  - Sortable by spend, hires, CPH, ROI score
  - Visual ROI bar indicator
- [ ] Task: Implement spend breakdown pie chart
- [ ] Task: Implement CPH trend line chart
- [ ] Task: Implement spend entry form
  - Channel dropdown
  - Date range picker
  - Amount, impressions, clicks fields
- [ ] Task: Implement CSV import modal
  - File upload
  - Preview and validation
  - Import confirmation
- [ ] Task: Add PostMessage bridge for Velo integration

### 3.5 Phase 3 Testing

- [ ] Test: Manual spend entry saves correctly
- [ ] Test: CSV import parses and validates correctly
- [ ] Test: CPH calculation matches spend/hires
- [ ] Test: Channel ROI ranks channels correctly
- [ ] Test: Dashboard displays correct spend breakdown
- [ ] Test: Trend charts render with correct data

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
- [ ] Task: Add collection permissions
- [ ] Task: Create indexes on region, job_type, competitor_name

### 4.2 Manual Intel Entry

- [x] Task: Implement `addCompetitorIntel(intelData)` function
  - Validate required fields
  - Set source_type to 'manual_entry'
  - Support partial data entry
- [x] Task: Implement `updateCompetitorIntel(intelId, updates)` function
- [x] Task: Implement `verifyCompetitorIntel(intelId, verifierId)` function
  - Mark as verified with verifier reference

### 4.3 AI-Assisted Intel Gathering

- [~] Task: Implement `scrapeCompetitorJobPosting(url)` function
  - Use Perplexity API to extract job details
  - Parse pay, bonuses, requirements from posting
  - Store with source_type 'scrape'
- [ ] Task: Create prompt template for job posting extraction
  - Extract: pay range, sign-on bonus, benefits, requirements
  - Output structured JSON
- [~] Task: Implement `triggerCompetitorScrape(urls)` admin function
  - Queue URLs for batch processing
  - Rate limit to avoid blocks
- [ ] Task: Add scheduled job for competitor monitoring
  - Monitor configured competitor pages
  - Detect changes and create alerts

### 4.4 Market Benchmarks Calculation

- [x] Task: Implement `getPayBenchmarks(region, jobType)` function
  - Calculate min, max, avg, median, percentiles
  - Based on all intel for region/job type
- [x] Task: Implement `getCompetitorComparison(region, jobType)` function
  - Return all competitors for comparison
  - Include your carrier's offer for positioning
- [ ] Task: Implement change detection
  - Compare current intel to previous
  - Flag significant changes (>10% pay change, new bonus)

### 4.5 Competitor Dashboard UI

- [ ] Task: Create `RECRUITER_COMPETITOR_INTEL.html` component
  - Region and job type filters
  - Your offer positioning display
- [ ] Task: Implement market pay benchmark visualization
  - Number line with percentile markers
  - Your position highlighted
- [ ] Task: Implement competitor comparison table
  - Columns: carrier, pay, bonus, benefits, home time
  - Sortable columns
- [ ] Task: Implement recent changes alerts panel
  - Notable competitor changes
  - Date detected
- [ ] Task: Implement "Add Intel" form
  - Competitor name, region, job type
  - Pay, bonus, benefits fields
  - Source URL (optional)
- [ ] Task: Add PostMessage bridge for Velo integration
### 4.6 Phase 4 Testing

- [ ] Test: Manual intel entry saves all fields correctly
- [ ] Test: AI scraper extracts data from job posting URLs
- [ ] Test: Pay benchmarks calculate correct percentiles
- [ ] Test: Competitor comparison includes all relevant records
- [ ] Test: Change detection identifies pay/bonus changes
- [ ] Test: Dashboard filters work correctly

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
- [ ] Task: Add collection permissions
- [ ] Task: Create indexes on carrier_dot, forecast_date

### 5.2 Feature Engineering

- [~] Task: Implement `calculateTurnoverRate(carrierDot, months)` function
  - Rolling turnover rate calculation
  - Based on FunnelEvents and DriverProfiles
- [~] Task: Implement `getTenureDistribution(carrierDot)` function
  - Bucket drivers by tenure
  - Identify at-risk tenure bands
- [~] Task: Implement `getSeasonalFactors(carrierDot)` function
  - Analyze historical hiring patterns
  - Calculate seasonal multipliers by month
- [~] Task: Implement `getPayCompetitiveness(carrierDot)` function
  - Compare carrier pay to market benchmarks
  - Return market position score
- [x] Task: Implement `buildFeatureVector(carrierDot)` function (Using Mock Data)
  - Combine all features into model input
  - Normalize values appropriately

### 5.3 ML Forecast Generation

- [ ] Task: Create forecast prompt template for Claude
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
- [ ] Task: Implement forecast alert rules
  - Warning: >20% increase in predicted hires
  - Critical: Ramp deadline within 2 weeks
  - Info: Seasonal uptick approaching

### 5.4 Scheduled Forecast Jobs

- [ ] Task: Add `runWeeklyForecastGeneration` scheduled job
  - Generate forecasts for all active carriers
  - Rate limit API calls
  - Log failures for retry
- [ ] Task: Add `runDailyAlertCheck` scheduled job
  - Check forecast deadlines
  - Send alert notifications
- [ ] Task: Implement forecast refresh on significant data changes
  - Trigger on major turnover event
  - Trigger on fleet size change

### 5.5 Predictive Dashboard UI

- [ ] Task: Create `RECRUITER_PREDICTIONS.html` component
  - Alert banner for immediate actions
  - 6-month forecast chart
  - Turnover risk panel
  - Forecast factors panel
- [ ] Task: Implement forecast bar chart
  - Monthly bars with replacement vs growth breakdown
  - Confidence indicator
  - Trend line overlay
- [ ] Task: Implement alert cards
  - Color-coded by severity
  - Dismiss/snooze actions
  - Link to detailed recommendations
- [ ] Task: Implement at-risk drivers panel
  - Risk score badges
  - Risk factor chips
  - Link to driver profile
- [ ] Task: Implement forecast adjustment modal
  - Override predicted values
  - Add manual factors
  - Recalculate with adjustments
- [ ] Task: Add PostMessage bridge for Velo integration

### 5.6 Phase 5 Testing

- [ ] Test: Feature vector builds with all required inputs
- [ ] Test: Claude API call returns valid forecast structure
- [ ] Test: Forecast confidence correlates with data quality
- [ ] Test: Alert rules fire at correct thresholds
- [ ] Test: Weekly job generates forecasts for all carriers
- [ ] Test: Dashboard renders forecast chart correctly
- [ ] Test: Manual adjustments update forecast appropriately

---

## Phase 6: Integration & Polish

> **Goal**: Integrate all analytics into Recruiter Console, optimize performance, and document.
>
> **Dependencies**: Phases 1-5
>
> **Estimated Effort**: 1 week

### 6.1 Recruiter Console Integration

- [ ] Task: Add "Analytics" tab to Recruiter Console navigation
- [ ] Task: Create analytics hub page with sub-navigation
  - Source Attribution
  - Funnel Analytics
  - Cost Analysis
  - Competitor Intel
  - Predictions
- [ ] Task: Add analytics summary widgets to Recruiter Dashboard
  - Top source this month
  - Current CPH
  - Funnel health indicator
  - Next hiring alert
- [ ] Task: Add contextual analytics links
  - Driver profile -> attribution source
  - Pipeline -> funnel stage
  - Job posting -> source performance

### 6.2 Performance Optimization

- [ ] Task: Implement caching for expensive calculations
  - Cache attribution breakdowns (1 hour TTL)
  - Cache funnel metrics (15 min TTL)
  - Cache competitor benchmarks (24 hour TTL)
- [ ] Task: Optimize queries with proper indexing
  - Review and add missing indexes
  - Test query performance under load
- [ ] Task: Implement pagination for large datasets
  - Funnel events list
  - Competitor intel list
  - Forecast history

### 6.3 Access Control & Tier Enforcement

- [ ] Task: Implement feature flags by subscription tier
  - Free: Basic attribution only
  - Pro: All analytics except predictions
  - Enterprise: Full access including predictions
- [ ] Task: Add upgrade prompts for tier-locked features
- [ ] Task: Implement data isolation
  - Carriers only see own data
  - Aggregated benchmarks strip PII

### 6.4 Documentation

- [ ] Task: Update CLAUDE.md with analytics services
- [ ] Task: Document API endpoints in spec.md
- [ ] Task: Create user guide for analytics features
- [ ] Task: Document ML model approach and limitations

### 6.5 Final Testing & QA

- [ ] Test: End-to-end driver journey tracked correctly
  - UTM capture -> attribution -> funnel -> hire
- [ ] Test: All dashboards load within 3 seconds
- [ ] Test: Tier restrictions enforced correctly
- [ ] Test: Data isolation prevents cross-carrier access
- [ ] Test: Mobile responsiveness of dashboard components
- [ ] Test: Error handling for missing data scenarios

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

- [ ] All tasks checked off
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code reviewed
- [ ] No console errors in browser
- [ ] Performance acceptable (< 3s load times)
- [ ] Manual QA completed
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
