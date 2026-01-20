# Specification: Recruiter Utility Expansion

## 1. Overview

This track expands the utility of existing recruiter features to maximize value from the Recruiter Operating System. Rather than building new capabilities, we enhance and connect existing tools to create a more cohesive and automated recruiting workflow.

### Business Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Reduce time-to-hire | 20% improvement | Days from first contact to offer |
| Improve driver retention | 15% improvement | 90-day retention rate |
| Increase recruiter efficiency | 30% more contacts/day | Outreach volume |
| Improve match quality | 25% higher acceptance | Offer acceptance rate |

### Features Overview

| Feature | Primary Benefit | Extends |
|---------|-----------------|---------|
| Saved Searches with Alerts | Never miss a qualified driver | RECRUITER_DRIVER_SEARCH.html + driverMatching.jsw |
| Pipeline Automation Triggers | Auto-advance candidates | recruiter_service.jsw |
| Intervention Templates | Quick response to at-risk drivers | retentionService.jsw + Recruiter_Retention_Dashboard.html |
| Call Outcome Logging | Improve match quality over time | Recruiter_Telemetry.html + telemetry backend |

---

## 2. Architecture Overview

### 2.1 System Integration Diagram

```
+-----------------------------------------------------------------------------------+
|                           RECRUITER UTILITY EXPANSION                              |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +------------------------+     +------------------------+     +-----------------+ |
|  |  SAVED SEARCHES        |     |  PIPELINE AUTOMATION   |     | CALL OUTCOMES   | |
|  |  ----------------      |     |  -------------------   |     | -------------   | |
|  |  SavedSearches coll    |---->|  AutomationTriggers    |---->| CallOutcomes    | |
|  |  Scheduler job         |     |  EventProcessor        |     | FeedbackLoop    | |
|  |  Alert notifications   |     |  PipelineStageManager  |     | MatchImprover   | |
|  +------------------------+     +------------------------+     +-----------------+ |
|            |                             |                            |            |
|            v                             v                            v            |
|  +-----------------------------------------------------------------------------------+
|  |                         INTERVENTION TEMPLATES                                    |
|  |                         ----------------------                                    |
|  |  RetentionTemplates collection | SMS/Email scripts by risk type                   |
|  |  One-click outreach from Retention Dashboard                                      |
|  +-----------------------------------------------------------------------------------+
|                                                                                    |
|  EXTENDS EXISTING:                                                                 |
|  - driverMatching.jsw (search criteria persistence)                                |
|  - recruiter_service.jsw (pipeline event hooks)                                    |
|  - retentionService.jsw (intervention actions)                                     |
|  - Recruiter_Telemetry.html (call logging UI)                                      |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

### 2.2 Data Flow Architecture

```
+----------------+     +------------------+     +--------------------+
|   DRIVER       |     |    RECRUITER     |     |    AUTOMATION      |
|   POOL         |---->|    SEARCH        |---->|    ENGINE          |
+----------------+     +------------------+     +--------------------+
       |                       |                        |
       |                       v                        |
       |               +--------------+                 |
       |               | SavedSearch  |                 |
       |               | Collection   |                 |
       |               +--------------+                 |
       |                       |                        |
       |                       v                        v
       |               +--------------------------------+
       |               |     SCHEDULER JOB              |
       |               |  (runs every 15 min)           |
       |               +--------------------------------+
       |                       |
       v                       v
+----------------+     +------------------+     +--------------------+
|   NEW DRIVER   |---->|  MATCH DETECTED  |---->|  ALERT SENT        |
|   REGISTERED   |     |  (criteria match)|     |  (email/in-app)    |
+----------------+     +------------------+     +--------------------+
```

---

## 3. Feature 1: Saved Searches with Alerts

### 3.1 Overview

Allow recruiters to save their driver search criteria and receive notifications when new drivers matching those criteria become available on the platform.

### 3.2 Data Model

#### SavedSearches Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter user ID |
| `carrier_dot` | String | Associated carrier DOT |
| `search_name` | String | User-friendly name for the search |
| `criteria` | Object | Serialized search filters (JSON) |
| `criteria.cdl_types` | Array[String] | Required CDL classes |
| `criteria.endorsements` | Array[String] | Required endorsements |
| `criteria.min_experience` | Number | Minimum years experience |
| `criteria.availability` | String | Availability filter |
| `criteria.zip_code` | String | Location center |
| `criteria.radius_miles` | Number | Search radius |
| `alert_frequency` | String | 'realtime', 'daily', 'weekly' |
| `alert_channel` | String | 'email', 'in_app', 'both' |
| `last_run_date` | DateTime | Last time search was executed |
| `last_match_count` | Number | Drivers matched on last run |
| `new_matches_since_last` | Number | New drivers since last alert |
| `is_active` | Boolean | Whether alerts are enabled |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

#### SavedSearchAlerts Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `saved_search_id` | Reference | FK to SavedSearches |
| `recruiter_id` | String | Recruiter user ID |
| `driver_ids` | Array[String] | New driver IDs matched |
| `alert_status` | String | 'pending', 'sent', 'viewed' |
| `sent_at` | DateTime | When alert was sent |
| `viewed_at` | DateTime | When recruiter viewed alert |
| `channel_used` | String | 'email', 'in_app' |
| `_createdDate` | DateTime | Created timestamp |

### 3.3 API Design

#### savedSearchService.jsw

```javascript
// Create a new saved search
export async function createSavedSearch(carrierDot, searchData) {
  // Input: { name, criteria, alertFrequency, alertChannel }
  // Returns: { success, savedSearch }
}

// Update an existing saved search
export async function updateSavedSearch(searchId, updates) {
  // Returns: { success, savedSearch }
}

// Delete a saved search
export async function deleteSavedSearch(searchId) {
  // Returns: { success }
}

// Get all saved searches for a carrier
export async function getSavedSearches(carrierDot) {
  // Returns: { success, searches: [] }
}

// Execute a saved search manually
export async function executeSavedSearch(searchId) {
  // Returns: { success, matches: [], newCount }
}

// Process alerts for all saved searches (called by scheduler)
export async function processSavedSearchAlerts() {
  // Returns: { success, processedCount, alertsSent }
}
```

### 3.4 UI Mockup (RECRUITER_DRIVER_SEARCH.html Extension)

```
+-----------------------------------------------------------------------------------+
|  DRIVER SEARCH                                              [Pro Plan] 18/25 views |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  ACTIVE FILTERS                                      [Save Search] [Clear]  |  |
|  |  CDL: Class A | Endorsements: Hazmat, Tanker | Experience: 5+ yrs          |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  SAVED SEARCHES (3)                                          [Manage All]   |  |
|  |  +-------------------------------------------------------------------------+  |
|  |  |  [*] Hazmat Drivers - Dallas    | 12 matches | Alert: Daily | [Run Now] |  |
|  |  |  [ ] Class A - Regional TX      | 34 matches | Alert: Off   | [Run Now] |  |
|  |  |  [*] Immediate Availability     | 8 matches  | Alert: Real  | [Run Now] |  |
|  |  +-------------------------------------------------------------------------+  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  Found 47 matching drivers                                                         |
|  ...                                                                               |
+-----------------------------------------------------------------------------------+
```

### 3.5 Save Search Modal

```
+-----------------------------------------------+
|  SAVE THIS SEARCH                      [X]    |
+-----------------------------------------------+
|                                               |
|  Search Name:                                 |
|  +-------------------------------------------+|
|  | Hazmat Drivers - Dallas Area              ||
|  +-------------------------------------------+|
|                                               |
|  Alert Frequency:                             |
|  ( ) Real-time (within 15 minutes)            |
|  (*) Daily digest (9 AM)                      |
|  ( ) Weekly summary (Monday 9 AM)             |
|  ( ) No alerts - manual check only            |
|                                               |
|  Alert Channel:                               |
|  [X] Email                                    |
|  [X] In-app notification                      |
|                                               |
|  Current Criteria:                            |
|  - CDL Type: Class A                          |
|  - Endorsements: Hazmat, Tanker               |
|  - Experience: 5+ years                       |
|  - Location: 100mi from 75201                 |
|                                               |
|  [Cancel]                    [Save Search]    |
+-----------------------------------------------+
```

---

## 4. Feature 2: Pipeline Automation Triggers

### 4.1 Overview

Automatically advance candidates through the Kanban pipeline based on system events. When specific triggers occur (e.g., documents uploaded, background check completed), the candidate moves to the appropriate stage without manual intervention.

### 4.2 Data Model

#### PipelineAutomationRules Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Carrier DOT number |
| `rule_name` | String | Human-readable rule name |
| `trigger_event` | String | Event that triggers the rule |
| `trigger_conditions` | Object | Additional conditions to check |
| `from_stage` | String | Current pipeline stage (or 'any') |
| `to_stage` | String | Target pipeline stage |
| `auto_note` | String | Note to add when triggered |
| `notify_recruiter` | Boolean | Send notification to recruiter |
| `is_active` | Boolean | Whether rule is enabled |
| `priority` | Number | Rule execution order |
| `_createdDate` | DateTime | Created timestamp |

#### Supported Trigger Events

| Event | Description | Default Action |
|-------|-------------|----------------|
| `document_uploaded` | Driver uploads any document | Move to Verification |
| `cdl_verified` | CDL verification completed | Move to Qualified |
| `background_check_clear` | Background check passed | Move to Ready |
| `offer_viewed` | Driver viewed offer document | Move to Negotiating |
| `offer_signed` | Driver signed offer | Move to Hired |
| `no_response_7d` | No activity for 7 days | Move to Follow-up |
| `driver_message` | Driver sends a message | Move to Contacted |
| `interview_scheduled` | Interview confirmed | Move to Interview |

### 4.3 API Design

#### pipelineAutomationService.jsw

```javascript
// Get automation rules for a carrier
export async function getAutomationRules(carrierDot) {
  // Returns: { success, rules: [] }
}

// Create a new automation rule
export async function createAutomationRule(carrierDot, ruleData) {
  // Returns: { success, rule }
}

// Update an automation rule
export async function updateAutomationRule(ruleId, updates) {
  // Returns: { success, rule }
}

// Delete an automation rule
export async function deleteAutomationRule(ruleId) {
  // Returns: { success }
}

// Toggle rule active status
export async function toggleRuleStatus(ruleId, isActive) {
  // Returns: { success }
}

// Process an event (called by event handlers)
export async function processEvent(carrierDot, eventType, eventData) {
  // Returns: { success, actionsTriggered: [] }
}

// Get automation activity log
export async function getAutomationLog(carrierDot, options) {
  // Returns: { success, log: [], pagination }
}
```

### 4.4 Integration with recruiter_service.jsw

Extend `updateCandidateStatus` to emit events:

```javascript
// Add to recruiter_service.jsw
async function emitPipelineEvent(carrierDot, eventType, eventData) {
  // Call pipelineAutomationService.processEvent
  // This allows automation rules to react to manual changes too
}
```

### 4.5 UI Mockup (Pipeline Settings)

```
+-----------------------------------------------------------------------------------+
|  PIPELINE AUTOMATION                                                              |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  Automatically move candidates through your pipeline based on events.             |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  ACTIVE RULES                                                 [+ Add Rule]  |  |
|  +-----------------------------------------------------------------------------+  |
|  |                                                                              |  |
|  |  1. Document Verification Flow                            [ON]  [Edit] [X]  |  |
|  |     When: Driver uploads documents                                          |  |
|  |     Then: Move to "Verification" stage                                      |  |
|  |     Note: "Documents received - awaiting review"                            |  |
|  |                                                                              |  |
|  |  2. Background Check Complete                             [ON]  [Edit] [X]  |  |
|  |     When: Background check returns clear                                    |  |
|  |     Then: Move to "Ready to Hire" stage                                     |  |
|  |     Notify: Send email to recruiter                                         |  |
|  |                                                                              |  |
|  |  3. Stale Candidate Alert                                 [ON]  [Edit] [X]  |  |
|  |     When: No activity for 7 days                                            |  |
|  |     Then: Move to "Follow Up" stage                                         |  |
|  |     Note: "Auto-flagged: No response in 7 days"                             |  |
|  |                                                                              |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  RECENT AUTOMATION ACTIVITY                                                  |  |
|  |  - 10:42 AM: John D. moved to Verification (doc upload)                     |  |
|  |  - 09:15 AM: Maria S. moved to Ready (background clear)                     |  |
|  |  - Yesterday: 3 candidates flagged for follow-up                            |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

---

## 5. Feature 3: Intervention Templates

### 5.1 Overview

Pre-written SMS and email scripts for each retention risk type, accessible directly from the Recruiter_Retention_Dashboard. When a driver shows risk signals (silence, pay volatility, burnout), the recruiter can send a targeted intervention with one click.

### 5.2 Data Model

#### InterventionTemplates Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Carrier DOT (or 'system' for defaults) |
| `risk_type` | String | Risk category this template addresses |
| `template_name` | String | Human-readable name |
| `channel` | String | 'sms', 'email', 'both' |
| `subject_line` | String | Email subject (if applicable) |
| `body_template` | String | Template with {{placeholders}} |
| `tone` | String | 'empathetic', 'direct', 'urgent' |
| `is_default` | Boolean | System default template |
| `usage_count` | Number | Times this template was used |
| `success_rate` | Number | % of drivers retained after use |
| `_createdDate` | DateTime | Created timestamp |

#### Risk Type Templates

| Risk Type | Default SMS Template | Default Email Subject |
|-----------|---------------------|----------------------|
| `SILENCE_SIGNAL` | "Hey {{firstName}}, noticed we haven't connected in a while. Everything okay? Give me a call when you have a minute - {{recruiterPhone}}" | "Checking in - how's the road treating you?" |
| `DETRACTOR_NPS` | "{{firstName}}, I saw your feedback and I want to make things right. Can we talk today? - {{recruiterName}}" | "Your feedback matters - let's talk" |
| `PAY_VOLATILITY` | "{{firstName}}, I noticed some inconsistency in your recent settlements. Let me look into this for you - call me at {{recruiterPhone}}" | "Regarding your recent pay - action needed" |
| `BURNOUT_RISK` | "{{firstName}}, you've been running hard. Want to talk about getting you some home time? - {{recruiterName}}" | "Let's get you home - schedule discussion" |
| `SAFETY_INCIDENT` | "{{firstName}}, saw the incident report. I want to make sure you're okay. Call me when you can - {{recruiterPhone}}" | "Following up - making sure you're okay" |

### 5.3 API Design

#### interventionService.jsw

```javascript
// Get templates for a risk type
export async function getTemplates(carrierDot, riskType) {
  // Returns: { success, templates: [] }
}

// Get all templates for a carrier
export async function getAllTemplates(carrierDot) {
  // Returns: { success, templates: [] }
}

// Create custom template
export async function createTemplate(carrierDot, templateData) {
  // Returns: { success, template }
}

// Update template
export async function updateTemplate(templateId, updates) {
  // Returns: { success, template }
}

// Delete custom template
export async function deleteTemplate(templateId) {
  // Returns: { success }
}

// Send intervention using template
export async function sendIntervention(templateId, driverId, overrides) {
  // overrides: { customMessage, channel }
  // Returns: { success, interventionId, channel }
}

// Log intervention outcome
export async function logInterventionOutcome(interventionId, outcome) {
  // outcome: 'responded', 'retained', 'churned', 'no_response'
  // Returns: { success }
}

// Get intervention history for a driver
export async function getDriverInterventions(driverId) {
  // Returns: { success, interventions: [] }
}
```

### 5.4 UI Mockup (Retention Dashboard Extension)

```
+-----------------------------------------------------------------------------------+
|  RETENTION DASHBOARD                                     [Export] [Settings]       |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  AT-RISK WATCHLIST                                                                |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  [!] CRITICAL - David Ghost                           Risk Score: 95        |  |
|  |      Silence Signal: 50%+ activity drop in 7 days                           |  |
|  |      Last Active: 6 days ago | Miles This Week: 1,200                       |  |
|  |                                                                              |  |
|  |      Suggested Actions:                                                      |  |
|  |      +-----------------------------------------------------------+          |  |
|  |      | [SMS: Check-in]  [Email: Wellness]  [Schedule Call]       |          |  |
|  |      +-----------------------------------------------------------+          |  |
|  |                                                                              |  |
|  |      Quick Intervention:                                                     |  |
|  |      +-----------------------------------------------------------+          |  |
|  |      | "Hey David, noticed we haven't connected in a while.      |          |  |
|  |      |  Everything okay? Give me a call - 555-0123"              |          |  |
|  |      +-----------------------------------------------------------+          |  |
|  |      [Send SMS]  [Edit Message]  [Use Different Template]                   |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  [!] CRITICAL - Angry Adam                            Risk Score: 95        |  |
|  |      Detractor (dNPS 4) - Expressed dissatisfaction                         |  |
|  |      Last Feedback: "Pay inconsistent, dispatch issues"                     |  |
|  |                                                                              |  |
|  |      Quick Intervention:                                                     |  |
|  |      +-----------------------------------------------------------+          |  |
|  |      | "Adam, I saw your feedback and I want to make things      |          |  |
|  |      |  right. Can we talk today? - Sarah"                       |          |  |
|  |      +-----------------------------------------------------------+          |  |
|  |      [Send SMS]  [Edit Message]  [Schedule Manager Call]                    |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

### 5.5 Template Editor Modal

```
+-----------------------------------------------+
|  EDIT INTERVENTION TEMPLATE              [X]  |
+-----------------------------------------------+
|                                               |
|  Template Name:                               |
|  +-------------------------------------------+|
|  | Check-in - Silence Signal                 ||
|  +-------------------------------------------+|
|                                               |
|  Risk Type: [Silence Signal v]                |
|                                               |
|  Channel: [SMS v]                             |
|                                               |
|  Message Template:                            |
|  +-------------------------------------------+|
|  | Hey {{firstName}}, noticed we haven't     ||
|  | connected in a while. Everything okay?    ||
|  | Give me a call when you have a minute -   ||
|  | {{recruiterPhone}}                        ||
|  +-------------------------------------------+|
|                                               |
|  Available Variables:                         |
|  {{firstName}} {{lastName}} {{driverPhone}}   |
|  {{recruiterName}} {{recruiterPhone}}         |
|  {{carrierName}} {{lastPayAmount}}            |
|                                               |
|  Tone: ( ) Empathetic  (*) Direct  ( ) Urgent |
|                                               |
|  [Cancel]                    [Save Template]  |
+-----------------------------------------------+
```

---

## 6. Feature 4: Call Outcome Logging

### 6.1 Overview

Enable recruiters to tag call outcomes directly from the Telemetry page and feed those results back into the matching algorithm. This creates a feedback loop that improves match quality over time.

### 6.2 Data Model

#### CallOutcomes Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `recruiter_id` | String | Recruiter who made the call |
| `carrier_dot` | String | Carrier DOT number |
| `driver_id` | String | Driver profile ID |
| `call_timestamp` | DateTime | When call occurred |
| `call_duration_seconds` | Number | Length of call |
| `outcome` | String | Call result tag |
| `outcome_details` | String | Additional notes |
| `follow_up_date` | DateTime | When to follow up |
| `follow_up_type` | String | 'call', 'email', 'sms' |
| `match_score_at_call` | Number | Match score when called |
| `source` | String | How driver was found |
| `sentiment` | String | 'positive', 'neutral', 'negative' |
| `_createdDate` | DateTime | Created timestamp |

#### Outcome Types

| Outcome | Description | Feedback Weight |
|---------|-------------|-----------------|
| `interested` | Driver interested, continue process | +1.0 |
| `callback` | Requested callback at specific time | +0.5 |
| `not_interested` | Not interested at this time | -0.3 |
| `wrong_fit` | Driver not a good fit for role | -0.5 |
| `no_answer` | Driver didn't answer | 0.0 |
| `voicemail` | Left voicemail | 0.0 |
| `declined` | Declined offer | -0.2 |
| `hired` | Driver hired | +2.0 |
| `bad_contact` | Wrong number or disconnected | N/A |

### 6.3 Feedback Loop Integration

```
+------------------+      +-------------------+      +------------------+
|  CALL OUTCOME    |      |  FEEDBACK         |      |  SCORING         |
|  LOGGED          |----->|  PROCESSOR        |----->|  WEIGHT UPDATE   |
+------------------+      +-------------------+      +------------------+
       |                          |                         |
       |                          v                         |
       |                  +---------------+                 |
       |                  | CallFeedback  |                 |
       |                  | Collection    |                 |
       |                  +---------------+                 |
       |                          |                         v
       |                          |              +------------------+
       |                          |              | driverScoring.js |
       |                          |              | weight adjustment|
       |                          |              +------------------+
       v                          v
+------------------------------------------------------+
|  ANALYTICS DASHBOARD                                 |
|  - Conversion rates by match score band              |
|  - Best performing driver criteria                   |
|  - Optimal call times                                |
+------------------------------------------------------+
```

### 6.4 API Design

#### callOutcomeService.jsw

```javascript
// Log a call outcome
export async function logCallOutcome(carrierDot, outcomeData) {
  // Input: { driverId, outcome, details, callDuration, followUpDate }
  // Returns: { success, outcomeId }
}

// Get outcomes for a driver
export async function getDriverOutcomes(driverId) {
  // Returns: { success, outcomes: [] }
}

// Get outcomes for a carrier
export async function getCarrierOutcomes(carrierDot, options) {
  // options: { dateRange, outcome, recruiter }
  // Returns: { success, outcomes: [], stats }
}

// Get outcome analytics
export async function getOutcomeAnalytics(carrierDot, dateRange) {
  // Returns: { success, analytics }
}

// Process feedback for scoring adjustment
export async function processFeedbackBatch(carrierDot) {
  // Called by scheduler to update scoring weights
  // Returns: { success, adjustments: [] }
}
```

### 6.5 UI Mockup (Telemetry Extension)

```
+-----------------------------------------------------------------------------------+
|  CALL ENDED - Michael Scott                                        Duration: 4:32 |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  How did the call go?                                                              |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  [Interested]  [Callback]  [Not Now]  [Wrong Fit]  [No Answer]  [Voicemail] |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  Selected: INTERESTED                                                              |
|                                                                                    |
|  Notes (optional):                                                                 |
|  +-----------------------------------------------------------------------------+  |
|  | Excited about the regional route. Wants to review benefits before next     |  |
|  | call. Send benefits PDF.                                                    |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  Follow-up:                                                                        |
|  [X] Schedule follow-up   Date: [Jan 22, 2026 v]  Time: [10:00 AM v]              |
|  Type: ( ) Call  (*) Email  ( ) SMS                                               |
|                                                                                    |
|  Sentiment: (*) Positive  ( ) Neutral  ( ) Negative                               |
|                                                                                    |
|                                          [Skip]  [Save & Close]                   |
+-----------------------------------------------------------------------------------+
```

### 6.6 Analytics Dashboard (New Section in Telemetry)

```
+-----------------------------------------------------------------------------------+
|  CALL ANALYTICS                                        Last 30 Days | Export       |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +--------------------------------+  +--------------------------------+            |
|  |  CONVERSION BY MATCH SCORE    |  |  OUTCOMES DISTRIBUTION         |            |
|  |  90-100%: 45% interested      |  |  [===] Interested: 34%         |            |
|  |  80-89%:  32% interested      |  |  [==]  Callback: 28%           |            |
|  |  70-79%:  18% interested      |  |  [=]   Not Now: 22%            |            |
|  |  <70%:    8% interested       |  |  [=]   Other: 16%              |            |
|  +--------------------------------+  +--------------------------------+            |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  INSIGHTS                                                                    |  |
|  |  - Drivers with Hazmat endorsement have 2.3x higher conversion              |  |
|  |  - Best call time: 10 AM - 12 PM (47% answer rate)                          |  |
|  |  - Regional route matches convert 40% better than OTR                       |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
|  +-----------------------------------------------------------------------------+  |
|  |  RECENT CALLS                                              [View All]        |  |
|  |  - 10:42 AM: Michael Scott - Interested - Regional Class A                  |  |
|  |  - 09:15 AM: Jim Halpert - Callback scheduled Jan 22                        |  |
|  |  - Yesterday: Dwight Schrute - Hired!                                       |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                    |
+-----------------------------------------------------------------------------------+
```

---

## 7. Integration Points

### 7.1 Service Dependencies

| Feature | Primary Service | Dependencies |
|---------|-----------------|--------------|
| Saved Searches | savedSearchService.jsw (new) | driverMatching.jsw, scheduler.jsw |
| Pipeline Automation | pipelineAutomationService.jsw (new) | recruiter_service.jsw |
| Intervention Templates | interventionService.jsw (new) | retentionService.jsw, emailService.jsw |
| Call Outcomes | callOutcomeService.jsw (new) | driverScoring.js, observabilityService.jsw |

### 7.2 Collection Dependencies

```
+--------------------+     +----------------------+
| SavedSearches      |     | PipelineAutomation   |
|                    |     | Rules                |
+--------------------+     +----------------------+
        |                           |
        v                           v
+--------------------+     +----------------------+
| SavedSearchAlerts  |     | AutomationLog        |
+--------------------+     +----------------------+

+--------------------+     +----------------------+
| Intervention       |     | CallOutcomes         |
| Templates          |     |                      |
+--------------------+     +----------------------+
        |                           |
        v                           v
+--------------------+     +----------------------+
| InterventionLog    |     | CallFeedback         |
+--------------------+     +----------------------+
```

### 7.3 Scheduler Jobs

| Job | Frequency | Service |
|-----|-----------|---------|
| `processSavedSearchAlerts` | Every 15 min | savedSearchService.jsw |
| `processStaleAutomation` | Every hour | pipelineAutomationService.jsw |
| `processCallFeedback` | Daily at 2 AM | callOutcomeService.jsw |

---

## 8. Security Considerations

### 8.1 Access Control

- All features require authenticated recruiter with valid carrier access
- Saved searches are scoped to carrier_dot
- Automation rules can only affect candidates in recruiter's pipeline
- Templates can be system (read-only) or carrier-specific (editable)

### 8.2 Data Privacy

- Call outcomes stored with driver consent notice
- Feedback data anonymized for algorithm training
- Intervention templates must not contain PII

### 8.3 Rate Limiting

- Saved search alerts: Max 10 per day per search
- Interventions: Max 3 per driver per day
- API calls: Standard Wix rate limits apply

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Saved search adoption | 60% of recruiters | Active saved searches / total recruiters |
| Alert engagement | 40% click rate | Alerts clicked / alerts sent |
| Automation coverage | 50% of stage changes | Auto-moves / total moves |
| Intervention response | 35% reply rate | Replies / interventions sent |
| Call logging rate | 80% of calls | Logged outcomes / completed calls |
| Match quality improvement | 20% better conversion | Conversion rate trend |

---

## 10. Open Questions

1. **Saved Search Limits**: Should free tier users have saved searches? How many?
2. **Automation Complexity**: Should we support multi-condition rules (AND/OR)?
3. **Template Sharing**: Can carriers share templates with agency recruiters?
4. **Feedback Privacy**: How do we handle driver consent for outcome tracking?
5. **Alert Fatigue**: What's the right balance for alert frequency defaults?
