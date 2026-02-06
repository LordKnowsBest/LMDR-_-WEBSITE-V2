# Wave 6 Task Cards — Recruiter Analytics & Driver Lifecycle

**Timeline:** Weeks 12-13
**Juniors:** J5, J6
**Gate 2 follows immediately after this wave (week 14)**

---

## Wave 6 Key Notes

- **All recruiter analytics pages use `type` key** with `{ type, data, timestamp }` envelope
- `recruiterAnalyticsService.jsw` is the primary backend — powers 5 separate pages
- **RECRUITER_LIFECYCLE_MONITOR is a placeholder** (no bridge wired) — skip bridge test
- Multiple services have direct wixData fallback calls — flag for Gate 2
- Existing service tests: `recruiterAnalyticsService.test.js`, `callOutcomeService.test.js`, `interventionService.test.js`, `pipelineAutomationService.test.js`, `savedSearchService.test.js`, `retentionService.test.js`, `feedbackLoopService.test.js`

---

# JUNIOR 5 (J5): Recruiter Analytics (5 pages)

## J5-A: Recruiter Analytics Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedRecruiterAnalytics.jsw` |
| 2 | `src/backend/tests/recruiterAnalyticsConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `sourceAttribution` | `v2_Source_Attribution` |
| `recruitingSpend` | `v2_Recruiting_Spend` |
| `funnelEvents` | `v2_Funnel_Events` |
| `competitorIntel` | `v2_Competitor_Intel` |
| `hiringForecasts` | `v2_Hiring_Forecasts` |
| `callOutcomes` | `v2_Call_Outcomes` |
| `callFeedback` | `v2_Call_Feedback` |
| `interventionTemplates` | `v2_Intervention_Templates` |
| `interventionLog` | `v2_Intervention_Log` |
| `pipelineAutomationRules` | `v2_Pipeline_Automation_Rules` |
| `automationLog` | `v2_Automation_Log` |
| `savedSearches` | `v2_Saved_Searches` |
| `savedSearchAlerts` | `v2_Saved_Search_Alerts` |

### Seed Data: 5 attribution records, 5 spend records, 10 funnel events, 3 competitor intel, 3 forecasts, 5 call outcomes, 3 intervention templates, 3 automation rules, 3 saved searches

## J5-B: Attribution Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterAttribution.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterAttribution.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/RECRUITER_ATTRIBUTION.f8zdu.js` — `{ type, data, timestamp }` envelope

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `attributionReady` | sends `carrierContext` | — |
| 2 | `getAttributionData` | `getAttributionBreakdown(dot, dateRange, metric)` | `attributionData` |
| 3 | `recordTouchpoint` | `recordTouchpoint(driverId, utmParams, pageUrl, sessionId)` | `touchpointResult` |
| 4 | `recordHireAttribution` | `recordHireAttribution(driverId, dot, attributionModel)` | `hireAttributionResult` |

## J5-C: Funnel Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterFunnel.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterFunnel.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/RECRUITER_FUNNEL.c87yk.js`

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `funnelReady` | sends `carrierContext` | — |
| 2 | `getFunnelData` | `getFunnelMetrics(dot, dateRange)` + `getBottleneckAnalysis(dot, dateRange)` | `funnelData` |
| 3 | `recordStageChange` | `recordStageChange(driverId, dot, toStage, dropReason)` | `stageChangeResult` |

## J5-D: Cost Analysis Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterCostAnalysis.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterCostAnalysis.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/RECRUITER_COST_ANALYSIS.hc0dz.js`

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `costAnalysisReady` | sends `carrierContext` | — |
| 2 | `getCostData` | `calculateCostPerHire` + `getChannelROI` + `getSpendTrend` (parallel) | `costData` |
| 3 | `recordSpend` | `recordRecruitingSpend(spendData)` | `spendResult` |
| 4 | `bulkImportSpend` | `bulkImportSpend(dot, records)` | `bulkImportResult` |
| 5 | `updateSpendHires` | `updateSpendHires(spendId, hires)` | `spendResult` |
| 6 | `getChannelROI` | `getChannelROI(dot, dateRange)` | `channelROIData` |
| 7 | `getSpendTrend` | `getSpendTrend(dot, months)` | `spendTrendData` |

## J5-E: Competitor Intel Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterCompetitorIntel.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterCompetitorIntel.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/RECRUITER_COMPETITOR_INTEL.hvbs4.js`

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `competitorIntelReady` | sends `carrierContext` | — |
| 2 | `getCompetitorData` | `getCompetitorComparison` + `getPayBenchmarks` (parallel) | `competitorData` |
| 3 | `addIntel` | `addCompetitorIntel(data)` | `intelResult` |
| 4 | `updateIntel` | `updateCompetitorIntel(intelId, updates)` | `intelResult` |
| 5 | `verifyIntel` | `verifyCompetitorIntel(intelId, verifierId)` | `intelResult` |
| 6 | `getPayBenchmarks` | `getPayBenchmarks(region, jobType)` | `payBenchmarksData` |
| 7 | `triggerScrape` | `triggerCompetitorScrape(urls)` | `scrapeResult` |

## J5-F: Predictions Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/recruiterPredictions.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/recruiterPredictions.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/RECRUITER_PREDICTIONS.g78id.js`

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `predictionsReady` | sends `carrierContext` | — |
| 2 | `getPredictionsData` | `getHiringForecast(dot)` + `getTurnoverRiskAnalysis(dot)` (parallel) | `predictionsData` |
| 3 | `generateForecast` | `generateHiringForecast(dot, monthsAhead)` | `forecastResult` |
| 4 | `getTurnoverRisk` | `getTurnoverRiskAnalysis(dot)` | `turnoverRiskData` |

### J5 Acceptance Criteria
- [ ] Seed across 13 collections
- [ ] Connection test passes for all 13
- [ ] 5 new bridge tests: attribution (4), funnel (3), costAnalysis (7), competitorIntel (7), predictions (4)
- [ ] 5 new HTML DOM tests: `recruiterAttribution.html.test.js`, `recruiterFunnel.html.test.js`, `recruiterCostAnalysis.html.test.js`, `recruiterCompetitorIntel.html.test.js`, `recruiterPredictions.html.test.js`
- [ ] All use `{ type, data, timestamp }` envelope

---

# JUNIOR 6 (J6): Retention, Lifecycle & Driver Insights

## J6-A: Driver Lifecycle Seed + Connection Test

### Deliverables
| # | File |
|---|------|
| 1 | `src/backend/seeds/seedDriverLifecycle.jsw` |
| 2 | `src/backend/tests/driverLifecycleConnectionTest.jsw` |

### Collection Keys
| Key | Expected Airtable Table |
|-----|------------------------|
| `driverPerformance` | `v2_Driver_Performance` |
| `retentionRiskLogs` | `v2_Retention_Risk_Logs` |
| `lifecycleEvents` | `v2_Lifecycle_Events` |
| `terminationLogs` | `v2_Termination_Logs` |
| `surveyDefinitions` | `v2_Survey_Definitions` |
| `surveyResponses` | `v2_Survey_Responses` |
| `carrierDriverViews` | `v2_Carrier_Driver_Views` |
| `carrierDriverOutreach` | `v2_Carrier_Driver_Outreach` |

### Seed Data: 10 performance records, 5 risk logs, 8 lifecycle events, 3 termination logs, 2 survey definitions, 5 survey responses, 5 carrier views

## J6-B: Retention Dashboard Bridge + HTML DOM Tests (NEW)

### Deliverables
| # | File | Template Source |
|---|------|----------------|
| 1 | `src/public/__tests__/retentionDashboard.bridge.test.js` | `_TEMPLATE_bridge.test.js` |
| 2 | `src/public/__tests__/retentionDashboard.html.test.js` | `_TEMPLATE_html.test.js` |

### Source: `src/pages/Retention Dashboard.k2ez4.js` — `type` protocol

| # | Type | Calls | Response |
|---|------|-------|----------|
| 1 | `retentionDashboardReady` | `getCarrierRetentionDashboard(carrierDot)` | `updateRetentionDashboard` |
| 2 | `refresh` | same | `updateRetentionDashboard` |

**NOTE:** `RECRUITER_LIFECYCLE_MONITOR.mmg97.js` is a **placeholder page** (no bridge wired). Skip bridge test — document in PR.

### J6 Acceptance Criteria
- [ ] Seed across 8 collections
- [ ] Connection test passes for all 8
- [ ] `retentionDashboard.bridge.test.js` tests 2 actions
- [ ] `retentionDashboard.html.test.js` tests DOM rendering for `updateRetentionDashboard` response
- [ ] Lifecycle Monitor documented as placeholder (no bridge or HTML DOM test needed)
- [ ] Direct wixData calls in `retentionService`, `driverOutreach` documented for Gate 2
