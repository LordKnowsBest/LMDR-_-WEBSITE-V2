# Domain Router Architecture

**Track:** full_agentic_buildout_20260218
**Date:** 2026-02-18
**Purpose:** Collapse 388 flat tool definitions into ~28 domain router tools for AI prompt efficiency

---

## Problem

Sending 65–147 flat tool definitions per role to the AI wastes tokens, slows reasoning, and degrades tool selection accuracy. The admin role alone would push ~147 tool definitions into the system prompt — roughly 15,000+ tokens of schema before the AI even sees the user's message.

## Solution: Domain Routers

Each router is a single tool definition that the AI sees. It contains:
- A human-readable `description` summarizing the domain
- An `action` enum listing every operation available in that domain
- A `params` object the AI populates based on the action it picks

The router dispatch layer in `executeTool()` resolves the action to the real service module/function, applies the per-action risk level and approval gate, and executes.

**388 operations stay. The AI just sees ~28 tool definitions instead of 388.**

---

## Data Flow (Updated)

```
User Message
  → agentService.handleAgentTurn(role, userId, message, context)
    → Build router tool list (6-8 per role, not 65-147 flat tools)
      → AI generates tool_use: { name: 'fleet_ops', input: { action: 'get_roster', params: {...} } }
        → executeTool('fleet_ops', { action: 'get_roster', params }, runContext)
          → Look up ACTION_REGISTRY['fleet_ops']['get_roster']
            → { serviceModule, serviceFunction, argMapping, policy }
              → Apply risk check / approval gate from policy
                → serviceModule.serviceFunction(...mappedArgs)
                  → dataAccess → Airtable
```

---

## Implementation in `agentService.jsw`

### New: `ACTION_REGISTRY`

A nested map replacing flat `TOOL_DEFINITIONS` for Phase 1+ tools. Existing 36 tools keep their flat definitions for backward compatibility.

```javascript
const ACTION_REGISTRY = {
  // ── Driver Routers ──
  driver_cockpit: {
    search_jobs:            { serviceModule: 'backend/driverCockpitService', serviceFunction: 'searchJobs',            argMapping: ['driverId', 'filters', 'pagination'], policy: { risk_level: 'read', requires_approval: false, rate_limit: 20 } },
    get_job_details:        { serviceModule: 'backend/driverCockpitService', serviceFunction: 'getJobDetails',         argMapping: ['jobId', 'driverId'],                 policy: { risk_level: 'read', requires_approval: false, rate_limit: 20 } },
    quick_apply:            { serviceModule: 'backend/driverCockpitService', serviceFunction: 'submitApplication',     argMapping: ['driverId', 'jobId', 'payload'],      policy: { risk_level: 'execute_high', requires_approval: true, rate_limit: 5 } },
    // ... all 23 cockpit actions
  },
  driver_road: {
    find_parking:           { serviceModule: 'backend/parkingService',       serviceFunction: 'findTruckParking',      argMapping: ['filters'],                           policy: { risk_level: 'read', requires_approval: false, rate_limit: 20 } },
    // ... all 15 road utility actions
  },
  // ... etc
};
```

### New: `ROUTER_DEFINITIONS`

The tool definitions sent to the AI. One per domain.

```javascript
const ROUTER_DEFINITIONS = {
  driver_cockpit: {
    name: 'driver_cockpit',
    description: 'Driver cockpit operations: search jobs, view/apply/withdraw applications, messaging (send/read/threads), profile management, match browsing (view/express interest/dismiss), dashboard summary, notifications, document upload',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['search_jobs', 'get_job_details', 'quick_apply', 'save_job', 'get_saved_jobs',
                 'withdraw_application', 'check_application_status', 'get_application_history',
                 'send_message', 'get_messages', 'get_conversation', 'mark_read', 'get_unread_count',
                 'update_profile', 'get_profile_strength', 'get_profile_suggestions', 'upload_document',
                 'get_matches', 'get_match_details', 'express_interest', 'dismiss_match',
                 'get_dashboard_summary', 'get_notifications'],
          description: 'The cockpit operation to perform'
        },
        params: {
          type: 'object',
          description: 'Parameters for the selected action — see action-specific docs'
        }
      },
      required: ['action']
    },
    roles: ['driver']
  },
  // ... one entry per router
};
```

### Modified: `executeTool()`

```javascript
export async function executeTool(toolName, toolInput, runContext) {
  // Router dispatch: if toolInput has an action field, resolve from ACTION_REGISTRY
  if (toolInput.action && ACTION_REGISTRY[toolName]) {
    const actionDef = ACTION_REGISTRY[toolName][toolInput.action];
    if (!actionDef) {
      return { error: `Unknown action '${toolInput.action}' in router '${toolName}'` };
    }

    // Apply per-action policy (risk, approval, rate limit)
    const policyResult = await checkPolicy(actionDef.policy, runContext);
    if (policyResult.blocked) return policyResult;

    // Resolve and call the backend service
    const serviceModule = await import(actionDef.serviceModule);
    const fn = serviceModule[actionDef.serviceFunction];
    const mappedArgs = actionDef.argMapping.map(key =>
      key === 'driverId' || key === 'recruiterId' || key === 'userId'
        ? runContext.userId
        : toolInput.params?.[key]
    );
    return await fn(...mappedArgs);
  }

  // Fallback: flat TOOL_DEFINITIONS for existing 36 tools
  // ... existing executeTool logic unchanged
}
```

### Modified: `handleAgentTurn()` — Tool List Builder

```javascript
function buildToolList(role) {
  const tools = [];

  // Add router definitions for the role
  for (const [key, router] of Object.entries(ROUTER_DEFINITIONS)) {
    if (router.roles.includes(role)) {
      tools.push({
        name: router.name,
        description: router.description,
        input_schema: router.input_schema
      });
    }
  }

  // Keep existing flat tools that haven't been migrated to routers
  for (const [key, tool] of Object.entries(TOOL_DEFINITIONS)) {
    if (tool.roles?.includes(role) && !ROUTER_DEFINITIONS[key]) {
      tools.push({ name: tool.name, description: tool.description, input_schema: tool.input_schema });
    }
  }

  return tools;
}
```

---

## Router Definitions by Role

### Driver (83 tools → 7 routers)

#### `driver_cockpit` — 23 actions
> Jobs, applications, messaging, profile, matches, dashboard, notifications, documents

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `search_jobs` | read | No | driverCockpitService.searchJobs |
| `get_job_details` | read | No | driverCockpitService.getJobDetails |
| `quick_apply` | execute_high | **Yes** | driverCockpitService.submitApplication |
| `save_job` | execute_low | No | driverCockpitService.saveJob |
| `get_saved_jobs` | read | No | driverCockpitService.getSavedJobs |
| `withdraw_application` | execute_high | **Yes** | driverCockpitService.withdrawApplication |
| `check_application_status` | read | No | driverCockpitService.getApplicationStatus |
| `get_application_history` | read | No | driverCockpitService.getApplicationHistory |
| `send_message` | execute_low | No | messagingService.sendDriverMessage |
| `get_messages` | read | No | messagingService.getConversationMessages |
| `get_conversation` | read | No | messagingService.getConversation |
| `mark_read` | execute_low | No | messagingService.markConversationRead |
| `get_unread_count` | read | No | messagingService.getDriverUnreadCount |
| `update_profile` | execute_low | No | driverProfileService.updateDriverProfile |
| `get_profile_strength` | read | No | driverProfileService.getProfileStrength |
| `get_profile_suggestions` | suggest | No | driverProfileService.getProfileSuggestions |
| `upload_document` | execute_high | **Yes** | documentService.recordDriverDocumentUpload |
| `get_matches` | read | No | matchingService.getDriverMatches |
| `get_match_details` | read | No | matchingService.getMatchDetails |
| `express_interest` | execute_low | No | matchingService.expressDriverInterest |
| `dismiss_match` | execute_low | No | matchingService.dismissMatch |
| `get_dashboard_summary` | read | No | driverCockpitService.getDashboardSummary |
| `get_notifications` | read | No | driverCockpitService.getDriverNotifications |

---

#### `driver_road` — 15 actions
> Parking, fuel prices, weigh stations, rest stops, weather, road conditions, hazard reports

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `find_parking` | read | No | parkingService.findTruckParking |
| `get_parking_details` | read | No | parkingService.getParkingDetails |
| `report_parking_availability` | execute_low | No | parkingService.reportParkingAvailability |
| `save_favorite_parking` | execute_low | No | parkingService.saveFavoriteParking |
| `find_fuel_prices` | read | No | fuelService.findDieselPrices |
| `get_fuel_price_trends` | read | No | fuelService.getFuelPriceTrends |
| `calculate_fuel_cost` | suggest | No | fuelService.calculateTripFuelCost |
| `get_weigh_station_status` | read | No | roadUtilitiesService.getWeighStationStatus |
| `get_weigh_stations_on_route` | read | No | roadUtilitiesService.getWeighStationsOnRoute |
| `find_rest_stops` | read | No | roadUtilitiesService.findRestStops |
| `rate_rest_stop` | execute_low | No | roadUtilitiesService.rateRestStop |
| `get_weather_forecast` | read | No | weatherService.getWeatherForecast |
| `get_weather_alerts` | read | No | weatherService.getWeatherAlerts |
| `get_road_conditions` | read | No | weatherService.getRoadConditions |
| `report_road_hazard` | execute_low | No | roadUtilitiesService.reportRoadHazard |

---

#### `driver_community` — 14 actions
> Forums, mentorship, pet-friendly locations, health resources

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `get_forum_posts` | read | No | communityService.getForumPosts |
| `create_forum_post` | execute_low | No | communityService.createForumPost |
| `reply_to_post` | execute_low | No | communityService.replyToPost |
| `like_post` | execute_low | No | communityService.toggleLike |
| `report_post` | execute_low | No | communityService.reportContent |
| `search_forums` | read | No | communityService.searchForums |
| `find_mentors` | read | No | mentorshipService.findMentors |
| `request_mentorship` | execute_low | No | mentorshipService.requestMentorship |
| `get_mentorship_status` | read | No | mentorshipService.getMentorshipStatus |
| `rate_mentor` | execute_low | No | mentorshipService.rateMentor |
| `search_pet_friendly_locations` | read | No | petFriendlyService.searchLocations |
| `submit_pet_friendly_location` | execute_low | No | petFriendlyService.submitLocation |
| `get_health_resources` | read | No | healthService.getResourcesByCategory |
| `submit_health_tip` | execute_low | No | healthService.submitTip |

---

#### `driver_compliance` — 12 actions
> Document wallet, HOS, ELD, training, certifications

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `upload_compliance_doc` | execute_high | **Yes** | documentService.uploadComplianceDoc |
| `get_compliance_docs` | read | No | documentService.getComplianceDocs |
| `check_doc_expiry` | read | No | documentService.checkDocExpiry |
| `get_expiring_docs` | read | No | documentService.getExpiringDocs |
| `get_hos_summary` | read | No | hosService.getHOSSummary |
| `log_hos_entry` | execute_low | No | hosService.logHOSEntry |
| `get_hos_violations` | read | No | hosService.getHOSViolations |
| `sync_eld_data` | execute_low | No | eldService.syncELDData |
| `get_training_courses` | read | No | trainingService.getTrainingCourses |
| `start_training` | execute_low | No | trainingService.startTraining |
| `get_training_progress` | read | No | trainingService.getTrainingProgress |
| `get_certifications` | read | No | trainingService.getCertifications |

---

#### `driver_financial` — 10 actions
> Expenses, settlements, trip costs, tax, deductions, per diem

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `log_expense` | execute_low | No | expenseService.logExpense |
| `get_expenses` | read | No | expenseService.getExpenses |
| `get_expense_summary` | read | No | expenseService.getExpenseSummary |
| `export_expenses` | read | No | expenseService.exportExpenses |
| `get_settlement_history` | read | No | settlementService.getSettlementHistory |
| `dispute_settlement` | execute_high | **Yes** | settlementService.disputeSettlement |
| `calculate_trip_cost` | suggest | No | tripCalculatorService.calculateTripCost |
| `get_tax_summary` | read | No | taxHelperService.getTaxSummary |
| `get_deduction_suggestions` | suggest | No | taxHelperService.getDeductionSuggestions |
| `get_per_diem_rates` | read | No | taxHelperService.getPerDiemRates |

---

#### `driver_lifecycle` — 5 actions
> Timeline, disposition, surveys, feedback

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `get_driver_timeline` | read | No | driverLifecycleService.getDriverTimeline |
| `update_disposition` | execute_low | No | driverLifecycleService.updateDisposition |
| `get_pending_surveys` | read | No | driverLifecycleService.getPendingSurveys |
| `submit_survey_response` | execute_low | No | driverLifecycleService.submitSurveyResponse |
| `submit_match_feedback` | execute_low | No | driverLifecycleService.submitMatchFeedback |

---

#### `driver_utility` — 4 actions
> Profile strength, quick responses, reverse alerts, market insights

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `get_profile_strength_score` | read | No | driverInsightsService.getProfileStrengthScore |
| `send_quick_response` | execute_low | No | quickResponseService.sendQuickResponse |
| `set_reverse_alert` | execute_low | No | reverseAlertService.setReverseAlert |
| `get_market_insights` | read | No | driverInsightsService.getMarketInsights |

---

### Recruiter (65 tools → 6 routers)

#### `recruiter_outreach` — 14 actions
> Campaigns (SMS, email, voice), job boards, social, templates

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `create_campaign` | execute_low | No | outreachService.createCampaign |
| `send_sms` | execute_high | **Yes** | smsService.sendCampaignSMS |
| `send_email` | execute_high | **Yes** | emailService.sendCampaignEmail |
| `schedule_campaign` | execute_low | No | outreachService.scheduleCampaign |
| `get_campaign_status` | read | No | outreachService.getCampaignStatus |
| `pause_campaign` | execute_low | No | outreachService.pauseCampaign |
| `get_campaign_analytics` | read | No | outreachService.getCampaignAnalytics |
| `create_email_template` | execute_low | No | emailService.createEmailTemplate |
| `get_templates` | read | No | emailService.getTemplates |
| `syndicate_to_job_boards` | execute_high | **Yes** | jobBoardService.syndicateToBoards |
| `get_syndication_status` | read | No | jobBoardService.getSyndicationStatus |
| `update_job_posting` | execute_low | No | jobBoardService.updateJobPosting |
| `create_social_post` | execute_high | **Yes** | socialService.createSocialPost |
| `get_social_analytics` | read | No | socialService.getSocialAnalytics |

---

#### `recruiter_analytics` — 13 actions
> Attribution, CPH, funnels, competitors, forecasts

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `get_source_attribution` | read | No | recruiterAnalyticsService.getSourceAttribution |
| `get_channel_performance` | read | No | recruiterAnalyticsService.getChannelPerformance |
| `compare_sources` | suggest | No | recruiterAnalyticsService.compareSources |
| `calculate_cost_per_hire` | read | No | recruiterAnalyticsService.calculateCostPerHire |
| `get_cph_trend` | read | No | recruiterAnalyticsService.getCPHTrend |
| `get_cph_breakdown` | read | No | recruiterAnalyticsService.getCPHBreakdown |
| `get_funnel_metrics` | read | No | recruiterAnalyticsService.getFunnelMetrics |
| `get_stage_conversion` | read | No | recruiterAnalyticsService.getStageConversion |
| `get_bottleneck_analysis` | suggest | No | recruiterAnalyticsService.getBottleneckAnalysis |
| `get_competitor_analysis` | read | No | competitorIntelService.getCompetitorAnalysis |
| `track_competitor` | execute_low | No | competitorIntelService.trackCompetitor |
| `get_hiring_forecast` | suggest | No | forecastingService.getHiringForecast |
| `get_attrition_forecast` | suggest | No | forecastingService.getAttritionForecast |

---

#### `recruiter_onboarding` — 12 actions
> Workflows, documents, BGC, drug test, e-sign, orientation

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `create_onboarding_workflow` | execute_low | No | onboardingService.createOnboardingWorkflow |
| `get_workflow_status` | read | No | onboardingService.getWorkflowStatus |
| `advance_workflow_step` | execute_low | No | onboardingService.advanceWorkflowStep |
| `get_pending_tasks` | read | No | onboardingService.getPendingTasks |
| `request_document` | execute_high | **Yes** | onboardingDocService.requestDocument |
| `get_document_status` | read | No | onboardingDocService.getDocumentStatus |
| `verify_document` | execute_low | No | onboardingDocService.verifyDocument |
| `initiate_background_check` | execute_high | **Yes** | bgcService.initiateBackgroundCheck |
| `get_bgc_status` | read | No | bgcService.getBGCStatus |
| `initiate_drug_test` | execute_high | **Yes** | drugTestService.initiateDrugTest |
| `send_for_signature` | execute_high | **Yes** | eSignService.sendForSignature |
| `schedule_orientation` | execute_high | **Yes** | orientationService.scheduleOrientation |

---

#### `recruiter_pipeline` — 10 actions
> Saved searches, automation rules, interventions, call outcomes

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `save_search` | execute_low | No | recruiterSearchService.saveSearch |
| `get_saved_searches` | read | No | recruiterSearchService.getSavedSearches |
| `run_saved_search` | read | No | recruiterSearchService.runSavedSearch |
| `create_pipeline_rule` | execute_low | No | pipelineAutomationService.createPipelineRule |
| `get_pipeline_rules` | read | No | pipelineAutomationService.getPipelineRules |
| `enable_rule` | execute_low | No | pipelineAutomationService.enableRule |
| `create_intervention` | execute_high | **Yes** | interventionService.createIntervention |
| `get_intervention_templates` | read | No | interventionService.getInterventionTemplates |
| `log_call_outcome` | execute_low | No | recruiterSearchService.logCallOutcome |
| `get_call_analytics` | read | No | recruiterSearchService.getCallAnalytics |

---

#### `recruiter_retention` — 8 actions
> Risk scores, watchlist, interventions, metrics

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `get_driver_risk_score` | read | No | retentionScoringService.getDriverRiskScore |
| `get_at_risk_drivers` | read | No | retentionScoringService.getAtRiskDrivers |
| `get_risk_factors` | read | No | retentionScoringService.getRiskFactors |
| `add_to_watchlist` | execute_low | No | retentionInterventionService.addToWatchlist |
| `get_watchlist` | read | No | retentionInterventionService.getWatchlist |
| `create_retention_intervention` | execute_high | **Yes** | retentionInterventionService.createRetentionIntervention |
| `get_intervention_status` | read | No | retentionInterventionService.getInterventionStatus |
| `get_retention_metrics` | read | No | retentionScoringService.getRetentionMetrics |

---

#### `recruiter_reverse_match` — 8 actions
> Driver search, scoring, subscriptions, payments

| Action | Risk | Approval | Backend |
|--------|------|----------|---------|
| `search_drivers` | read | No | reverseMatchService.searchDrivers |
| `get_driver_profile_for_recruiter` | read | No | reverseMatchService.getDriverProfileForRecruiter |
| `get_match_score` | read | No | reverseMatchService.getMatchScore |
| `get_score_breakdown` | read | No | reverseMatchService.getScoreBreakdown |
| `compare_candidates` | suggest | No | reverseMatchService.compareCandidates |
| `create_subscription` | execute_high | **Yes** | reverseMatchPaymentService.createSubscription |
| `get_subscription_status` | read | No | reverseMatchPaymentService.getSubscriptionStatus |
| `process_payment` | execute_high | **Yes** | reverseMatchPaymentService.processPayment |

---

### Carrier + B2B (93 tools → 7 routers)

#### `carrier_fleet` — 22 actions
> Roster, equipment, maintenance, scorecards, capacity, ELD, HOS

Actions: `get_fleet_roster`, `get_driver_detail`, `update_driver_status`, `get_driver_performance`, `get_roster_summary`, `export_roster`, `get_equipment_list`, `add_equipment`, `update_equipment`, `get_maintenance_schedule`, `log_maintenance`, `get_equipment_utilization`, `get_safety_scorecard`, `get_performance_scorecard`, `get_compliance_scorecard`, `compare_to_industry`, `get_scorecard_trends`, `get_capacity_overview`, `update_capacity`, `get_capacity_forecast`, `set_hiring_targets`, `get_hiring_progress`

#### `carrier_eld_compliance` — 16 actions
> ELD, HOS, compliance calendar, document vault, DQ files, CSA scores

Actions: `get_eld_summary`, `get_eld_violations`, `get_hos_compliance_rate`, `get_drive_time_utilization`, `get_compliance_calendar`, `add_compliance_event`, `get_upcoming_deadlines`, `set_reminder`, `get_overdue_items`, `upload_carrier_document`, `get_carrier_documents`, `get_document_by_type`, `check_document_validity`, `archive_document`, `get_dq_file_status`, `get_missing_dq_items`

#### `carrier_safety` — 12 actions
> DQ reminders, CSA, incidents

Actions: `send_dq_reminder`, `update_dq_item`, `get_dq_compliance_rate`, `get_csa_scores`, `get_csa_trend`, `get_csa_alerts`, `get_basic_violations`, `compare_csa_to_peers`, `report_incident`, `get_incidents`, `get_incident_detail`, `update_incident_status`, `get_incident_analytics`

#### `carrier_comms` — 20 actions
> Announcements, policies, recognition, feedback surveys

Actions: `create_announcement`, `get_announcements`, `update_announcement`, `delete_announcement`, `get_announcement_reach`, `create_policy`, `get_policies`, `update_policy`, `acknowledge_policy`, `get_policy_acknowledgments`, `create_recognition`, `get_recognitions`, `nominate_driver`, `get_recognition_leaderboard`, `get_recognition_history`, `create_feedback_survey`, `get_survey_responses`, `get_feedback_summary`, `get_sentiment_analysis`, `close_survey`

#### `carrier_setup` — 16 actions
> Onboarding, branding, navigation, subscriptions, deposits, pricing

Actions: `get_onboarding_status`, `start_onboarding_step`, `complete_onboarding_step`, `skip_onboarding_step`, `get_onboarding_checklist`, `update_carrier_profile`, `upload_carrier_logo`, `set_carrier_branding`, `get_carrier_public_profile`, `update_about_section`, `get_carrier_menu`, `set_default_view`, `get_quick_actions`, `customize_dashboard`, `get_feature_tour`, `create_subscription_checkout`

#### `carrier_billing` — 12 actions
> Subscription management, deposits, pricing plans

Actions: `get_subscription_status`, `update_subscription`, `cancel_subscription`, `get_billing_history`, `create_deposit_session`, `verify_deposit`, `get_deposit_status`, `refund_deposit`, `get_pricing_plans`, `compare_plans`, `get_plan_features`, `get_upgrade_options`, `calculate_proration`

#### `b2b_ops` — 33 actions (B2B sub-role shares carrier agent)
> Match intelligence, pipeline, outreach, events, research, analytics, presets, status mgmt

Actions: `save_search_preset`, `get_presets`, `apply_preset`, `delete_preset`, `share_preset`, `get_application_statuses`, `update_application_status`, `get_status_history`, `get_status_analytics`, `bulk_update_status`, `preview_match_results`, `get_match_criteria`, `update_match_preferences`, `get_match_quality_score`, `get_match_suggestions`, `get_b2b_match_signals`, `get_carrier_intent_data`, `get_market_opportunity`, `score_lead`, `get_lead_recommendations`, `get_b2b_pipeline`, `create_opportunity`, `update_opportunity_stage`, `get_pipeline_analytics`, `get_conversion_funnel`, `get_pipeline_forecast`, `create_b2b_outreach`, `send_b2b_email`, `send_b2b_sms`, `schedule_b2b_call`, `log_b2b_activity`, `get_outreach_analytics`, `create_b2b_event`, `get_b2b_events`, `register_for_event`, `get_event_attendees`, `get_event_roi`, `research_carrier`, `get_carrier_intelligence`, `get_fmcsa_data`, `get_company_news`, `generate_carrier_brief`, `get_b2b_dashboard`, `get_revenue_attribution`, `get_b2b_kpis`, `get_b2b_forecast`, `export_b2b_report`

---

### Admin (147 tools → 9 routers)

#### `admin_business` — 17 actions
> Revenue, billing, invoices, commissions

Actions: `get_revenue_dashboard`, `get_revenue_by_source`, `get_mrr_trend`, `get_arpu`, `get_revenue_forecast`, `export_revenue_report`, `get_billing_overview`, `create_invoice`, `send_invoice`, `get_invoice_status`, `mark_invoice_paid`, `get_overdue_invoices`, `calculate_commissions`, `get_commission_report`, `approve_commission`, `get_commission_rules`, `update_commission_rule`

#### `admin_config` — 20 actions
> Feature flags, A/B tests, email templates, notification rules

Actions: `get_feature_flags`, `toggle_feature_flag`, `create_feature_flag`, `update_feature_flag_rules`, `get_flag_audit_log`, `get_flag_impact`, `create_ab_test`, `get_ab_tests`, `get_ab_test_results`, `conclude_ab_test`, `get_winning_variant`, `get_email_templates`, `create_email_template`, `update_email_template`, `preview_email_template`, `send_test_email`, `get_template_performance`, `get_notification_rules`, `create_notification_rule`, `update_notification_rule`, `toggle_notification_rule`, `get_notification_analytics`

#### `admin_portal` — 20 actions
> Dashboard, users, moderation, AI dashboard, compliance

Actions: `get_admin_dashboard`, `get_system_health`, `get_key_metrics`, `get_alert_summary`, `get_recent_activity`, `get_users`, `get_user_detail`, `update_user_role`, `suspend_user`, `reactivate_user`, `get_user_activity_log`, `impersonate_user`, `get_moderation_queue`, `approve_content`, `reject_content`, `flag_content`, `get_moderation_history`, `update_moderation_rules`, `get_ai_usage_summary`, `get_ai_costs`, `get_ai_performance`, `get_provider_status`, `update_ai_config`, `get_ai_error_log`, `get_compliance_dashboard`, `get_audit_log`, `export_audit_log`, `get_compliance_score`, `generate_compliance_report`

#### `admin_support` — 22 actions
> Tickets, knowledge base, chat, NPS

Actions: `create_ticket`, `get_tickets`, `get_ticket_detail`, `update_ticket_status`, `assign_ticket`, `escalate_ticket`, `get_ticket_analytics`, `search_knowledge_base`, `create_kb_article`, `update_kb_article`, `get_kb_categories`, `get_kb_analytics`, `suggest_kb_article`, `get_chat_sessions`, `get_chat_history`, `get_chat_analytics`, `get_response_times`, `get_satisfaction_scores`, `send_nps_survey`, `get_nps_scores`, `get_nps_trend`, `get_nps_by_segment`, `get_nps_comments`, `get_detractor_list`

#### `admin_gamification` — 20 actions
> XP, streaks, achievements, challenges, leaderboards

Actions: `get_user_xp`, `award_xp`, `get_level_progress`, `get_level_requirements`, `get_xp_history`, `get_level_leaderboard`, `get_user_streaks`, `get_active_streaks`, `reset_streak`, `get_streak_leaderboard`, `get_achievements`, `get_user_achievements`, `award_achievement`, `get_achievement_progress`, `create_achievement_definition`, `create_challenge`, `get_active_challenges`, `join_challenge`, `get_challenge_progress`, `get_challenge_leaderboard`, `complete_challenge`, `get_leaderboard`, `get_user_rank`, `get_leaderboard_history`, `create_custom_leaderboard`

#### `admin_adoption` — 8 actions
> Feature interaction logging, usage, funnels, health scores

Actions: `log_feature_interaction`, `get_feature_usage`, `get_feature_adoption_rate`, `get_feature_funnel`, `get_feature_health_score`, `get_underused_features`, `get_feature_engagement_trend`, `get_feature_recommendations`

#### `admin_cross_role` — 12 actions
> Mutual interests, carrier retention, match explanations

Actions: `get_mutual_interests`, `send_interest_signal`, `get_interest_matches`, `withdraw_interest`, `get_carrier_retention_score`, `get_retention_risk_factors`, `get_retention_recommendations`, `get_match_explanation`, `get_match_factors`, `get_match_confidence`, `compare_matches`, `get_system_health_status`

#### `admin_observability` — 16 actions
> Health, tracing, metrics, errors

Actions: `get_service_availability`, `get_degraded_services`, `get_health_history`, `get_traces`, `search_traces`, `get_trace_detail`, `get_trace_timeline`, `get_slow_traces`, `get_system_metrics`, `get_metric_trend`, `get_metric_alerts`, `create_metric_alert`, `get_dashboard_metrics`, `get_error_log`, `get_error_trends`, `get_error_detail`, `acknowledge_error`, `get_top_errors`

#### `admin_api_platform` — 18 actions
> API keys, usage, rate limits, external safety/intel/ops/match/doc data

Actions: `get_api_keys`, `create_api_key`, `revoke_api_key`, `get_api_usage`, `get_rate_limit_status`, `get_safety_data`, `get_inspection_history`, `get_crash_data`, `get_violations`, `get_carrier_intel`, `get_market_data`, `get_industry_benchmarks`, `get_operational_metrics`, `get_fleet_utilization`, `get_route_analytics`, `get_external_matches`, `submit_match_request`, `get_match_status`, `verify_document_external`, `get_doc_verification_status`, `get_engagement_metrics`, `get_user_activity_external`

---

## Token Impact Estimate

| Role | Flat Tools | Flat Tokens (est.) | Routers | Router Tokens (est.) | Savings |
|------|-----------|-------------------|---------|---------------------|---------|
| Driver | 83 | ~12,500 | 7 | ~2,100 | **83%** |
| Recruiter | 65 | ~9,750 | 6 | ~1,800 | **82%** |
| Carrier/B2B | 93 | ~14,000 | 7 | ~2,100 | **85%** |
| Admin | 147 | ~22,000 | 9 | ~2,700 | **88%** |

Estimates assume ~150 tokens per flat tool definition (name + description + input_schema) and ~300 tokens per router definition (name + description + action enum + params schema).

---

## Migration Strategy

1. **Phase 0 complete** — existing 36 flat tools remain as-is
2. **Phase 1 onward** — all new tools register ONLY in `ACTION_REGISTRY` + `ROUTER_DEFINITIONS`
3. **After Phase 4** — backport existing 36 flat tools into routers (optional cleanup sprint)
4. **No breaking changes** — `executeTool()` checks for `toolInput.action` first (router path), falls through to flat path for legacy tools

---

## Per-Action Parameter Documentation

Each action's full parameter spec lives in the role-specific spec files (`spec-driver.md`, `spec-recruiter.md`, etc.). The router description gives the AI enough context to pick the right action; the AI then populates `params` based on conversation context. If the AI needs parameter help, it can describe what it wants to do and the system prompt guides it to the right action + params.

System prompts will include a compact reference table per router:

```
driver_cockpit actions:
  search_jobs(query?, cdl_class?, job_type?, pay_type?, min_pay?, home_time?, radius_miles?, sort_by?, page?)
  get_job_details(job_id, include_carrier_profile?, include_match_rationale?)
  quick_apply(job_id, cover_note?, availability_date?, acknowledge_requirements) [APPROVAL]
  ...
```

This gives the AI parameter hints in ~3 tokens per action instead of ~50 tokens per full schema.
