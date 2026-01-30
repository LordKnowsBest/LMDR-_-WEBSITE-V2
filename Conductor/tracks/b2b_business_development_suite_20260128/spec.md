# Specification: B2B Business Development Suite - Carrier Acquisition

## 1. Overview

This track delivers a complete B2B business development workspace that turns match intelligence into carrier acquisition. It equips business development professionals with prospecting, multi-channel outreach (email, SMS, voice), event lead capture, mobile workflow, and a sales pipeline. The system highlights non-client carriers with strong match potential and enables a direct value proposition: "We have qualified drivers in your area who are highly interested."

### Business Context

| Capability | Current State | After This Track |
|------------|---------------|------------------|
| **Prospecting** | Manual carrier research | Match-driven opportunity lists |
| **Outreach** | Ad hoc email/calls | Sequenced multi-channel outreach |
| **Lead Capture** | Spreadsheets / notes | Event-ready capture + mobile workflows |
| **Sales Pipeline** | Not centralized | Full pipeline with tasks and stages |
| **Value Proposition** | Generic | Match-signal driven messaging |

### Dependencies

- `reverse_matching_20251225` for match intelligence and scoring signals
- `carrier_conversion_20260103` for onboarding and conversion flow
- `recruiter_outreach_20260120` for outreach patterns and sequence structure

---

## 2. Architecture

### 2.1 System Overview

```
+=================================================================================+
|                 B2B BUSINESS DEVELOPMENT SUITE                                  |
+=================================================================================+
|                                                                                 |
|  +----------------------+    +----------------------+    +-------------------+  |
|  | MATCH INTELLIGENCE   |    | OUTREACH ENGINE      |    | PIPELINE + CRM     |  |
|  |----------------------|    |----------------------|    |-------------------|  |
|  | - Match Signals       |   | - Email Sequences     |   | - Opportunities   |  |
|  | - Signal Scoring      |   | - SMS Campaigns       |   | - Stages + Tasks  |  |
|  | - Opportunity Alerts  |   | - Voice Campaigns     |   | - Notes + Timeline|  |
|  +----------+-----------+    +----------+-----------+    +---------+---------+  |
|             |                           |                           |            |
|             v                           v                           v            |
|  +----------------------+    +----------------------+    +-------------------+  |
|  | DATA LAYER           |    | ACTIVITY FEED        |    | ANALYTICS          |  |
|  |----------------------|    |----------------------|    |-------------------|  |
|  | - Accounts            |   | - Unified timeline    |   | - Conversion KPIs |  |
|  | - Contacts            |   | - Outcome tracking    |   | - Channel ROI     |  |
|  | - Match Signals       |   | - Call logs           |   | - Segment perf    |  |
|  +----------------------+    +----------------------+    +-------------------+  |
|                                                                                 |
+=================================================================================+
```

### 2.2 Data Flow

```
Driver Matching Engine -> Match Signals -> Prospect Lists -> Outreach Sequences
                                                           -> Activity Feed
                                                           -> Pipeline Stages
                                                           -> Analytics + Alerts
```

---

## 3. Data Model

### 3.1 Core Collections

- `B2BAccounts`
  - Fields: `_id`, `carrier_dot`, `carrier_name`, `status`, `segment`, `region`, `fleet_size`, `primary_contact_id`, `source`, `owner_id`, `last_activity_at`
- `B2BContacts`
  - Fields: `_id`, `account_id`, `name`, `role`, `email`, `phone`, `timezone`, `preferred_channel`, `consent_status`
- `B2BOpportunities`
  - Fields: `_id`, `account_id`, `stage`, `value_estimate`, `match_signal_id`, `owner_id`, `next_step`, `next_step_at`, `close_reason`
- `B2BActivities`
  - Fields: `_id`, `account_id`, `contact_id`, `type`, `channel`, `subject`, `notes`, `outcome`, `created_at`
- `B2BAutomationRules`
  - Fields: `_id`, `rule_name`, `trigger_event`, `from_stage`, `to_stage`, `conditions`, `actions`, `is_active`, `priority`

### 3.2 Match Intelligence

- `B2BMatchSignals`
  - Fields: `_id`, `carrier_dot`, `signal_score`, `driver_count_high_match`, `top_regions`, `top_equipment`, `job_types`, `signal_reason`, `confidence`, `generated_at`

### 3.3 Outreach

- `B2BSequences`
  - Fields: `_id`, `name`, `channel_mix`, `status`, `owner_id`, `steps`, `throttle_rules`
- `B2BSequenceSteps`
  - Fields: `_id`, `sequence_id`, `step_type`, `template_id`, `delay_hours`, `conditions`
- `B2BCalls`
  - Fields: `_id`, `account_id`, `contact_id`, `campaign_id`, `direction`, `status`, `duration`, `recording_url`, `transcript`, `disposition`
- `B2BEmails`
  - Fields: `_id`, `account_id`, `contact_id`, `subject`, `status`, `opened`, `clicked`, `sent_at`
- `B2BTextMessages`
  - Fields: `_id`, `account_id`, `contact_id`, `status`, `sent_at`, `delivered_at`, `response_text`

### 3.4 Lead Capture

- `B2BLeadCaptureEvents`
  - Fields: `_id`, `event_name`, `event_date`, `capture_source`, `lead_count`, `owner_id`

### 3.5 Analytics and Research

- `B2BAnalyticsSnapshots`
  - Fields: `_id`, `owner_id`, `period_start`, `period_end`, `pipeline_coverage`, `win_rate`, `avg_cycle_days`, `forecast_accuracy`, `stage_conversions`, `channel_metrics`
- `B2BAccountResearch`
  - Fields: `_id`, `account_id`, `summary`, `sources`, `signals`, `recommendations`, `generated_at`, `generated_by`
- `B2BLeadAttribution`
  - Fields: `_id`, `account_id`, `source`, `medium`, `campaign`, `first_touch_at`, `last_touch_at`, `touchpoint_history`
- `B2BSpend`
  - Fields: `_id`, `period_start`, `period_end`, `channel`, `amount`, `notes`
- `B2BCompetitorIntel`
  - Fields: `_id`, `competitor_name`, `region`, `offerings`, `pricing_notes`, `source_url`, `captured_at`

---

## 4. User Experience Modules

### 4.1 B2B Dashboard

- Opportunity queue powered by match signals
- "Top 25 non-client carriers" list with match counts
- Quick actions: call, text, email, add task

### 4.2 Account Detail

- Activity timeline
- Match signal summary and suggested pitch
- Contacts panel and consent status
- Opportunity stage with next-step scheduling

### 4.3 Outreach Workspace

- Sequence builder
- Template library with match-signal variables
- Campaign performance view

### 4.4 Event Lead Capture

- Mobile-first form with QR entry
- Quick account creation
- Tagging and follow-up reminders

### 4.5 Pipeline & Deal Flow

- Kanban pipeline with stage counts and conversion rates
- Weighted pipeline view (forecast by stage probability)
- Deal risk flags (stalled, no next-step, missing decision maker)

### 4.6 B2B Analytics Dashboard

- Pipeline coverage, win rate, and sales cycle length
- Stage-to-stage conversion funnel
- Outreach performance by channel and sequence
- Source performance and segment-level conversion
- Forecast accuracy tracking
- Spend-to-close (cost per acquisition) by channel
- Competitor intel highlights and alerts
- Predictive close likelihood and ramp forecasting

### 4.7 Research Agent Panel

- One-click research brief for a carrier account
- Highlights: fleet size, lanes/regions, hiring signals, compliance/safety public signals
- Suggested talk track and next-step recommendations

### 4.8 Detailed Page Schemas and Workflows

#### 4.8.1 B2B Dashboard (Page Schema)

```
DashboardState {
  viewer: { user_id, role, region, timezone },
  date_range: { start, end, preset },
  kpis: {
    pipeline_coverage,
    win_rate,
    avg_cycle_days,
    forecast_accuracy,
    activity_velocity,
    responses_7d
  },
  top_opportunities: [
    { opportunity_id, account_name, stage, value_estimate, last_activity_at, risk_flags[] }
  ],
  top_non_clients: [
    { carrier_dot, carrier_name, signal_score, driver_count_high_match, top_regions[] }
  ],
  alerts: [
    { alert_id, type, severity, message, created_at, account_id }
  ],
  next_actions: [
    { task_id, account_id, due_at, action_type, priority }
  ]
}
```

Workflow
```
Load Dashboard -> getMatchSignals() -> getPipelineKPIs() -> getAlerts()
             -> assemble DashboardState -> render KPIs + queues + alerts
```

#### 4.8.2 Pipeline & Deal Flow (Page Schema)

```
PipelineState {
  stages: [
    { stage_id, name, probability, opportunity_count, value_sum, avg_age_days }
  ],
  opportunities: [
    {
      opportunity_id, account_id, account_name,
      stage_id, value_estimate, owner_id,
      last_activity_at, next_step_at,
      risk_flags[], match_signal_score
    }
  ],
  filters: { owner_id, region, segment, signal_min, stage_ids[] },
  view: { mode: "kanban" | "table" | "forecast" }
}
```

Workflow
```
Load Pipeline -> getPipelineStages() -> getOpportunities(filters)
            -> compute rollups -> render Kanban + Forecast
Drag Stage -> updateOpportunityStage() -> evaluateAutomationRules()
          -> log B2BActivity -> refresh rollups
```

#### 4.8.3 Campaign Reporting (Page Schema)

```
CampaignReportState {
  campaigns: [
    { campaign_id, name, channel_mix[], status, sent_count, reply_count, booked_count }
  ],
  metrics: {
    open_rate, click_rate, reply_rate, meeting_rate,
    conversion_rate, avg_response_time_hours
  },
  channel_breakdown: [
    { channel, sent, delivered, replied, meetings }
  ],
  sequence_performance: [
    { sequence_id, step_id, step_type, sent, replied, conversion_rate }
  ],
  rep_performance: [
    { owner_id, touches, replies, meetings, deals_won }
  ]
}
```

Workflow
```
Load Campaign Reporting -> getCampaigns(date_range)
                        -> getCampaignMetrics(date_range)
                        -> getSequencePerformance(date_range)
                        -> render charts + tables
```

### 4.9 UI Wireframes (ASCII)

#### 4.9.1 B2B Dashboard

```
+----------------------------------------------------------------------------------+
| B2B Dashboard                         Date Range [ Last 30 days v ]  [Export]   |
+----------------------+------------------------------+----------------------------+
| KPI: Pipeline Cover. | KPI: Win Rate                | KPI: Avg Cycle             |
| 3.2x                 | 18%                           | 24 days                    |
+----------------------+------------------------------+----------------------------+
| KPI: Forecast Acc.   | KPI: Activity Velocity       | KPI: Responses (7d)         |
| 86%                  | 42 touches/wk                | 19 replies                  |
+----------------------+------------------------------+----------------------------+
| Top Non-Client Carriers                         | Alerts                        |
| ------------------------------------------------+------------------------------|
| Carrier X   Score 92  100 drivers  Regions: TX  | HIGH: 3 deals stalled >14d   |
| Carrier Y   Score 88   75 drivers  Regions: GA  | MED: 2 no next-step set      |
| Carrier Z   Score 84   63 drivers  Regions: IL  | LOW: 5 new signals detected  |
+-------------------------------------------------+------------------------------+
| Top Opportunities                                | Next Actions                 |
| ------------------------------------------------+------------------------------|
| Carrier A  Stage: Discovery  $12k  Risk: None   | Call Carrier B (Today 3pm)   |
| Carrier B  Stage: Proposal   $25k  Risk: Stale  | Email Carrier D (Tomorrow)   |
| Carrier C  Stage: Negotiation $40k Risk: No DM  | Review Carrier A brief       |
+----------------------------------------------------------------------------------+
```

#### 4.9.2 Pipeline & Deal Flow

```
+----------------------------------------------------------------------------------+
| Pipeline  [Kanban v]  Filters: Owner [All] Region [All] Signal [70+]            |
+----------------------------------------------------------------------------------+
| Prospecting     | Discovery       | Proposal        | Negotiation     | Closed  |
| 6 ($48k)        | 5 ($60k)        | 3 ($44k)        | 2 ($75k)        | 4 ($90k)|
|-----------------+-----------------+-----------------+-----------------+---------|
| Carrier A $12k  | Carrier E $10k  | Carrier G $18k  | Carrier J $40k  | Won 2   |
| Carrier B $8k   | Carrier F $20k  | Carrier H $12k  | Carrier K $35k  | Lost 2  |
| Risk: Stale     | Risk: None      | Risk: No DM     | Risk: NextStep  |         |
+----------------------------------------------------------------------------------+
| Forecast Summary: Commit $55k | Best $120k | Pipeline $247k | Coverage 3.2x      |
+----------------------------------------------------------------------------------+
```

#### 4.9.3 Campaign Reporting

```
+----------------------------------------------------------------------------------+
| Campaign Reporting                    Date Range [ Last 30 days v ]  [Export]   |
+----------------------+------------------------------+----------------------------+
| KPI: Open Rate       | KPI: Reply Rate              | KPI: Meeting Rate          |
| 42%                  | 7.8%                          | 2.1%                       |
+----------------------+------------------------------+----------------------------+
| Channel Breakdown                                    | Rep Performance            |
| ----------------------------------------------------+----------------------------|
| Email  Sent 4,200  Open 42%  Reply 8%  Meetings 2%  | Jordan  220 touches  6 mtg |
| SMS    Sent 1,100  Reply 12%  Meetings 3%           | Casey   180 touches  4 mtg |
| Voice  Calls 260   Connect 18%  Meetings 6%         | Riley   140 touches  3 mtg |
+----------------------------------------------------+----------------------------+
| Sequence Performance                                                         |
| ----------------------------------------------------------------------------- |
| Seq A  Step1 Email  4.2% reply | Step2 SMS  9.1% reply | Step3 Call  4.8% reply |
| Seq B  Step1 Email  3.1% reply | Step2 Email 2.4% reply | Step3 Call 3.6% reply |
+----------------------------------------------------------------------------------+
```

### 4.10 Mobile Wireframes (ASCII)

#### 4.10.1 B2B Dashboard (Mobile)

```
+------------------------------+
| B2B Dashboard   [30d v]     |
+------------------------------+
| Pipeline Cover.  3.2x       |
| Win Rate         18%        |
| Avg Cycle        24d        |
| Forecast Acc.    86%        |
+------------------------------+
| Top Non-Clients              |
| Carrier X  Score 92          |
| 100 drivers  Regions: TX     |
| [Call] [Email] [Brief]       |
| Carrier Y  Score 88          |
| 75 drivers  Regions: GA      |
| [Call] [Email] [Brief]       |
+------------------------------+
| Alerts                        |
| HIGH: 3 deals stalled >14d   |
| MED: 2 no next-step set      |
+------------------------------+
| Next Actions                  |
| Call Carrier B (Today 3pm)   |
| Email Carrier D (Tomorrow)   |
+------------------------------+
```

#### 4.10.2 Pipeline & Deal Flow (Mobile)

```
+------------------------------+
| Pipeline   [Kanban v]       |
| Filters: Owner All          |
+------------------------------+
| Stage: Discovery (5)        |
| Carrier E  $10k  Risk: None |
| Carrier F  $20k  Risk: None |
| [Next Stage] [Details]      |
+------------------------------+
| Stage: Proposal (3)         |
| Carrier G  $18k  Risk: No DM|
| Carrier H  $12k  Risk: None |
| [Next Stage] [Details]      |
+------------------------------+
| Forecast: Commit $55k       |
+------------------------------+
```

#### 4.10.3 Campaign Reporting (Mobile)

```
+------------------------------+
| Campaigns   [30d v]         |
+------------------------------+
| Open 42%  Reply 7.8%        |
| Meetings 2.1%               |
+------------------------------+
| Channel Breakdown            |
| Email 4,200  Reply 8%       |
| SMS   1,100  Reply 12%      |
| Voice 260   Connect 18%     |
+------------------------------+
| Rep Performance              |
| Jordan  6 mtg               |
| Casey   4 mtg               |
+------------------------------+
| Sequence Performance         |
| Seq A Step1 4.2%            |
| Seq A Step2 9.1%            |
+------------------------------+
```

### 4.11 Account Detail and Research Agent Wireframes (ASCII)

#### 4.11.1 Account Detail

```
+----------------------------------------------------------------------------------+
| Carrier X (DOT 123456)   Segment: Regional   Status: Target  Owner: Jordan      |
+------------------------------+------------------------------+--------------------+
| Match Signal Summary         | Opportunity Status           | Quick Actions      |
| Score 92  100 drivers        | Stage: Discovery             | [Call] [Text]      |
| Top Regions: TX, OK          | Value: $12k                  | [Email] [Task]     |
| Top Equip: Dry Van           | Next Step: Intro Call (Fri)  | [Generate Brief]   |
+------------------------------+------------------------------+--------------------+
| Contacts                      | Activity Timeline                               |
| ---------------------------------------------------------------                  |
| Jamie Smith (Owner)            | Tue 10:15a  Call - Left VM                       |
| (555) 222-8899                 | Tue 10:18a  Email - Intro + Match Data           |
| Preferred: Call                | Wed 2:30p  SMS - Confirm meeting                 |
| [Add Contact]                  | [Log Activity]                                   |
+------------------------------+--------------------------------------------------+
| Deal Risks & Notes                                                              |
| - No decision maker confirmed                                                   |
| - No proposal sent                                                              |
+----------------------------------------------------------------------------------+
```

#### 4.11.2 Research Agent Panel

```
+----------------------------------------------------------------------------------+
| Research Brief: Carrier X                  Generated: 2026-01-28  [Refresh]      |
+----------------------------------------------------------------------------------+
| Highlights                                                                     |
| - Fleet size: ~210 tractors (public FMCSA)                                     |
| - Hiring signals: 3 active postings in TX/OK (last 14 days)                     |
| - Compliance: CSA BASIC alert - Vehicle Maintenance (moderate)                 |
| - Growth signal: Added regional lanes in DFW/Austin                             |
+----------------------------------------------------------------------------------+
| Suggested Talk Track                                                           |
| "We have 100+ qualified drivers in TX/OK who match your regional lanes..."      |
+----------------------------------------------------------------------------------+
| Recommended Next Steps                                                         |
| 1) Call owner with match count + lane fit                                       |
| 2) Offer 2-week pilot for fast fill                                             |
+----------------------------------------------------------------------------------+
| Sources                                                                        |
| - FMCSA profile, Job board listings, Company site                               |
+----------------------------------------------------------------------------------+
```

### 4.12 Interaction Notes

#### 4.12.1 Dashboard

- KPI tiles toggle the KPI trend view (7d/30d/90d).
- Top Non-Client list allows one-tap call/text/email actions.
- Alerts link to the filtered pipeline or specific account.
- Next Actions are editable; drag to re-prioritize.

#### 4.12.2 Pipeline

- Kanban drag-and-drop updates stage and triggers automation rules.
- “Risk” badges appear when: no next step >7 days, no activity >10 days, no decision maker.
- Forecast view shows Commit/Best/Pipeline based on stage probabilities.
- Bulk actions: assign owner, enroll in sequence, set next step.

#### 4.12.3 Campaign Reporting

- Date range filters update KPIs, channel breakdown, and rep performance.
- Drill-down from sequence step opens step performance timeline.
- Channel cards link to campaign list filtered by channel.

#### 4.12.4 Account Detail

- Generate Brief triggers research agent and caches for 7 days.
- Quick actions create B2BActivity log entries automatically.
- Contact consent status gates SMS and call recording options.

---

## 5. Integrations (Vendor-Agnostic)

- Voice dialer and transcription
- SMS provider
- Email sending provider
- Calendar scheduling (optional)
- Company research data sources (public web, registries, FMCSA profile, news)

---

## 6. Security and Compliance

- Consent tracking for SMS and call recording
- Quiet hours and rate limits per region
- Do-not-contact list enforcement
- Audit logging for outreach actions

---

## 7. Metrics and KPIs

- Match signal to outreach conversion rate
- Response rate by channel
- Average days from first touch to close
- Win rate by segment and match signal score
- Revenue influenced by match-driven outreach
- Pipeline coverage and forecast accuracy
- Stage conversion rates and time-in-stage
- Activity-to-outcome ratios (calls/emails per meeting)
- Cost per acquisition and ROI by channel
- Predictive close rate accuracy and variance

---

## 8. Acceptance Criteria

- Business development professionals can create accounts, contacts, and opportunities
- Match signal data can populate opportunity lists
- Email, SMS, and voice actions create activity log entries
- A non-client carrier with high match potential can be surfaced and contacted
- Outreach compliance rules are enforced
- Pipeline dashboard reflects accurate stage counts and conversion rates
- Research briefs can be generated and attached to accounts
