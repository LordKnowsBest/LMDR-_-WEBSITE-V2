# Agent Tool Spec: Recruiter Section
# Track: full_agentic_buildout_20260218
# Platform: LMDR / VelocityMatch — Wix Velo CDL Truck Driver Recruiting
# Generated: 2026-02-18

## Overview

This spec defines every agent tool for the **recruiter** role in the full agentic buildout.
Each tool maps to an existing backend `.jsw` service and Airtable collection. The agent
orchestration layer (`agentService.jsw → handleAgentTurn`) builds a role-scoped tool list at
runtime; only tools matching the authenticated user's role are exposed. Recruiter tools span
six functional domains: Outreach, Analytics, Onboarding Automation, Pipeline, Retention, and
Reverse Matching.

**Risk levels:**
- `read` — safe read-only, no approval required
- `suggest` — prepares a recommendation or preview, user confirms before execute
- `execute_low` — low-impact write (status flag, note, preference)
- `execute_high` — high-impact write (campaign launch, subscription change, BGC order, bulk action)

**Airtable base:** `Last Mile Driver recruiting` (`app9N1YCJ3gdhExA0`) — all `v2_*` tables.

---

## Group 1: Recruiter Outreach (~14 tools)

**Source Track:** recruiter_outreach_20260120
**Backend Services:** outreachService.jsw, smsService.jsw, emailService.jsw, jobBoardService.jsw, socialService.jsw, voiceCampaignService.jsw, voiceAgentTemplates.jsw

> **Already delivered (Pipeline Execution Agent — Feb 2026):**
> Three recruiter agent tools already exist in `agentService.jsw` TOOL_DEFINITIONS:
> - `initiate_voice_screen` — Creates a VAPI assistant from a voice template and initiates an outbound call (risk: execute_high, TCPA check via `tcpaGuard.js`)
> - `get_pipeline_health` — Returns SLA compliance and conversion metrics from `pipelineExecutionAgent.jsw` (risk: read)
> - `emit_pipeline_event` — Fires a pipeline event through `pipelineEventBus.jsw` (risk: execute_low)
>
> Supporting infrastructure already live:
> - `pipelineExecutionAgent.jsw` — Rule-based decision engine with < 5 min contact SLA, channel escalation (SMS → email → voice → recruiter queue)
> - `pipelineEventBus.jsw` — Central event dispatch replacing inline `emitPipelineEventNonBlocking`
> - `voiceAgentTemplates.jsw` — 13 VAPI voice agent templates across 5 lifecycle groups (sourcing, screening, application support, onboarding, retention)
> - `pipelineJobs.jsw` — SLA enforcement (every 5 min) and failed event reprocessing (every 15 min)
> - Airtable tables: `v2_Pipeline Events`, `v2_Voice Agent Templates`
>
> Phase 2 outreach tools should integrate with this infrastructure rather than duplicating channel dispatch logic.

---

### create_campaign

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Creates a new outreach campaign record (SMS, email, or multi-channel) for a recruiter. Stores campaign configuration, audience filter, and channel mix. Does not launch; use `schedule_campaign` or `send_sms` / `send_email` to activate.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID of the recruiter (required)
  campaign_name: string          — Human-readable name for the campaign (required)
  campaign_type: string          — sms | email | multi_channel (required)
  audience_filter: object        — Driver filter criteria: { cdl_class, endorsements, experience_years_min, home_state, status, max_results } (required)
  message_template_id: string    — ID of an existing template from get_templates; null for ad-hoc
  scheduled_send: string         — ISO 8601 datetime for scheduled delivery; null for immediate
  carrier_dot: string            — DOT number of carrier this campaign is on behalf of
  job_posting_id: string         — Optional link to an active job posting record ID
  channel_priority: string[]     — Ordered channel list for multi-channel: ["sms","email"] (default)
  ```
- **Backend Service:** outreachService.jsw → createCampaign()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw (audience resolution), get_templates (template lookup)

---

### send_sms

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Sends an SMS message to one or more drivers via Twilio. Resolves the audience from a campaign or an explicit driver list, validates opt-in status for each recipient, substitutes merge fields, and dispatches. Returns a send receipt with per-recipient delivery status.
- **Parameters:**
  ```
  campaign_id: string            — Campaign record ID (required; links send to campaign)
  driver_ids: string[]           — Explicit list of driver record IDs; overrides campaign audience if provided
  message_body: string           — SMS body text, max 160 chars per segment; merge fields via {{first_name}}, {{carrier_name}} (required)
  send_immediately: boolean      — true dispatches now; false queues for scheduled_send time (default: true)
  test_mode: boolean             — true sends only to recruiter's own number (default: false)
  ```
- **Backend Service:** smsService.jsw → sendCampaignSMS()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns; smsDeliveryLogs → v2_SMS Delivery Logs; driverProfiles → v2_Driver Profiles
- **Approval Required:** Yes (dispatches to real drivers; recruiter must confirm audience count before send)
- **Dependencies:** outreachService.jsw (audience resolution), Twilio API

---

### send_email

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Dispatches an email campaign to the resolved audience via SendGrid. Applies the selected email template, injects personalization tokens, enforces unsubscribe footers, and logs delivery. Returns a send receipt with message IDs.
- **Parameters:**
  ```
  campaign_id: string            — Campaign record ID (required)
  driver_ids: string[]           — Explicit driver list; overrides campaign audience if provided
  template_id: string            — SendGrid template ID or internal template record ID (required)
  subject_line: string           — Email subject; merge fields supported (required)
  from_name: string              — Sender display name (default: recruiter's display name)
  reply_to: string               — Reply-to email address (default: recruiter's email)
  send_immediately: boolean      — true dispatches now (default: true)
  test_mode: boolean             — true sends only to recruiter's email (default: false)
  ```
- **Backend Service:** emailService.jsw → sendCampaignEmail()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns; emailDeliveryLogs → v2_Email Delivery Logs; driverProfiles → v2_Driver Profiles
- **Approval Required:** Yes (dispatches to real drivers)
- **Dependencies:** outreachService.jsw, SendGrid API, get_templates

---

### schedule_campaign

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Sets or updates the scheduled send datetime for an existing campaign. Validates that the campaign is in `draft` or `scheduled` status. Updates the `scheduled_send` field and confirms the scheduling. Does not dispatch.
- **Parameters:**
  ```
  campaign_id: string            — Campaign record ID (required)
  scheduled_send: string         — ISO 8601 datetime in recruiter's timezone (required)
  timezone: string               — IANA timezone string, e.g. "America/Chicago" (default: "America/Chicago")
  notify_recruiter: boolean      — Send confirmation notification to recruiter (default: true)
  ```
- **Backend Service:** outreachService.jsw → scheduleCampaign()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns
- **Approval Required:** No
- **Dependencies:** None

---

### get_campaign_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the current execution status of a campaign including delivery counts, bounce rate, opt-out count, link click rate, and any delivery errors. Works for SMS, email, and multi-channel campaigns.
- **Parameters:**
  ```
  campaign_id: string            — Campaign record ID (required)
  include_delivery_log: boolean  — Include per-driver delivery status rows (default: false)
  ```
- **Backend Service:** outreachService.jsw → getCampaignStatus()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns; smsDeliveryLogs → v2_SMS Delivery Logs; emailDeliveryLogs → v2_Email Delivery Logs
- **Approval Required:** No
- **Dependencies:** None

---

### pause_campaign

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Pauses an in-progress campaign, halting any further outbound messages. Safe for both SMS and email campaigns. Updates campaign status to `paused`. Can be resumed later by calling `schedule_campaign` with a new datetime.
- **Parameters:**
  ```
  campaign_id: string            — Campaign record ID (required)
  pause_reason: string           — Freeform reason stored in campaign record (required)
  ```
- **Backend Service:** outreachService.jsw → pauseCampaign()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns
- **Approval Required:** No
- **Dependencies:** None

---

### get_campaign_analytics

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns aggregated performance analytics for a campaign: open rate, click rate, reply rate, application starts attributed to campaign, and cost per click. Compares against recruiter's 30-day baseline.
- **Parameters:**
  ```
  campaign_id: string            — Campaign record ID (required)
  compare_to_baseline: boolean   — Include delta vs. recruiter baseline (default: true)
  ```
- **Backend Service:** outreachService.jsw → getCampaignAnalytics()
- **Airtable Collection(s):** outreachCampaigns → v2_Outreach Campaigns; outreachAnalytics → v2_Outreach Analytics; sourceAttribution → v2_Source Attribution
- **Approval Required:** No
- **Dependencies:** None

---

### create_email_template

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Creates a reusable email template stored to the recruiter's template library. Supports merge fields ({{first_name}}, {{carrier_name}}, {{job_title}}, {{pay_rate}}, {{home_time}}). Templates are scoped to the recruiter and optionally shared carrier-wide.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  template_name: string          — Display name for the template (required)
  subject_line: string           — Email subject with merge field support (required)
  body_html: string              — HTML email body (required)
  body_text: string              — Plain text fallback body (required)
  channel: string                — email | sms (default: email)
  carrier_dot: string            — If provided, makes template available to all recruiters at this carrier
  tags: string[]                 — Categorization tags, e.g. ["initial_outreach","follow_up"]
  ```
- **Backend Service:** emailService.jsw → createEmailTemplate()
- **Airtable Collection(s):** emailTemplates → v2_Email Templates
- **Approval Required:** No
- **Dependencies:** None

---

### get_templates

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the recruiter's available email and SMS templates, including shared carrier templates and LMDR platform templates. Supports filtering by channel and tag.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Also return templates shared at this carrier (optional)
  channel: string                — email | sms | all (default: all)
  tag: string                    — Filter by tag (optional)
  include_platform_templates: boolean — Include LMDR default templates (default: true)
  ```
- **Backend Service:** emailService.jsw → getTemplates()
- **Airtable Collection(s):** emailTemplates → v2_Email Templates
- **Approval Required:** No
- **Dependencies:** None

---

### syndicate_to_job_boards

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Posts or syndicates an active job posting to one or more external job boards (Indeed, ZipRecruiter, CDLjobs, Truckers Report). Maps internal job fields to each board's schema, submits via their respective APIs, and logs confirmation IDs.
- **Parameters:**
  ```
  job_posting_id: string         — Job posting record ID (required)
  boards: string[]               — Target boards: indeed | ziprecruiter | cdljobs | truckers_report | all (required)
  budget_per_board: number       — Daily spend cap in USD per board (optional; boards without budgets post organically)
  apply_url_override: string     — Custom apply URL; defaults to LMDR driver profile apply URL
  expiry_date: string            — ISO 8601 date for posting expiration (default: 30 days)
  ```
- **Backend Service:** jobBoardService.jsw → syndicateToBoards()
- **Airtable Collection(s):** jobPostings → v2_Job Postings; jobBoardSyndications → v2_Job Board Syndications
- **Approval Required:** Yes (incurs spend on paid boards; recruiter confirms budget)
- **Dependencies:** Stripe (for sponsored posting billing), Indeed API, ZipRecruiter API

---

### get_syndication_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the live status of a job posting's syndication across all boards it was submitted to: active, pending, rejected, expired. Includes rejection reasons where available.
- **Parameters:**
  ```
  job_posting_id: string         — Job posting record ID (required)
  refresh_from_apis: boolean     — Pull live status from board APIs (may be slow; default: false)
  ```
- **Backend Service:** jobBoardService.jsw → getSyndicationStatus()
- **Airtable Collection(s):** jobBoardSyndications → v2_Job Board Syndications
- **Approval Required:** No
- **Dependencies:** None

---

### update_job_posting

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Updates mutable fields of an existing job posting record: pay range, home time, description, required endorsements, or status. Propagates changes to active board syndications where the board API supports it.
- **Parameters:**
  ```
  job_posting_id: string         — Job posting record ID (required)
  pay_min: number                — Minimum pay (CPM or annual salary in USD)
  pay_max: number                — Maximum pay
  pay_type: string               — cpm | annual | hourly
  home_time: string              — Updated home time description
  description: string            — Updated job description (HTML or plain text)
  required_endorsements: string[] — e.g. ["hazmat","tanker"]
  status: string                 — active | paused | filled | expired
  propagate_to_boards: boolean   — Push changes to active syndications (default: true)
  ```
- **Backend Service:** jobBoardService.jsw → updateJobPosting()
- **Airtable Collection(s):** jobPostings → v2_Job Postings; jobBoardSyndications → v2_Job Board Syndications
- **Approval Required:** No
- **Dependencies:** None

---

### create_social_post

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Composes and publishes (or schedules) a social media post to Facebook or LinkedIn on behalf of the recruiter or carrier page. Generates a copy suggestion from the job posting data if no body is provided.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  platforms: string[]            — facebook | linkedin (required)
  body: string                   — Post text; if omitted, auto-generated from job_posting_id
  job_posting_id: string         — Source job posting for auto-copy generation (optional)
  media_url: string              — Image or video URL to attach (optional)
  scheduled_at: string           — ISO 8601 datetime; null = post now (default: null)
  carrier_dot: string            — Post on behalf of carrier page if page is connected
  ```
- **Backend Service:** socialService.jsw → createSocialPost()
- **Airtable Collection(s):** socialPosts → v2_Social Posts
- **Approval Required:** Yes (publishes externally)
- **Dependencies:** Facebook Graph API, LinkedIn API

---

### get_social_analytics

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns engagement metrics for social posts published through the platform: impressions, reach, clicks, shares, and application starts attributed to social traffic. Aggregatable by platform and date range.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  platform: string               — facebook | linkedin | all (default: all)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  job_posting_id: string         — Scope to a specific job posting (optional)
  ```
- **Backend Service:** socialService.jsw → getSocialAnalytics()
- **Airtable Collection(s):** socialPosts → v2_Social Posts; outreachAnalytics → v2_Outreach Analytics
- **Approval Required:** No
- **Dependencies:** None

---

## Group 2: Recruiter Analytics (~13 tools)

**Source Track:** recruiter_analytics_20260120
**Backend Services:** recruiterAnalyticsService.jsw, forecastingService.jsw, competitorIntelService.jsw

---

### get_source_attribution

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the first-touch and last-touch attribution breakdown for driver acquisitions over a time period. Shows which channels (organic search, job boards, social, SMS, referral, direct) drove completed applications, qualifications, and hires.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a specific carrier (optional)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  attribution_model: string      — first_touch | last_touch | linear (default: last_touch)
  funnel_stage: string           — application | qualification | hire | all (default: all)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getSourceAttribution()
- **Airtable Collection(s):** sourceAttribution → v2_Source Attribution; driverProfiles → v2_Driver Profiles
- **Approval Required:** No
- **Dependencies:** None

---

### get_channel_performance

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns a ranked table of channel performance: volume, conversion rate at each funnel stage, average time-to-hire, and cost per hire. Enables recruiters to reallocate budget to highest-performing channels.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  channels: string[]             — Channels to include; empty = all
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getChannelPerformance()
- **Airtable Collection(s):** sourceAttribution → v2_Source Attribution; recruitingSpend → v2_Recruiting Spend
- **Approval Required:** No
- **Dependencies:** None

---

### compare_sources

- **Role:** recruiter
- **Risk Level:** suggest
- **Description:** Head-to-head comparison of two or more sourcing channels across cost, quality, speed, and retention metrics. Returns a recommendation on which channel to prioritize for a given hiring objective.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  channels: string[]             — Exactly 2–5 channel names to compare (required)
  metric_weights: object         — Optional custom weights: { cost: 0.3, quality: 0.4, speed: 0.3 }
  date_from: string              — ISO 8601 date (default: 90 days ago)
  date_to: string                — ISO 8601 date (default: today)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → compareSources()
- **Airtable Collection(s):** sourceAttribution → v2_Source Attribution; recruitingSpend → v2_Recruiting Spend
- **Approval Required:** No
- **Dependencies:** None

---

### calculate_cost_per_hire

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Calculates total cost-per-hire (CPH) for a given period by channel, combining spend data with hire counts. Returns blended CPH and per-channel breakdown. Includes a 90-day and 12-month trend if data is available.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  period_start: string           — ISO 8601 date (required)
  period_end: string             — ISO 8601 date (required)
  include_platform_fees: boolean — Include LMDR subscription cost in CPH (default: false)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → calculateCostPerHire()
- **Airtable Collection(s):** recruitingSpend → v2_Recruiting Spend; sourceAttribution → v2_Source Attribution; hiringOutcomes → v2_Hiring Outcomes
- **Approval Required:** No
- **Dependencies:** None

---

### get_cph_trend

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns month-over-month cost-per-hire trend data for chart rendering. Includes blended CPH and per-channel CPH for up to 24 months of history.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  months: number                 — Number of months to return (default: 12, max: 24)
  channels: string[]             — Channels to include; empty = all
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getCPHTrend()
- **Airtable Collection(s):** recruitingSpend → v2_Recruiting Spend; hiringOutcomes → v2_Hiring Outcomes
- **Approval Required:** No
- **Dependencies:** None

---

### get_cph_breakdown

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns a detailed cost-per-hire breakdown by spend category: job board spend, SMS cost, email platform cost, recruiter time allocation, and background check fees. Surfaces which cost line items are above industry benchmarks.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  period_start: string           — ISO 8601 date (required)
  period_end: string             — ISO 8601 date (required)
  benchmark_comparison: boolean  — Include industry benchmark percentiles (default: true)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getCPHBreakdown()
- **Airtable Collection(s):** recruitingSpend → v2_Recruiting Spend; hiringOutcomes → v2_Hiring Outcomes
- **Approval Required:** No
- **Dependencies:** None

---

### get_funnel_metrics

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns full-funnel conversion metrics from application to hire: counts at each stage (applied, screened, interviewed, offered, accepted, started), stage-to-stage conversion rates, and average time-in-stage.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  segment_by: string             — channel | cdl_class | experience_tier | none (default: none)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getFunnelMetrics()
- **Airtable Collection(s):** funnelEvents → v2_Funnel Events; driverCarrierInterests → v2_Driver Carrier Interests
- **Approval Required:** No
- **Dependencies:** None

---

### get_stage_conversion

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the conversion rate, average time-in-stage, and drop-off rate for a specific funnel stage. Compares to the recruiter's historical baseline and peer benchmarks.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  stage: string                  — applied | screened | interviewed | offered | accepted | started (required)
  carrier_dot: string            — Scope to a carrier (optional)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getStageConversion()
- **Airtable Collection(s):** funnelEvents → v2_Funnel Events
- **Approval Required:** No
- **Dependencies:** None

---

### get_bottleneck_analysis

- **Role:** recruiter
- **Risk Level:** suggest
- **Description:** Identifies the funnel stage with the highest drop-off rate and longest time-in-stage relative to benchmarks. Returns ranked list of bottlenecks with contributing factors and suggested interventions for each.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  top_n: number                  — Return top N bottlenecks (default: 3)
  ```
- **Backend Service:** recruiterAnalyticsService.jsw → getBottleneckAnalysis()
- **Airtable Collection(s):** funnelEvents → v2_Funnel Events; hiringOutcomes → v2_Hiring Outcomes
- **Approval Required:** No
- **Dependencies:** None

---

### get_competitor_analysis

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns structured intelligence on a competitor carrier including tracked pay range, home time offering, equipment types, bonus structures, known pain points, and recent changes. Data sourced from tracked competitor records.
- **Parameters:**
  ```
  competitor_dot: string         — FMCSA DOT number of competitor carrier (required)
  fields: string[]               — Specific data points to return; empty = all
  include_change_history: boolean — Show tracked changes over time (default: false)
  ```
- **Backend Service:** competitorIntelService.jsw → getCompetitorAnalysis()
- **Airtable Collection(s):** competitorIntel → v2_Competitor Intel
- **Approval Required:** No
- **Dependencies:** None

---

### track_competitor

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Adds a competitor carrier to the recruiter's monitored list or updates tracked fields for an existing competitor record. Triggers periodic data refresh jobs for that competitor.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  competitor_dot: string         — FMCSA DOT number of competitor carrier (required)
  competitor_name: string        — Carrier name (required)
  track_fields: string[]         — Fields to actively monitor: pay | home_time | bonuses | equipment | reviews (default: all)
  alert_on_change: boolean       — Notify recruiter when tracked fields change (default: true)
  ```
- **Backend Service:** competitorIntelService.jsw → trackCompetitor()
- **Airtable Collection(s):** competitorIntel → v2_Competitor Intel
- **Approval Required:** No
- **Dependencies:** None

---

### get_hiring_forecast

- **Role:** recruiter
- **Risk Level:** suggest
- **Description:** Projects hiring demand for the next 30, 60, or 90 days based on historical hiring velocity, seasonal CDL market patterns, current pipeline state, and carrier-specified headcount targets. Returns point forecast and confidence band.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier to forecast for (required)
  horizon_days: number           — 30 | 60 | 90 (default: 30)
  include_seasonality: boolean   — Apply CDL market seasonality adjustments (default: true)
  headcount_target: number       — Known target headcount to compare against forecast (optional)
  ```
- **Backend Service:** forecastingService.jsw → getHiringForecast()
- **Airtable Collection(s):** hiringForecasts → v2_Hiring Forecasts; hiringOutcomes → v2_Hiring Outcomes
- **Approval Required:** No
- **Dependencies:** None

---

### get_attrition_forecast

- **Role:** recruiter
- **Risk Level:** suggest
- **Description:** Projects expected driver attrition for the next 30–90 days using retention risk scores, tenure distributions, and seasonal churn patterns. Returns forecasted departures by risk tier and suggests proactive intervention count.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier to forecast for (required)
  horizon_days: number           — 30 | 60 | 90 (default: 30)
  risk_tiers: string[]           — high | medium | low — tiers to include (default: all)
  ```
- **Backend Service:** forecastingService.jsw → getAttritionForecast()
- **Airtable Collection(s):** hiringForecasts → v2_Hiring Forecasts; retentionRiskLogs → v2_Retention Risk Logs
- **Approval Required:** No
- **Dependencies:** retentionService.jsw (risk score data)

---

## Group 3: Recruiter Onboarding Automation (~12 tools)

**Source Track:** recruiter_onboarding_automation_20260120
**Backend Services:** onboardingWorkflowService.jsw, documentCollectionService.jsw, backgroundCheckService.jsw, drugTestService.jsw, eSignatureService.jsw, orientationService.jsw

---

### create_onboarding_workflow

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Creates a new onboarding workflow instance for a driver who has accepted an offer. Initializes the step checklist (document collection, BGC, drug test, offer letter, orientation), sets deadlines per step, and sends the driver their onboarding portal link.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  recruiter_id: string           — Wix member ID of the owning recruiter (required)
  start_date: string             — Driver's expected start date ISO 8601 (required)
  workflow_template: string      — standard | expedited | owner_operator (default: standard)
  skip_steps: string[]           — Steps to skip: bgc | drug_test | orientation (optional)
  notify_driver: boolean         — Send portal link to driver immediately (default: true)
  ```
- **Backend Service:** onboardingWorkflowService.jsw → createOnboardingWorkflow()
- **Airtable Collection(s):** onboardingWorkflows → v2_Onboarding Workflows; onboardingSteps → v2_Onboarding Steps
- **Approval Required:** No
- **Dependencies:** documentCollectionService.jsw (initializes document checklist)

---

### get_workflow_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the current status of a driver's onboarding workflow: completed steps, pending steps, overdue steps, blocking issues, and overall completion percentage. Powers the onboarding dashboard progress view.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  include_step_detail: boolean   — Include full step records with due dates (default: true)
  ```
- **Backend Service:** onboardingWorkflowService.jsw → getWorkflowStatus()
- **Airtable Collection(s):** onboardingWorkflows → v2_Onboarding Workflows; onboardingSteps → v2_Onboarding Steps
- **Approval Required:** No
- **Dependencies:** None

---

### advance_workflow_step

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Manually marks an onboarding step as complete and advances the workflow to the next pending step. Triggers any downstream automations associated with the completed step (e.g., marking BGC complete unlocks orientation booking).
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  step_key: string               — Step to mark complete: docs_submitted | bgc_ordered | bgc_clear | drug_test_scheduled | drug_test_clear | offer_signed | orientation_scheduled | orientation_complete (required)
  notes: string                  — Optional notes for the completion event
  completed_at: string           — ISO 8601 datetime; defaults to now
  ```
- **Backend Service:** onboardingWorkflowService.jsw → advanceWorkflowStep()
- **Airtable Collection(s):** onboardingWorkflows → v2_Onboarding Workflows; onboardingSteps → v2_Onboarding Steps
- **Approval Required:** No
- **Dependencies:** None

---

### get_pending_tasks

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns all onboarding tasks across the recruiter's active workflows that are pending action — overdue, due within 48 hours, or awaiting recruiter review. Sorted by urgency. Enables a prioritized daily work queue.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Filter by carrier (optional)
  urgency_filter: string         — overdue | due_soon | all (default: all)
  limit: number                  — Max tasks to return (default: 25, max: 100)
  ```
- **Backend Service:** onboardingWorkflowService.jsw → getPendingTasks()
- **Airtable Collection(s):** onboardingWorkflows → v2_Onboarding Workflows; onboardingSteps → v2_Onboarding Steps
- **Approval Required:** No
- **Dependencies:** None

---

### request_document

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Sends an automated document request to a driver for a specific document type. Generates a secure upload link, notifies the driver by SMS and email, and creates a pending document record in the workflow.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  document_type: string          — cdl | medical_card | mvr_consent | previous_employer | ssn_verification | dot_physical | drug_test_consent | w4 | i9 (required)
  due_date: string               — ISO 8601 date for document submission deadline (required)
  message_override: string       — Custom message to driver; uses default template if omitted
  send_reminder: boolean         — Auto-send reminder 24 hours before due date (default: true)
  ```
- **Backend Service:** documentCollectionService.jsw → requestDocument()
- **Airtable Collection(s):** onboardingDocuments → v2_Onboarding Documents; onboardingWorkflows → v2_Onboarding Workflows
- **Approval Required:** No
- **Dependencies:** smsService.jsw, emailService.jsw

---

### get_document_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the current status of all documents in a workflow: requested, submitted, under_review, accepted, rejected. Includes submission timestamps and any rejection reasons.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  document_type: string          — Filter to a specific doc type (optional)
  ```
- **Backend Service:** documentCollectionService.jsw → getDocumentStatus()
- **Airtable Collection(s):** onboardingDocuments → v2_Onboarding Documents
- **Approval Required:** No
- **Dependencies:** None

---

### verify_document

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Marks a submitted document as accepted or rejected by the recruiter. If rejected, stores the rejection reason and re-triggers the document request to the driver. If accepted, marks the onboarding step as cleared.
- **Parameters:**
  ```
  document_record_id: string     — Onboarding Documents record ID (required)
  decision: string               — accepted | rejected (required)
  rejection_reason: string       — Required if decision is rejected
  notify_driver: boolean         — Notify driver of outcome (default: true)
  ```
- **Backend Service:** documentCollectionService.jsw → verifyDocument()
- **Airtable Collection(s):** onboardingDocuments → v2_Onboarding Documents; onboardingSteps → v2_Onboarding Steps
- **Approval Required:** No
- **Dependencies:** None

---

### initiate_background_check

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Orders a background check for a driver through the configured BGC provider (HireRight, Checkr, or Tenstreet). Collects driver consent, submits the order, and links the order ID to the workflow. Requires driver consent document to be in accepted status.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  driver_id: string              — Driver Profiles record ID (required)
  provider: string               — hireright | checkr | tenstreet (required)
  package_type: string           — standard | dot_extended | mvr_only (default: dot_extended)
  rush_order: boolean            — Expedite processing (incurs additional fee; default: false)
  ```
- **Backend Service:** backgroundCheckService.jsw → initiateBackgroundCheck()
- **Airtable Collection(s):** backgroundChecks → v2_Background Checks; onboardingWorkflows → v2_Onboarding Workflows
- **Approval Required:** Yes (triggers billing and creates external legal record)
- **Dependencies:** documentCollectionService.jsw (consent check), HireRight/Checkr/Tenstreet APIs

---

### get_bgc_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the current status of a background check order from the provider: pending, in_progress, complete, adverse_action_required, or cancelled. Includes a summary of findings when complete (pass/flag, not raw detail).
- **Parameters:**
  ```
  bgc_record_id: string          — Background Checks record ID (required)
  refresh_from_provider: boolean — Pull live status from BGC provider API (default: false)
  ```
- **Backend Service:** backgroundCheckService.jsw → getBGCStatus()
- **Airtable Collection(s):** backgroundChecks → v2_Background Checks
- **Approval Required:** No
- **Dependencies:** None

---

### initiate_drug_test

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Schedules a DOT drug test for a driver at the nearest available lab (Quest or LabCorp). Sends the driver a lab authorization with location and appointment window. Creates a drug test record in the workflow.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  driver_id: string              — Driver Profiles record ID (required)
  provider: string               — quest | labcorp (default: quest)
  test_type: string              — pre_employment | random | return_to_duty (default: pre_employment)
  driver_zip: string             — Driver's current ZIP for lab location search (required)
  preferred_date: string         — ISO 8601 date preference; system finds available slot (optional)
  ```
- **Backend Service:** drugTestService.jsw → initiateDrugTest()
- **Airtable Collection(s):** drugTests → v2_Drug Tests; onboardingWorkflows → v2_Onboarding Workflows
- **Approval Required:** Yes (creates external lab order and billing event)
- **Dependencies:** Quest/LabCorp APIs, smsService.jsw (sends lab authorization to driver)

---

### send_for_signature

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Sends an offer letter or employment agreement to a driver for e-signature via DocuSign or HelloSign. Merges driver and carrier data into the selected template, generates the envelope, and dispatches to the driver's email. Tracks signing status.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  driver_id: string              — Driver Profiles record ID (required)
  document_template: string      — offer_letter | employment_agreement | independent_contractor | lease_agreement (required)
  esign_provider: string         — docusign | hellosign (default: docusign)
  signers: object[]              — Array of signer objects: [{ name, email, role }]; driver is always first signer
  expiry_days: number            — Days before envelope expires (default: 7)
  message_to_signer: string      — Custom message in the signature request email (optional)
  ```
- **Backend Service:** eSignatureService.jsw → sendForSignature()
- **Airtable Collection(s):** eSignatureEnvelopes → v2_ESignature Envelopes; onboardingWorkflows → v2_Onboarding Workflows
- **Approval Required:** Yes (creates legal document; recruiter must confirm template and parties)
- **Dependencies:** DocuSign/HelloSign APIs, documentCollectionService.jsw

---

### schedule_orientation

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Books a driver into an orientation session at the carrier's facility. Checks available orientation slots, confirms the driver's availability, creates a calendar event, and sends confirmation to driver and carrier contact. Marks the orientation step as scheduled in the workflow.
- **Parameters:**
  ```
  workflow_id: string            — Onboarding workflow record ID (required)
  driver_id: string              — Driver Profiles record ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  preferred_dates: string[]      — Ordered list of ISO 8601 dates the driver prefers
  orientation_location: string   — Terminal address or "virtual" (required)
  session_type: string           — in_person | virtual | hybrid (default: in_person)
  send_confirmation: boolean     — Send calendar invite and directions to driver (default: true)
  ```
- **Backend Service:** orientationService.jsw → scheduleOrientation()
- **Airtable Collection(s):** orientationSessions → v2_Orientation Sessions; onboardingWorkflows → v2_Onboarding Workflows
- **Approval Required:** No
- **Dependencies:** smsService.jsw, emailService.jsw (confirmation delivery)

---

## Group 4: Recruiter Pipeline (~10 tools)

**Source Track:** recruiter_utility_expansion_20260120
**Backend Services:** recruiterPipelineService.jsw, savedSearchService.jsw, pipelineAutomationService.jsw, callOutcomeService.jsw

---

### save_search

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Saves a driver search query with its full filter set as a named saved search. Optionally configures an alert so the recruiter is notified when new drivers matching the criteria enter the pool.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  search_name: string            — Display name for this saved search (required)
  filters: object                — Full search filter object: { cdl_class, endorsements, experience_years_min, experience_years_max, home_state, home_time_preference, equipment_types, freight_types, availability, radius_miles, center_zip } (required)
  alert_enabled: boolean         — Send notification when new drivers match (default: false)
  alert_frequency: string        — immediate | daily_digest | weekly_digest (default: daily_digest)
  ```
- **Backend Service:** savedSearchService.jsw → saveSearch()
- **Airtable Collection(s):** savedSearches → v2_Saved Searches
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw (validates filter schema)

---

### get_saved_searches

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns all saved searches for a recruiter with their alert configuration, last-run timestamp, and the count of new drivers matching each search since it was last checked.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  include_match_counts: boolean  — Compute new driver counts for each search (default: true)
  ```
- **Backend Service:** savedSearchService.jsw → getSavedSearches()
- **Airtable Collection(s):** savedSearches → v2_Saved Searches
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw (for live match counts)

---

### run_saved_search

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Executes a saved search and returns the current matching driver list. Supports pagination. Updates the `last_run` timestamp on the saved search record.
- **Parameters:**
  ```
  saved_search_id: string        — Saved Searches record ID (required)
  page: number                   — 1-based page number (default: 1)
  page_size: number              — Results per page (default: 20, max: 100)
  new_only: boolean              — Return only drivers added since last_run (default: false)
  ```
- **Backend Service:** savedSearchService.jsw → runSavedSearch()
- **Airtable Collection(s):** savedSearches → v2_Saved Searches; driverProfiles → v2_Driver Profiles
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw

---

### create_pipeline_rule

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Creates an automation rule that triggers a pipeline action when a driver meets a condition (e.g., auto-advance stage when BGC clears, auto-send follow-up SMS when a driver goes 72 hours without response). Rules are scoped to the recruiter or carrier.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  rule_name: string              — Human-readable rule name (required)
  trigger_event: string          — bgc_cleared | drug_test_cleared | no_response_72h | stage_entered | document_submitted | offer_signed (required)
  trigger_conditions: object     — Additional conditions: { stage, carrier_dot, min_days_in_stage }
  action_type: string            — advance_stage | send_sms | send_email | assign_task | notify_recruiter (required)
  action_config: object          — Action-specific config: { stage, template_id, message, assignee_id }
  is_active: boolean             — Enable rule immediately (default: true)
  ```
- **Backend Service:** pipelineAutomationService.jsw → createPipelineRule()
- **Airtable Collection(s):** pipelineRules → v2_Pipeline Rules
- **Approval Required:** No
- **Dependencies:** None

---

### get_pipeline_rules

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns all pipeline automation rules for the recruiter, with their active/inactive status, trigger counts, and last-fired timestamp.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Filter by carrier (optional)
  is_active: boolean             — Filter to active-only rules (optional)
  ```
- **Backend Service:** pipelineAutomationService.jsw → getPipelineRules()
- **Airtable Collection(s):** pipelineRules → v2_Pipeline Rules
- **Approval Required:** No
- **Dependencies:** None

---

### enable_rule

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Toggles an existing pipeline automation rule between active and inactive. Does not modify rule configuration.
- **Parameters:**
  ```
  rule_id: string                — Pipeline Rules record ID (required)
  is_active: boolean             — true to enable, false to disable (required)
  ```
- **Backend Service:** pipelineAutomationService.jsw → enableRule()
- **Airtable Collection(s):** pipelineRules → v2_Pipeline Rules
- **Approval Required:** No
- **Dependencies:** None

---

### create_intervention

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Creates a manual intervention record for a driver — a targeted action to re-engage, retain, or resolve an at-risk situation. Links to an intervention template and assigns a due date. Triggers outbound contact if the template specifies it.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  recruiter_id: string           — Wix member ID (required)
  intervention_type: string      — re_engagement | retention | stall_break | at_risk_outreach | satisfaction_check (required)
  template_id: string            — Intervention template record ID (optional; uses default if omitted)
  due_date: string               — ISO 8601 date for completion (required)
  notes: string                  — Recruiter notes on the intervention context
  auto_send: boolean             — Send the template message immediately (default: false)
  ```
- **Backend Service:** recruiterPipelineService.jsw → createIntervention()
- **Airtable Collection(s):** interventions → v2_Interventions; interventionTemplates → v2_Intervention Templates
- **Approval Required:** No (Yes if auto_send is true and type is at_risk_outreach)
- **Dependencies:** retentionService.jsw, smsService.jsw, emailService.jsw

---

### get_intervention_templates

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns available intervention templates organized by type. Each template includes the channel (SMS/email), message body, recommended trigger criteria, and historical success rate.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  intervention_type: string      — Filter by type: re_engagement | retention | stall_break | at_risk_outreach | satisfaction_check | all (default: all)
  channel: string                — sms | email | all (default: all)
  ```
- **Backend Service:** recruiterPipelineService.jsw → getInterventionTemplates()
- **Airtable Collection(s):** interventionTemplates → v2_Intervention Templates
- **Approval Required:** No
- **Dependencies:** None

---

### log_call_outcome

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Records the outcome of a recruiter call with a driver: disposition (connected, voicemail, no-answer, callback-scheduled), conversation summary, next steps, and signals that should update the driver's match profile (e.g., new equipment preference, new home time need).
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  recruiter_id: string           — Wix member ID (required)
  call_timestamp: string         — ISO 8601 datetime of the call (required)
  disposition: string            — connected | voicemail | no_answer | callback_scheduled | wrong_number (required)
  duration_seconds: number       — Call duration in seconds (0 if no answer)
  summary: string                — Recruiter's summary of the conversation
  next_action: string            — no_action | follow_up_call | send_sms | send_email | schedule_interview | mark_disqualified
  next_action_date: string       — ISO 8601 date for next action
  profile_signals: object        — Updated driver preferences discovered in call: { preferred_equipment, preferred_lanes, home_time_need }
  ```
- **Backend Service:** callOutcomeService.jsw → logCallOutcome()
- **Airtable Collection(s):** callOutcomes → v2_Call Outcomes; driverProfiles → v2_Driver Profiles
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw (profile signal propagation)

---

### get_call_analytics

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns call outcome analytics for a recruiter over a period: contact rate, voicemail rate, average call duration, calls-to-interview conversion, and top-performing call time windows (day of week and hour of day).
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Scope to a carrier (optional)
  date_from: string              — ISO 8601 date (default: 30 days ago)
  date_to: string                — ISO 8601 date (default: today)
  ```
- **Backend Service:** callOutcomeService.jsw → getCallAnalytics()
- **Airtable Collection(s):** callOutcomes → v2_Call Outcomes
- **Approval Required:** No
- **Dependencies:** None

---

## Group 5: Recruiter Retention (~8 tools)

**Source Track:** retention_dashboard
**Backend Services:** retentionService.jsw, recruiterPipelineService.jsw

---

### get_driver_risk_score

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the current turnover risk score (0–100) and risk tier (LOW / MEDIUM / HIGH / CRITICAL) for a specific driver, along with the primary contributing risk factors and their weights.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  carrier_dot: string            — Carrier context for the risk assessment (required)
  recalculate: boolean           — Force a fresh risk calculation (default: false; uses cached if < 24h old)
  ```
- **Backend Service:** retentionService.jsw → calculateRiskScore()
- **Airtable Collection(s):** retentionRiskLogs → v2_Retention Risk Logs; driverPerformance → v2_Driver Performance
- **Approval Required:** No
- **Dependencies:** None

---

### get_at_risk_drivers

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns a paginated list of drivers at a carrier who meet the specified risk threshold, sorted by risk score descending. Each record includes the primary risk factor, trend direction (improving/worsening), and days since last recruiter contact.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  min_risk_tier: string          — medium | high | critical (default: high)
  sort_by: string                — risk_score | last_contact | tenure (default: risk_score)
  page: number                   — 1-based page (default: 1)
  page_size: number              — Records per page (default: 25, max: 100)
  ```
- **Backend Service:** retentionService.jsw → getCarrierRetentionDashboard()
- **Airtable Collection(s):** retentionRiskLogs → v2_Retention Risk Logs; driverProfiles → v2_Driver Profiles
- **Approval Required:** No
- **Dependencies:** None

---

### get_risk_factors

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the detailed breakdown of all risk factors contributing to a driver's current risk score: performance metrics (miles, on-time rate, safety incidents, home time), engagement signals (last login, last message, app activity), and tenure signal.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  include_trend: boolean         — Include 90-day trend for each factor (default: true)
  ```
- **Backend Service:** retentionService.jsw → getDriverRetentionProfile()
- **Airtable Collection(s):** retentionRiskLogs → v2_Retention Risk Logs; driverPerformance → v2_Driver Performance
- **Approval Required:** No
- **Dependencies:** None

---

### add_to_watchlist

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Adds a driver to the recruiter's active retention watchlist. Watchlisted drivers surface in the daily work queue and trigger escalation alerts if risk score increases. A note can be attached explaining the reason for watchlisting.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier context (required)
  reason: string                 — Reason for watchlisting: at_risk | flight_risk | performance_decline | life_event | voluntary_monitor (required)
  notes: string                  — Freeform notes (optional)
  alert_threshold: string        — Trigger alert if score exceeds: medium | high | critical (default: high)
  ```
- **Backend Service:** retentionService.jsw → addToWatchlist()
- **Airtable Collection(s):** retentionWatchlist → v2_Retention Watchlist
- **Approval Required:** No
- **Dependencies:** None

---

### get_watchlist

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns all drivers currently on the recruiter's watchlist with their current risk score, reason for watchlisting, days on watchlist, last intervention, and trend since added.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Filter by carrier (optional)
  sort_by: string                — risk_score | days_on_watchlist | last_intervention (default: risk_score)
  include_resolved: boolean      — Include drivers who were removed from watchlist (default: false)
  ```
- **Backend Service:** retentionService.jsw → getWatchlist()
- **Airtable Collection(s):** retentionWatchlist → v2_Retention Watchlist; retentionRiskLogs → v2_Retention Risk Logs
- **Approval Required:** No
- **Dependencies:** None

---

### create_retention_intervention

- **Role:** recruiter
- **Risk Level:** execute_low
- **Description:** Creates and optionally dispatches a targeted retention intervention for a watchlisted or at-risk driver. Selects the appropriate channel (SMS, phone prompt, or email) based on the driver's engagement history and current risk type.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  intervention_type: string      — check_in | pay_discussion | schedule_adjustment | safety_support | life_event_support | appreciation_outreach (required)
  channel: string                — sms | email | phone_prompt | auto_select (default: auto_select)
  template_id: string            — Intervention template record ID (optional)
  custom_message: string         — Override template message body (optional)
  auto_dispatch: boolean         — Send immediately (default: false; prompts confirmation)
  ```
- **Backend Service:** retentionService.jsw → createRetentionIntervention()
- **Airtable Collection(s):** interventions → v2_Interventions; retentionWatchlist → v2_Retention Watchlist
- **Approval Required:** No (Yes if auto_dispatch is true)
- **Dependencies:** smsService.jsw, emailService.jsw, voiceCampaignService.jsw

---

### get_intervention_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the status and outcome of a previously created retention intervention: dispatched, opened, replied, resolved, or no-response. Includes any driver reply text and whether the intervention improved the driver's risk score on next calculation.
- **Parameters:**
  ```
  intervention_id: string        — Interventions record ID (required)
  ```
- **Backend Service:** retentionService.jsw → getInterventionStatus()
- **Airtable Collection(s):** interventions → v2_Interventions
- **Approval Required:** No
- **Dependencies:** None

---

### get_retention_metrics

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns fleet-wide retention metrics for a carrier over a time period: 30/60/90-day retention rate, average tenure, voluntary turnover rate, involuntary turnover rate, and intervention success rate (interventions that prevented departure).
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  date_from: string              — ISO 8601 date (default: 90 days ago)
  date_to: string                — ISO 8601 date (default: today)
  benchmark_comparison: boolean  — Compare against CDL industry benchmarks (default: true)
  ```
- **Backend Service:** retentionService.jsw → getRetentionMetrics()
- **Airtable Collection(s):** retentionRiskLogs → v2_Retention Risk Logs; hiringOutcomes → v2_Hiring Outcomes; driverPerformance → v2_Driver Performance
- **Approval Required:** No
- **Dependencies:** None

---

## Group 6: Reverse Matching (~8 tools)

**Source Track:** reverse_matching_20251225
**Backend Services:** driverMatching.jsw, recruiterMatchService.jsw, stripeService.jsw

---

### search_drivers

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Performs a reverse-matching search of the LMDR driver pool using carrier hiring criteria. Returns a ranked, paginated list of matching drivers with anonymized profiles (name and contact withheld until subscription entitles unlock). Requires an active VelocityMatch subscription.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  cdl_class: string[]            — A | B | A_or_B (default: A)
  endorsements: string[]         — Required endorsements: hazmat | tanker | doubles_triples | passenger | school_bus | none
  experience_years_min: number   — Minimum verified years of CDL experience (default: 0)
  equipment_types: string[]      — dry_van | flatbed | refrigerated | tanker | step_deck | lowboy | auto_hauler
  freight_types: string[]        — general | hazmat | oversized | produce | chemicals | automotive
  home_state: string[]           — Preferred home states (2-letter codes)
  radius_miles: number           — Radius from carrier terminal ZIP (optional)
  center_zip: string             — Required if radius_miles is set
  availability: string           — immediate | within_30_days | within_60_days | any (default: any)
  home_time: string              — local | regional | otr | any (default: any)
  sort_by: string                — match_score | experience | availability (default: match_score)
  page: number                   — 1-based page (default: 1)
  page_size: number              — Results per page (default: 20, max: 50)
  ```
- **Backend Service:** driverMatching.jsw → searchDriversForRecruiter()
- **Airtable Collection(s):** driverProfiles → v2_Driver Profiles; recruiterSearchLogs → v2_Recruiter Search Logs
- **Approval Required:** No
- **Dependencies:** recruiterMatchService.jsw (subscription entitlement check)

---

### get_driver_profile_for_recruiter

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the full driver profile for a specific driver, gated by subscription tier. Free tier returns anonymized profile. Pro/Enterprise tiers return full contact details, MVR consent status, employment history summary, and endorsement verification status.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier context (required)
  include_contact: boolean       — Include contact details (requires Pro/Enterprise; default: true)
  ```
- **Backend Service:** recruiterMatchService.jsw → getDriverProfileForRecruiter()
- **Airtable Collection(s):** driverProfiles → v2_Driver Profiles; recruiterMatchService → v2_Recruiter Match Unlocks
- **Approval Required:** No
- **Dependencies:** stripeService.jsw (entitlement check)

---

### get_match_score

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the computed match score (0–100) between a specific driver and a carrier's hiring criteria. Scores compatibility across CDL class, endorsements, experience, equipment, lane, home time, and pay expectations.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  job_posting_id: string         — Score against a specific job posting instead of general carrier criteria (optional)
  ```
- **Backend Service:** recruiterMatchService.jsw → getMatchScore()
- **Airtable Collection(s):** driverProfiles → v2_Driver Profiles; carrierProfiles → v2_Carrier Profiles; jobPostings → v2_Job Postings
- **Approval Required:** No
- **Dependencies:** driverMatching.jsw (scoring engine)

---

### get_score_breakdown

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the detailed dimension-by-dimension breakdown of a driver-carrier match score: what percentage each dimension contributes, which are green (strong match), yellow (partial), or red (mismatch), and a plain-language summary of the strongest and weakest fit factors.
- **Parameters:**
  ```
  driver_id: string              — Driver Profiles record ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  job_posting_id: string         — Scope to a specific job posting (optional)
  ```
- **Backend Service:** recruiterMatchService.jsw → getScoreBreakdown()
- **Airtable Collection(s):** driverProfiles → v2_Driver Profiles; carrierProfiles → v2_Carrier Profiles
- **Approval Required:** No
- **Dependencies:** matchExplanationService.jsw (plain-language rationale generation)

---

### compare_candidates

- **Role:** recruiter
- **Risk Level:** suggest
- **Description:** Side-by-side comparison of 2–5 candidate drivers against the same carrier or job posting. Returns a comparison table of key dimensions, a ranked recommendation with a rationale statement for each candidate, and the single strongest recommendation.
- **Parameters:**
  ```
  driver_ids: string[]           — Driver Profiles record IDs to compare (2–5 required)
  carrier_dot: string            — Carrier DOT number (required)
  job_posting_id: string         — Compare against a specific job posting (optional)
  dimensions: string[]           — Dimensions to include in comparison; empty = all: cdl_class | endorsements | experience | equipment | lane | home_time | pay_expectation | availability
  ```
- **Backend Service:** recruiterMatchService.jsw → compareCandidates()
- **Airtable Collection(s):** driverProfiles → v2_Driver Profiles; carrierProfiles → v2_Carrier Profiles
- **Approval Required:** No
- **Dependencies:** matchExplanationService.jsw

---

### create_subscription

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Initiates a new VelocityMatch recruiter subscription for a carrier. Creates a Stripe checkout session for the selected plan tier, returns the session URL for the recruiter to complete payment, and on success activates the subscription and grants platform access.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  plan_tier: string              — pro | enterprise (required)
  billing_cycle: string          — monthly | annual (default: monthly)
  promo_code: string             — Discount/promo code (optional)
  trial_days: number             — Override trial period in days; 0 = no trial (default: platform default)
  success_url: string            — Redirect URL after successful payment
  cancel_url: string             — Redirect URL if payment is cancelled
  ```
- **Backend Service:** stripeService.jsw → createSubscriptionCheckout()
- **Airtable Collection(s):** carrierSubscriptions → v2_Carrier Subscriptions; recruiterMatchUnlocks → v2_Recruiter Match Unlocks
- **Approval Required:** Yes (initiates billing)
- **Dependencies:** Stripe API

---

### get_subscription_status

- **Role:** recruiter
- **Risk Level:** read
- **Description:** Returns the current VelocityMatch subscription status for a recruiter or carrier: active/inactive, plan tier, billing cycle, next renewal date, contacts unlocked this period, contacts remaining, and any payment issues.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  ```
- **Backend Service:** stripeService.jsw → getSubscriptionStatus()
- **Airtable Collection(s):** carrierSubscriptions → v2_Carrier Subscriptions
- **Approval Required:** No
- **Dependencies:** Stripe API (live status check)

---

### process_payment

- **Role:** recruiter
- **Risk Level:** execute_high
- **Description:** Processes a one-time payment or upgrades/downgrades an existing subscription tier. Handles plan change proration, applies promo codes, and returns the updated subscription record. For tier upgrades that grant immediate additional unlocks, activates them on success.
- **Parameters:**
  ```
  recruiter_id: string           — Wix member ID (required)
  carrier_dot: string            — Carrier DOT number (required)
  payment_action: string         — upgrade | downgrade | add_seats | pay_invoice | cancel (required)
  new_plan_tier: string          — pro | enterprise — required for upgrade/downgrade
  promo_code: string             — Discount code (optional)
  seat_count: number             — For add_seats action: number of additional recruiter seats
  reason: string                 — Reason for downgrade or cancellation (required for downgrade/cancel)
  ```
- **Backend Service:** stripeService.jsw → processSubscriptionChange()
- **Airtable Collection(s):** carrierSubscriptions → v2_Carrier Subscriptions; recruiterMatchUnlocks → v2_Recruiter Match Unlocks
- **Approval Required:** Yes (modifies billing; always requires confirmation)
- **Dependencies:** Stripe API

---

## Airtable Collection Reference (Recruiter Scope)

| Config Key | Airtable Table | Owning Service |
|---|---|---|
| `outreachCampaigns` | `v2_Outreach Campaigns` | outreachService.jsw |
| `smsDeliveryLogs` | `v2_SMS Delivery Logs` | smsService.jsw |
| `emailDeliveryLogs` | `v2_Email Delivery Logs` | emailService.jsw |
| `emailTemplates` | `v2_Email Templates` | emailService.jsw |
| `jobPostings` | `v2_Job Postings` | jobBoardService.jsw |
| `jobBoardSyndications` | `v2_Job Board Syndications` | jobBoardService.jsw |
| `socialPosts` | `v2_Social Posts` | socialService.jsw |
| `outreachAnalytics` | `v2_Outreach Analytics` | outreachService.jsw |
| `sourceAttribution` | `v2_Source Attribution` | recruiterAnalyticsService.jsw |
| `recruitingSpend` | `v2_Recruiting Spend` | recruiterAnalyticsService.jsw |
| `funnelEvents` | `v2_Funnel Events` | recruiterAnalyticsService.jsw |
| `hiringOutcomes` | `v2_Hiring Outcomes` | recruiterAnalyticsService.jsw |
| `hiringForecasts` | `v2_Hiring Forecasts` | forecastingService.jsw |
| `competitorIntel` | `v2_Competitor Intel` | competitorIntelService.jsw |
| `onboardingWorkflows` | `v2_Onboarding Workflows` | onboardingWorkflowService.jsw |
| `onboardingSteps` | `v2_Onboarding Steps` | onboardingWorkflowService.jsw |
| `onboardingDocuments` | `v2_Onboarding Documents` | documentCollectionService.jsw |
| `backgroundChecks` | `v2_Background Checks` | backgroundCheckService.jsw |
| `drugTests` | `v2_Drug Tests` | drugTestService.jsw |
| `eSignatureEnvelopes` | `v2_ESignature Envelopes` | eSignatureService.jsw |
| `orientationSessions` | `v2_Orientation Sessions` | orientationService.jsw |
| `savedSearches` | `v2_Saved Searches` | savedSearchService.jsw |
| `pipelineRules` | `v2_Pipeline Rules` | pipelineAutomationService.jsw |
| `interventions` | `v2_Interventions` | recruiterPipelineService.jsw |
| `interventionTemplates` | `v2_Intervention Templates` | recruiterPipelineService.jsw |
| `callOutcomes` | `v2_Call Outcomes` | callOutcomeService.jsw |
| `retentionRiskLogs` | `v2_Retention Risk Logs` | retentionService.jsw |
| `retentionWatchlist` | `v2_Retention Watchlist` | retentionService.jsw |
| `driverPerformance` | `v2_Driver Performance` | retentionService.jsw |
| `recruiterSearchLogs` | `v2_Recruiter Search Logs` | recruiterMatchService.jsw |
| `recruiterMatchUnlocks` | `v2_Recruiter Match Unlocks` | recruiterMatchService.jsw |
| `carrierSubscriptions` | `v2_Carrier Subscriptions` | stripeService.jsw |

---

## Backend Service Summary (Recruiter Scope)

| Service File | Purpose | New vs. Existing |
|---|---|---|
| `outreachService.jsw` | Campaign lifecycle, audience resolution, analytics | Existing (recruiter_outreach_20260120) |
| `smsService.jsw` | Twilio SMS dispatch and delivery logging | Existing |
| `emailService.jsw` | SendGrid email dispatch, templates | Existing |
| `jobBoardService.jsw` | Job board syndication APIs | Existing (recruiter_outreach_20260120) |
| `socialService.jsw` | Facebook/LinkedIn posting | Existing (recruiter_outreach_20260120) |
| `recruiterAnalyticsService.jsw` | Source attribution, CPH, funnel, bottleneck | Existing (recruiter_analytics_20260120) |
| `forecastingService.jsw` | Hiring and attrition forecasting | Existing (recruiter_analytics_20260120) |
| `competitorIntelService.jsw` | Competitor tracking and intelligence | Existing (recruiter_analytics_20260120) |
| `onboardingWorkflowService.jsw` | Onboarding workflow orchestration | Existing (recruiter_onboarding_automation_20260120) |
| `documentCollectionService.jsw` | Document requests, verification | Existing (recruiter_onboarding_automation_20260120) |
| `backgroundCheckService.jsw` | HireRight/Checkr/Tenstreet BGC orders | Existing (recruiter_onboarding_automation_20260120) |
| `drugTestService.jsw` | Quest/LabCorp drug test scheduling | Existing (recruiter_onboarding_automation_20260120) |
| `eSignatureService.jsw` | DocuSign/HelloSign envelope management | Existing (recruiter_onboarding_automation_20260120) |
| `orientationService.jsw` | Orientation session booking | Existing (recruiter_onboarding_automation_20260120) |
| `savedSearchService.jsw` | Saved search persistence and alerts | Existing (recruiter_utility_expansion_20260120) |
| `pipelineAutomationService.jsw` | Pipeline automation rules engine | Existing (recruiter_utility_expansion_20260120) |
| `recruiterPipelineService.jsw` | Interventions, pipeline utilities | Existing (recruiter_utility_expansion_20260120) |
| `callOutcomeService.jsw` | Call logging and analytics | Existing (recruiter_utility_expansion_20260120) |
| `retentionService.jsw` | Risk scoring, watchlist, interventions, metrics | Existing (retention_dashboard) |
| `driverMatching.jsw` | Driver pool search and scoring | Existing (reverse_matching_20251225) |
| `recruiterMatchService.jsw` | Profile unlock gating, candidate comparison | Existing (reverse_matching_20251225) |
| `matchExplanationService.jsw` | Plain-language match rationale | Existing (2026-02-01 new services) |
| `stripeService.jsw` | Subscription checkout, plan changes | Existing (stripe_subscriptions_20260104) |

---

## Tool Count Summary

| Group | Tool Count |
|---|---|
| Recruiter Outreach | 14 |
| Recruiter Analytics | 13 |
| Recruiter Onboarding Automation | 12 |
| Recruiter Pipeline | 10 |
| Recruiter Retention | 8 |
| Reverse Matching | 8 |
| **Total** | **65** |
