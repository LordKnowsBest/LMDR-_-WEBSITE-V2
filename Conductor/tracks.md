# Project Tracks

This file tracks all major tracks for the project. Each track has its own detailed plan in its respective folder.

---

## [x] Track: End-to-End Profile Persistence for AI Matching
*Link: [./conductor/tracks/persistence_20251220/](./conductor/tracks/persistence_20251220/)*

## [x] Track: Driver Cockpit & Application Journey
*Link: [./conductor/tracks/driver_cockpit_20251221/](./conductor/tracks/driver_cockpit_20251221/)*
*Depends on: persistence_20251220*

## [x] Track: LMDR Admin Portal
*Link: [./conductor/tracks/admin_portal_20251224/](./conductor/tracks/admin_portal_20251224/)*
*Depends on: persistence_20251220, driver_cockpit_20251221*
*Priority: High*
*Status: Implemented (Backend & Frontend)*

## [x] Track: Reverse Matching Engine (Carrier → Driver)
*Link: [./conductor/tracks/reverse_matching_20251225/](./conductor/tracks/reverse_matching_20251225/)*
*Depends on: persistence_20251220, driver_cockpit_20251221*
*Priority: Critical*
*Business Impact: Primary Revenue Driver*
*TDD Required: Yes*
*Status: Core Complete (Phases 1-6, 8-10 Implemented)*
*Completed:*
- *driverMatching.jsw (890 LOC - search, profile view, mutual match detection)*
- *driverScoring.js (892 LOC - 6-dimension scoring: qualifications, experience, location, availability, salary, engagement)*
- *carrierPreferences.jsw (648 LOC - CRUD + weight management)*
- *driverOutreach.jsw (423 LOC - pipeline saves, messaging, outreach history)*
- *recruiter_service.jsw (900+ LOC - agency model, pipeline, candidate management)*
- *subscriptionService.jsw (tier enforcement, quota tracking, billing period resets)*
- *RECRUITER_DRIVER_SEARCH.html (1,923 LOC - filters, results, profile modal, quota UI)*
- *Recruiter Console page code (928 LOC, 93 registered messages)*
- *All collections routed to Airtable (CarrierHiringPreferences, CarrierDriverViews, DriverCarrierInterests, DriverInterests, RecruiterCarriers)*
- *Stripe billing extracted to dedicated track (stripe_subscriptions_20260104 - complete)*
- *Gamification integration (recruiter points for view_profile)*
- *Feature adoption tracking integrated*
- *matchNotifications.jsw (Phase 10 - driver profile-viewed/contacted alerts, Enterprise carrier match digests, daily scan job, Twilio SMS with graceful degradation, 40 tests)*
*Remaining (post-launch): Phase 7 integration tests, Phase 11 analytics, Phase 12 documentation*

## [x] Track: QA Convergence & System Verification
*Link: [./conductor/tracks/qa_convergence_20260102/](./conductor/tracks/qa_convergence_20260102/)*
*Priority: Immediate*
*Goal: Systematic verification of implemented backend services.*

## [x] Track: Stripe Subscription Billing Infrastructure
*Link: [./conductor/tracks/stripe_subscriptions_20260104/](./conductor/tracks/stripe_subscriptions_20260104/)*
*Depends on: reverse_matching_20251225*
*Priority: Critical*
*Business Impact: Revenue Infrastructure - Enables carrier subscription monetization*
*TDD Required: Yes*
*Status: Implemented (stripeService.jsw & Frontend Pages)*
*Note: Replaces Phase 9 of reverse_matching track with dedicated billing infrastructure*

## [x] Track: Carrier Conversion Flow Optimization
*Link: [./conductor/tracks/carrier_conversion_20260103/](./conductor/tracks/carrier_conversion_20260103/)*
*Priority: High*
*Status: Implemented (Carrier Leads Service & Forms)*
*Goal: Monetize carrier leads via upfront deposits.*

## [x] Track: Observability Gaps
*Link: [./conductor/tracks/observability_gaps_20260112/](./conductor/tracks/observability_gaps_20260112/)*
*Priority: High*
*Status: Implemented (observabilityService.jsw)*
*Goal: Fix tracing and error handling gaps in matching engine.*

## [x] Track: Feature Adoption Log
*Link: [./conductor/tracks/feature_adoption_log_20260120/](./conductor/tracks/feature_adoption_log_20260120/)*
*Priority: High*
*Goal: Visualize feature adoption and lifecycle to enable rapid shipping/disposal decisions.*
*Status: Complete*
*Completed:*
- *featureAdoptionService.jsw (2,848 lines - 14/14 functions: logging, stats, funnels, health scores, at-risk detection, daily aggregation)*
- *feature-tracker.js (986 lines - 30+ methods: view/click/complete/error/abandon tracking, timers, sessions, auto-instrumentation)*
- *ADMIN_DASHBOARD.html integration (feature adoption section with charts, health grid, at-risk alerts)*
- *ADMIN_FEATURE_ADOPTION.html (standalone drill-down dashboard with registry, funnels, at-risk, health grid)*
- *config.jsw + airtableClient.jsw (4 collections routed to Airtable with full field mappings)*
- *jobs.config (daily aggregation scheduled at 1 AM UTC)*
- *Live integration: Road Utilities page tracking parking, fuel, weigh station features*
- *Page instrumentation: Driver Dashboard, Recruiter Dashboard, AI Matching (feature-tracker.js + PostMessage bridge)*
- *Test suite: featureAdoptionService.test.js (111/111 tests passing)*
- *Airtable tables verified: v2_Feature Adoption Logs, v2_Feature Registry, v2_Feature Funnels, v2_Feature Metrics Daily*

## [/] Track: UI/UX Consistency & Standardization
*Link: [./conductor/tracks/ui_standardization_20260120/](./conductor/tracks/ui_standardization_20260120/)*
*Priority: High*
*Goal: Unify Tailwind configs, icons, buttons, and theme logic across the platform.*
*Status: In Progress — approach pivoted to inline Tailwind config (external lmdr-config.js fails in Wix iframes)*
*Progress (audited 2026-01-31):*
- *Phase 1 (Tailwind Unification): Complete — lmdr-config.js + theme-utils.js created as reference; inline config is the runtime pattern*
- *Phase 2 (Dashboards): Partial — 10/10 recruiter files tokenized, only 2/11 admin files tokenized*
- *Phase 3 (Landing Pages): 13/18 files tokenized (5 landing pages untouched)*
- *Phase 4 (Carrier Pages): 7 files partially tokenized, 2 retain only hardcoded classes*
- *Phase 5 (Component Refactoring): Not verified*
- *Hardcoded class cleanup: 34 files still contain 341 occurrences of old color classes alongside LMDR tokens*

## [ ] Track: Systematic HTML Mobile Optimization
*Link: [./conductor/tracks/mobile_optimization_20260122/](./conductor/tracks/mobile_optimization_20260122/)*
*Priority: High*
*Goal: Systematic review and optimization of all HTML files for mobile responsiveness (iPhone 12/13 target).*
*Status: Planning Complete, In Progress (10 of 56+ files modified)*
*Standard: docs/MOBILE_OPTIMIZATION_GUIDE.md*
*Phases: 5 (Pilot Landing Pages → Driver Portal → Recruiter Portal → Carrier & Admin → Verification)*

## [x] Track: Gamification System - Driver & Recruiter Progression
*Link: [./tracks/gamification_strategy_20260123/](./tracks/gamification_strategy_20260123/)*
*Depends on: driver_cockpit_20251221, reverse_matching_20251225, feature_adoption_log_20260120*
*Priority: High*
*Status: Complete (All 7 Phases + Post-Launch Tasks)*
*Goal: Comprehensive dual-sided gamification with XP/levels for drivers ("Road to Success") and points/ranks for recruiters ("Talent Hunter"). Includes achievements, badges, streaks, challenges, leaderboards, and seasonal events.*
*Business Impact: Engagement & Retention - Target +35% DAU, +20% 30-day retention, +40% profile completion.*
*Phases: 7 (Foundation → Streaks → Achievements → Badges/Leaderboards → Challenges → UI → Integration)*
*Completed Services:*
- *gamificationService.jsw, streakService.jsw, achievementService.jsw, badgeService.jsw*
- *challengeService.jsw, leaderboardService.jsw, seasonalEventService.jsw*
- *referralService.jsw, gamificationAnalyticsService.jsw, gamificationCache.js*
*Completed UI: DRIVER_GAMIFICATION.html, DRIVER_BADGES.html, RECRUITER_GAMIFICATION.html, RECRUITER_LEADERBOARD.html, CHALLENGES.html*
*Admin: ADMIN_GAMIFICATION_ANALYTICS.html (economy health, abuse detection)*
*Documentation: CLAUDE.md, GEMINI.md, GAMIFICATION_HELP.html*

## [ ] Track: External API Platform - Partner Data Services
*Link: [./tracks/external_api_platform_20260123/](./tracks/external_api_platform_20260123/)*
*Depends on: fmcsaService, aiEnrichment, parkingService, fuelService, driverMatching, ocrService, gamification_strategy_20260123*
*Priority: Critical*
*Status: In Progress*
*Goal: Monetize platform capabilities via B2B REST APIs - Safety & Compliance, Intelligence, Operational, Matching, Document, and Engagement (gamification white-label) APIs for external partners.*
*Business Impact: Revenue Diversification - Target $300K ARR Year 1, 25 API partners, 1M+ monthly API calls.*
*Phases: 8 (Gateway Infrastructure → Safety APIs → Intelligence APIs → Operational APIs → Matching APIs → Document APIs → Engagement APIs → Developer Portal)*
*Pricing: Starter $99/mo, Growth $499/mo, Enterprise $999/mo + usage-based add-ons*

---

# Infrastructure Tracks (Q1 2026)

> Critical infrastructure improvements for scalability and long-term platform health.

## [X] Track: Airtable Migration - Scalable Data Architecture
*Link: [./tracks/airtable_migration_20260121/](./tracks/airtable_migration_20260121/)*
*Depends on: persistence_20251220*
*Priority: High*
*Status: Complete (Grade: A — 95%)*
*Goal: Migrate Wix Collections to Airtable for improved scalability, visual data management, and better API tooling while maintaining Wix frontend and authentication.*
*Business Impact: Infrastructure Improvement - Scalable data architecture established before production volume.*
*Outcome: 70/72 collections routed to Airtable (2 in Wix by design). All backend services refactored to dual-source pattern. 2,218-line airtableClient.jsw with rate limiting, bulk ops, field mappings. 72 Airtable schema docs. 14 gamification tables as Airtable-only (no Wix fallback).*
*Remaining: Formal regression test report, performance benchmark documentation, post-migration Wix fallback code cleanup.*

---

# Utility Expansion Tracks (Q1 2026)

> Expand utility of existing features to maximize platform value before building new capabilities.

## [/] Track: Driver Utility Expansion
*Link: [./conductor/tracks/driver_utility_expansion_20260120/](./conductor/tracks/driver_utility_expansion_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: High*
*Status: Phases 1-4 Implemented — Phase 5 Mobile QA Pending*
*Goal: Increase driver engagement through Profile Strength Meter, Quick Response Templates, Reverse Alerts, and Insights Panel.*
*Completed:*
- *PostMessage bridge fix (payload→data key mismatch) — entire dashboard was non-functional*
- *Restored missing utility functions: stripHtml, goToProfile, goToMatching, promptWithdraw, closeWithdrawModal, confirmWithdraw, useQuickReply*
- *Wired viewsData + insightsData outbound messages from page code*
- *Added setDiscoverability + navigateToMyCareer inbound handlers in page code*
- *Fixed undefined variable bug (result.error → appResult.error)*

## [x] Track: Recruiter Utility Expansion
*Link: [./tracks/recruiter_utility_expansion_20260120/](./tracks/recruiter_utility_expansion_20260120/)*
*Depends on: reverse_matching_20251225, stripe_subscriptions_20260104*
*Priority: High*
*Status: Complete*
*Goal: Improve recruiter efficiency through Saved Searches with Alerts, Call Outcome Logging, Intervention Templates, and Pipeline Automation Triggers.*
*Completed Services:*
- *savedSearchService.jsw (Phase 1 - CRUD, search execution, alert processing every 15min)*
- *callOutcomeService.jsw (Phase 2 - outcome logging, analytics, feedback batch at 2:30 AM)*
- *interventionService.jsw (Phase 3 - template CRUD, variable substitution, 10 default templates, outcome tracking)*
- *pipelineAutomationService.jsw (Phase 4 - rule CRUD, event processing, stale detection hourly, 4 default rules)*
*Scoring Integration: driverScoring.js + driverMatching.jsw feedback weight adjustments (±20% cap)*
*Service Extensions: retentionService.jsw (intervention suggestions), emailService.jsw (intervention emails), recruiter_service.jsw (pipeline events), messaging.jsw (driver_message events)*
*Frontend: RECRUITER_DRIVER_SEARCH.html (saved search UI), Recruiter_Telemetry.html (call outcome UI), Recruiter_Retention_Dashboard.html (intervention UI), Recruiter_Pipeline_Page.html (automation UI)*
*Data: 8 new Airtable tables (v2_Saved Searches, v2_Saved Search Alerts, v2_Call Outcomes, v2_Call Feedback, v2_Intervention Templates, v2_Intervention Log, v2_Pipeline Automation Rules, v2_Automation Log)*
*Recruiter Console: 21 inbound + 21 outbound PostMessage types, 21 handler functions*
*Tests: 4 test suites (savedSearchService, callOutcomeService, interventionService, pipelineAutomationService)*

## [x] Track: Carrier Utility Expansion
*Link: [./tracks/carrier_utility_expansion_20260120/](./tracks/carrier_utility_expansion_20260120/)*
*Depends on: carrier_conversion_20260103*
*Priority: Medium*
*Status: Complete*
*Goal: Improve carrier onboarding and engagement through Preference Presets, Status Tracker, and Instant Match Preview.*
*Completed:*
- *carrierPreferences.jsw (PRESET_TEMPLATES, applyPresetTemplate, customization tracking)*
- *carrierStatusService.jsw (Onboarding status determination, real-time match count)*
- *carrierLeadsService.jsw (getMatchPreview backend with cdl/endorsement/experience filters)*
- *CARRIER_WEIGHT_PREFERENCES.html (Quick Start section, 5 presets, confirmation modal, customized badges)*
- *STATUS_TRACKER.html (Embedded in Carrier_Welcome.html with 5-step progress, AI enrichment tracker, match preview card)*
- *Carrier Lead Forms (Added Live Match Estimate section with debounced real-time updates to _TEMPLATE_Carrier_Staffing_Form.html and primary landing pages)*
- *Page Code Bridges (Updated CARRIER_WEIGHT_PREFERENCES.kvkff.js, Carrier Welcome.gnhma.js, Home.c1dmp.js, and Last Mile staffing page code)*

## [x] Track: Admin Utility Expansion
*Link: [./tracks/admin_utility_expansion_20260120/](./tracks/admin_utility_expansion_20260120/)*
*Depends on: admin_portal_20251224, observability_gaps_20260112*
*Priority: Medium*
*Status: Planned*
*Goal: Reduce operational costs and improve reliability through Cost Optimizer Mode, Anomaly Alerts, and Compliance Reports.*

## [/] Track: Cross-Role Utility
*Link: [./tracks/cross_role_utility_20260120/](./tracks/cross_role_utility_20260120/)*
*Depends on: driver_cockpit_20251221, reverse_matching_20251225, retention_dashboard*
*Priority: High*
*Status: In Progress — Phase 3 (Match Explanation) & Phase 4 (System Health) Complete*
*Goal: Cross-pollinate features between roles through Mutual Interest Indicator, Retention Dashboard for Carriers, Match Explanation for Drivers, and System Health for Recruiters.*
*Completed:*
- *matchExplanationService.jsw (Driver match "Why?" explanations)*
- *recruiterHealthService.jsw (System health monitoring for recruiters)*
- *UI: AI_MATCHING.html (Explanation Panel), RecruiterDashboard.html (System Health Widget)*

---

# New Feature Tracks - Platform Gaps (Q1-Q2 2026)

> Fill platform gaps to transform LMDR from job matching platform to full trucking industry operating system.

## Driver New Features

### [/] Track: Driver Road Utilities
*Link: [./tracks/driver_road_utilities_20260120/](./tracks/driver_road_utilities_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: Critical*
*Status: Integration Fixes Applied — Optimization & QA Pending*
*Goal: Daily-use tools for drivers on the road - Parking Finder, Fuel Optimizer, Weigh Station Status, Rest Stop Ratings, Weather Alerts, Road Conditions.*
*Business Impact: Transform platform to daily-use operating system.*
*Completed Services:*
- *parkingService.jsw (Phase 1 + TPIMS Phase 1.5 - 9 state APIs integrated)*
- *fuelService.jsw (Phase 2 - fuel card discounts, route optimization)*
- *weighStationService.jsw (Phase 3 - DriveWyze/PrePass integration)*
- *restStopService.jsw (Phase 4 - multi-category ratings, duplicate prevention)*
- *weatherAlertService.jsw (Phase 5 - NWS API, chain law detection)*
- *roadConditionService.jsw (Phase 6 - traffic, closures, truck restrictions, chain requirements)*
*Completed UI: DRIVER_ROAD_UTILITIES.html (unified 6-tab interface)*
*Integration fixes (2026-01-30):*
- *Fixed `savingsResult` vs `fuelSavingsCalculated` message mismatch (fuel savings never rendered)*
- *Fixed `tabChanged` vs `tabSwitch` mismatch (tab analytics never fired)*
- *Added missing HTML handlers: parkingDetails, reportResult, reviewsLoaded, reviewSubmitted, conditionReported, voteRegistered*
- *Fixed getReviews missing locationId (always returned error)*
- *Cleaned MESSAGE_REGISTRY: removed duplicates, added missing Phase 6 outbound entries*
*Remaining: Phase 4 photo upload/GPS, Phase 5 notification infra, Phase 6 testing, Cross-Phase analytics/performance*

### [ ] Track: Driver Compliance Tools
*Link: [./tracks/driver_compliance_tools_20260120/](./tracks/driver_compliance_tools_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: High*
*Status: Planned*
*Goal: Help drivers stay DOT compliant - HOS Tracker, Document Wallet, Expiration Alerts, Training Tracker.*

### [ ] Track: Driver Financial Tools
*Link: [./tracks/driver_financial_tools_20260120/](./tracks/driver_financial_tools_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: High*
*Status: Planned*
*Goal: Pay transparency and expense management - Settlement Viewer, Expense Tracker, Trip Pay Calculator, Tax Deduction Helper.*

### [~] Track: Driver Community
*Link: [./tracks/driver_community_20260120/](./tracks/driver_community_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: Medium*
*Status: Planned*
*Goal: Reduce driver isolation and build community - Forums, Mentor Matching, Pet-Friendly Database, Trucker Health Resources.*

## Recruiter New Features

### [ ] Track: Recruiter Onboarding Automation
*Link: [./tracks/recruiter_onboarding_automation_20260120/](./tracks/recruiter_onboarding_automation_20260120/)*
*Depends on: reverse_matching_20251225, recruiter_utility_expansion_20260120*
*Priority: Critical*
*Status: Planned*
*Goal: Automate hiring paperwork - Document Collection Workflow, Background Check Integration, Drug Test Scheduling, Orientation Scheduler, Offer Letter Generator.*
*Business Impact: 60% reduction in recruiter admin time.*

### [ ] Track: Recruiter Analytics
*Link: [./tracks/recruiter_analytics_20260120/](./tracks/recruiter_analytics_20260120/)*
*Depends on: reverse_matching_20251225, stripe_subscriptions_20260104*
*Priority: High*
*Status: Planned*
*Goal: Data-driven recruiting decisions - Source Attribution, Cost-Per-Hire by Channel, Funnel Analytics, Competitor Intelligence, Predictive Hiring.*

### [x] Track: Driver Lifecycle & Disposition Intelligence
*Link: [./tracks/driver_lifecycle_disposition_20260128/](./tracks/driver_lifecycle_disposition_20260128/)*
*Depends on: driver_cockpit_20251221*
*Priority: High*
*Status: Complete*
*Goal: Monitor full driver lifecycle and capture granular termination reasons (especially <30 days) to train matching algorithms via a feedback loop.*
*Business Impact: Reduces early churn and improves long-term match quality by learning from failures.*
*Completed Services:*
- *lifecycleService.jsw (Event logging, timeline management)*
- *surveyService.jsw (Pulse check triggers and response processing)*
- *feedbackLoopService.jsw (Recursive training loop: Termination/Survey -> Profile Updates)*
*Completed UI:*
- *RECRUITER_LIFECYCLE_MONITOR.html (Timeline, Log Event, Termination Wizard)*
- *DRIVER_MY_CAREER.html (Journey Timeline, Resignation Flow)*
*Data:*
- *New Tables: v2_Lifecycle Events, v2_Termination Logs, v2_Survey Definitions, v2_Survey Responses*

### [ ] Track: Recruiter Outreach
*Link: [./tracks/recruiter_outreach_20260120/](./tracks/recruiter_outreach_20260120/)*
*Depends on: reverse_matching_20251225, recruiter_utility_expansion_20260120*
*Priority: High*
*Status: Planned*
*Goal: Multi-channel driver engagement - SMS Campaign Manager, Email Drip Campaigns, Job Board Distribution, Social Posting.*
*Business Impact: 5x driver engagement through automated outreach.*

### [ ] Track: Graph API Organic Posting — Facebook Page & Instagram Feed
*Link: [./tracks/graph_api_org_posting_20260219/](./tracks/graph_api_org_posting_20260219/)*
*Depends on: meta_marketing_api_surface_buildout_20260219 (for existing Meta app credentials)*
*Priority: High*
*Status: Planning — spec.md + plan.md complete, Phase 0 (research) done*
*Goal: Implement organic (non-paid) timeline posting to Facebook Pages and Instagram professional accounts using Meta Graph API + Instagram Graph API. Separate from the existing paid Marketing API track.*
*Platforms: Facebook Page timeline (text, link, photo, video) + Instagram feed (image, carousel, video, Reels)*
*Key Architecture: Unified `post.facebook()` / `post.instagram()` / `post.both()` dispatcher; post queue with status tracking; token lifecycle management; GCP-migration-ready secrets abstraction.*
*Phases: 5 (MVP one-post each → Full types + queue → Scheduling + rate limits → Hardening → Migration-ready)*

## Business Development New Features

### [ ] Track: B2B Business Development Suite - Carrier Acquisition
*Link: [./tracks/b2b_business_development_suite_20260128/](./tracks/b2b_business_development_suite_20260128/)*
*Depends on: reverse_matching_20251225, carrier_conversion_20260103, recruiter_outreach_20260120*
*Priority: Critical*
*Status: Planned*
*Goal: Equip business development professionals with match-driven prospecting, multi-channel outreach, lead capture, and a full sales pipeline to scale carrier acquisition.*

## Carrier New Features

### [/] Track: Carrier Journey Activation - Checkout to Daily Operations
*Link: [./tracks/carrier_journey_activation_20260131/](./tracks/carrier_journey_activation_20260131/)*
*Depends on: stripe_subscriptions_20260104, carrier_conversion_20260103, carrier_compliance_20260120*
*Priority: Critical*
*Status: In Progress*
*Goal: Wire the complete carrier path from Stripe checkout through onboarding, dashboard, compliance suite, and daily operations. Fixes dead ends where paying carriers land on broken/empty pages.*
*Business Impact: Every paying carrier ($149-$499/mo) hits this flow. Broken post-checkout = immediate churn.*
*Phases: 5 (Post-Checkout Onboarding → Unified Carrier Identity → Compliance Page Bridges → Navigation System → Retention/Analytics Wiring)*

## [x] Track: Carrier Fleet Dashboard
*Link: [./tracks/carrier_fleet_dashboard_20260120/](./tracks/carrier_fleet_dashboard_20260120/)*
*Depends on: carrier_conversion_20260103, carrier_utility_expansion_20260120*
*Priority: High*
*Status: Complete*
*Goal: Fleet operations visibility - Driver Roster, Equipment Assignment, Driver Scorecard, Real-Time Location, Capacity Planning.*
*Completed Services:*
- *fleetService.jsw, equipmentService.jsw, driverScorecardService.jsw, capacityPlanningService.jsw, eldIntegrationService.jsw*
- *fleetJobs.jsw (3 new scheduled jobs)*
*Completed UI:*
- *CARRIER_FLEET_DASHBOARD.html, DRIVER_ROSTER.html, EQUIPMENT_MANAGER.html, DRIVER_SCORECARD.html, CAPACITY_PLANNER.html, FLEET_MAP.html*
- *Unified page code bridge (CARRIER_FLEET_DASHBOARD.unified.js)*
*Data:*
- *7 new collections routed to Airtable via config.jsw (FleetDrivers, EquipmentAssets, EquipmentAssignments, DriverScores, CapacityPlans, ELDConnections, DriverLocations)*

### [/] Track: Carrier Compliance
*Link: [./tracks/carrier_compliance_20260120/](./tracks/carrier_compliance_20260120/)*
*Depends on: carrier_conversion_20260103*
*Priority: Critical*
*Status: Implementation Complete — Page Code Bridges + Manual QA Pending*
*Goal: DOT compliance management - Compliance Calendar, Document Vault, Qualification File Tracker, CSA Score Monitor, Incident Reporting.*
*Business Impact: Avoid $10k+ DOT violations.*
*Completed:*
- *complianceCalendarService.jsw (Phase 1 - CRUD, reminders, dashboard, recurring events)*
- *documentVaultService.jsw (Phase 2 - upload, versioning, expiration tracking, verification)*
- *dqFileService.jsw (Phase 3 - DQ file management, completeness scoring, audit reports)*
- *csaMonitorService.jsw (Phase 4 - FMCSA integration, trend analysis, recommendations)*
- *incidentService.jsw (Phase 5 - DOT reportability, investigation workflow, statistics)*
- *Frontend: CARRIER_COMPLIANCE_CALENDAR.html, CARRIER_DOCUMENT_VAULT.html, CARRIER_DQ_TRACKER.html, CARRIER_CSA_MONITOR.html, CARRIER_INCIDENT_REPORTING.html*
- *Automated tests: All 5 phase test suites passing*
*Integration Fixes (2026-01-30):*
- *All 5 compliance HTML files: Added 5-second demo-data fallback timeouts (components render demo data if no page code responds)*
- *CARRIER_DOCUMENT_VAULT.html: Defined missing `filterCategory()` function with explicit event parameter*
- *CARRIER_DQ_TRACKER.html: Defined missing `exportAll()` function (CSV export)*
- *Trucking Companies.html: Fixed `event.data.success` → `event.data.data.success` (wrong nesting depth)*
- *CARRIER_WEIGHT_PREFERENCES.html: Added 15-second save timeout fallback*
*Remaining: Page code bridges for 5 compliance HTML iframes (no Wix pages exist yet), manual integration testing*

### [ ] Track: Carrier Communication
*Link: [./tracks/carrier_communication_20260120/](./tracks/carrier_communication_20260120/)*
*Depends on: carrier_conversion_20260103, carrier_fleet_dashboard_20260120*
*Priority: Medium*
*Status: Planned*
*Goal: Driver engagement and retention - Company Announcements, Policy Repository, Recognition Board, Feedback Channel.*

## Admin New Features

### [ ] Track: Admin Business Operations
*Link: [./tracks/admin_business_ops_20260120/](./tracks/admin_business_ops_20260120/)*
*Depends on: admin_portal_20251224, stripe_subscriptions_20260104*
*Priority: High*
*Status: Planned*
*Goal: Business visibility and billing management - Revenue Dashboard, Billing Management, Invoicing, Commission Tracking.*

### [ ] Track: Admin Platform Configuration
*Link: [./tracks/admin_platform_config_20260120/](./tracks/admin_platform_config_20260120/)*
*Depends on: admin_portal_20251224*
*Priority: Medium*
*Status: Planned*
*Goal: Feature management and experimentation - Feature Flags, A/B Test Manager, Email Template Editor, Notification Rules.*

### [ ] Track: Admin Support Operations
*Link: [./tracks/admin_support_ops_20260120/](./tracks/admin_support_ops_20260120/)*
*Depends on: admin_portal_20251224*
*Priority: Medium*
*Status: Planned*
*Goal: Customer support efficiency - Support Ticket System, Knowledge Base Admin, Chat Support Dashboard, NPS/Satisfaction Tracking.*

---

# Cross-Cutting Tracks

> Tracks that span multiple roles or improve conversion/retention metrics.

## [ ] Track: Carrier Lead Form UX Enhancement
*Link: [./conductor/tracks/form_ux_refactor_20260119/](./conductor/tracks/form_ux_refactor_20260119/)*
*Depends on: carrier_conversion_20260103*
*Priority: Medium*
*Status: Planned*
*Goal: Improve carrier lead form conversion rates through progressive disclosure, inline validation, and micro-interactions on Trucking Companies landing page.*

## [x] Track: Employee Retention & Driver Tracking Dashboard
*Link: [./conductor/tracks/retention_dashboard/](./conductor/tracks/retention_dashboard/)*
*Depends on: driver_cockpit_20251221, reverse_matching_20251225*
*Priority: High*
*Status: Complete*
*Goal: Predictive dashboard for recruiters/fleet managers to track driver performance (miles, deliveries, safety), monitor engagement, and predict turnover risk.*
*Note: Referenced as dependency by Cross-Role Utility track.*

## [x] Track: Agentic Orchestration (Cross-Role)
*Link: [./conductor/tracks/agentic_orchestration_20260218/](./conductor/tracks/agentic_orchestration_20260218/)*
*Priority: Critical*
*Status: COMPLETE — All 4 Phases Delivered*
*Goal: Deliver fully orchestrated multi-agent execution across recruiter, carrier, driver, admin, and development operations with recursive compendium memory and policy-guarded autonomy.*
*Completed (Execution Plane — 2026-02-17):*
- *agentService.jsw (23 tools, 4 role scopes, tool_use iteration loop, dynamic dispatch)*
- *agentConversationService.jsw (Airtable-backed conversation persistence)*
- *voiceService.jsw (VAPI REST wrapper — create assistants, outbound calls, transcripts)*
- *voiceCampaignService.jsw (chunked parallel outbound campaigns)*
- *http-functions.js VAPI webhooks (end-of-call-report, function-call, assistant-request)*
- *aiRouterService.jsw extended (agent_orchestration function, tools param, contentBlocks)*
- *4 agent chat UIs (Driver LMDR, Recruiter VelocityMatch, Admin, B2B)*
- *4 voice orbs via reusable voice-agent-ui.js + voice-agent-bridge.js*
- *Recruiter: ros-chat.js NLU-enabled, ros-voice.js, ros-view-campaigns.js*
- *6 Airtable tables (Agent Conversations/Turns, Voice Call Logs/Assistants/Campaigns/Contacts)*
- *6 Claude Code agents (deploy, test-bridge, seed-data, audit-schema, purge-cdn, create-page)*
*Completed (Control Plane Phase 1A — 2026-02-18):*
- *Policy-tagged tool registry (all 23 tools with risk_level, requires_approval, rate_limit, success_metric)*
- *Run ledger: agentRunLedgerService.jsw (startRun, logStep, createGate, resolveGate, completeRun)*
- *4 Airtable tables (Agent Runs, Agent Steps, Approval Gates, Run Outcomes)*
- *Approval gate system on all 4 surfaces (confirmation cards, approve/reject flow)*
- *Outcome evaluator: agentOutcomeService.jsw (heuristic scoring 0-100, KPI aggregation)*
*Completed (Control Plane Phase 1B — 2026-02-18):*
- *Cost controls (per-role token caps, 30s time cap, 100 daily runs, $0.50 cost alert)*
- *E2E tests rewritten (26 tests: role-specific flows, approval gates, policy tags)*
- *Agent KPI dashboard card on Admin Dashboard (5 metrics: total runs, success rate, quality score, partial rate, failure rate)*
*Completed (Phase 2 — 2026-02-18):*
- *crossRoleIntelService.jsw (5 exports: market intel, lane demand, compensation benchmarks, hiring benchmarks, conversion insights)*
- *5 new agent tools wired (get_market_intel, get_lane_demand, get_compensation_benchmarks, get_hiring_benchmarks, get_conversion_insights)*
- *Role system prompts updated with cross-role intel awareness*
- *Admin Run Monitor: admin-run-monitor.js (4-tab UI: Active Runs, Completed Runs, Approval Audit, Quality Trends)*
- *Backend queries: getRecentRuns, getApprovalGatesByDateRange, getOutcomeTrends*
- *4 new page code handlers on Admin Dashboard*
*Completed (Phase 3 — 2026-02-18):*
- *Compendium/ directory: 5 departments (recruiter, carrier, driver, admin, dev) with INDEX.md + seeded playbooks/patterns/metrics*
- *compendiumService.jsw (8 exports: CRUD, runDeltas, sharding check, weekly summary, runCurator)*
- *Knowledge Curator agent (.claude/agents/curator.md) + run_curator admin tool*
- *v2_Compendium Entries Airtable table (12 fields)*
- *24 tests (compendiumService.test.js)*
*Completed (Phase 4 — 2026-02-18):*
- *autopilotService.jsw (7 exports: campaign CRUD, step execution, postmortem)*
- *selfHealingService.jsw (6 exports: detect, triage, propose, execute, verify, timeline)*
- *5 new agent tools (start_autopilot, get_autopilot_status, detect_anomalies, propose_fix, execute_fix)*
- *3 dev swarm agents (scout, security-audit, style-audit)*
- *4 Airtable tables (Autopilot Campaigns/Steps, Remediation Plans, Incident Log)*
- *Tests: autopilotService.test.js + selfHealingService.test.js*
