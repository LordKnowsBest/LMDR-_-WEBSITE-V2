# Track Plan: B2B Business Development Suite - Carrier Acquisition

> **Dependencies**: `reverse_matching_20251225` (match intelligence), `carrier_conversion_20260103` (carrier onboarding), `recruiter_outreach_20260120` (multi-channel outreach patterns).

---

## Phase 1: Match Intelligence and Prospecting Signals

Build the data layer that turns driver match insights into carrier sales opportunities.

### 1.1 Data Model Setup
- [ ] Task: Create `B2BAccounts` collection for carrier targets
- [ ] Task: Create `B2BContacts` collection for decision makers
- [ ] Task: Create `B2BMatchSignals` collection to store match opportunity signals
- [ ] Task: Create `B2BLeadSources` collection for lead origin tracking
- [ ] Task: Create indexes for carrier DOT, region, status, and signal score

### 1.2 Match Signal Generation
- [ ] Task: Implement `matchSignalService.jsw`
- [ ] Task: Calculate high match counts by region, equipment, and job type
- [ ] Task: Store signal snapshots with timestamps for trend analysis
- [ ] Task: Add confidence and urgency scoring rules
- [ ] Task: Create API to fetch top opportunities for business development dashboard

### 1.3 Prospecting Lists
- [ ] Task: Build saved prospect lists with filters (region, match count, fleet size)
- [ ] Task: Add list export for field use
- [ ] Task: Add notes and tags to accounts for segmentation

---

## Phase 2: Multi-Channel Outreach Toolkit (Email, SMS, Voice)

Enable business development professionals to reach carriers via automated and manual channels.

### 2.1 Email and SMS Sequences
- [ ] Task: Create `B2BSequences` and `B2BSequenceSteps` collections
- [ ] Task: Implement `b2bSequenceService.jsw` with scheduling and throttling
- [ ] Task: Add templated sequences with variable injection (carrier name, match count)
- [ ] Task: Integrate opt-out tracking and suppression lists

### 2.2 Voice Agent Enablement
- [ ] Task: Create `B2BCallCampaigns` and `B2BCalls` collections
- [ ] Task: Implement `b2bVoiceService.jsw` to enqueue outbound calls
- [ ] Task: Add call outcome logging, disposition codes, and call notes
- [ ] Task: Store call recordings and transcripts (if enabled)

### 2.3 Unified Activity Timeline
- [ ] Task: Create `B2BActivities` collection (email, sms, call, meeting, task)
- [ ] Task: Implement `b2bActivityService.jsw` to read/write activity feed
- [ ] Task: Add activity sync from sequence steps and call campaigns

---

## Phase 3: Lead Capture and Mobile Capabilities

Provide field-ready tools for event capture and mobile outreach.

### 3.1 Lead Capture Forms
- [ ] Task: Create `B2BLeadCaptureEvents` collection
- [ ] Task: Build a lightweight lead capture form for events
- [ ] Task: Add QR code and short link entry points
- [ ] Task: Support quick account creation from business cards

### 3.2 Mobile Workflow
- [ ] Task: Create mobile-first B2B dashboard view
- [ ] Task: Add tap-to-call and tap-to-text actions
- [ ] Task: Add offline note capture with sync on reconnect

---

## Phase 4: Sales Pipeline and Playbooks

Enable full sales workflow with stages, tasks, and value proposition assets.

### 4.1 Pipeline and Opportunity Management
- [ ] Task: Create `B2BOpportunities` collection with stages
- [ ] Task: Implement `b2bPipelineService.jsw` for CRUD and stage transitions
- [ ] Task: Add SLA timers and next-step reminders

### 4.2 Playbooks and Value Propositions
- [ ] Task: Create `B2BPlaybooks` and `B2BValueProps` collections
- [ ] Task: Add messaging templates tied to match signals
- [ ] Task: Build playbook suggestions based on carrier segment

### 4.3 Pipeline Views and Deal Flow
- [ ] Task: Build B2B pipeline Kanban with stage counts and conversion rates
- [ ] Task: Add weighted pipeline and forecast view (stage-based probability)
- [ ] Task: Add opportunity detail view with next-step checklist and deal risks

### 4.4 Pipeline Automation
- [ ] Task: Create `B2BAutomationRules` collection for stage-triggered actions
- [ ] Task: Implement `b2bAutomationService.jsw` for triggers and actions
- [ ] Task: Support auto-task creation, notifications, and follow-up sequences

---

## Phase 5: Reporting, ROI, and Opportunity Alerts

Provide visibility into conversion, outreach effectiveness, and match-driven wins.

### 5.1 Analytics Dashboard
- [ ] Task: Create `b2bAnalyticsService.jsw` for KPIs
- [ ] Task: Track conversion rate by segment and source
- [ ] Task: Track response rate by channel and sequence
- [ ] Task: Track revenue impact from matched carriers
- [ ] Task: Track pipeline coverage, win rate, cycle length, and velocity
- [ ] Task: Add stage-to-stage conversion funnel view
- [ ] Task: Add forecast accuracy reporting
- [ ] Task: Implement lead source attribution (first/last touch) for B2B accounts
- [ ] Task: Add spend import and cost-per-acquisition reporting
- [ ] Task: Add competitor intel tracking and alerts

### 5.2 Opportunity Alerts
- [ ] Task: Add alerts when match counts spike in a carrier's region
- [ ] Task: Add alerts when non-client carriers have high match potential
- [ ] Task: Add weekly digest for top opportunities

### 5.3 Campaign and Sequence Reporting
- [ ] Task: Add campaign-level performance dashboards (email, sms, voice)
- [ ] Task: Add rep-level activity vs. outcomes view
- [ ] Task: Add cohort analysis by lead source and time period

---

## Phase 6: Security, Compliance, and Admin Controls

Protect carrier data and ensure outreach compliance.

### 6.1 Access Controls
- [ ] Task: Define B2B professional role permissions
- [ ] Task: Add record-level access control for accounts and contacts

### 6.2 Compliance
- [ ] Task: Implement consent tracking for SMS and call recording
- [ ] Task: Add configurable quiet hours and throttling
- [ ] Task: Add unsubscribe and do-not-contact enforcement

### 6.3 Admin Configuration
- [ ] Task: Add admin UI to configure templates, throttles, and sequences
- [ ] Task: Add audit logs for outreach actions

---

## Phase 7: Research Agent and Account Intelligence

Automate company research and surface sales-ready insights.

### 7.1 Research Agent Service
- [ ] Task: Create `b2bResearchAgentService.jsw` for account research tasks
- [ ] Task: Add configurable research briefs (ICP fit, fleet size, locations, hiring signals)
- [ ] Task: Store research outputs in `B2BAccountResearch` collection with sources

### 7.2 Account Intelligence Panel
- [ ] Task: Add \"research brief\" panel to account detail view
- [ ] Task: Highlight recent signals and suggested next steps
- [ ] Task: Add one-click \"generate brief\" action with caching
