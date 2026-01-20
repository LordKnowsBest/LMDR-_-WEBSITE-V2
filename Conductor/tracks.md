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
