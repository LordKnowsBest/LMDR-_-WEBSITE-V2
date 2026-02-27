# Track Plan: Reverse Matching Engine (Carrier → Driver)

> **TDD REQUIRED**: Every implementation task is preceded by a test task. Write tests first, then implement.

---

## Phase 1: Data Model & Test Infrastructure

### 1.1 Test Fixtures & Utilities
- [ ] Task: Create `src/public/__tests__/reverseMatching.integration.test.js (inline driver fixtures)` with mock driver profiles (searchable, hidden, various qualifications) (File missing)
- [ ] Task: Create `src/public/__tests__/reverseMatching.integration.test.js (inline preferences fixtures)` with mock carrier hiring preferences (File missing)
- [ ] Task: Create `src/public/__tests__/reverseMatching.integration.test.js (inline subscription fixtures)` with mock subscription tiers (free, pro, enterprise, exhausted) (File missing)
- [ ] Task: Extend `src/public/__tests__/setup.js` with `createMockQueryWithFilters()` for advanced query simulation (File missing)

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
- [x] Task: Conductor - Verify Phase 2 Scoring Engine

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
- [x] Task: Conductor - Verify Phase 3 Preferences Service

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
- [x] Task: Conductor - Verify Phase 4 Subscription Service

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
- [x] Task: Conductor - Verify Phase 5 Matching Engine

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
- [x] Task: Conductor - Verify Phase 6 Outreach Service

---

## Phase 7: Integration Tests

### 7.1 End-to-End Flow Tests
- [x] Task: Write `src/public/__tests__/reverseMatching.integration.test.js`
- [ ] Task: Write E2E test: Pro subscriber search → view → contact flow
- [ ] Task: Write E2E test: Free user sees interest count, blocked from search
- [ ] Task: Write E2E test: Quota exhaustion blocks further views
- [ ] Task: Write E2E test: Mutual match priority surfacing
- [ ] Task: Run integration tests - verify all pass
- [ ] Task: Conductor - Verify Phase 7 Integration Tests

---

## Phase 8: Recruiter Console UI (Frontend)

### 8.1 Search Dashboard
- [x] Task: Create `RECRUITER_DRIVER_SEARCH.html` component
- [x] Task: Build filter panel (CDL, endorsements, location, experience, availability)
- [x] Task: Build search results list with match scores
- [x] Task: Add match rationale display
- [x] Task: Implement pagination/infinite scroll
- [x] Task: Add "View Profile" button with quota indicator

### 8.2 Driver Profile View
- [x] Task: Create driver profile modal/panel
- [x] Task: Display qualifications, experience, preferences
- [x] Task: Display work history
- [x] Task: Display match rationale
- [x] Task: Add action buttons (Save, Message, Schedule, Offer)

### 8.3 Quota & Subscription UI
- [x] Task: Add quota indicator to search dashboard header
- [x] Task: Create subscription management panel
- [x] Task: Build upgrade prompts for free users
- [x] Task: Add quota exhausted messaging

### 8.4 Integration with Recruiter Console
- [x] Task: Add "Search Drivers" tab to existing Recruiter Console
- [x] Task: Wire up postMessage handlers for search actions
- [x] Task: Connect to backend services via Velo page code
- [x] Task: Conductor - Verify Phase 8 Frontend

---

## Phase 9: Stripe Billing Integration

> **NOTE:** This phase was extracted into its own dedicated track: `stripe_subscriptions_20260104` (COMPLETE).
> See [../../stripe_subscriptions_20260104/](../../stripe_subscriptions_20260104/) for full details.

### 9.1 Stripe Setup
- [x] Task: Create Stripe products and prices (Pro, Enterprise)
- [x] Task: Add `STRIPE_SECRET_KEY` to Wix Secrets Manager
- [x] Task: Create `stripeService.jsw` for Stripe API calls

### 9.2 Subscription Management
- [x] Task: Implement `createCheckoutSession()` for new subscriptions
- [x] Task: Implement `createCustomerPortalSession()` for self-service
- [x] Task: Implement webhook handler for subscription events
- [x] Task: Connect subscription changes to `CarrierSubscriptions` collection

### 9.3 Testing
- [x] Task: Test with Stripe test mode
- [x] Task: Verify subscription creation flow
- [x] Task: Verify cancellation flow
- [x] Task: Verify quota reset on renewal
- [x] Task: Conductor - Verify Phase 9 Billing

---

## Phase 10: Notifications & Alerts (Enterprise)

### 10.1 Real-time Match Alerts
- [x] Task: Create `matchNotifications.jsw`
- [x] Task: Implement background job to detect new matching drivers (`scanForNewMatchingDrivers` — daily 7 AM UTC via `jobs.config`)
- [x] Task: Send email notifications for new matches (Enterprise — tier-gated via `isEnterpriseTier()`)
- [x] Task: Implement SMS notifications via Twilio (Enterprise — graceful degradation when secrets not configured)

### 10.2 Driver Notifications
- [x] Task: Notify drivers when profile is viewed (opt-in via `notification_preferences.profile_viewed`)
- [x] Task: Notify drivers when contacted by carrier (opt-in via `notification_preferences.contacted`)
- [x] Task: Write `matchNotifications.test.js` — 40 tests covering preferences, tier gating, SMS degradation, scan filtering, digest building, logging, validation
- [x] Task: Add `matchNotificationLog` Airtable-only collection to `config.jsw` + `airtableClient.jsw`
- [x] Task: Hook non-blocking notifications into `driverMatching.jsw` (profile viewed) and `driverOutreach.jsw` (contacted)
- [x] Task: Conductor - Verify Phase 10 Notifications

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

### Phase 12: Documentation & Launch [x]
**Objective:** Finalize documentation and prepare for production release.

*   [x] **12.1 Update User Guides:** Revise "Recruiter Guide: Finding Drivers" to cover the new Reverse Matching Engine features, scoring concepts, and quota limits.
*   [x] **12.2 API Documentation (Enterprise):** Update developer documentation for Enterprise-tier customers utilizing API access for reverse matching. *(Addressed via in-app help tooltips per updated requirements).*
*   [x] **12.3 Troubleshooting Guide:** Create internal support documentation for common reverse matching issues (e.g., "Why is my quota exhausted?", "Why aren't I seeing mutual matches?").
*   [x] **12.4 Final Security Audit:** Conduct a final review of data access patterns, ensuring carrier tier restrictions and contact permission logic are leak-proof.
*   [x] **12.5 Performance Testing:** Execute load tests on the `searchDrivers` query to verify performance under high concurrent user load, ensuring the index and cache strategies are effective.
*   [x] **12.6 Production Deployment:** Deploy backend services, frontend updates, and initial database configurations to the live `LMDR Website V2` environment.

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

