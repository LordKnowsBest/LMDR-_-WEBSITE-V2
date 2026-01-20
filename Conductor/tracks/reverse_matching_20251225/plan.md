# Track Plan: Reverse Matching Engine (Carrier → Driver)

> **TDD REQUIRED**: Every implementation task is preceded by a test task. Write tests first, then implement.

---

## Phase 1: Data Model & Test Infrastructure

### 1.1 Test Fixtures & Utilities
- [x] Task: Create `src/test/fixtures/drivers.js` with mock driver profiles (searchable, hidden, various qualifications)
- [x] Task: Create `src/test/fixtures/preferences.js` with mock carrier hiring preferences
- [x] Task: Create `src/test/fixtures/subscriptions.js` with mock subscription tiers (free, pro, enterprise, exhausted)
- [x] Task: Extend `src/test/utils.js` with `createMockQueryWithFilters()` for advanced query simulation

### 1.2 Database Collections
- [x] Task: Create `CarrierHiringPreferences` collection in Wix with schema from spec
- [x] Task: Create `CarrierSubscriptions` collection in Wix with schema from spec
- [x] Task: Create `CarrierDriverViews` collection for view tracking
- [x] Task: Create `CarrierDriverOutreach` collection for outreach tracking
- [x] Task: Extend `DriverProfiles` collection with searchability fields (`is_searchable`, `visibility_level`, `last_active_date`)
- [x] Task: Conductor - Verify Phase 1 Collections

---

## Phase 2: Driver Scoring Engine (TDD)

### 2.1 Scoring Tests (RED)
- [x] Task: Write `driverScoring.test.js` - tests for `scoreQualifications()` (CDL match, endorsements, violations)
- [x] Task: Write tests for `scoreExperience()` (years driving, equipment familiarity)
- [x] Task: Write tests for `scoreLocation()` (distance from terminals, ZIP-based)
- [x] Task: Write tests for `scoreAvailability()` (immediate, 2-week, 30-day)
- [x] Task: Write tests for `scoreSalaryFit()` (driver expectation vs carrier offer)
- [x] Task: Write tests for `scoreEngagement()` (login recency, response rate)
- [x] Task: Write tests for `calculateDriverMatchScore()` (weighted overall score)
- [x] Task: Write tests for `generateDriverMatchRationale()` (human-readable explanations)
- [x] Task: Run tests - verify all fail (RED phase complete)

### 2.2 Scoring Implementation (GREEN)
- [x] Task: Create `src/backend/driverScoring.js` with CONFIG and WEIGHTS
- [x] Task: Implement `scoreQualifications()` - make tests pass
- [x] Task: Implement `scoreExperience()` - make tests pass
- [x] Task: Implement `scoreLocation()` - make tests pass
- [x] Task: Implement `scoreAvailability()` - make tests pass
- [x] Task: Implement `scoreSalaryFit()` - make tests pass
- [x] Task: Implement `scoreEngagement()` - make tests pass
- [x] Task: Implement `calculateDriverMatchScore()` - make tests pass
- [x] Task: Implement `generateDriverMatchRationale()` - make tests pass
- [x] Task: Verify all tests pass (GREEN phase complete)
- [x] Task: Verify coverage >95% for driverScoring.js

### 2.3 Scoring Refactor
- [x] Task: Review and refactor scoring functions for clarity
- [x] Task: Add JSDoc documentation to all exported functions
- [ ] Task: Conductor - Verify Phase 2 Scoring Engine

---

## Phase 3: Carrier Preferences Service (TDD)

### 3.1 Preferences Tests (RED)
- [x] Task: Write `carrierPreferences.test.js` - tests for `createHiringPreferences()`
- [x] Task: Write tests for `updateHiringPreferences()`
- [x] Task: Write tests for `getHiringPreferences()`
- [x] Task: Write tests for `deactivateHiringPreferences()`
- [x] Task: Write tests for authorization checks (logged in, carrier access)
- [x] Task: Write tests for validation (required fields, data types)
- [x] Task: Run tests - verify all fail (RED phase complete)

### 3.2 Preferences Implementation (GREEN)
- [x] Task: Create `src/backend/carrierPreferences.jsw`
- [x] Task: Implement `createHiringPreferences()` - make tests pass
- [x] Task: Implement `updateHiringPreferences()` - make tests pass
- [x] Task: Implement `getHiringPreferences()` - make tests pass
- [x] Task: Implement `deactivateHiringPreferences()` - make tests pass
- [x] Task: Implement authorization middleware
- [x] Task: Implement validation helpers
- [x] Task: Verify all tests pass (GREEN phase complete)
- [x] Task: Verify coverage >90% for carrierPreferences.jsw
- [ ] Task: Conductor - Verify Phase 3 Preferences Service

---

## Phase 4: Subscription & Quota Service (TDD)

### 4.1 Subscription Tests (RED)
- [x] Task: Write `subscriptionService.test.js` - tests for `getSubscription()`
- [x] Task: Write tests for `checkViewQuota()`
- [x] Task: Write tests for `recordProfileView()`
- [x] Task: Write tests for `getUsageStats()`
- [x] Task: Write tests for tier enforcement (free blocks, pro limits, enterprise unlimited)
- [x] Task: Write tests for quota reset logic
- [x] Task: Write tests for duplicate view handling (same driver, same day)
- [x] Task: Run tests - verify all fail (RED phase complete)

### 4.2 Subscription Implementation (GREEN)
- [x] Task: Create `src/backend/subscriptionService.jsw`
- [x] Task: Implement `getSubscription()` - make tests pass
- [x] Task: Implement `checkViewQuota()` - make tests pass
- [x] Task: Implement `recordProfileView()` - make tests pass
- [x] Task: Implement `getUsageStats()` - make tests pass
- [x] Task: Implement tier enforcement helpers
- [x] Task: Implement quota reset logic
- [x] Task: Verify all tests pass (GREEN phase complete)
- [x] Task: Verify coverage >95% for subscriptionService.jsw
- [ ] Task: Conductor - Verify Phase 4 Subscription Service

---

## Phase 5: Driver Matching Engine (TDD)

### 5.1 Matching Tests (RED)
- [x] Task: Write `driverMatching.test.js` - tests for `findMatchingDrivers()`
- [x] Task: Write tests for filtering (CDL, endorsements, location, experience, availability)
- [x] Task: Write tests for sorting by match score
- [x] Task: Write tests for subscription tier limits
- [x] Task: Write tests for driver visibility/searchability filtering
- [x] Task: Write tests for `getDriverProfile()` with quota enforcement
- [x] Task: Write tests for mutual match detection (driver interested + carrier searching)
- [x] Task: Write tests for access control (auth, carrier authorization)
- [x] Task: Write tests for empty results handling
- [x] Task: Write snapshot tests for result structure
- [x] Task: Run tests - verify all fail (RED phase complete)

### 5.2 Matching Implementation (GREEN)
- [x] Task: Create `src/backend/driverMatching.jsw`
- [x] Task: Implement `findMatchingDrivers()` - query and filter logic
- [x] Task: Integrate scoring engine for match scores
- [x] Task: Implement tier-based result limiting
- [x] Task: Implement driver visibility filtering
- [x] Task: Implement `getDriverProfile()` with quota check
- [x] Task: Implement mutual match detection
- [x] Task: Implement access control checks
- [x] Task: Verify all tests pass (GREEN phase complete)
- [x] Task: Update snapshots
- [x] Task: Verify coverage >90% for driverMatching.jsw
- [ ] Task: Conductor - Verify Phase 5 Matching Engine

---

## Phase 6: Driver Outreach Service (TDD)

### 6.1 Outreach Tests (RED)
- [x] Task: Write `driverOutreach.test.js` - tests for `saveToRecruiterPipeline()`
- [x] Task: Write tests for `sendMessage()`
- [x] Task: Write tests for `scheduleCall()`
- [x] Task: Write tests for `markAsContacted()`
- [x] Task: Write tests for `getOutreachHistory()`
- [x] Task: Write tests for subscription requirements
- [x] Task: Write tests for "view required before action" rule
- [x] Task: Run tests - verify all fail (RED phase complete)

### 6.2 Outreach Implementation (GREEN)
- [x] Task: Create `src/backend/driverOutreach.jsw`
- [x] Task: Implement `saveToRecruiterPipeline()` - make tests pass
- [x] Task: Implement `sendMessage()` - make tests pass
- [x] Task: Implement `scheduleCall()` - make tests pass
- [x] Task: Implement `markAsContacted()` - make tests pass
- [x] Task: Implement `getOutreachHistory()` - make tests pass
- [x] Task: Verify all tests pass (GREEN phase complete)
- [x] Task: Verify coverage >85% for driverOutreach.jsw
- [ ] Task: Conductor - Verify Phase 6 Outreach Service

---

## Phase 7: Integration Tests

### 7.1 End-to-End Flow Tests
- [ ] Task: Write `reverseMatching.integration.test.js`
- [ ] Task: Write E2E test: Pro subscriber search → view → contact flow
- [ ] Task: Write E2E test: Free user sees interest count, blocked from search
- [ ] Task: Write E2E test: Quota exhaustion blocks further views
- [ ] Task: Write E2E test: Mutual match priority surfacing
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 7 Integration Tests

---

## Phase 8: Recruiter Console UI (Frontend)

### 8.1 Search Dashboard
- [ ] Task: Create `RECRUITER_DRIVER_SEARCH.html` component
- [ ] Task: Build filter panel (CDL, endorsements, location, experience, availability)
- [ ] Task: Build search results list with match scores
- [ ] Task: Add match rationale display
- [ ] Task: Implement pagination/infinite scroll
- [ ] Task: Add "View Profile" button with quota indicator

### 8.2 Driver Profile View
- [ ] Task: Create driver profile modal/panel
- [ ] Task: Display qualifications, experience, preferences
- [ ] Task: Display work history
- [ ] Task: Display match rationale
- [ ] Task: Add action buttons (Save, Message, Schedule, Offer)

### 8.3 Quota & Subscription UI
- [ ] Task: Add quota indicator to search dashboard header
- [ ] Task: Create subscription management panel
- [ ] Task: Build upgrade prompts for free users
- [ ] Task: Add quota exhausted messaging

### 8.4 Integration with Recruiter Console
- [ ] Task: Add "Search Drivers" tab to existing Recruiter Console
- [ ] Task: Wire up postMessage handlers for search actions
- [ ] Task: Connect to backend services via Velo page code
- [ ] Task: Conductor - Verify Phase 8 Frontend

---

## Phase 9: Stripe Billing Integration

### 9.1 Stripe Setup
- [ ] Task: Create Stripe products and prices (Pro, Enterprise)
- [ ] Task: Add `STRIPE_SECRET_KEY` to Wix Secrets Manager
- [ ] Task: Create `stripeService.jsw` for Stripe API calls

### 9.2 Subscription Management
- [ ] Task: Implement `createCheckoutSession()` for new subscriptions
- [ ] Task: Implement `createCustomerPortalSession()` for self-service
- [ ] Task: Implement webhook handler for subscription events
- [ ] Task: Connect subscription changes to `CarrierSubscriptions` collection

### 9.3 Testing
- [ ] Task: Test with Stripe test mode
- [ ] Task: Verify subscription creation flow
- [ ] Task: Verify cancellation flow
- [ ] Task: Verify quota reset on renewal
- [ ] Task: Conductor - Verify Phase 9 Billing

---

## Phase 10: Notifications & Alerts (Enterprise)

### 10.1 Real-time Match Alerts
- [ ] Task: Create `matchNotifications.jsw`
- [ ] Task: Implement background job to detect new matching drivers
- [ ] Task: Send email notifications for new matches (Enterprise)
- [ ] Task: Implement SMS notifications via Twilio (Enterprise)

### 10.2 Driver Notifications
- [ ] Task: Notify drivers when profile is viewed (optional setting)
- [ ] Task: Notify drivers when contacted by carrier
- [ ] Task: Conductor - Verify Phase 10 Notifications

---

## Phase 11: Analytics & Optimization

### 11.1 Metrics Dashboard
- [ ] Task: Create admin dashboard for reverse matching metrics
- [ ] Task: Track: searches performed, profiles viewed, contacts made
- [ ] Task: Track: conversion rates (view → contact → hire)
- [ ] Task: Track: subscription metrics (signups, churn, MRR)

### 11.2 Algorithm Optimization
- [ ] Task: A/B test different scoring weights
- [ ] Task: Analyze match success rates
- [ ] Task: Refine scoring based on hire outcomes
- [ ] Task: Conductor - Verify Phase 11 Analytics

---

## Phase 12: Documentation & Launch

### 12.1 Documentation
- [ ] Task: Write carrier user guide for driver search
- [ ] Task: Write API documentation for enterprise customers
- [ ] Task: Document subscription tiers and features
- [ ] Task: Create troubleshooting guide

### 12.2 Launch Preparation
- [ ] Task: Security audit of all new endpoints
- [ ] Task: Performance testing with realistic data volumes
- [ ] Task: Create launch announcement for carriers
- [ ] Task: Set up monitoring and alerts

### 12.3 Launch
- [ ] Task: Enable feature for existing carriers
- [ ] Task: Monitor for issues
- [ ] Task: Gather initial feedback
- [ ] Task: Conductor - Final Verification & Launch

---

## Dependencies Summary

```
Phase 1 (Data Model)
    ↓
Phase 2 (Scoring) → Phase 3 (Preferences)
    ↓                    ↓
Phase 4 (Subscriptions) ←┘
    ↓
Phase 5 (Matching Engine)
    ↓
Phase 6 (Outreach) → Phase 7 (Integration Tests)
    ↓
Phase 8 (UI) → Phase 9 (Stripe)
    ↓
Phase 10 (Notifications) → Phase 11 (Analytics)
    ↓
Phase 12 (Launch)
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [ ] All tests written (TDD RED phase)
- [ ] All tests passing (TDD GREEN phase)
- [ ] Code coverage meets requirements
- [ ] No linting errors
- [ ] JSDoc documentation complete
- [ ] Security review passed
- [ ] Manual verification completed