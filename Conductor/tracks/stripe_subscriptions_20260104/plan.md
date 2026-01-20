# Track Plan: Stripe Subscription Billing Infrastructure

> **STATUS: TESTING** - Implementation complete, ready for integration testing.
>
> **Last Updated**: 2026-01-19
>
> **Test Plan**: See `docs/STRIPE_INTEGRATION_TEST_PLAN.md`

---

## Phase 1: Stripe Configuration & Secrets ✅

### 1.1 Stripe Dashboard Setup
- [x] Task: Create Stripe Product "LMDR Pro" with monthly price ($249)
- [x] Task: Create Stripe Product "LMDR Enterprise" with monthly price ($749)
- [x] Task: Configure Customer Portal settings (allow plan changes, cancellations)
- [x] Task: Create webhook endpoint in Stripe pointing to `/_functions/stripe_webhook`
- [x] Task: Enable webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`

### 1.2 Wix Secrets Configuration
- [x] Task: Add `SECRET_KEY_STRIPE` to Wix Secrets Manager
- [x] Task: Add `STRIPE_WEBHOOK_SECRET` to Wix Secrets Manager
- [x] Task: Add `STRIPE_PRICE_PRO` (price ID) to Wix Secrets Manager
- [x] Task: Add `STRIPE_PRICE_ENTERPRISE` (price ID) to Wix Secrets Manager
- [x] Task: Add `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_6MONTH`, `STRIPE_PRICE_ENTERPRISE_6MONTH` variants
- [x] Task: Add `STRIPE_PRICE_PLACEMENT_DEPOSIT` for one-time payments
- [ ] Task: Document all secret names in CLAUDE.md

### 1.3 Wix Collections Setup
- [x] Task: Extend `CarrierSubscriptions` collection with Stripe fields (stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_start, current_period_end, cancel_at_period_end)
- [x] Task: Create `StripeEvents` collection for webhook audit log
- [x] Task: Create `BillingHistory` collection for billing events
- [x] Task: Create `CarrierDriverViews` collection for view quota tracking
- [x] Task: Create `CheckoutAbandonment` and `AbandonmentEmailLog` collections
- [ ] Task: Update collection permissions in permissions.json
- [x] Task: Conductor - Verify Phase 1 Configuration

---

## Phase 2: Stripe Service - Core Functions ✅

> **File**: `src/backend/stripeService.jsw` (691 lines)

### 2.1 Stripe Client Setup
- [x] Task: Create `src/backend/stripeService.jsw` with Stripe SDK initialization
- [x] Task: Create `getStripeSecrets()` helper using Wix Secrets Manager
- [x] Task: Implement proper error handling for missing secrets

### 2.2 Checkout Session Implementation
- [x] Task: Implement `createCheckoutSession(priceId, carrierDot, email, billingPeriod)`
- [x] Task: Support monthly and 6-month billing periods
- [x] Task: Include carrier_dot in checkout session metadata
- [x] Task: Configure success_url and cancel_url
- [x] Task: Add support for trial periods (optional)

### 2.3 Portal Session Implementation
- [x] Task: Implement `createPortalSession(carrierDot)`
- [x] Task: Look up stripe_customer_id from CarrierSubscriptions
- [x] Task: Return portal URL for redirect

### 2.4 Subscription Query Implementation
- [x] Task: Implement `getSubscriptionByCarrier(carrierDot)`
- [x] Task: Implement `getSubscriptionDetails(carrierDot)` with full details
- [x] Task: Implement `getUsageStats(carrierDot)` for quota info
- [x] Task: Return full subscription record with usage stats

### 2.5 Additional Functions Implemented
- [x] Task: Implement `upsertSubscription()` for webhook-driven updates
- [x] Task: Implement `updateSubscriptionStatus()` for status changes
- [x] Task: Implement `resetQuota()` for monthly quota reset
- [x] Task: Implement `recordBillingEvent()` for billing history
- [x] Task: Implement `getBillingHistory()` for billing records
- [x] Task: Implement `isEventProcessed()` / `logStripeEvent()` for idempotency
- [x] Task: Implement `createPlacementDepositCheckout()` for one-time payments
- [x] Task: Implement `getPublishableKey()` for frontend Stripe.js
- [x] Task: Conductor - Verify Phase 2 Stripe Service ✅

---

## Phase 3: Webhook Handler ✅

> **File**: `src/backend/http-functions.js` (404 lines)

### 3.1 HTTP Function Setup
- [x] Task: Create `src/backend/http-functions.js`
- [x] Task: Implement HMAC-SHA256 signature verification using STRIPE_WEBHOOK_SECRET
- [x] Task: Implement timestamp replay attack prevention (5-minute tolerance)

### 3.2 Webhook Events Implemented (9 event types)
- [x] Task: Implement `checkout.session.completed` - create subscription record
- [x] Task: Implement `checkout.session.expired` - abandonment tracking
- [x] Task: Implement `customer.subscription.created` - new subscription registration
- [x] Task: Implement `customer.subscription.updated` - status/plan changes
- [x] Task: Implement `customer.subscription.deleted` - cancellation handling
- [x] Task: Implement `invoice.paid` - monthly billing + quota reset
- [x] Task: Implement `invoice.payment_failed` - failed payment handling

### 3.3 Security & Reliability
- [x] Task: Implement idempotency check via event ID logging
- [x] Task: Log all events to StripeEvents collection
- [x] Task: Return proper HTTP status codes (ok, badRequest, serverError)
- [x] Task: Add comprehensive console logging with `[Webhook]` prefix
- [x] Task: Implement health check endpoint (GET returns service status)

### 3.4 Abandonment Recovery Integration
- [x] Task: Integrate with `abandonmentEmailService` for recovery emails
- [x] Task: Implement 3-email sequence (2 hours, 3 days, 7 days)
- [x] Task: Track email sends in `AbandonmentEmailLog` collection
- [x] Task: Conductor - Verify Phase 3 Webhook Handler ✅

---

## Phase 4: Subscription Service Integration ✅

> **File**: `src/backend/subscriptionService.jsw` (512 lines)

### 4.1 Quota Management Implementation
- [x] Task: Implement `checkViewQuota(carrierDot)` - returns { hasQuota, remaining, resetDate }
- [x] Task: Implement `recordProfileView(carrierDot, driverId, viewType)` - tracks views
- [x] Task: Implement `getUsageStats(carrierDot)` - { used, quota, remaining, isExhausted, daysUntilReset }
- [x] Task: Implement `resetQuotaIfNeeded(carrierDot)` - automatic monthly reset
- [x] Task: Per-carrier daily view deduplication (prevent double-counting)
- [x] Task: View type classification (match_list, full_profile, contact_reveal)

### 4.2 Tier-Based Access Control
- [x] Task: Implement three-tier system: free (0 views), pro (25 views), enterprise (unlimited)
- [x] Task: Implement `canSearchDrivers(carrierDot)` helper
- [x] Task: Implement `canViewProfile(carrierDot)` helper
- [x] Task: Safe defaults to free tier on errors ("fail safe" philosophy)

### 4.3 Billing History Integration
- [x] Task: Billing history recording via webhook handlers in stripeService
- [x] Task: Billing period tracking in view records
- [x] Task: Comprehensive observability logging with tracing

### 4.4 Subscription Status Helpers
- [x] Task: Implement `getSubscription(carrierDot)` with fallback defaults
- [x] Task: Implement `getFullSubscriptionStatus(carrierDot)` for UI display
- [x] Task: Implement feature flag helpers for tier-based access
- [x] Task: Conductor - Verify Phase 4 Subscription Integration ✅

---

## Phase 5: Frontend - Subscription UI ✅

> **File**: `src/pages/CDL Driver Recruitment Pricing.o5c9o.js`

### 5.1 Pricing Page Integration
- [x] Task: Pricing page with tier display (Free, Pro $249, Enterprise $749)
- [x] Task: `startCheckout()` - subscription checkout flow
- [x] Task: `startPlacementCheckout()` - one-time payment flow
- [x] Task: `openBillingPortal()` - customer portal access
- [x] Task: `getFullSubscriptionStatus()` - current tier display
- [x] Task: `getStripePublishableKey()` - Stripe.js setup

### 5.2 Checkout Flow Integration
- [x] Task: Velo page code handler for checkout session creation
- [x] Task: Redirect to Stripe Checkout URL
- [x] Task: Success/cancel URL handling

### 5.3 Quota & Billing Features
- [ ] Task: Create `QUOTA_INDICATOR.html` component for search dashboard header
- [ ] Task: Display: current plan, views used/quota, progress bar, reset date
- [ ] Task: Add visual warning when quota is >80% used
- [ ] Task: Add "Quota Exhausted" state with upgrade prompt

### 5.4 Billing Management
- [x] Task: Customer Portal integration for self-service management
- [x] Task: Payment method management via Stripe Portal
- [x] Task: Invoice viewing via Stripe Portal
- [ ] Task: In-app billing history display

### 5.5 Recruiter Console Integration
- [ ] Task: Add quota indicator to Recruiter Console header
- [ ] Task: Add "Billing" tab to Recruiter Console navigation
- [x] Task: PostMessage handlers for subscription actions
- [ ] Task: Conductor - Verify Phase 5 Frontend (90% complete)

---

## Phase 6: Integration Testing & Polish 🔄 IN PROGRESS

> **Test Plan Created**: `docs/STRIPE_INTEGRATION_TEST_PLAN.md`

### 6.1 End-to-End Flow Tests
- [ ] Task: Test: Free user → Subscribe to Pro → Access search
- [ ] Task: Test: Pro user exhausts quota → Upgrade prompt shown
- [ ] Task: Test: Pro user → Upgrade to Enterprise → Unlimited access
- [ ] Task: Test: Subscription canceled → Downgrade to Free
- [ ] Task: Test: Payment fails → Grace period → Restricted access

### 6.2 Stripe Test Mode Verification
- [ ] Task: Test complete checkout flow with Stripe test cards
- [ ] Task: Test webhook delivery and processing
- [ ] Task: Test Customer Portal access and actions
- [ ] Task: Test failed payment scenarios with decline codes
- [ ] Task: Verify quota reset on simulated renewal

### 6.3 Error Handling (Implemented)
- [x] Task: Handle network failures during checkout creation (try/catch)
- [x] Task: Handle webhook signature verification failures (returns 400)
- [x] Task: Handle duplicate webhook events gracefully (idempotency)
- [x] Task: Handle subscription not found scenarios (safe defaults)
- [x] Task: User-friendly error messages in responses

### 6.4 Security Audit
- [x] Task: Webhook signature validation (HMAC-SHA256)
- [x] Task: Timestamp replay attack prevention (5-min tolerance)
- [x] Task: Secrets not exposed in client code (server-side only)
- [ ] Task: Verify all endpoints require authentication
- [ ] Task: Verify carriers can only access own subscription data
- [ ] Task: Test for quota manipulation vulnerabilities

### 6.5 Documentation
- [x] Task: Create comprehensive test plan (`docs/STRIPE_INTEGRATION_TEST_PLAN.md`)
- [ ] Task: Document Stripe configuration in tech-stack.md
- [ ] Task: Document webhook setup process
- [ ] Task: Document troubleshooting guide for billing issues
- [ ] Task: Update CLAUDE.md with billing-related context
- [ ] Task: Conductor - Final Verification & Phase 6 Complete

---

## Dependencies Summary

```
Phase 1 (Stripe Config)
    ↓
Phase 2 (Stripe Service)
    ↓
Phase 3 (Webhook Handler)
    ↓
Phase 4 (Subscription Integration)
    ↓
Phase 5 (Frontend UI)
    ↓
Phase 6 (Integration & Polish)
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [ ] All tests written (TDD RED phase)
- [ ] All tests passing (TDD GREEN phase)
- [ ] Code coverage meets requirements (>90%)
- [ ] No linting errors
- [ ] JSDoc documentation complete
- [ ] Security review passed
- [ ] Manual verification completed

---

## Reference: Existing Patterns

### From CDL Pricing Page (Placement Flow)
```javascript
// Pattern: Form → Velo → Redirect
const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/...';

// 1. Collect form data
// 2. Save to Wix collection via postMessage
// 3. On success, redirect to Stripe
window.open(STRIPE_PAYMENT_URL, '_blank');
```

### For Subscription Flow (This Track)
```javascript
// Pattern: Form → Velo → Checkout Session → Redirect
// 1. User clicks "Subscribe to Pro"
// 2. postMessage to Velo: { type: 'createCheckoutSession', priceId: 'pro' }
// 3. Velo calls stripeService.createCheckoutSession()
// 4. Velo returns { checkoutUrl }
// 5. Redirect: window.location.href = checkoutUrl
// 6. Stripe handles payment
// 7. Webhook updates CarrierSubscriptions
// 8. User redirected to success page
```

---

## Notes

- This track replaces Phase 9 (Stripe Billing) in the Reverse Matching track
- After completing this track, update reverse_matching_20251225 plan.md to mark Phase 9 as "See stripe_subscriptions_20260104"
- Enterprise "Contact Sales" flow can initially just be a mailto link or Calendly

---

## Implementation Summary (2026-01-19)

### Completed Components

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Stripe Service | `stripeService.jsw` | 691 | ✅ Complete |
| Subscription Service | `subscriptionService.jsw` | 512 | ✅ Complete |
| Webhook Handlers | `http-functions.js` | 404 | ✅ Complete |
| Pricing Page | `CDL Driver Recruitment Pricing.o5c9o.js` | - | ✅ Integrated |

### Features Implemented
- ✅ 3-tier subscriptions (Free/Pro $249/Enterprise $749)
- ✅ Monthly & 6-month billing periods
- ✅ Quota management (25 views/month for Pro, unlimited Enterprise)
- ✅ Customer portal self-service
- ✅ Abandoned checkout recovery (3-email sequence)
- ✅ One-time placement deposits ($100/driver)
- ✅ Comprehensive webhook handling (9 event types)
- ✅ Idempotency protection
- ✅ HMAC-SHA256 signature verification

### Remaining Work
- 🔄 Integration testing (test plan created)
- 🔄 Quota indicator UI component
- 🔄 Recruiter Console billing tab
- 🔄 Documentation updates
