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
*Status: Implemented*

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

## [ ] Track: Feature Adoption Log
*Link: [./conductor/tracks/feature_adoption_log_20260120/](./conductor/tracks/feature_adoption_log_20260120/)*
*Priority: High*
*Goal: Visualize feature adoption and lifecycle to enable rapid shipping/disposal decisions.*
*Status: In Progress (Backend + Tests Created)*

## [X] Track: UI/UX Consistency & Standardization
*Link: [./conductor/tracks/ui_standardization_20260120/](./conductor/tracks/ui_standardization_20260120/)*
*Priority: High*
*Goal: Unify Tailwind configs, icons, buttons, and theme logic across the platform.*
*Status: In Progress (Phase 3 Complete, Phase 4: Component Refactoring)*

## [ ] Track: Systematic HTML Mobile Optimization
*Link: [./conductor/tracks/mobile_optimization_20260122/](./conductor/tracks/mobile_optimization_20260122/)*
*Priority: High*
*Goal: Systematic review and optimization of all HTML files for mobile responsiveness (iPhone 12/13 target).*
*Status: In Progress*
*Standard: docs/MOBILE_OPTIMIZATION_GUIDE.md*

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
*Status: Planned*
*Goal: Monetize platform capabilities via B2B REST APIs - Safety & Compliance, Intelligence, Operational, Matching, Document, and Engagement (gamification white-label) APIs for external partners.*
*Business Impact: Revenue Diversification - Target $300K ARR Year 1, 25 API partners, 1M+ monthly API calls.*
*Phases: 8 (Gateway Infrastructure → Safety APIs → Intelligence APIs → Operational APIs → Matching APIs → Document APIs → Engagement APIs → Developer Portal)*
*Pricing: Starter $199/mo, Growth $499/mo, Enterprise $999/mo + usage-based add-ons*

---

# Infrastructure Tracks (Q1 2026)

> Critical infrastructure improvements for scalability and long-term platform health.

## [ ] Track: Airtable Migration - Scalable Data Architecture
*Link: [./tracks/airtable_migration_20260121/](./tracks/airtable_migration_20260121/)*
*Depends on: persistence_20251220*
*Priority: High*
*Status: Planned*
*Goal: Migrate 35 Wix Collections to Airtable for improved scalability, visual data management, and better API tooling while maintaining Wix frontend and authentication.*
*Business Impact: Infrastructure Improvement - Enables scalable data architecture before production volume.*
*Technical Scope: 35 collections to migrate, 5 to keep in Wix (auth-related), 38 backend services affected.*
*Phases: 6 (Infrastructure Setup → Content Migration → Core Data → Transactions → Communication/Billing → Validation)*

---

# Utility Expansion Tracks (Q1 2026)

> Expand utility of existing features to maximize platform value before building new capabilities.

## [ ] Track: Driver Utility Expansion
*Link: [./tracks/driver_utility_expansion_20260120/](./tracks/driver_utility_expansion_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: High*
*Status: Planned*
*Goal: Increase driver engagement through Profile Strength Meter, Quick Response Templates, Reverse Alerts, and Insights Panel.*

## [ ] Track: Recruiter Utility Expansion
*Link: [./tracks/recruiter_utility_expansion_20260120/](./tracks/recruiter_utility_expansion_20260120/)*
*Depends on: reverse_matching_20251225, stripe_subscriptions_20260104*
*Priority: High*
*Status: Planned*
*Goal: Improve recruiter efficiency through Saved Searches with Alerts, Call Outcome Logging, Intervention Templates, and Pipeline Automation Triggers.*

## [ ] Track: Carrier Utility Expansion
*Link: [./tracks/carrier_utility_expansion_20260120/](./tracks/carrier_utility_expansion_20260120/)*
*Depends on: carrier_conversion_20260103*
*Priority: Medium*
*Status: Planned*
*Goal: Improve carrier onboarding and engagement through Preference Presets, Status Tracker, and Instant Match Preview.*

## [ ] Track: Admin Utility Expansion
*Link: [./tracks/admin_utility_expansion_20260120/](./tracks/admin_utility_expansion_20260120/)*
*Depends on: admin_portal_20251224, observability_gaps_20260112*
*Priority: Medium*
*Status: Planned*
*Goal: Reduce operational costs and improve reliability through Cost Optimizer Mode, Anomaly Alerts, and Compliance Reports.*

## [ ] Track: Cross-Role Utility
*Link: [./tracks/cross_role_utility_20260120/](./tracks/cross_role_utility_20260120/)*
*Depends on: driver_cockpit_20251221, reverse_matching_20251225, retention_dashboard*
*Priority: High*
*Status: Planned*
*Goal: Cross-pollinate features between roles through Mutual Interest Indicator, Retention Dashboard for Carriers, Match Explanation for Drivers, and System Health for Recruiters.*

---

# New Feature Tracks - Platform Gaps (Q1-Q2 2026)

> Fill platform gaps to transform LMDR from job matching platform to full trucking industry operating system.

## Driver New Features

### [/] Track: Driver Road Utilities
*Link: [./tracks/driver_road_utilities_20260120/](./tracks/driver_road_utilities_20260120/)*
*Depends on: driver_cockpit_20251221*
*Priority: Critical*
*Status: In Progress (Phases 1-3 Complete)*
*Goal: Daily-use tools for drivers on the road - Parking Finder, Fuel Optimizer, Weigh Station Status, Rest Stop Ratings, Weather Alerts, Road Conditions.*
*Business Impact: Transform platform to daily-use operating system.*

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

### [ ] Track: Driver Community
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

### [ ] Track: Recruiter Outreach
*Link: [./tracks/recruiter_outreach_20260120/](./tracks/recruiter_outreach_20260120/)*
*Depends on: reverse_matching_20251225, recruiter_utility_expansion_20260120*
*Priority: High*
*Status: Planned*
*Goal: Multi-channel driver engagement - SMS Campaign Manager, Email Drip Campaigns, Job Board Distribution, Social Posting.*
*Business Impact: 5x driver engagement through automated outreach.*

## Carrier New Features

### [ ] Track: Carrier Fleet Dashboard
*Link: [./tracks/carrier_fleet_dashboard_20260120/](./tracks/carrier_fleet_dashboard_20260120/)*
*Depends on: carrier_conversion_20260103, carrier_utility_expansion_20260120*
*Priority: High*
*Status: Planned*
*Goal: Fleet operations visibility - Driver Roster, Equipment Assignment, Driver Scorecard, Real-Time Location, Capacity Planning.*

### [ ] Track: Carrier Compliance
*Link: [./tracks/carrier_compliance_20260120/](./tracks/carrier_compliance_20260120/)*
*Depends on: carrier_conversion_20260103*
*Priority: Critical*
*Status: Planned*
*Goal: DOT compliance management - Compliance Calendar, Document Vault, Qualification File Tracker, CSA Score Monitor, Incident Reporting.*
*Business Impact: Avoid $10k+ DOT violations.*

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
