# Plan — Full Agentic Buildout (36 to ~305 Tools)

## Status: PHASE 0 IN PROGRESS

**Master plan created 2026-02-18.** This is the single source of truth for expanding the LMDR/VelocityMatch agent surface from 36 tools to ~305 tools across all 4 roles. Phase 0 fixes 7 known bugs in the existing agent loop. Phases 1-4 expand each role surface in parallel. Phase 5 adds cross-role intelligence and external API tools.

---

## Current State (delivered)

| Component | Count | Files |
|-----------|-------|-------|
| Driver tools | 6 | `find_matches`, `get_carrier_details`, `explain_match`, `get_fmcsa_data`, `road_conditions`, `find_parking` |
| Recruiter tools | 9 | `search_drivers`, `get_pipeline`, `update_candidate_status`, `send_message`, `schedule_interview`, `log_call`, `get_recruiter_analytics`, `start_autopilot`, `get_autopilot_status` |
| Admin tools | 8 | `get_system_health`, `get_driver_stats`, `manage_prompts`, `get_agent_kpis`, `run_curator`, `detect_anomalies`, `propose_fix`, `execute_fix` |
| Carrier/B2B tools | 5 | `get_account`, `get_signals`, `get_opportunities`, `get_hiring_benchmarks`, `get_conversion_insights` |
| Cross-role tools | 3 | `get_market_intel`, `get_lane_demand`, `get_compensation_benchmarks` |
| Shared tools | 5 | `get_carrier_details` (multi-role), `get_fmcsa_data` (multi-role), `get_compensation_benchmarks` (multi-role), `get_agent_kpis`, `get_autopilot_status` |
| **Total unique tool definitions** | **36** | `agentService.jsw` TOOL_DEFINITIONS |

---

## What's Missing: Full Feature Coverage

The execution plane and control plane are live (tools execute, run ledger tracks, approval gates work, outcomes score). But the agent surface only covers ~12% of the platform's features. 40 Conductor tracks define capabilities that have no agent tool exposure.

### Gap Analysis by Role

| Role | Current Tools | Features Without Tools | Coverage |
|------|--------------|----------------------|----------|
| Driver | 6 | Cockpit (applications, messaging, saved jobs, quick apply), road utilities (fuel, weigh stations, rest stops, weather), community (forums, mentorship, pet-friendly, health), compliance (doc wallet, HOS, ELD, training), utility (profile strength, quick responses, alerts, insights) | ~8% |
| Recruiter | 9 | Outreach (SMS/email campaigns, job boards, social), analytics (attribution, CPH, forecast), onboarding (workflows, docs, BGC, drug test, e-sign), pipeline (saved searches, automation, templates), retention (risk scoring, watchlist), reverse matching (driver search, scoring, Stripe) | ~14% |
| Carrier | 5 | Fleet (roster, equipment, scorecards, capacity, ELD), compliance (calendar, vault, DQ, CSA, incidents), communication (announcements, policies, recognition), journey (onboarding, identity, navigation), conversion (Stripe, checkout), B2B suite (match intel, pipeline, outreach, events, research) | ~8% |
| Admin | 8 | Business ops (revenue, billing, invoicing, commissions), platform config (feature flags, A/B, email templates), portal (dashboard, user mgmt, moderation, AI dashboard), support (tickets, KB, chat, NPS), gamification (XP, streaks, achievements, leaderboards), feature adoption (logging, funnels, health) | ~15% |

---

## Phase 0 — Foundation Fixes (Sprint 1 -- 1 week)

**Goal:** Fix all 7 known bugs before expanding the tool surface. Zero new tools; hardening only.

### Bug 0.1: `start_autopilot` Signature Mismatch

**Problem:** The tool definition passes `Object.values({ carrier_dot, objective, max_contacts, cadence })` positionally, but `autopilotService.createAutopilotCampaign` expects `(recruiterId, config)`.

**File:** `src/backend/agentService.jsw` line 839

**Current (broken):**
```javascript
const args = Object.values(toolInput);
result = await fn(...args);
// Called as: createAutopilotCampaign('DOT123', 'outreach', 20, 'standard')
// Expected:  createAutopilotCampaign(recruiterId, { carrierDot, objective, ... })
```

**Fix:** Add explicit argument mapping for `start_autopilot` in `executeTool()`:
```javascript
} else if (toolName === 'start_autopilot') {
  const { carrier_dot, objective, max_contacts, cadence } = toolInput;
  result = await fn(runContext.userId, {
    carrierDot: carrier_dot,
    objective,
    maxContacts: max_contacts || 20,
    cadence: cadence || 'standard'
  });
}
```

### Bug 0.2: `logAgentAction` Missing Export

**Problem:** `autopilotService.jsw` lines 148-149 and 254-255 import `logAgentAction` from `agentRunLedgerService`, but that function does not exist. The import silently fails in the dynamic `await import()` try/catch, so autopilot campaign actions are never logged.

**File:** `src/backend/agentRunLedgerService.jsw`

**Fix:** Add the missing export:
```javascript
/**
 * Log a high-level agent action (used by autopilot and other autonomous services)
 */
export async function logAgentAction({ action, role, userId, details, runId }) {
  const stepId = generateId('action');
  await dataAccess.insertRecord(COLLECTIONS.steps, {
    step_id: stepId,
    run_id: runId || '',
    tool_name: action || 'agent_action',
    risk_level: 'execute_low',
    args_hash: JSON.stringify(Object.keys(details || {})),
    result_summary: JSON.stringify(details).substring(0, 200),
    latency_ms: 0,
    retries: 0,
    status: 'executed',
    approval_gate_id: ''
  }, { suppressAuth: true });
  return { stepId };
}
```

### Bug 0.3: `checkFollowUpMessage` Field Name Mismatch

**Problem:** `agentOutcomeService.jsw` line 94 queries `{ conversation_id: conversationId }` (snake_case), but `agentConversationService.jsw` stores the field as `conversationId` (camelCase). The Airtable column in `v2_Agent Turns` uses `conversationId`. Result: follow-up detection always returns false, quality scores are always 20 points lower than they should be.

**File:** `src/backend/agentOutcomeService.jsw` line 93-94

**Current (broken):**
```javascript
const result = await dataAccess.queryRecords(COLLECTIONS.turns, {
  filters: { conversation_id: conversationId },
```

**Fix:**
```javascript
const result = await dataAccess.queryRecords(COLLECTIONS.turns, {
  filters: { conversationId: conversationId },
```

### Bug 0.4: `Object.values(toolInput)` Positional Spread

**Problem:** `agentService.jsw` line 839 spreads `Object.values(toolInput)` as positional arguments. JavaScript object property order is not guaranteed to match function parameter order. This is the root cause of Bug 0.1 and will break any tool whose backend function expects named parameters.

**File:** `src/backend/agentService.jsw` lines 834-841

**Current (fragile):**
```javascript
const fn = serviceModule[toolDef.serviceFunction];
if (!fn) {
  return { error: `Function ${toolDef.serviceFunction} not found in ${toolDef.serviceModule}` };
}
const args = Object.values(toolInput);
result = await fn(...args);
```

**Fix:** Pass the entire `toolInput` object for all tools. Update each service function to accept a single config object, or add an `argMapping` field to tool definitions:
```javascript
const fn = serviceModule[toolDef.serviceFunction];
if (!fn) {
  return { error: `Function ${toolDef.serviceFunction} not found in ${toolDef.serviceModule}` };
}

// Use explicit arg mapping if defined, else pass full input object
if (toolDef.argMapping) {
  const mappedArgs = toolDef.argMapping.map(key => toolInput[key]);
  result = await fn(...mappedArgs);
} else {
  result = await fn(toolInput);
}
```

Then add `argMapping` to each existing tool definition:
```javascript
find_matches: {
  // ... existing fields ...
  argMapping: ['zip', 'maxDistance', 'minCPM', 'operationType'],
  // ...
},
get_carrier_details: {
  argMapping: ['dotNumber'],
  // ...
},
explain_match: {
  argMapping: ['driverId', 'carrierDot'],
  // ...
}
```

### Bug 0.5: Self-Healing `_executeAction` Stubs

**Problem:** `selfHealingService.jsw` lines 663-698: 7 of 8 action types in `_executeAction` are `console.log` only. Only `clear_cache` actually does anything. The `execute_fix` tool reports success but performs no remediation.

**File:** `src/backend/selfHealingService.jsw` lines 653-698

**Fix:** Implement real actions for each case:
```javascript
async function _executeAction(action) {
  const actionType = action.type || '';

  switch (actionType) {
    case 'clear_cache': {
      const { getHealthMetrics } = await import('backend/observabilityService');
      await getHealthMetrics('hour');
      break;
    }
    case 'retry_jobs': {
      const { runEnrichmentBatch } = await import('backend/enrichmentBatchService');
      await runEnrichmentBatch();
      break;
    }
    case 'switch_provider': {
      const { updateCostOptimizerConfig } = await import('backend/aiRouterService');
      await updateCostOptimizerConfig({ mode: 'failover', failover_active: true });
      break;
    }
    case 'throttle_requests': {
      const { updateCostOptimizerConfig } = await import('backend/aiRouterService');
      await updateCostOptimizerConfig({ mode: 'cost_optimized', rate_limit_pct: 50 });
      break;
    }
    case 'enable_circuit_breaker': {
      const { createAnomalyRule } = await import('backend/observabilityService');
      await createAnomalyRule({
        name: `circuit_breaker_${action.target}_${Date.now()}`,
        type: 'circuit_breaker',
        metric: action.target,
        threshold: 5,
        window_minutes: 5,
        severity: 'critical',
        enabled: true
      });
      break;
    }
    case 'flag_optimization': {
      await dataAccess.insertRecord('anomalyAlerts', {
        type: 'optimization_flag',
        metric: action.target || 'slow_query',
        severity: 'warning',
        message: action.description || 'Flagged for query optimization review',
        acknowledged: false,
        created_at: new Date().toISOString()
      }, { suppressAuth: true });
      break;
    }
    case 'validation_scan': {
      const { runDataValidation } = await import('backend/dataValidationService');
      if (typeof runDataValidation === 'function') {
        await runDataValidation(action.target);
      }
      break;
    }
    case 'reconciliation': {
      const { runReconciliation } = await import('backend/dataReconciliationService');
      if (typeof runReconciliation === 'function') {
        await runReconciliation(action.target);
      }
      break;
    }
    default: {
      console.warn(`selfHealingService: Unknown action type '${actionType}'`);
    }
  }
}
```

### Bug 0.6: AI Router Non-Anthropic `tool_use` Breakage

**Problem:** The cost optimizer in `aiRouterService.jsw` can route `agent_orchestration` requests to non-Anthropic providers (OpenAI, Google). These providers do not return `contentBlocks` or `stopReason` in the same format. `agentService.jsw` lines 958-961 rely on `aiResponse.contentBlocks` and `aiResponse.stopReason === 'tool_use'`, which are Anthropic-specific.

**File:** `src/backend/aiRouterService.jsw`

**Fix:** Pin `agent_orchestration` to Anthropic in the cost optimizer config:
```javascript
// In selectOptimalProvider() or equivalent function:
const PINNED_FUNCTIONS = {
  agent_orchestration: 'anthropic'  // tool_use format dependency
};

if (PINNED_FUNCTIONS[functionName]) {
  return PINNED_FUNCTIONS[functionName];
}
```

### Bug 0.7: Admin/B2B Hardcoded `userId`s

**Problem:** Several admin and B2B page codes use hardcoded user IDs instead of dynamic `wix-users` lookup. This breaks when deployed to environments where user IDs differ.

**Files:** Various `src/pages/ADMIN_*.js` and `src/pages/B2B_*.js`

**Fix:** Replace all hardcoded user ID strings with dynamic lookup:
```javascript
import wixUsers from 'wix-users';

// BEFORE (broken):
const userId = 'some-hardcoded-id-here';

// AFTER (correct):
const currentUser = wixUsers.currentUser;
const userId = currentUser.loggedIn ? currentUser.id : null;
if (!userId) {
  console.error('User not logged in — cannot proceed');
  return;
}
```

Audit all page codes with `grep -rn "userId.*=.*'" src/pages/ADMIN src/pages/B2B` and replace each instance.

### Phase 0 Exit Criteria

- [ ] `start_autopilot` correctly calls `createAutopilotCampaign(recruiterId, config)`
- [ ] `logAgentAction` exported and autopilot campaign actions appear in run ledger
- [ ] `checkFollowUpMessage` queries `conversationId` (camelCase) and follow-up bonus applies
- [ ] All tools use `argMapping` or named destructuring (no `Object.values` spread)
- [ ] All 8 self-healing action types execute real operations
- [ ] `agent_orchestration` pinned to Anthropic in cost optimizer
- [ ] Zero hardcoded user IDs in admin/B2B page codes
- [ ] All 36 existing tools still pass integration tests

---

## Phase 1 — Driver Surface Expansion (Sprints 2-4 -- 3 weeks)

**Goal:** Expand driver agent from 6 tools to ~80. Make the driver agent a full copilot for CDL drivers.

### 1.1 Cockpit Tools (~15 tools)

Cover the driver cockpit: application pipeline, messaging, job search, saved jobs, quick apply.

| Tool Name | Description | Service Module | Risk Level |
|-----------|-------------|---------------|------------|
| `get_applications` | List driver's active applications and statuses | `backend/applicationService` | read |
| `get_application_detail` | Get detailed status for a specific application | `backend/applicationService` | read |
| `submit_application` | Apply to a carrier position | `backend/applicationService` | execute_high |
| `withdraw_application` | Withdraw a pending application | `backend/applicationService` | execute_high |
| `get_messages` | List conversation threads | `backend/messaging` | read |
| `get_message_thread` | Get messages in a specific thread | `backend/messaging` | read |
| `send_driver_message` | Send a message to a recruiter | `backend/messaging` | execute_high |
| `search_jobs` | Search available positions by criteria | `backend/jobSearchService` | read |
| `get_job_detail` | Get full job listing details | `backend/jobSearchService` | read |
| `save_job` | Save a job to driver's watchlist | `backend/savedJobService` | execute_low |
| `unsave_job` | Remove a saved job | `backend/savedJobService` | execute_low |
| `get_saved_jobs` | List all saved jobs | `backend/savedJobService` | read |
| `quick_apply` | One-click apply using stored profile | `backend/quickApplyService` | execute_high |
| `get_application_timeline` | Get timeline of events for an application | `backend/applicationService` | read |
| `get_match_preferences` | Get driver's current matching preferences | `backend/driverPreferences` | read |

**Tool registration pattern:**
```javascript
get_applications: {
  name: 'get_applications',
  description: 'List all active applications and their current statuses',
  input_schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'withdrawn', 'all'] },
      limit: { type: 'number', description: 'Max results (default 20)' }
    }
  },
  serviceModule: 'backend/applicationService',
  serviceFunction: 'getDriverApplications',
  argMapping: ['status', 'limit'],
  roles: ['driver'],
  policy: {
    risk_level: 'read',
    requires_approval: false,
    rate_limit: 20,
    success_metric: 'applications_returned',
    rollback_strategy: null,
    audit_fields: ['status']
  }
}
```

### 1.2 Road Utilities Tools (~15 tools)

Cover: fuel prices, weigh stations, rest stops, weather, road conditions expansion.

| Tool Name | Description | Service Module | Risk Level |
|-----------|-------------|---------------|------------|
| `get_fuel_prices` | Current fuel prices near a location | `backend/fuelPriceService` | read |
| `find_cheapest_fuel` | Find cheapest fuel within radius | `backend/fuelPriceService` | read |
| `find_weigh_stations` | Locate weigh stations on a route | `backend/weighStationService` | read |
| `get_weigh_station_status` | Open/closed status and wait times | `backend/weighStationService` | read |
| `find_rest_stops` | Find rest stops and amenities | `backend/restStopService` | read |
| `get_weather_forecast` | Weather forecast for route or location | `backend/weatherService` | read |
| `get_weather_alerts` | Active weather alerts along a route | `backend/weatherService` | read |
| `plan_route_stops` | Plan optimal stops along a route | `backend/routePlannerService` | read |
| `get_traffic_conditions` | Real-time traffic for a corridor | `backend/trafficService` | read |
| `find_truck_washes` | Locate truck wash facilities | `backend/truckServicesService` | read |
| `find_repair_shops` | Find repair and maintenance shops | `backend/truckServicesService` | read |
| `get_scale_bypass_info` | PrePass/Drivewyze bypass info | `backend/weighStationService` | read |
| `get_road_closures` | Active road closures and detours | `backend/roadConditionService` | read |
| `calculate_trip_eta` | Estimate trip time with HOS compliance | `backend/tripCalculatorService` | read |
| `get_speed_limits` | Speed limits for a route segment | `backend/roadConditionService` | read |

### 1.3 Community Tools (~12 tools)

Cover: forums, mentorship, pet-friendly locations, health resources.

| Tool Name | Description | Service Module | Risk Level |
|-----------|-------------|---------------|------------|
| `get_forum_posts` | Browse community forum posts | `backend/forumService` | read |
| `create_forum_post` | Post to the driver community forum | `backend/forumService` | execute_high |
| `reply_to_post` | Reply to a forum post | `backend/forumService` | execute_high |
| `find_mentors` | Find available mentors by specialty | `backend/mentorshipService` | read |
| `request_mentorship` | Request a mentorship connection | `backend/mentorshipService` | execute_low |
| `find_pet_friendly` | Search pet-friendly truck stops/locations | `backend/petFriendlyService` | read |
| `submit_pet_location` | Submit a new pet-friendly location | `backend/petFriendlyService` | execute_low |
| `get_health_resources` | Get health resources by category | `backend/healthService` | read |
| `submit_health_tip` | Submit a community health tip | `backend/healthService` | execute_low |
| `get_community_events` | Upcoming driver community events | `backend/communityEventService` | read |
| `rate_location` | Rate a truck stop or facility | `backend/locationReviewService` | execute_low |
| `get_location_reviews` | Get reviews for a facility | `backend/locationReviewService` | read |

### 1.4 Compliance Tools (~14 tools)

Cover: document wallet, HOS tracking, ELD integration, training.

| Tool Name | Description | Service Module | Risk Level |
|-----------|-------------|---------------|------------|
| `get_documents` | List driver's compliance documents | `backend/documentWalletService` | read |
| `upload_document` | Upload a compliance document (CDL, medical, etc.) | `backend/documentWalletService` | execute_low |
| `get_document_status` | Check document expiration/validity status | `backend/documentWalletService` | read |
| `get_expiring_documents` | Get documents expiring within N days | `backend/documentWalletService` | read |
| `get_hos_summary` | Get HOS compliance summary | `backend/hosTrackingService` | read |
| `get_hos_violations` | Check for HOS violations | `backend/hosTrackingService` | read |
| `get_eld_status` | ELD device connection status | `backend/eldIntegrationService` | read |
| `get_eld_logs` | Recent ELD driving logs | `backend/eldIntegrationService` | read |
| `get_training_courses` | Available training courses | `backend/trainingService` | read |
| `enroll_training` | Enroll in a training course | `backend/trainingService` | execute_low |
| `get_training_progress` | Training completion progress | `backend/trainingService` | read |
| `get_compliance_score` | Driver's overall compliance score | `backend/complianceScoreService` | read |
| `get_inspection_history` | Recent DOT inspection results | `backend/inspectionService` | read |
| `get_mvr_summary` | Motor vehicle record summary | `backend/mvrService` | read |

### 1.5 Utility Expansion Tools (~18 tools)

Cover: profile strength, quick responses, reverse alerts, insights dashboard.

| Tool Name | Description | Service Module | Risk Level |
|-----------|-------------|---------------|------------|
| `get_profile_strength` | Profile completeness score and improvement suggestions | `backend/profileStrengthService` | read |
| `update_profile` | Update driver profile fields | `backend/driverProfileService` | execute_low |
| `get_quick_responses` | List saved quick response templates | `backend/quickResponseService` | read |
| `create_quick_response` | Create a new quick response template | `backend/quickResponseService` | execute_low |
| `delete_quick_response` | Delete a quick response template | `backend/quickResponseService` | execute_low |
| `get_reverse_alerts` | Carriers that have viewed/matched the driver | `backend/reverseAlertService` | read |
| `set_alert_preferences` | Configure what alerts driver wants | `backend/reverseAlertService` | execute_low |
| `get_insights_dashboard` | Aggregated dashboard data (views, matches, applications) | `backend/driverInsightsService` | read |
| `get_earnings_estimate` | Estimated earnings for a specific job/route | `backend/earningsEstimateService` | read |
| `get_driver_score` | Driver's matching score and breakdown | `backend/driverScoring` | read |
| `get_notifications` | List driver notifications | `backend/notificationService` | read |
| `mark_notification_read` | Mark a notification as read | `backend/notificationService` | execute_low |
| `get_referral_status` | Check referral program status and rewards | `backend/referralService` | read |
| `submit_referral` | Submit a driver referral | `backend/referralService` | execute_low |
| `get_gamification_status` | XP, level, streaks, achievements | `backend/gamificationService` | read |
| `claim_achievement` | Claim an unlocked achievement reward | `backend/gamificationService` | execute_low |
| `get_leaderboard` | View community leaderboard | `backend/gamificationService` | read |
| `update_preferences` | Update matching/notification preferences | `backend/driverPreferences` | execute_low |

### Phase 1 New Backend Services Required

| Service | File | New Functions | Source Tracks |
|---------|------|--------------|---------------|
| `applicationService.jsw` | New | `getDriverApplications`, `getApplicationDetail`, `submitApplication`, `withdrawApplication`, `getApplicationTimeline` | driver_cockpit |
| `jobSearchService.jsw` | New | `searchJobs`, `getJobDetail` | driver_cockpit |
| `savedJobService.jsw` | New | `getSavedJobs`, `saveJob`, `unsaveJob` | driver_cockpit |
| `quickApplyService.jsw` | New | `quickApply` | driver_cockpit |
| `fuelPriceService.jsw` | New | `getFuelPrices`, `findCheapestFuel` | driver_road_utilities |
| `weighStationService.jsw` | New | `findWeighStations`, `getWeighStationStatus`, `getScaleBypassInfo` | driver_road_utilities |
| `restStopService.jsw` | New | `findRestStops` | driver_road_utilities |
| `weatherService.jsw` | New | `getWeatherForecast`, `getWeatherAlerts` | driver_road_utilities |
| `documentWalletService.jsw` | New | `getDocuments`, `uploadDocument`, `getDocumentStatus`, `getExpiringDocuments` | driver_compliance_tools |
| `hosTrackingService.jsw` | New | `getHOSSummary`, `getHOSViolations` | driver_compliance_tools |
| `eldIntegrationService.jsw` | New | `getELDStatus`, `getELDLogs` | driver_compliance_tools |
| `trainingService.jsw` | New | `getTrainingCourses`, `enrollTraining`, `getTrainingProgress` | driver_compliance_tools |
| `profileStrengthService.jsw` | New | `getProfileStrength` | driver_utility_expansion |
| `reverseAlertService.jsw` | New | `getReverseAlerts`, `setAlertPreferences` | driver_utility_expansion |
| `driverInsightsService.jsw` | New | `getInsightsDashboard` | driver_utility_expansion |

### Phase 1 New Airtable Collections (~40)

`v2_Applications`, `v2_Application Events`, `v2_Job Listings`, `v2_Saved Jobs`, `v2_Quick Apply Config`, `v2_Fuel Prices`, `v2_Weigh Stations`, `v2_Rest Stops`, `v2_Weather Cache`, `v2_Traffic Cache`, `v2_Truck Services`, `v2_Forum Posts`, `v2_Forum Replies`, `v2_Mentorship Connections`, `v2_Community Events`, `v2_Location Reviews`, `v2_Document Wallet`, `v2_HOS Records`, `v2_HOS Violations`, `v2_ELD Connections`, `v2_ELD Logs`, `v2_Training Courses`, `v2_Training Enrollments`, `v2_Training Progress`, `v2_Compliance Scores`, `v2_Inspections`, `v2_MVR Records`, `v2_Profile Strength`, `v2_Quick Responses`, `v2_Reverse Alerts`, `v2_Alert Preferences`, `v2_Driver Insights`, `v2_Earnings Estimates`, `v2_Notifications`, `v2_Referrals`, `v2_Referral Rewards`, `v2_Gamification Profiles`, `v2_Achievements`, `v2_Leaderboard Cache`

### Phase 1 Exit Criteria

- [ ] ~74 new driver tools registered in `TOOL_DEFINITIONS` (total ~80)
- [ ] All tools have `argMapping` and `policy` objects
- [ ] `petFriendlyService.jsw` and `healthService.jsw` (already exist) wired to agent tools
- [ ] All `read` tools return data from Airtable via `dataAccess.jsw`
- [ ] All `execute_high` tools (submit_application, withdraw_application, send_driver_message, create_forum_post, reply_to_post, quick_apply) require approval
- [ ] Driver system prompt updated to describe all new capabilities
- [ ] Integration tests for 5 representative tool chains (cockpit, road, community, compliance, utility)

---

## Phase 2 — Recruiter Surface Expansion (Sprints 5-7 -- 3 weeks)

**Goal:** Expand recruiter agent from 9 tools to ~65. Cover the full recruiter operating system.

### 2.1 Outreach Tools (~12 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `create_sms_campaign` | Create an SMS outreach campaign | execute_high |
| `create_email_campaign` | Create an email outreach campaign | execute_high |
| `get_campaign_status` | Get campaign performance metrics | read |
| `pause_campaign` | Pause an active campaign | execute_low |
| `resume_campaign` | Resume a paused campaign | execute_low |
| `get_campaign_history` | Historical campaigns with outcomes | read |
| `syndicate_job_posting` | Post a job to external boards (Indeed, CDLJobs) | execute_high |
| `get_syndication_status` | Status of syndicated postings | read |
| `create_social_post` | Draft a social media recruiting post | execute_high |
| `get_message_templates` | List available outreach templates | read |
| `create_message_template` | Create a new outreach template | execute_low |
| `preview_campaign_reach` | Estimate campaign reach before sending | read |

### 2.2 Analytics Tools (~10 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_attribution_report` | Source attribution for hires | read |
| `get_cph_metrics` | Cost per hire by channel/period | read |
| `get_funnel_analysis` | Full funnel conversion analysis | read |
| `get_competitor_intel` | Competitor hiring activity in region | read |
| `get_ml_forecast` | ML-powered pipeline forecast | read |
| `get_time_to_fill` | Average time to fill by position type | read |
| `get_source_roi` | ROI by recruiting source | read |
| `get_drop_off_analysis` | Where candidates drop out of funnel | read |
| `get_recruiter_scorecard` | Individual recruiter performance scorecard | read |
| `export_analytics` | Export analytics data as CSV/report | execute_low |

### 2.3 Onboarding Automation Tools (~12 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `create_onboarding_workflow` | Create an onboarding workflow for a hire | execute_low |
| `get_onboarding_status` | Status of a candidate's onboarding | read |
| `request_documents` | Request documents from a candidate | execute_high |
| `get_document_collection_status` | Track document collection progress | read |
| `initiate_bgc` | Initiate background check | execute_high |
| `get_bgc_status` | Background check status | read |
| `initiate_drug_test` | Initiate drug test order | execute_high |
| `get_drug_test_status` | Drug test status | read |
| `send_esign_request` | Send documents for electronic signature | execute_high |
| `get_esign_status` | E-signature status | read |
| `schedule_orientation` | Schedule new hire orientation | execute_high |
| `get_orientation_slots` | Available orientation dates/times | read |

### 2.4 Pipeline Management Tools (~10 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `save_driver_search` | Save a driver search for re-use | execute_low |
| `get_saved_searches` | List saved searches | read |
| `run_saved_search` | Execute a saved search | read |
| `create_pipeline_automation` | Set up automated pipeline stage transitions | execute_low |
| `get_pipeline_automations` | List active automations | read |
| `get_intervention_templates` | Templates for pipeline interventions | read |
| `apply_intervention` | Apply an intervention to a stalled candidate | execute_high |
| `bulk_update_pipeline` | Bulk status update for multiple candidates | execute_high |
| `get_stale_candidates` | Candidates with no activity in N days | read |
| `get_call_outcomes_summary` | Summary of recent call outcomes by disposition | read |

### 2.5 Retention Tools (~8 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_retention_risks` | Drivers at risk of churning | read |
| `get_risk_score_detail` | Detailed risk scoring breakdown | read |
| `add_to_watchlist` | Add a driver to retention watchlist | execute_low |
| `remove_from_watchlist` | Remove from watchlist | execute_low |
| `get_watchlist` | Current watchlist entries | read |
| `create_retention_intervention` | Create a retention outreach action | execute_high |
| `get_retention_history` | Historical retention actions and outcomes | read |
| `get_turnover_analytics` | Turnover rate analytics by segment | read |

### 2.6 Reverse Matching Tools (~8 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `reverse_search_drivers` | Find drivers matching carrier criteria | read |
| `get_reverse_match_scores` | Scoring breakdown for reverse matches | read |
| `create_match_subscription` | Subscribe to new driver alerts for criteria | execute_low |
| `get_match_subscriptions` | List active match subscriptions | read |
| `delete_match_subscription` | Remove a subscription | execute_low |
| `get_subscription_alerts` | Recent alerts from subscriptions | read |
| `get_stripe_billing` | Recruiter subscription and billing info | read |
| `upgrade_subscription` | Initiate Stripe subscription upgrade | execute_high |

### Phase 2 Exit Criteria

- [ ] ~56 new recruiter tools registered (total ~65)
- [ ] All `execute_high` tools approval-gated (campaigns, messages, BGC, drug test, e-sign, bulk updates)
- [ ] Outreach tools integrate with existing `autopilotService.jsw` workflow
- [ ] Onboarding tools integrate with existing `onboardingWorkflowService.jsw`
- [ ] Retention tools integrate with existing `retentionService.jsw`
- [ ] Recruiter system prompt updated
- [ ] Integration tests for outreach chain, onboarding chain, pipeline chain

---

## Phase 3 — Carrier & B2B Surface Expansion (Sprints 8-10 -- 3 weeks)

**Goal:** Expand carrier agent from 5 tools to ~60. Cover fleet management, compliance, and B2B operations.

### 3.1 Fleet Dashboard Tools (~12 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_fleet_roster` | List all drivers in the fleet | read |
| `get_driver_scorecard` | Performance scorecard for a fleet driver | read |
| `get_equipment_list` | Fleet equipment inventory | read |
| `get_equipment_status` | Maintenance and compliance status for a unit | read |
| `get_fleet_capacity` | Current fleet capacity vs demand | read |
| `get_eld_fleet_summary` | Fleet-wide ELD compliance summary | read |
| `get_fleet_utilization` | Equipment utilization rates | read |
| `get_fleet_costs` | Operating cost breakdown | read |
| `assign_driver_to_unit` | Assign a driver to equipment | execute_low |
| `update_equipment_status` | Update equipment maintenance status | execute_low |
| `get_fleet_alerts` | Active fleet alerts (maintenance, compliance) | read |
| `get_driver_availability` | Which drivers are available for dispatch | read |

### 3.2 Carrier Compliance Tools (~10 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_compliance_calendar` | Upcoming compliance deadlines | read |
| `get_document_vault` | Carrier document vault contents | read |
| `upload_carrier_document` | Upload a compliance document | execute_low |
| `get_dq_tracker` | Driver qualification file tracker | read |
| `get_dq_gaps` | Missing or expiring DQ items | read |
| `get_csa_scores` | CSA BASIC scores and trends | read |
| `get_csa_alerts` | CSA alert thresholds approaching | read |
| `log_incident` | Log a safety incident | execute_low |
| `get_incident_history` | Safety incident history | read |
| `get_audit_readiness` | DOT audit readiness assessment | read |

### 3.3 Carrier Communication Tools (~8 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `create_announcement` | Create a fleet-wide announcement | execute_high |
| `get_announcements` | List recent announcements | read |
| `create_policy_update` | Draft and distribute a policy update | execute_high |
| `get_policies` | List active policies | read |
| `create_recognition` | Recognize a driver achievement | execute_low |
| `get_recognitions` | List recent recognitions | read |
| `create_feedback_request` | Request feedback from drivers | execute_low |
| `get_feedback_responses` | View feedback responses | read |

### 3.4 Journey & Conversion Tools (~8 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_onboarding_flow` | Carrier onboarding flow status | read |
| `update_carrier_identity` | Update carrier profile/branding | execute_low |
| `get_carrier_navigation` | Guided next steps for carrier setup | read |
| `initiate_deposit` | Initiate Stripe deposit for service | execute_high |
| `get_payment_history` | Payment and billing history | read |
| `get_subscription_status` | Current subscription plan details | read |
| `upgrade_carrier_plan` | Initiate plan upgrade | execute_high |
| `get_checkout_session` | Create Stripe checkout session | execute_high |

### 3.5 B2B Suite Tools (~18 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_match_intelligence` | Detailed match intelligence for an account | read |
| `get_b2b_pipeline` | Full B2B pipeline view | read |
| `update_opportunity_stage` | Move an opportunity through stages | execute_low |
| `create_b2b_outreach` | Create B2B outreach to a prospect | execute_high |
| `get_b2b_events` | B2B account timeline events | read |
| `run_research_agent` | Run AI research on a prospect account | execute_low |
| `get_research_results` | Get research agent results | read |
| `get_b2b_analytics` | B2B pipeline and conversion analytics | read |
| `create_b2b_account` | Create a new B2B prospect account | execute_low |
| `update_b2b_account` | Update account details | execute_low |
| `get_b2b_tasks` | Open tasks for B2B accounts | read |
| `create_b2b_task` | Create a follow-up task | execute_low |
| `complete_b2b_task` | Mark a task as complete | execute_low |
| `get_b2b_contacts` | Contacts associated with an account | read |
| `add_b2b_contact` | Add a contact to an account | execute_low |
| `get_b2b_notes` | Notes on an account | read |
| `add_b2b_note` | Add a note to an account | execute_low |
| `get_b2b_score` | Account scoring and fit analysis | read |

### Phase 3 Exit Criteria

- [ ] ~55 new carrier/B2B tools registered (total ~60)
- [ ] Fleet tools read from existing carrier data collections
- [ ] B2B tools integrate with existing `b2bAccountService`, `b2bPipelineService`, `b2bMatchSignalService`, `b2bActivityService`, `b2bResearchAgentService`
- [ ] Stripe tools integrate with existing `stripeService.jsw`
- [ ] Communication tools (`create_announcement`, `create_policy_update`) are approval-gated
- [ ] Carrier system prompt updated
- [ ] Integration tests for fleet chain, compliance chain, B2B chain

---

## Phase 4 — Admin & Platform Expansion (Sprints 11-13 -- 3 weeks)

**Goal:** Expand admin agent from 8 tools to ~55. Give admins full platform control through the agent.

### 4.1 Business Operations Tools (~10 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_revenue_dashboard` | Revenue metrics and trends | read |
| `get_billing_overview` | Active subscriptions and billing status | read |
| `get_invoices` | List invoices by period | read |
| `create_invoice` | Generate an invoice | execute_high |
| `get_commission_report` | Commission calculations by recruiter | read |
| `approve_commission` | Approve a commission payout | execute_high |
| `get_mrr_metrics` | Monthly recurring revenue metrics | read |
| `get_churn_metrics` | Subscription churn analytics | read |
| `get_arpu_breakdown` | Average revenue per user breakdown | read |
| `export_financial_report` | Export financial data | execute_low |

### 4.2 Platform Configuration Tools (~10 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_feature_flags` | List all feature flags and states | read |
| `toggle_feature_flag` | Enable/disable a feature flag | execute_high |
| `get_ab_tests` | Active A/B tests and results | read |
| `create_ab_test` | Create a new A/B test | execute_high |
| `get_email_templates` | List email templates | read |
| `update_email_template` | Update an email template | execute_high |
| `get_notification_rules` | Notification routing rules | read |
| `update_notification_rule` | Update a notification rule | execute_low |
| `get_platform_config` | Platform-wide configuration values | read |
| `update_platform_config` | Update a platform config value | execute_high |

### 4.3 Admin Portal Tools (~10 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_admin_dashboard` | Admin dashboard summary data | read |
| `get_user_list` | List platform users with filters | read |
| `get_user_detail` | Detailed user profile and activity | read |
| `suspend_user` | Suspend a user account | execute_high |
| `unsuspend_user` | Reactivate a suspended user | execute_high |
| `get_moderation_queue` | Content moderation queue | read |
| `moderate_content` | Approve/reject/flag moderated content | execute_high |
| `get_ai_dashboard` | AI usage dashboard (tokens, costs, quality) | read |
| `get_compliance_audit` | Platform compliance audit report | read |
| `get_login_activity` | Recent login activity and anomalies | read |

### 4.4 Support Operations Tools (~8 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_support_tickets` | List open support tickets | read |
| `get_ticket_detail` | Detailed ticket with conversation | read |
| `update_ticket_status` | Update ticket status/priority | execute_low |
| `assign_ticket` | Assign ticket to support agent | execute_low |
| `get_knowledge_base` | Search knowledge base articles | read |
| `create_kb_article` | Create a new KB article | execute_low |
| `get_nps_scores` | NPS survey results and trends | read |
| `get_csat_report` | Customer satisfaction report | read |

### 4.5 Gamification Admin Tools (~8 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_gamification_config` | Gamification system configuration | read |
| `update_xp_rules` | Update XP earning rules | execute_high |
| `get_achievement_list` | List all achievements and unlock rates | read |
| `create_achievement` | Create a new achievement | execute_low |
| `create_challenge` | Create a limited-time challenge | execute_low |
| `get_active_challenges` | Active challenges and participation | read |
| `get_global_leaderboard` | Platform-wide leaderboard data | read |
| `get_gamification_analytics` | Gamification engagement analytics | read |

### 4.6 Feature Adoption Tools (~6 tools)

| Tool Name | Description | Risk Level |
|-----------|-------------|------------|
| `get_feature_adoption` | Feature adoption rates and trends | read |
| `get_adoption_funnels` | Feature adoption funnels | read |
| `get_feature_health` | Health scores per feature | read |
| `get_stickiness_metrics` | DAU/MAU and stickiness metrics | read |
| `get_adoption_cohorts` | Cohort analysis for feature adoption | read |
| `create_adoption_campaign` | Create a feature adoption nudge campaign | execute_low |

### Phase 4 Exit Criteria

- [ ] ~47 new admin tools registered (total ~55)
- [ ] All `execute_high` tools approval-gated (invoices, commissions, feature flags, A/B tests, user suspension, email templates, platform config, content moderation, XP rules)
- [ ] Business ops tools read from existing billing/Stripe data
- [ ] Feature adoption tools integrate with existing `featureAdoptionService.jsw`
- [ ] Gamification tools integrate with existing `gamificationService.jsw`
- [ ] Admin system prompt updated
- [ ] Integration tests for business ops chain, platform config chain, support chain

---

## Phase 5 — Cross-Role Intelligence & External APIs (Sprints 14-16 -- 3 weeks)

**Goal:** Add ~45 cross-role tools covering mutual intelligence, external API gateway, financial tools, and lifecycle management.

### 5.1 Cross-Role Utility Tools (~10 tools)

| Tool Name | Description | Roles | Risk Level |
|-----------|-------------|-------|------------|
| `get_mutual_interest` | Check if driver and carrier have mutual interest | driver, recruiter | read |
| `get_retention_for_carrier` | Carrier-specific retention insights | carrier, recruiter | read |
| `get_match_explanation` | Detailed explanation of a match score | driver, carrier | read |
| `get_recruiter_health` | Recruiter's system health status | recruiter | read |
| `get_platform_benchmarks` | Platform-wide performance benchmarks | all | read |
| `get_industry_trends` | CDL industry trend data | recruiter, carrier, admin | read |
| `get_regional_analysis` | Regional supply/demand analysis | recruiter, carrier | read |
| `get_seasonal_patterns` | Seasonal hiring pattern analysis | recruiter, carrier | read |
| `compare_carriers` | Side-by-side carrier comparison | driver | read |
| `get_driver_market_value` | Driver's estimated market value | driver | read |

### 5.2 Observability Gap Fixes (~5 tools)

| Tool Name | Description | Roles | Risk Level |
|-----------|-------------|-------|------------|
| `get_tracing_dashboard` | Distributed tracing for agent runs | admin | read |
| `get_tool_performance` | Per-tool latency and error rate metrics | admin | read |
| `get_scoring_accuracy` | Outcome scoring accuracy metrics | admin | read |
| `recalibrate_scoring` | Recalibrate outcome scoring weights | admin | execute_high |
| `get_agent_replay` | Replay an agent run step-by-step | admin | read |

### 5.3 External API Gateway Tools (~10 tools)

| Tool Name | Description | Roles | Risk Level |
|-----------|-------------|-------|------------|
| `query_safety_api` | External safety/CSA data APIs | admin, carrier | read |
| `query_intel_api` | External market intelligence APIs | recruiter, carrier | read |
| `query_ops_api` | External operations data (fuel, weather) | driver | read |
| `query_matching_api` | External matching/scoring APIs | recruiter | read |
| `query_document_api` | External document verification APIs | recruiter, carrier | read |
| `query_engagement_api` | External engagement/communication APIs | recruiter | read |
| `get_api_usage` | API gateway usage and rate limit status | admin | read |
| `get_api_health` | External API health status | admin | read |
| `configure_api_key` | Manage external API keys | admin | execute_high |
| `test_api_endpoint` | Test an external API endpoint | admin | execute_low |

### 5.4 Financial Tools (~8 tools)

| Tool Name | Description | Roles | Risk Level |
|-----------|-------------|-------|------------|
| `track_expenses` | Log and track driver expenses | driver | execute_low |
| `get_expense_report` | Expense report by period | driver | read |
| `get_settlement_detail` | Settlement statement details | driver | read |
| `calculate_trip_cost` | Calculate trip cost (fuel, tolls, etc.) | driver | read |
| `get_tax_summary` | Tax-relevant expense summary | driver | read |
| `get_irs_per_diem` | Current IRS per diem rates | driver | read |
| `get_fuel_tax_report` | IFTA fuel tax calculation | driver, carrier | read |
| `estimate_take_home` | Estimated take-home pay calculator | driver | read |

### 5.5 Lifecycle & Disposition Tools (~10 tools)

| Tool Name | Description | Roles | Risk Level |
|-----------|-------------|-------|------------|
| `get_driver_timeline` | Full lifecycle timeline for a driver | recruiter, admin | read |
| `get_carrier_timeline` | Full lifecycle timeline for a carrier | admin | read |
| `update_disposition` | Update candidate disposition code | recruiter | execute_low |
| `get_disposition_options` | Available disposition codes | recruiter | read |
| `create_exit_survey` | Send an exit survey to a churned driver | recruiter | execute_high |
| `get_survey_responses` | Exit survey response data | recruiter, admin | read |
| `submit_algorithm_feedback` | Submit feedback on match/score quality | driver, recruiter | execute_low |
| `get_feedback_summary` | Aggregated algorithm feedback | admin | read |
| `get_lifecycle_analytics` | Lifecycle stage distribution analytics | admin | read |
| `get_cohort_retention` | Retention rates by signup cohort | admin | read |

### Phase 5 Exit Criteria

- [ ] ~43 new cross-role tools registered (total ~45)
- [ ] Cross-role tools have correct multi-role `roles` arrays
- [ ] External API tools route through a centralized API gateway service
- [ ] Financial tools work with existing billing data or new Airtable collections
- [ ] Lifecycle tools integrate with existing pipeline and application data
- [ ] All 4 system prompts updated with cross-role awareness
- [ ] End-to-end test: driver searches + carrier matches + recruiter outreach + admin monitors

---

## Architecture Notes

### Tool Registration Pattern

Every new tool follows this exact pattern in `TOOL_DEFINITIONS`:

```javascript
tool_name: {
  name: 'tool_name',
  description: 'Clear description of what this tool does and when to use it',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'What this param is' },
      param2: { type: 'number', description: 'What this param is' }
    },
    required: ['param1']
  },
  serviceModule: 'backend/serviceFile',
  serviceFunction: 'functionName',
  argMapping: ['param1', 'param2'],  // Explicit positional mapping (Phase 0 fix)
  roles: ['driver'],                  // Which roles can use this tool
  policy: {
    risk_level: 'read',               // read | suggest | execute_low | execute_high
    requires_approval: false,          // true for execute_high
    rate_limit: 20,                    // calls per minute per user
    success_metric: 'data_returned',   // what constitutes success
    rollback_strategy: null,           // how to undo (null for reads)
    audit_fields: ['param1']           // fields to log for compliance
  }
}
```

### Data Flow

```
User Message
  -> agentService.handleAgentTurn(role, userId, message, context)
    -> AI generates tool_use response
      -> executeTool(toolName, toolInput, runContext)
        -> argMapping maps input to function params
          -> serviceModule.serviceFunction(...mappedArgs)
            -> dataAccess.queryRecords/insertRecord/updateRecord
              -> Airtable (primary) or Wix (auth-only)
```

### System Prompt Scaling

As tools grow from 36 to ~305, system prompts must evolve to give the AI enough context to choose tools wisely without exceeding token limits. Strategy:

1. **Role scoping** -- Each role only sees its own tools (driver: ~80, recruiter: ~65, carrier: ~60, admin: ~55)
2. **Category prefixes** -- Tool names use category prefixes (`fleet_`, `compliance_`, `b2b_`) so the AI can reason about tool groups
3. **Tool discovery** -- Add a `list_available_tools` meta-tool per role that returns categorized tool list when the user asks what the agent can do
4. **Prompt compression** -- System prompts describe capabilities by category, not individual tools

### Backend Service Conventions

New backend services follow these rules:
- File: `src/backend/<serviceName>.jsw`
- Imports: `import * as dataAccess from 'backend/dataAccess';`
- Collection keys: camelCase, matching `configData.js` entries
- All queries use `{ suppressAuth: true }` for backend-initiated operations
- All numeric fields from user input are cast with `Number()`
- Chunk size: 10 for Airtable CRUD, 5 for email, 50 for simple reads
- Error handling: try/catch with descriptive error objects, never throw from tool functions

---

## Quantified Scope

| Phase | Current Tools | Target Tools | New Tools | New Backend Services | New Airtable Collections |
|-------|--------------|-------------|-----------|---------------------|-------------------------|
| 0 | 36 | 36 | 0 (fixes) | 0 | 0 |
| 1 | 6 (driver) | ~80 | ~74 | ~15 | ~40 |
| 2 | 9 (recruiter) | ~65 | ~56 | ~12 | ~35 |
| 3 | 5 (carrier) | ~60 | ~55 | ~14 | ~45 |
| 4 | 8 (admin) | ~55 | ~47 | ~10 | ~35 |
| 5 | 3 (cross-role) | ~45 | ~43 | ~8 | ~32 |
| **Total** | **36** | **~305** | **~275** | **~59** | **~187** |

---

## Team Implementation Plan

### Sprint Cadence

| Sprint | Phase | Duration | Focus |
|--------|-------|----------|-------|
| 1 | Phase 0 | 1 week | Bug fixes, hardening, test green |
| 2-4 | Phase 1 | 3 weeks | Driver tools (cockpit, road, community, compliance, utility) |
| 5-7 | Phase 2 | 3 weeks | Recruiter tools (outreach, analytics, onboarding, pipeline, retention, reverse) |
| 8-10 | Phase 3 | 3 weeks | Carrier/B2B tools (fleet, compliance, comms, journey, conversion, B2B suite) |
| 11-13 | Phase 4 | 3 weeks | Admin tools (biz ops, config, portal, support, gamification, adoption) |
| 14-16 | Phase 5 | 3 weeks | Cross-role tools (intel, observability, API gateway, financial, lifecycle) |

### Parallel Workstreams per Phase

```
Each Phase (1-4):
  ┌────────────────────────────────────────────────┐
  │                  TEAM LEAD                      │
  │  Owns: Tool registration, system prompt updates │
  │  Coordinates: Service integration, code review   │
  └──────┬──────────┬──────────┬──────────┬─────────┘
         │          │          │          │
  ┌──────┴──┐ ┌─────┴───┐ ┌───┴─────┐ ┌──┴────────┐
  │ Backend │ │  Data   │ │  Tool   │ │   Test    │
  │ Service │ │  Layer  │ │ Defs +  │ │  Suite    │
  │ Author  │ │ Airtable│ │ Prompts │ │           │
  └─────────┘ └─────────┘ └─────────┘ └───────────┘
```

**Backend Service Author:** Writes new `.jsw` files with service functions.
**Data Layer:** Creates Airtable tables, adds `configData.js` entries, writes `dataAccess` queries.
**Tool Defs + Prompts:** Registers tools in `TOOL_DEFINITIONS`, updates system prompts.
**Test Suite:** Writes integration tests, validates tool chains, regression checks.

### Dependency Graph

```
Phase 0 (bug fixes)
  │
  ├──> Phase 1 (driver ~80 tools)   ──┐
  ├──> Phase 2 (recruiter ~65 tools) ──┤
  ├──> Phase 3 (carrier ~60 tools)   ──┼──> Phase 5 (cross-role ~45 tools)
  └──> Phase 4 (admin ~55 tools)     ──┘
```

Phases 1-4 run in parallel after Phase 0 completes. Phase 5 depends on all four surface phases because cross-role tools reference tools and data from every role.

### Per-Phase Delivery Checklist

For every phase completion, verify:

- [ ] All new tools registered in `TOOL_DEFINITIONS` with complete policy objects
- [ ] All `argMapping` arrays match service function signatures
- [ ] All risk levels correctly classified (read/suggest/execute_low/execute_high)
- [ ] All `execute_high` tools have `requires_approval: true`
- [ ] All new backend services follow `dataAccess.jsw` routing pattern
- [ ] All new Airtable collections added to `configData.js` (DATA_SOURCE, WIX_COLLECTION_NAMES, AIRTABLE_TABLE_NAMES)
- [ ] Run ledger logging all new tool steps
- [ ] Outcome evaluator scoring new tool executions correctly
- [ ] System prompt updated for the role with new capability descriptions
- [ ] Integration tests passing for representative tool chains
- [ ] No regressions in existing tools (run full test suite)
- [ ] PostMessage bridge updates if any new tools require frontend interaction

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tool count exceeds AI context window | Tools dropped from prompt, agent cannot use them | Role scoping keeps per-role count under 80; add tool discovery meta-tool |
| Airtable rate limits at ~187 collections | Queries throttled or fail | Chunk size limits, 200ms inter-chunk delays, connection pooling |
| Backend service sprawl | Hard to maintain ~59 new services | Follow naming conventions strictly; group related functions in single service files |
| Approval fatigue on execute_high tools | Users stop approving, bypass gates | Review approval gates per phase; downgrade low-risk actions to execute_low when safe |
| Phase 5 blocked by slow Phase 1-4 | Cross-role tools delayed | Phase 5 can start with available surfaces; graceful degradation if some roles incomplete |
| Cost explosion from 305-tool agent | Token usage spikes | Existing cost controls (per-run caps, daily limits, cost alerts) apply to all new tools |

---

## Source Conductor Tracks

This plan consolidates requirements from all 40 Conductor tracks:

| Track | Phase | Tools Contributed |
|-------|-------|-------------------|
| `driver_cockpit_20251221` | 1 | ~15 (applications, messaging, jobs) |
| `driver_road_utilities_20260120` | 1 | ~15 (fuel, weigh, rest, weather, traffic) |
| `driver_community_20260120` | 1 | ~12 (forums, mentorship, pet-friendly, health) |
| `driver_compliance_tools_20260120` | 1 | ~14 (docs, HOS, ELD, training) |
| `driver_utility_expansion_20260120` | 1 | ~18 (profile, alerts, insights, gamification) |
| `recruiter_outreach_20260120` | 2 | ~12 (SMS, email, job boards, social) |
| `recruiter_analytics_20260120` | 2 | ~10 (attribution, CPH, forecast) |
| `recruiter_onboarding_automation_20260120` | 2 | ~12 (workflows, BGC, drug test, e-sign) |
| `recruiter_utility_expansion_20260120` | 2 | ~10 (pipeline, interventions, saved searches) |
| `retention_dashboard` | 2 | ~8 (risk scoring, watchlist, interventions) |
| `reverse_matching_20251225` | 2 | ~8 (reverse search, subscriptions, Stripe) |
| `carrier_fleet_dashboard_20260120` | 3 | ~12 (roster, equipment, utilization) |
| `carrier_compliance_20260120` | 3 | ~10 (calendar, DQ, CSA, incidents) |
| `carrier_communication_20260120` | 3 | ~8 (announcements, policies, recognition) |
| `carrier_journey_activation_20260131` | 3 | ~4 (onboarding, identity) |
| `carrier_conversion_20260103` | 3 | ~4 (Stripe deposit, checkout) |
| `b2b_business_development_suite_20260128` | 3 | ~18 (match intel, pipeline, research) |
| `admin_business_ops_20260120` | 4 | ~10 (revenue, billing, commissions) |
| `admin_platform_config_20260120` | 4 | ~10 (feature flags, A/B, templates) |
| `admin_portal_20251224` | 4 | ~10 (dashboard, users, moderation) |
| `admin_support_ops_20260120` | 4 | ~8 (tickets, KB, NPS) |
| `gamification_strategy_20260123` | 4 | ~8 (XP, achievements, challenges) |
| `feature_adoption_log_20260120` | 4 | ~6 (adoption, funnels, health) |
| `cross_role_utility_20260120` | 5 | ~10 (mutual interest, benchmarks) |
| `observability_gaps_20260112` | 5 | ~5 (tracing, scoring, replay) |
| `external_api_platform_20260123` | 5 | ~10 (gateway, safety, intel APIs) |
| `driver_financial_tools_20260120` | 5 | ~8 (expenses, settlements, tax) |
| `driver_lifecycle_disposition_20260128` | 5 | ~10 (timelines, surveys, feedback) |
