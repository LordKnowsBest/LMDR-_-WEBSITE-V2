# Track Plan: Recruiter Utility Expansion

> **Dependencies**: This track depends on `reverse_matching_20251225` (driver search) and `stripe_subscriptions_20260104` (tier enforcement).

---

## Phase 1: Saved Searches with Alerts

Extend the driver search functionality to allow recruiters to save search criteria and receive notifications when new matching drivers appear.

### 1.1 Data Model Setup

- [x] Task: Create `SavedSearches` collection in Wix with schema from spec
  - Fields: `_id`, `_owner`, `carrier_dot`, `search_name`, `criteria` (JSON), `alert_frequency`, `alert_channel`, `last_run_date`, `last_match_count`, `new_matches_since_last`, `is_active`
- [x] Task: Create `SavedSearchAlerts` collection for tracking sent alerts
  - Fields: `_id`, `saved_search_id`, `recruiter_id`, `driver_ids`, `alert_status`, `sent_at`, `viewed_at`, `channel_used`
- [x] Task: Verify collections created and permissions set correctly

### 1.2 Backend Service Implementation

- [x] Task: Create `src/backend/savedSearchService.jsw` with base structure
- [x] Task: Implement `createSavedSearch(carrierDot, searchData)` function
  - Validate search name uniqueness per carrier
  - Serialize criteria object to JSON
  - Set default alert settings
- [x] Task: Implement `updateSavedSearch(searchId, updates)` function
  - Verify ownership before update
  - Handle criteria changes
- [x] Task: Implement `deleteSavedSearch(searchId)` function
  - Soft delete with `is_active = false`
- [x] Task: Implement `getSavedSearches(carrierDot)` function
  - Return all active searches with match counts
- [x] Task: Implement `executeSavedSearch(searchId)` function
  - Call driverMatching.findMatchingDrivers with saved criteria
  - Calculate new matches since last run
  - Update last_run_date and match counts
- [x] Task: Implement `processSavedSearchAlerts()` function (scheduler entry point)
  - Query all active saved searches by alert frequency
  - Execute each search and detect new matches
  - Create alert records for new matches
  - Send notifications via appropriate channels

### 1.3 Scheduler Job Configuration

- [x] Task: Add `runSavedSearchAlerts` job to `src/backend/jobs.config`
  - Schedule: Every 15 minutes (`*/15 * * * *`)
  - Handler: `savedSearchService.processSavedSearchAlerts`
- [x] Task: Implement email alert template for new driver matches
- [x] Task: Implement in-app notification for new matches (MemberNotifications collection)

### 1.4 Frontend Integration (RECRUITER_DRIVER_SEARCH.html)

- [x] Task: Add "Save Search" button to active filters section
- [x] Task: Create Save Search modal with:
  - Search name input
  - Alert frequency radio buttons (realtime, daily, weekly, none)
  - Alert channel checkboxes (email, in-app)
  - Current criteria display
- [x] Task: Add Saved Searches collapsible panel above results
  - List saved searches with name, match count, alert status
  - "Run Now" button for each search
  - "Manage All" link to settings
- [x] Task: Implement postMessage handlers for:
  - `saveSearch` - Create saved search
  - `loadSavedSearch` - Apply saved criteria to filters
  - `runSavedSearch` - Execute and show results
  - `deleteSavedSearch` - Remove saved search
- [x] Task: Add Wix page code integration for saved search backend calls

### 1.5 Testing & Verification

- [x] Task: Write unit tests for savedSearchService.jsw
- [x] Task: Test saved search CRUD operations manually
- [x] Task: Test scheduler job execution with mock data
- [x] Task: Verify email alerts are sent correctly
- [x] Task: Verify in-app notifications appear in member dashboard
- [x] Task: Conductor - Verify Phase 1 Complete

---

## Phase 2: Call Outcome Logging

Add call outcome tagging to the Telemetry page and create a feedback loop to improve match scoring over time.

### 2.1 Data Model Setup

- [x] Task: Create `CallOutcomes` collection in Wix with schema from spec
  - Fields: `_id`, `recruiter_id`, `carrier_dot`, `driver_id`, `call_timestamp`, `call_duration_seconds`, `outcome`, `outcome_details`, `follow_up_date`, `follow_up_type`, `match_score_at_call`, `source`, `sentiment`
- [x] Task: Create `CallFeedback` collection for aggregated scoring data
  - Fields: `_id`, `carrier_dot`, `criteria_key`, `outcome_count`, `positive_weight`, `negative_weight`, `last_calculated`
- [x] Task: Verify collections created with proper indexes (carrier_dot, driver_id, call_timestamp)

### 2.2 Backend Service Implementation

- [x] Task: Create `src/backend/callOutcomeService.jsw` with base structure
- [x] Task: Implement `logCallOutcome(carrierDot, outcomeData)` function
  - Validate required fields
  - Record call with current match score
  - Create follow-up reminder if specified
- [x] Task: Implement `getDriverOutcomes(driverId)` function
  - Return call history for a driver
- [x] Task: Implement `getCarrierOutcomes(carrierDot, options)` function
  - Support filtering by date range, outcome type, recruiter
  - Return outcomes with pagination
- [x] Task: Implement `getOutcomeAnalytics(carrierDot, dateRange)` function
  - Calculate conversion rates by match score band
  - Identify best performing criteria
  - Return insights and trends
- [x] Task: Implement `processFeedbackBatch(carrierDot)` function
  - Aggregate outcomes into CallFeedback collection
  - Calculate weight adjustments based on outcomes
  - Store for scoring algorithm consumption

### 2.3 Scoring Integration

- [x] Task: Extend `src/backend/driverScoring.js` to read from CallFeedback
  - Add `getCarrierFeedbackWeights(carrierDot)` function
  - Apply carrier-specific adjustments to base weights
- [x] Task: Add `applyFeedbackAdjustments(baseScore, carrierDot, driverCriteria)` function
  - Boost scores for criteria with positive feedback
  - Reduce scores for criteria with negative feedback
- [x] Task: Update `driverMatching.jsw` to use feedback-adjusted scoring
  - Pass carrierDot to scoring functions
  - Log scoring source (default vs feedback-adjusted)

### 2.4 Scheduler Job Configuration

- [x] Task: Add `processCallFeedback` job to `src/backend/jobs.config`
  - Schedule: Daily at 2 AM (`0 2 * * *`)
  - Handler: `callOutcomeService.processFeedbackBatch`
- [x] Task: Implement feedback aggregation logic
  - Group outcomes by criteria combination
  - Calculate weighted success rate
  - Update CallFeedback collection

### 2.5 Frontend Integration (Recruiter_Telemetry.html)

- [x] Task: Add Call Outcome modal that appears after call ends
  - Outcome buttons: Interested, Callback, Not Now, Wrong Fit, No Answer, Voicemail
  - Notes textarea
  - Follow-up scheduler (date picker, type selector)
  - Sentiment radio buttons
- [x] Task: Add Call Analytics section to Telemetry page
  - Conversion by match score band chart
  - Outcomes distribution chart
  - Insights panel with key findings
  - Recent calls list
- [x] Task: Implement postMessage handlers for:
  - `logCallOutcome` - Save outcome data
  - `getCallAnalytics` - Fetch analytics data
  - `getRecentCalls` - Load call history
- [x] Task: Add Wix page code integration for call outcome backend calls

### 2.6 Testing & Verification

- [x] Task: Write unit tests for callOutcomeService.jsw
- [x] Task: Test outcome logging with various outcome types
- [x] Task: Test analytics calculations with sample data
- [x] Task: Verify feedback adjustments affect scoring
- [x] Task: Test scheduler job processes feedback correctly
- [x] Task: Conductor - Verify Phase 2 Complete

---

## Phase 3: Intervention Templates

Create pre-written SMS/email scripts for each retention risk type, accessible from the Retention Dashboard.

### 3.1 Data Model Setup

- [x] Task: Create `InterventionTemplates` collection in Wix with schema from spec
  - Fields: `_id`, `carrier_dot`, `risk_type`, `template_name`, `channel`, `subject_line`, `body_template`, `tone`, `is_default`, `usage_count`, `success_rate`
- [x] Task: Create `InterventionLog` collection for tracking sent interventions
  - Fields: `_id`, `template_id`, `driver_id`, `recruiter_id`, `sent_at`, `channel_used`, `message_sent`, `outcome`, `outcome_date`
- [x] Task: Seed default system templates for each risk type
  - SILENCE_SIGNAL templates (SMS + Email)
  - DETRACTOR_NPS templates (SMS + Email)
  - PAY_VOLATILITY templates (SMS + Email)
  - BURNOUT_RISK templates (SMS + Email)
  - SAFETY_INCIDENT templates (SMS + Email)

### 3.2 Backend Service Implementation

- [x] Task: Create `src/backend/interventionService.jsw` with base structure
- [x] Task: Implement `getTemplates(carrierDot, riskType)` function
  - Return system defaults + carrier custom templates
  - Sort by usage count descending
- [x] Task: Implement `getAllTemplates(carrierDot)` function
  - Group templates by risk type
- [x] Task: Implement `createTemplate(carrierDot, templateData)` function
  - Validate template structure
  - Set is_default = false for custom templates
- [x] Task: Implement `updateTemplate(templateId, updates)` function
  - Only allow updates to non-default templates
  - Validate ownership
- [x] Task: Implement `deleteTemplate(templateId)` function
  - Only allow deletion of non-default templates
- [x] Task: Implement `sendIntervention(templateId, driverId, overrides)` function
  - Render template with driver/recruiter variables
  - Send via appropriate channel (SMS/Email)
  - Log intervention in InterventionLog
  - Update usage_count on template
- [x] Task: Implement `logInterventionOutcome(interventionId, outcome)` function
  - Update intervention record with outcome
  - Recalculate template success_rate
- [x] Task: Implement `getDriverInterventions(driverId)` function
  - Return intervention history for a driver

### 3.3 Integration with retentionService.jsw

- [x] Task: Extend `calculateRiskScore()` to return recommended template IDs
  - Map risk factors to template risk types
- [x] Task: Add `getInterventionSuggestions(driverId)` function to retentionService
  - Return top 3 recommended interventions based on risk type
- [x] Task: Update `getCarrierRetentionDashboard()` to include intervention suggestions
  - Attach suggested templates to each at-risk driver

### 3.4 Frontend Integration (Recruiter_Retention_Dashboard.html)

- [x] Task: Add Quick Intervention panel to each at-risk driver card
  - Show pre-filled message preview
  - "Send SMS" and "Send Email" buttons
  - "Edit Message" button to customize
  - "Use Different Template" dropdown
- [x] Task: Create Template Editor modal
  - Template name input
  - Risk type selector
  - Channel selector (SMS/Email/Both)
  - Subject line input (for email)
  - Message body textarea with variable reference
  - Tone selector
- [x] Task: Add Template Management section to dashboard settings
  - List all templates by risk type
  - Edit/Delete custom templates
  - View usage stats
- [x] Task: Implement postMessage handlers for:
  - `getInterventionTemplates` - Load templates for risk type
  - `sendIntervention` - Send message using template
  - `saveTemplate` - Create/update custom template
  - `deleteTemplate` - Remove custom template

### 3.5 SMS/Email Integration

- [x] Task: Extend `src/backend/emailService.jsw` with intervention email sending
  - Add `sendInterventionEmail(driverId, subject, body)` function
- [x] Task: Create SMS integration (if not exists)
  - Option A: Use Twilio via Wix Secrets Manager
  - Option B: Use Wix SMS API if available
  - Add `sendInterventionSMS(phoneNumber, message)` function
- [x] Task: Implement variable substitution for templates
  - {{firstName}}, {{lastName}}, {{driverPhone}}
  - {{recruiterName}}, {{recruiterPhone}}
  - {{carrierName}}, {{lastPayAmount}}

### 3.6 Testing & Verification

- [x] Task: Write unit tests for interventionService.jsw
- [x] Task: Test template CRUD operations manually
- [x] Task: Test intervention sending via SMS and email
- [x] Task: Verify variable substitution works correctly
- [x] Task: Test outcome logging and success rate calculation
- [x] Task: Conductor - Verify Phase 3 Complete

---

## Phase 4: Pipeline Automation Triggers

Automatically advance candidates through the Kanban pipeline based on system events.

### 4.1 Data Model Setup

- [x] Task: Create `PipelineAutomationRules` collection in Wix with schema from spec
  - Fields: `_id`, `carrier_dot`, `rule_name`, `trigger_event`, `trigger_conditions`, `from_stage`, `to_stage`, `auto_note`, `notify_recruiter`, `is_active`, `priority`
- [x] Task: Create `AutomationLog` collection for audit trail
  - Fields: `_id`, `rule_id`, `carrier_dot`, `driver_id`, `interest_id`, `trigger_event`, `from_stage`, `to_stage`, `executed_at`, `success`, `error_message`
- [x] Task: Seed default automation rules for common scenarios
  - Document Upload -> Verification
  - CDL Verified -> Qualified
  - Background Check Clear -> Ready
  - No Response 7d -> Follow Up

### 4.2 Backend Service Implementation

- [x] Task: Create `src/backend/pipelineAutomationService.jsw` with base structure
- [x] Task: Implement `getAutomationRules(carrierDot)` function
  - Return all rules sorted by priority
- [x] Task: Implement `createAutomationRule(carrierDot, ruleData)` function
  - Validate rule structure
  - Check for conflicting rules
- [x] Task: Implement `updateAutomationRule(ruleId, updates)` function
  - Validate ownership
- [x] Task: Implement `deleteAutomationRule(ruleId)` function
  - Soft delete with `is_active = false`
- [x] Task: Implement `toggleRuleStatus(ruleId, isActive)` function
- [x] Task: Implement `processEvent(carrierDot, eventType, eventData)` function
  - Find matching active rules
  - Check trigger conditions
  - Execute stage transitions
  - Log to AutomationLog
  - Send notifications if configured
- [x] Task: Implement `getAutomationLog(carrierDot, options)` function
  - Return recent automation activity
  - Support filtering by date, event type, driver

### 4.3 Event Integration with recruiter_service.jsw

- [x] Task: Create event emitter utility function `emitPipelineEvent(carrierDot, eventType, eventData)`
- [x] Task: Add event emission to `updateCandidateStatus()` in recruiter_service.jsw
  - Emit event after status change
  - Include old and new status in event data
- [x] Task: Add event hooks for document upload events
  - Integrate with document upload handler (if exists)
  - Emit `document_uploaded` event
- [x] Task: Add event hooks for driver messages
  - Integrate with messaging.jsw
  - Emit `driver_message` event
- [x] Task: Create stale candidate detection job
  - Run hourly, check for candidates with no activity for 7 days
  - Emit `no_response_7d` event

### 4.4 Scheduler Job Configuration

- [x] Task: Add `processStaleAutomation` job to `src/backend/jobs.config`
  - Schedule: Every hour (`0 * * * *`)
  - Handler: Check for stale candidates and emit events

### 4.5 Frontend Integration (Pipeline Settings Page)

- [x] Task: Create Pipeline Automation settings section in Recruiter Console
  - Add new tab or section in settings area
- [x] Task: Build Active Rules list component
  - Display rule name, trigger, action
  - Toggle switch for active/inactive
  - Edit and delete buttons
- [x] Task: Create Add/Edit Rule modal
  - Rule name input
  - Trigger event dropdown (document_uploaded, etc.)
  - Optional trigger conditions
  - From stage selector (or "any")
  - To stage selector
  - Auto-note text input
  - Notify recruiter checkbox
- [x] Task: Build Recent Automation Activity log
  - Show last 20 automation actions
  - Driver name, action, timestamp
  - Success/failure indicator
- [x] Task: Implement postMessage handlers for:
  - `getAutomationRules` - Load carrier rules
  - `createAutomationRule` - Create new rule
  - `updateAutomationRule` - Update existing rule
  - `deleteAutomationRule` - Delete rule
  - `toggleRuleStatus` - Enable/disable rule
  - `getAutomationLog` - Load activity log

### 4.6 Notification Integration

- [x] Task: Extend `src/backend/emailService.jsw` with automation notification
  - Add `sendAutomationNotification(recruiterId, candidateName, action)` function
- [x] Task: Add in-app notification for automation events
  - Create notification in MemberNotifications collection
  - Include link to candidate in pipeline

### 4.7 Testing & Verification

- [x] Task: Write unit tests for pipelineAutomationService.jsw
- [x] Task: Test rule CRUD operations manually
- [x] Task: Test event processing with various trigger types
- [x] Task: Verify stage transitions occur correctly
- [x] Task: Test notification delivery (email + in-app)
- [x] Task: Test stale candidate detection job
- [x] Task: Conductor - Verify Phase 4 Complete

---

## Dependencies Summary

```
Phase 1 (Saved Searches)
    |
    +---> driverMatching.jsw (search execution)
    |
    +---> scheduler.jsw (alert job)
    |
    +---> emailService.jsw (alert delivery)

Phase 2 (Call Outcomes)
    |
    +---> driverScoring.js (feedback integration)
    |
    +---> driverMatching.jsw (adjusted scoring)
    |
    +---> observabilityService.jsw (logging)

Phase 3 (Intervention Templates)
    |
    +---> retentionService.jsw (risk detection)
    |
    +---> emailService.jsw (email delivery)
    |
    +---> SMS integration (Twilio or Wix)

Phase 4 (Pipeline Automation)
    |
    +---> recruiter_service.jsw (event hooks)
    |
    +---> messaging.jsw (message events)
    |
    +---> scheduler.jsw (stale detection)
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [x] All backend services implemented and functional
- [x] All collections created with proper schema
- [x] Frontend UI components integrated
- [x] PostMessage handlers working bidirectionally
- [x] Wix page code connecting frontend to backend
- [ ] Manual testing completed successfully
- [ ] No console errors in browser or Wix backend
- [ ] Performance acceptable (< 2s response time)
- [x] Security review passed (authorization checks)

---

## Rollout Strategy

### Phase 1 Rollout (Saved Searches)

1. Deploy backend service and collections
2. Add scheduler job (disabled)
3. Deploy frontend changes
4. Enable scheduler job
5. Monitor alert delivery rates
6. Gather feedback from pilot users

### Phase 2 Rollout (Call Outcomes)

1. Deploy backend service and collections
2. Deploy Telemetry UI changes
3. Let recruiters log outcomes for 2 weeks
4. Deploy feedback integration to scoring
5. Monitor match quality improvements

### Phase 3 Rollout (Intervention Templates)

1. Deploy backend service and collections
2. Seed default templates
3. Deploy Retention Dashboard UI changes
4. Train recruiters on template usage
5. Monitor intervention success rates

### Phase 4 Rollout (Pipeline Automation)

1. Deploy backend service and collections
2. Seed default rules (disabled)
3. Deploy settings UI
4. Enable automation for pilot carriers
5. Expand to all carriers after validation

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Alert fatigue from too many notifications | Low engagement | Configurable frequency, daily digest option |
| Automation rule conflicts | Unexpected behavior | Priority ordering, conflict detection |
| SMS delivery failures | Missed interventions | Fallback to email, delivery status tracking |
| Scoring drift from bad feedback | Lower match quality | Feedback weights bounded, periodic calibration |
| Data privacy concerns | Compliance issues | Clear consent, anonymized feedback data |
