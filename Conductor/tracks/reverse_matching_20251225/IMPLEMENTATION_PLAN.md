# Reverse Matching Implementation Plan

> **Goal**: Complete Phases 7-12 to launch carrier driver search and monetization
> **Created**: 2026-01-04
> **Updated**: 2026-01-05
> **Priority**: CRITICAL - Primary revenue driver
> **Status**: 🟡 IN PROGRESS - Sprint 1 Phase 8.1-8.2 COMPLETE

---

## Executive Summary

The backend engine (Phases 1-6) is complete with 302+ tests passing. This plan covers the remaining work to make the feature usable and monetized.

**Estimated Effort**: 40-60 hours
**Dependencies**:
- Stripe account with API keys
- Wix Secrets Manager access
- Recruiter Console page in Wix Editor

---

## ✅ COMPLETED WORK LOG (2026-01-05)

### Files Created/Modified:
- `src/public/RECRUITER_DRIVER_SEARCH.html` - Full search UI with filters, cards, modals
- `src/pages/RecruiterDriverSearch.qtecw.js` - Velo page code with PostMessage handlers
- `src/backend/carrierPreferences.jsw` - Weight preferences backend functions

### Key Features Implemented:
1. **Search Dashboard** - Filter panel, driver cards, pagination
2. **Profile Modal** - Full driver details with match rationale
3. **Quota Display** - Visual progress bar with tier-based limits
4. **Settings Panel** - Slide-out weight preferences with donut chart
5. **Save Button UX** - Visual feedback states (loading, success, error)
6. **Actionable Error Tooltips** - Context-aware guidance for failures
7. **View-Before-Save** - Enforces profile review before pipeline save
8. **LMDR Brand Alignment** - Colors, fonts, components per brand spec

---

## Sprint 1: Integration Tests & UI Foundation (Phase 7-8a)

### Day 1-2: Integration Tests (Phase 7)

#### Task 7.1: Create Integration Test File
```
File: src/test/reverseMatching.integration.test.js
```
- [ ] Set up test database state (mock carriers, drivers, subscriptions)
- [ ] Test: Pro subscriber complete flow (search → view → contact)
- [ ] Test: Free user blocked from search, sees interest count only
- [ ] Test: Quota exhaustion blocks further profile views
- [ ] Test: Mutual match detection and priority surfacing
- [ ] Test: Authorization failures return proper errors

#### Task 7.2: Run Integration Suite
- [ ] Execute all integration tests
- [ ] Fix any failures from cross-service interactions
- [ ] Document any edge cases discovered

---

### Day 3-5: Recruiter Console UI - Search Dashboard (Phase 8.1) ✅ COMPLETE

#### Task 8.1.1: Create Search Page HTML ✅ COMPLETE
```
File: src/public/RECRUITER_DRIVER_SEARCH.html
```

**Structure:**
```html
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Quota Display (Views: 15/50 this month)    [Upgrade]   │
├─────────────────────────────────────────────────────────────────┤
│  FILTERS PANEL (Collapsible on Mobile)                          │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ CDL Class   │ Endorsements│ Location    │ Experience  │     │
│  │ [A] [B]     │ [H] [T] [X] │ [ZIP] [mi]  │ [1-3] [3+]  │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│  ┌─────────────┬─────────────┐                                  │
│  │ Availability│ Salary Range│        [Search Drivers]          │
│  │ [Now][2wk]  │ [$$$-$$$$]  │                                  │
│  └─────────────┴─────────────┘                                  │
├─────────────────────────────────────────────────────────────────┤
│  RESULTS: 47 drivers match your criteria          [Sort: Score] │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Avatar] John D. ★★★★☆ 94% Match                        │   │
│  │ Class A | Hazmat, Tanker | Dallas, TX | 5 yrs exp       │   │
│  │ "Strong qualifications match. Available immediately."    │   │
│  │                              [View Profile] [Save]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Avatar] Maria S. ★★★★★ 91% Match                       │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [Load More Results]                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Tasks:**
- [x] Create HTML structure with LMDR brand styling
- [x] Build filter panel with all search criteria
- [x] Create driver card component with match score display
- [x] Add match rationale tooltip/expansion
- [x] Implement responsive design (mobile-first)
- [x] Add loading states and empty state messaging

#### Task 8.1.2: Search Page JavaScript (PostMessage Bridge) ✅ COMPLETE
- [x] Implement `searchDrivers(filters)` → calls backend
- [x] Handle pagination/infinite scroll
- [x] Implement filter state management
- [x] Add debounced search on filter change
- [x] Handle quota exceeded state

#### Task 8.1.3: Wix Page Code for Search ✅ COMPLETE
```
File: src/pages/RecruiterDriverSearch.qtecw.js
```
- [x] Import backend services (driverMatching, subscriptionService)
- [x] Set up postMessage handlers
- [x] Implement search with quota checking
- [x] Return results with match scores

---

### Day 6-7: Driver Profile View (Phase 8.2) ✅ COMPLETE

#### Task 8.2.1: Profile Modal Component ✅ COMPLETE
```
Embedded in: RECRUITER_DRIVER_SEARCH.html
```

**Structure:**
```html
┌─────────────────────────────────────────────────────────────────┐
│  [X Close]                                                       │
│  ┌──────────┐  JOHN DOE                         94% Match       │
│  │  Avatar  │  Class A CDL | Hazmat, Tanker, Doubles            │
│  │          │  Dallas, TX | 5 years experience                   │
│  └──────────┘  Available: Immediately                            │
├─────────────────────────────────────────────────────────────────┤
│  WHY THIS MATCH                                                  │
│  ✓ CDL Class A matches your requirement                         │
│  ✓ Has Hazmat endorsement you need                              │
│  ✓ Within 25 miles of your Dallas terminal                      │
│  ✓ Salary expectation within your budget                        │
│  ⚠ 2 years less experience than preferred                       │
├─────────────────────────────────────────────────────────────────┤
│  QUALIFICATIONS                                                  │
│  CDL: Class A | Endorsements: H, T, X | Clean MVR               │
│  Equipment: Dry Van, Reefer, Flatbed                            │
├─────────────────────────────────────────────────────────────────┤
│  WORK HISTORY                                                    │
│  • ABC Trucking (2022-Present) - OTR Driver                     │
│  • XYZ Logistics (2019-2022) - Regional Driver                  │
├─────────────────────────────────────────────────────────────────┤
│  PREFERENCES                                                     │
│  Routes: Regional, Dedicated | Home Time: Weekly                │
│  Salary: $65,000 - $80,000                                      │
├─────────────────────────────────────────────────────────────────┤
│  [Save to Pipeline]  [Send Message]  [Schedule Call]  [Offer]   │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Tasks:**
- [x] Create modal HTML structure
- [x] Display all driver profile fields
- [x] Show match rationale with icons (✓/⚠/✗)
- [x] Add action buttons
- [x] Implement modal open/close animations
- [x] Handle "profile already viewed" state

#### Task 8.2.2: Profile View Logic ✅ COMPLETE
- [x] Call `getDriverProfile()` on modal open
- [x] Record profile view for quota tracking
- [x] Handle quota exceeded (show upgrade prompt instead)
- [x] Enable action buttons only after view recorded

#### Task 8.2.3: Save Driver UX Enhancements ✅ COMPLETE (BONUS)
- [x] Visual button feedback (spinner → success/error states)
- [x] Actionable error tooltips with context-aware guidance
- [x] "View profile before save" enforcement with tooltip
- [x] Retry button for failed saves (not disabled)

---

## Sprint 2: Quota UI & Stripe Integration (Phase 8.3-9)

### Day 8-9: Quota & Subscription UI (Phase 8.3)

#### Task 8.3.1: Quota Indicator Component
- [ ] Create header component showing views used/remaining
- [ ] Add visual progress bar (green → yellow → red)
- [ ] Show reset date ("Resets in 12 days")
- [ ] Link to upgrade for free/pro users

#### Task 8.3.2: Subscription Management Panel
```
File: src/public/CARRIER_SUBSCRIPTION.html (or modal in search page)
```
- [ ] Display current plan and features
- [ ] Show usage statistics
- [ ] Add upgrade/downgrade options
- [ ] Link to Stripe customer portal

#### Task 8.3.3: Upgrade Prompts
- [ ] Create upgrade modal for quota exceeded
- [ ] Create upgrade prompt for free users attempting search
- [ ] Show tier comparison (Free vs Pro vs Enterprise)
- [ ] Add "Contact Sales" option for Enterprise

#### Task 8.3.4: Connect to Recruiter Console
- [ ] Add "Search Drivers" tab to existing RecruiterDashboard
- [ ] Update navigation to include new page
- [ ] Ensure consistent styling with Kanban board

---

### Day 10-13: Stripe Billing Integration (Phase 9)

#### Task 9.1.1: Stripe Account Setup
- [ ] Create Stripe products:
  - `prod_ReverseMatchPro` - Pro Tier ($299/month)
  - `prod_ReverseMatchEnterprise` - Enterprise Tier ($799/month)
- [ ] Create Stripe prices (monthly billing)
- [ ] Set up webhook endpoint URL in Stripe Dashboard
- [ ] Add `STRIPE_SECRET_KEY` to Wix Secrets Manager
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Wix Secrets Manager

#### Task 9.1.2: Create Stripe Service
```
File: src/backend/stripeService.jsw
```

```javascript
// Functions to implement:
export async function createCheckoutSession(carrierId, priceId, successUrl, cancelUrl)
export async function createCustomerPortalSession(carrierId, returnUrl)
export async function handleWebhook(rawBody, signature)
export async function getSubscriptionStatus(carrierId)
export async function cancelSubscription(carrierId)
```

**Implementation Tasks:**
- [ ] Implement `createCheckoutSession()` - returns Stripe Checkout URL
- [ ] Implement `createCustomerPortalSession()` - for self-service management
- [ ] Implement `handleWebhook()` - process subscription events
- [ ] Implement `getSubscriptionStatus()` - check current tier
- [ ] Implement `cancelSubscription()` - handle cancellation

#### Task 9.1.3: Webhook Handler
```
File: src/backend/http-functions.js
```

**Events to handle:**
- [ ] `checkout.session.completed` → Create/upgrade subscription
- [ ] `customer.subscription.updated` → Update tier
- [ ] `customer.subscription.deleted` → Downgrade to free
- [ ] `invoice.payment_succeeded` → Reset quota for new period
- [ ] `invoice.payment_failed` → Send warning, grace period

#### Task 9.1.4: Connect Stripe to CarrierSubscriptions
- [ ] On checkout complete: Insert/update `CarrierSubscriptions` record
- [ ] Store `stripe_customer_id` and `stripe_subscription_id`
- [ ] Update `tier`, `quota_limit`, `current_period_end`
- [ ] On renewal: Reset `views_used` to 0

#### Task 9.1.5: Testing
- [ ] Test with Stripe test mode cards
- [ ] Verify checkout flow creates subscription
- [ ] Verify webhook updates collection
- [ ] Verify quota reset on renewal
- [ ] Verify cancellation downgrades to free
- [ ] Test failed payment handling

---

## Sprint 3: Notifications & Analytics (Phase 10-11)

### Day 14-15: Notifications (Phase 10)

#### Task 10.1.1: Match Notifications Service
```
File: src/backend/matchNotifications.jsw
```
- [ ] Create function to detect new matching drivers for a carrier
- [ ] Implement email notification (via SendGrid or Wix email)
- [ ] Implement SMS notification (via Twilio) - Enterprise only
- [ ] Add notification preferences to CarrierHiringPreferences

#### Task 10.1.2: Scheduled Job for Match Alerts
```
File: src/backend/jobs.config (add entry)
```
- [ ] Run daily at 8 AM carrier local time
- [ ] Query for new drivers matching each carrier's preferences
- [ ] Send digest email: "5 new drivers match your criteria"
- [ ] Track sent notifications to avoid duplicates

#### Task 10.1.3: Driver Notifications
- [ ] Notify driver when profile is viewed (optional setting)
- [ ] Notify driver when carrier sends message
- [ ] Add notification preferences to DriverProfiles

---

### Day 16-17: Analytics Dashboard (Phase 11)

#### Task 11.1.1: Admin Metrics Dashboard
```
File: src/public/ADMIN_REVERSE_MATCHING_ANALYTICS.html
```

**Metrics to display:**
- [ ] Total searches performed (daily/weekly/monthly)
- [ ] Total profiles viewed
- [ ] Total contacts made
- [ ] Conversion funnel: Search → View → Contact → Hire
- [ ] Subscription metrics: New, Active, Churned, MRR

#### Task 11.1.2: Analytics Backend
```
File: src/backend/reverseMatchingAnalytics.jsw
```
- [ ] Implement `getSearchMetrics(dateRange)`
- [ ] Implement `getConversionFunnel(dateRange)`
- [ ] Implement `getSubscriptionMetrics()`
- [ ] Implement `getTopSearchCriteria()` - what carriers search for most

#### Task 11.1.3: Tracking Events
- [ ] Log search events to analytics collection
- [ ] Log profile view events
- [ ] Log contact events
- [ ] Track hire outcomes (manual or via integration)

---

## Sprint 4: Documentation & Launch (Phase 12)

### Day 18-19: Documentation

#### Task 12.1.1: Carrier User Guide
```
File: docs/CARRIER_DRIVER_SEARCH_GUIDE.md
```
- [ ] How to set up hiring preferences
- [ ] How to search for drivers
- [ ] Understanding match scores
- [ ] Contacting drivers
- [ ] Managing your subscription

#### Task 12.1.2: API Documentation (Enterprise)
```
File: docs/REVERSE_MATCHING_API.md
```
- [ ] API endpoint reference
- [ ] Authentication requirements
- [ ] Rate limits by tier
- [ ] Webhook event reference
- [ ] Code examples

#### Task 12.1.3: Internal Documentation
- [ ] Update CLAUDE.md with reverse matching services
- [ ] Document troubleshooting procedures
- [ ] Document monitoring and alerting setup

---

### Day 20: Launch Preparation

#### Task 12.2.1: Security Audit
- [ ] Review all new endpoints for auth requirements
- [ ] Verify PII handling (driver data access)
- [ ] Verify subscription checks can't be bypassed
- [ ] Test for injection vulnerabilities

#### Task 12.2.2: Performance Testing
- [ ] Test search with 10,000+ driver profiles
- [ ] Verify response times < 2 seconds
- [ ] Test concurrent searches
- [ ] Identify and fix bottlenecks

#### Task 12.2.3: Monitoring Setup
- [ ] Add error alerting for backend services
- [ ] Add Stripe webhook failure alerts
- [ ] Add subscription churn alerts
- [ ] Set up daily metrics email

---

### Day 21: Launch

#### Task 12.3.1: Soft Launch
- [ ] Enable feature for 10 beta carriers
- [ ] Monitor for errors
- [ ] Gather feedback
- [ ] Fix critical issues

#### Task 12.3.2: Full Launch
- [ ] Enable feature for all carriers
- [ ] Send announcement email
- [ ] Publish carrier user guide
- [ ] Monitor metrics dashboard

---

## Quick Reference: File Inventory

### New Files to Create
```
src/test/reverseMatching.integration.test.js
src/public/RECRUITER_DRIVER_SEARCH.html
src/pages/RecruiterDriverSearch.xxxxx.js (Wix creates filename)
src/public/CARRIER_SUBSCRIPTION.html (optional - could be modal)
src/backend/stripeService.jsw
src/backend/http-functions.js (webhook handler)
src/backend/matchNotifications.jsw
src/public/ADMIN_REVERSE_MATCHING_ANALYTICS.html
src/backend/reverseMatchingAnalytics.jsw
docs/CARRIER_DRIVER_SEARCH_GUIDE.md
docs/REVERSE_MATCHING_API.md
```

### Existing Files to Modify
```
src/backend/jobs.config (add notification job)
src/public/RecruiterDashboard.html (add Search Drivers tab)
CLAUDE.md (document new services)
```

### Wix Collections to Verify/Create
```
CarrierSubscriptions (add stripe_customer_id, stripe_subscription_id fields)
AnalyticsEvents (new - for tracking)
NotificationLog (new - for tracking sent notifications)
```

---

## Stripe Pricing Reference

| Tier | Monthly Price | Profile Views | Features |
|------|--------------|---------------|----------|
| Free | $0 | 0 | See interest count only |
| Pro | $299 | 50/month | Search, view profiles, contact |
| Enterprise | $799 | Unlimited | + API access, SMS alerts, priority support |

---

## Success Metrics

**Launch Week:**
- [ ] 0 critical errors
- [ ] 10+ carriers activate search
- [ ] 3+ paid subscriptions

**Month 1:**
- [ ] 50+ carriers using search
- [ ] 20+ paid subscriptions
- [ ] $6,000+ MRR
- [ ] 5+ hires attributed to reverse matching

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Stripe webhook failures | Implement retry logic, monitor webhook success rate |
| Slow searches | Pre-index drivers, implement caching |
| Low conversion to paid | A/B test pricing, add more value to Pro tier |
| Driver data privacy | Require explicit consent for searchability |
| Quota gaming | Rate limit searches, detect abuse patterns |
