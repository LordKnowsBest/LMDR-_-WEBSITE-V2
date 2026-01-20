# Stripe Subscription System Integration Test Plan

**Document Version:** 1.0
**Last Updated:** January 2026
**System:** LMDR Carrier Subscription Billing

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Test Environment Setup](#3-test-environment-setup)
4. [Unit Test Scenarios](#4-unit-test-scenarios)
5. [Integration Test Scenarios](#5-integration-test-scenarios)
6. [Webhook Testing Procedures](#6-webhook-testing-procedures)
7. [Edge Cases and Error Scenarios](#7-edge-cases-and-error-scenarios)
8. [Manual QA Checklist](#8-manual-qa-checklist)
9. [Test Data Reference](#9-test-data-reference)

---

## 1. Overview

### 1.1 System Components Under Test

| Component | File | Purpose |
|-----------|------|---------|
| **stripeService.jsw** | `src/backend/stripeService.jsw` | Core Stripe API integration |
| **subscriptionService.jsw** | `src/backend/subscriptionService.jsw` | Subscription and quota management |
| **http-functions.js** | `src/backend/http-functions.js` | Webhook endpoint handler |
| **abandonmentEmailService.jsw** | `src/backend/abandonmentEmailService.jsw` | Checkout abandonment recovery |
| **Pricing Page** | `src/pages/CDL Driver Recruitment Pricing.o5c9o.js` | Frontend checkout flow |

### 1.2 Subscription Tiers

| Tier | Monthly Price | View Quota | Key Features |
|------|---------------|------------|--------------|
| **Free** | $0 | 0 views | See interest count only |
| **Pro** | $249/month | 25/month | Search, view profiles, messaging |
| **Enterprise** | $749/month | Unlimited | + API access, priority support |

### 1.3 Stripe Products Required

- `STRIPE_PRICE_PRO` - Pro monthly subscription ($249)
- `STRIPE_PRICE_PRO_MONTHLY` - Pro monthly (alternate)
- `STRIPE_PRICE_PRO_6MONTH` - Pro 6-month billing
- `STRIPE_PRICE_ENTERPRISE` - Enterprise monthly ($749)
- `STRIPE_PRICE_ENTERPRISE_6MONTH` - Enterprise 6-month billing
- `STRIPE_PRICE_PLACEMENT_DEPOSIT` - Per-driver placement fee ($100/driver)

---

## 2. Prerequisites

### 2.1 Stripe Test Account Configuration

1. **Create Stripe Test Account**
   - Log into Stripe Dashboard: https://dashboard.stripe.com
   - Toggle to "Test Mode" (switch in top-right)
   - Note your test API keys from Developers > API Keys

2. **Required Test API Keys**
   ```
   SECRET_KEY_STRIPE: sk_test_...
   PUBLISHABLE_STRIPE: pk_test_...
   STRIPE_WEBHOOK_SECRET: whsec_... (from webhook endpoint)
   ```

3. **Create Test Products & Prices**

   Navigate to Stripe Dashboard > Products and create:

   **Product: LMDR Pro**
   - Price 1: $249.00/month recurring (note ID: `price_xxx`)
   - Price 2: $1,245.00/6-month recurring (optional)
   - Metadata: `{ "tier": "pro", "view_quota": "25" }`

   **Product: LMDR Enterprise**
   - Price 1: $749.00/month recurring (note ID: `price_xxx`)
   - Price 2: $3,745.00/6-month recurring (optional)
   - Metadata: `{ "tier": "enterprise", "view_quota": "-1" }`

   **Product: Placement Deposit**
   - Price: $100.00 one-time (note ID: `price_xxx`)
   - Metadata: `{ "type": "placement_deposit" }`

4. **Configure Webhook Endpoint**
   - Go to Developers > Webhooks
   - Add endpoint: `https://www.lastmiledeliveryrecruiting.com/_functions/stripe_webhook`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 2.2 Wix Secrets Manager Setup

Add these secrets to Wix Secrets Manager (Dashboard > Developer Tools > Secrets Manager):

| Secret Name | Description |
|-------------|-------------|
| `SECRET_KEY_STRIPE` | Stripe secret key (sk_test_...) |
| `PUBLISHABLE_STRIPE` | Stripe publishable key (pk_test_...) |
| `STRIPE_PRICE_PRO` | Pro monthly price ID |
| `STRIPE_PRICE_ENTERPRISE` | Enterprise monthly price ID |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly price ID (alternate) |
| `STRIPE_PRICE_PRO_6MONTH` | Pro 6-month price ID |
| `STRIPE_PRICE_ENTERPRISE_6MONTH` | Enterprise 6-month price ID |
| `STRIPE_PRICE_PLACEMENT_DEPOSIT` | Placement deposit price ID |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |

### 2.3 Database Collections Required

Verify these collections exist in Wix CMS:

| Collection | Purpose |
|------------|---------|
| `CarrierSubscriptions` | Subscription records |
| `StripeEvents` | Webhook event log (idempotency) |
| `BillingHistory` | Payment/billing events |
| `CarrierDriverViews` | Profile view tracking |
| `CheckoutAbandonment` | Abandoned checkout tracking |
| `AbandonmentEmailLog` | Email send log |

### 2.4 Test Carrier Account

Create or identify a test carrier account with:
- Valid email address you control
- DOT number (can be test value like `TEST12345`)
- Logged-in Wix member account

---

## 3. Test Environment Setup

### 3.1 Stripe CLI Installation (Local Webhook Testing)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using scoop)
scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to local endpoint (if testing locally)
stripe listen --forward-to localhost:3000/_functions/stripe_webhook

# Get test webhook secret
# Copy the signing secret shown after running listen command
```

### 3.2 Stripe Test Card Numbers

| Card Number | Scenario |
|-------------|----------|
| `4242424242424242` | Successful payment |
| `4000000000000002` | Card declined |
| `4000000000009995` | Insufficient funds |
| `4000000000000341` | Attach card fails |
| `4000002500003155` | Requires authentication (3D Secure) |
| `4000003720000278` | 3D Secure 2 authentication required |

**For all test cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

## 4. Unit Test Scenarios

### 4.1 stripeService.jsw Functions

#### Test Case ST-001: getStripeSecrets()
**Purpose:** Verify secrets are retrieved and cached correctly

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call getStripeSecrets() first time | Returns secrets object, logs retrieval |
| 2 | Call getStripeSecrets() again | Returns cached secrets (no new API call) |
| 3 | Verify all required keys present | secretKey, publishableKey, pricePro, priceEnterprise exist |

#### Test Case ST-002: createCheckoutSession()
**Purpose:** Verify checkout session creation

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-002a | priceId='pro', carrierDot='12345', email='test@test.com' | success=true, checkoutUrl returned |
| ST-002b | priceId='enterprise', carrierDot='12345', email='test@test.com' | success=true, checkoutUrl returned |
| ST-002c | priceId=null | success=false, error='Missing required parameters' |
| ST-002d | carrierDot=null | success=false, error='Missing required parameters' |
| ST-002e | email=null | success=false, error='Missing required parameters' |
| ST-002f | priceId='pro', billingPeriod='6month' | Uses 6-month price ID |
| ST-002g | Carrier with active subscription | success=false, error contains 'already has active subscription' |

#### Test Case ST-003: createPortalSession()
**Purpose:** Verify customer portal session creation

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-003a | Valid carrierDot with subscription | success=true, portalUrl returned |
| ST-003b | Valid carrierDot without subscription | success=false, errorCode='NO_SUBSCRIPTION' |
| ST-003c | carrierDot=null | success=false, error='Carrier DOT required' |

#### Test Case ST-004: getSubscriptionByCarrier()
**Purpose:** Verify subscription lookup

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-004a | Existing carrier DOT with subscription | Returns subscription object |
| ST-004b | Carrier DOT without subscription | Returns null |
| ST-004c | carrierDot=null | Returns null |

#### Test Case ST-005: getSubscriptionDetails()
**Purpose:** Verify full subscription details with usage

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-005a | Carrier with Pro subscription | tier='pro', viewsLimit=25, features array |
| ST-005b | Carrier with Enterprise subscription | tier='enterprise', viewsLimit='unlimited' |
| ST-005c | Carrier without subscription | tier='free', viewsLimit=5, viewsRemaining=5 |

#### Test Case ST-006: upsertSubscription()
**Purpose:** Verify subscription create/update from webhook

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| ST-006a | New subscription (no existing) | Creates new record, returns subscriptionId |
| ST-006b | Existing subscription | Updates existing record |
| ST-006c | No carrier_dot in metadata | success=false, error='Missing carrier_dot metadata' |

#### Test Case ST-007: resetQuota()
**Purpose:** Verify quota reset on renewal

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-007a | Valid carrierDot, new period dates | success=true, views_used_this_month=0 |
| ST-007b | Non-existent carrierDot | success=false, error='Subscription not found' |

#### Test Case ST-008: recordBillingEvent()
**Purpose:** Verify billing event logging

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-008a | carrierDot, eventType='payment_succeeded', details | Record created in BillingHistory |
| ST-008b | Verify all fields saved | carrier_dot, event_type, amount, timestamp populated |

#### Test Case ST-009: isEventProcessed() / logStripeEvent()
**Purpose:** Verify idempotency tracking

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| ST-009a | New event ID | isEventProcessed returns false |
| ST-009b | Call logStripeEvent with event | Record created in StripeEvents |
| ST-009c | Same event ID again | isEventProcessed returns true |

#### Test Case ST-010: createPlacementDepositCheckout()
**Purpose:** Verify one-time placement payment checkout

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| ST-010a | Valid carrierDot, email, driverCount=3 | success=true, checkoutUrl with quantity=3 |
| ST-010b | driverCount=0 | success=false, error |
| ST-010c | Missing pricePlacementDeposit secret | success=false, error='Placement pricing not configured' |

---

### 4.2 subscriptionService.jsw Functions

#### Test Case SS-001: getSubscription()
**Purpose:** Verify subscription retrieval with defaults

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| SS-001a | Carrier with active subscription | Returns full subscription object |
| SS-001b | Carrier without subscription | Returns DEFAULT_FREE_SUBSCRIPTION |
| SS-001c | carrierDot=null | Returns DEFAULT_FREE_SUBSCRIPTION |
| SS-001d | Carrier with inactive subscription | Returns DEFAULT_FREE_SUBSCRIPTION |

#### Test Case SS-002: checkViewQuota()
**Purpose:** Verify quota checking logic

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SS-002a | Free tier | hasQuota=false, remaining=0 |
| SS-002b | Pro tier, 10/25 used | hasQuota=true, remaining=15 |
| SS-002c | Pro tier, 25/25 used | hasQuota=false, remaining=0 |
| SS-002d | Enterprise tier | hasQuota=true, remaining=-1 (unlimited) |
| SS-002e | Pro tier, quota reset needed | Quota resets, hasQuota=true |

#### Test Case SS-003: recordProfileView()
**Purpose:** Verify view recording and quota decrement

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SS-003a | Free tier | success=false, error='tier_not_allowed' |
| SS-003b | Pro tier, quota available | success=true, viewsUsed incremented |
| SS-003c | Pro tier, quota exhausted | success=false, error='quota_exhausted' |
| SS-003d | Enterprise tier | success=true, always succeeds |
| SS-003e | Same driver viewed twice today | alreadyViewed=true, quota not decremented |
| SS-003f | Same driver viewed different day | New view recorded, quota decremented |

#### Test Case SS-004: getUsageStats()
**Purpose:** Verify usage statistics calculation

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SS-004a | Pro tier, 18/25 used | used=18, quota=25, remaining=7, isExhausted=false |
| SS-004b | Pro tier, 25/25 used | isExhausted=true |
| SS-004c | Enterprise tier | isUnlimited=true, remaining=-1 |

#### Test Case SS-005: canSearchDrivers()
**Purpose:** Verify search permission check

| Test ID | Input | Expected Result |
|---------|-------|-----------------|
| SS-005a | subscription=null | false |
| SS-005b | Free tier, active | false |
| SS-005c | Pro tier, active | true |
| SS-005d | Enterprise tier, active | true |
| SS-005e | Pro tier, inactive | false |

#### Test Case SS-006: canViewProfile()
**Purpose:** Verify profile view permission check

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SS-006a | Free tier | false |
| SS-006b | Pro tier, quota available | true |
| SS-006c | Pro tier, quota exhausted | false |
| SS-006d | Enterprise tier | true (always) |

#### Test Case SS-007: resetQuotaIfNeeded()
**Purpose:** Verify automatic quota reset

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SS-007a | Free tier | wasReset=false (no reset needed) |
| SS-007b | Enterprise tier | wasReset=false (unlimited) |
| SS-007c | Pro tier, reset date in future | wasReset=false |
| SS-007d | Pro tier, reset date in past | wasReset=true, views_used_this_month=0 |

---

## 5. Integration Test Scenarios

### 5.1 Complete Checkout Flow (Happy Path)

#### Test Case INT-001: New Pro Subscription Checkout
**Purpose:** End-to-end new subscription creation

| Step | Action | Expected Result | Verify In |
|------|--------|-----------------|-----------|
| 1 | Navigate to pricing page | Page loads with tier cards | Browser |
| 2 | Click "Subscribe" on Pro tier | createCheckoutSession called | Console logs |
| 3 | Redirect to Stripe Checkout | Stripe checkout page loads | Browser URL |
| 4 | Enter test card 4242424242424242 | Card accepted | Stripe UI |
| 5 | Complete checkout | Redirect to success page | Browser URL |
| 6 | Webhook: checkout.session.completed | Event logged | Stripe Dashboard > Webhooks |
| 7 | Webhook: customer.subscription.created | Subscription created | Stripe Dashboard |
| 8 | Verify subscription in database | Record exists with status='active' | Wix CMS > CarrierSubscriptions |
| 9 | Verify billing event logged | payment_succeeded event | Wix CMS > BillingHistory |
| 10 | Test driver search access | Search returns results | Recruiter Console |
| 11 | Test profile view | View recorded, quota decremented | CarrierDriverViews |

#### Test Case INT-002: Enterprise Subscription Checkout
**Purpose:** Enterprise tier checkout flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1-5 | Same as INT-001 but select Enterprise | - |
| 6 | Verify subscription | plan_type='enterprise', monthly_view_quota=-1 |
| 7 | View 30 profiles | All succeed (unlimited) |

#### Test Case INT-003: 6-Month Billing Period
**Purpose:** Test non-monthly billing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select Pro with 6-month billing | Uses STRIPE_PRICE_PRO_6MONTH |
| 2 | Complete checkout | Amount charged: ~$1,245 |
| 3 | Verify subscription period | current_period_end is ~6 months out |

### 5.2 Customer Portal Flow

#### Test Case INT-004: Access Customer Portal
**Purpose:** Verify billing management access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User with active subscription clicks "Manage Billing" | createPortalSession called |
| 2 | Redirect to Stripe Portal | Portal loads with subscription details |
| 3 | User updates payment method | New card saved in Stripe |
| 4 | User views invoices | Invoice history displayed |
| 5 | User clicks return | Redirects back to recruiter console |

#### Test Case INT-005: Cancel Subscription via Portal
**Purpose:** Subscription cancellation flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access customer portal | Portal loads |
| 2 | Click "Cancel subscription" | Cancellation options shown |
| 3 | Confirm cancellation | cancel_at_period_end=true |
| 4 | Webhook: customer.subscription.updated | subscription record updated |
| 5 | Verify database | cancel_at_period_end=true, status still 'active' |
| 6 | User can still use service until period end | Search/view still works |

### 5.3 Subscription Renewal Flow

#### Test Case INT-006: Successful Renewal
**Purpose:** Automatic renewal processing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wait for billing period end (or trigger via Stripe test clock) | - |
| 2 | Stripe charges renewal | invoice.paid webhook sent |
| 3 | Webhook processed | Quota reset to 0 |
| 4 | Verify subscription | views_used_this_month=0, new period dates |
| 5 | Billing history | 'renewal' event logged |

#### Test Case INT-007: Failed Renewal Payment
**Purpose:** Payment failure handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Update payment method to failing card (4000000000000002) | Card saved |
| 2 | Trigger renewal attempt | invoice.payment_failed webhook |
| 3 | Webhook processed | status='past_due' |
| 4 | Billing history | 'payment_failed' event logged |
| 5 | Test service access | Should still work during grace period |
| 6 | After final retry fails | status='canceled', access reverted to free |

### 5.4 Placement Deposit Flow

#### Test Case INT-008: Placement Deposit Checkout
**Purpose:** One-time payment for driver placement

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill staffing form: 5 drivers needed | Form validates |
| 2 | Click "Pay Deposit" | createPlacementDepositCheckout called |
| 3 | Verify Stripe checkout | quantity=5, amount=$500 |
| 4 | Complete payment | checkout.session.completed webhook |
| 5 | Redirect to placement-success page | Session details displayed |
| 6 | Verify metadata | service_type='placement_deposit', driver_count=5 |

---

## 6. Webhook Testing Procedures

### 6.1 Webhook Endpoint Verification

#### Test Case WH-001: Health Check
**Purpose:** Verify endpoint is responding

```bash
curl -X GET https://www.lastmiledeliveryrecruiting.com/_functions/stripe_webhook
```

Expected Response:
```json
{
  "status": "healthy",
  "service": "stripe-webhook",
  "timestamp": "2026-01-15T..."
}
```

### 6.2 Signature Verification Tests

#### Test Case WH-002: Valid Signature
**Purpose:** Webhook with correct signature passes

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send webhook via Stripe CLI | Request processed |
| 2 | Check response | 200 OK, { received: true } |

#### Test Case WH-003: Invalid Signature
**Purpose:** Webhook with wrong signature rejected

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send request with invalid/missing stripe-signature header | 400 Bad Request |
| 2 | Check response | { error: 'Invalid signature' } |
| 3 | Verify no database changes | No records created/updated |

#### Test Case WH-004: Expired Timestamp
**Purpose:** Old webhook rejected

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send webhook with timestamp > 5 minutes old | Signature verification fails |
| 2 | Check response | 400 Bad Request |

### 6.3 Event Processing Tests

#### Test Case WH-005: Idempotency
**Purpose:** Duplicate events handled correctly

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send checkout.session.completed event | Processed, subscription created |
| 2 | Send same event again (same event ID) | Skipped with status='already_processed' |
| 3 | Verify database | Only one subscription record |

#### Test Case WH-006: Unknown Event Type
**Purpose:** Unhandled events acknowledged

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send event with type='some.unknown.event' | 200 OK |
| 2 | Check response | { status: 'unhandled' } |
| 3 | No errors thrown | - |

### 6.4 Using Stripe CLI for Webhook Testing

```bash
# Listen for webhooks and forward to endpoint
stripe listen --forward-to https://www.lastmiledeliveryrecruiting.com/_functions/stripe_webhook

# Trigger specific test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed

# Trigger with custom data
stripe trigger checkout.session.completed --add checkout_session:metadata[carrier_dot]=TEST12345
```

---

## 7. Edge Cases and Error Scenarios

### 7.1 Checkout Edge Cases

#### Test Case EC-001: Existing Active Subscription
**Scenario:** Carrier tries to subscribe when already subscribed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Carrier with active Pro subscription | - |
| 2 | Attempt to create new checkout session | success=false |
| 3 | Error message | 'Carrier already has an active subscription' |
| 4 | existingSubscription returned | Contains current subscription details |

#### Test Case EC-002: Missing Price Configuration
**Scenario:** Price ID not configured in secrets

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Remove STRIPE_PRICE_PRO from secrets | - |
| 2 | Attempt Pro checkout | success=false |
| 3 | Error message | 'Invalid price ID or billing period configuration' |

#### Test Case EC-003: Checkout Abandonment
**Scenario:** User starts but doesn't complete checkout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start checkout | Session created |
| 2 | Close browser (don't complete) | Session expires after 24 hours |
| 3 | checkout.session.expired webhook | trackAbandonedCheckout called |
| 4 | Verify CheckoutAbandonment record | Record created with email |
| 5 | After 2 hours | Email 1 sent |
| 6 | After 3 days | Email 2 sent |
| 7 | After 7 days | Email 3 sent |

#### Test Case EC-004: Abandonment Recovery
**Scenario:** User completes checkout after abandonment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger checkout.session.expired | Abandonment tracked |
| 2 | User returns and completes checkout | checkout.session.completed |
| 3 | Verify recovery | recovered=true, recoveredAt set |
| 4 | No more abandonment emails sent | Email sequence stopped |

### 7.2 Subscription Edge Cases

#### Test Case EC-005: Missing Carrier DOT in Metadata
**Scenario:** Webhook received without carrier_dot

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | customer.subscription.created with no metadata | - |
| 2 | upsertSubscription called | success=false |
| 3 | Error | 'Missing carrier_dot metadata' |
| 4 | Event still logged | StripeEvents record with error |

#### Test Case EC-006: Subscription Status Transitions
**Scenario:** Test all status transitions

| From Status | To Status | Trigger | Expected Behavior |
|-------------|-----------|---------|-------------------|
| (none) | active | subscription.created | New record, is_active=true |
| active | past_due | invoice.payment_failed | is_active=true (grace period) |
| past_due | active | invoice.paid | is_active=true, quota reset |
| past_due | canceled | Final retry fails | is_active=false |
| active | canceled | subscription.deleted | is_active=false |
| active | active (cancel_at_period_end) | subscription.updated | cancel_at_period_end=true |

### 7.3 Quota Edge Cases

#### Test Case EC-007: Quota Boundary
**Scenario:** Using exactly the quota limit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pro subscription with 24/25 views used | - |
| 2 | Record 25th view | success=true, remaining=0 |
| 3 | Attempt 26th view | success=false, error='quota_exhausted' |

#### Test Case EC-008: View Deduplication
**Scenario:** Same driver viewed multiple times same day

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View driver A | View recorded, quota decremented |
| 2 | View driver A again (same day) | alreadyViewed=true, quota unchanged |
| 3 | View driver B | New view, quota decremented |
| 4 | Next day, view driver A | New view recorded |

#### Test Case EC-009: Quota Reset Timing
**Scenario:** Automatic quota reset on period change

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pro subscription, 20/25 used | - |
| 2 | quota_reset_date passes | - |
| 3 | checkViewQuota called | resetQuotaIfNeeded triggers |
| 4 | Verify | views_used_this_month=0, new reset date |

### 7.4 Payment Edge Cases

#### Test Case EC-010: 3D Secure Authentication
**Scenario:** Card requires additional authentication

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use card 4000002500003155 | - |
| 2 | Checkout redirects to 3DS | Authentication modal appears |
| 3 | Complete authentication | Payment succeeds |
| 4 | Subscription created | Normal flow continues |

#### Test Case EC-011: Card Declined
**Scenario:** Payment method declined

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use card 4000000000000002 | - |
| 2 | Submit payment | Error shown in Stripe Checkout |
| 3 | User can retry with different card | - |
| 4 | No subscription created until success | - |

### 7.5 Concurrent Operations

#### Test Case EC-012: Race Condition - Double Checkout
**Scenario:** Two checkouts initiated simultaneously

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open pricing page in two tabs | - |
| 2 | Click subscribe in both tabs simultaneously | - |
| 3 | First checkout completes | Subscription created |
| 4 | Second checkout attempts | Blocked by existing subscription check |

---

## 8. Manual QA Checklist

### 8.1 Pre-Deployment Checklist

- [ ] All Stripe secrets configured in Wix Secrets Manager
- [ ] Stripe webhook endpoint configured and verified
- [ ] Test products and prices created in Stripe
- [ ] All database collections exist with correct schemas
- [ ] Triggered email templates created in Wix

### 8.2 Pricing Page Checklist

- [ ] Page loads without errors
- [ ] All three tiers displayed correctly (Free, Pro, Enterprise)
- [ ] Prices match Stripe configuration
- [ ] "Subscribe" buttons work for Pro and Enterprise
- [ ] "Contact Sales" button navigates correctly
- [ ] Logged-out users prompted to log in
- [ ] Logged-in users can proceed to checkout
- [ ] Current subscription status displayed for subscribed users
- [ ] "Manage Billing" button appears for subscribed users

### 8.3 Checkout Flow Checklist

- [ ] Redirect to Stripe Checkout works
- [ ] Correct price displayed in Stripe Checkout
- [ ] Carrier DOT passed in metadata
- [ ] Customer email pre-filled
- [ ] Success URL redirects correctly
- [ ] Cancel URL redirects correctly
- [ ] Success page shows correct information
- [ ] Canceled page shows appropriate messaging

### 8.4 Subscription Management Checklist

- [ ] Customer portal accessible
- [ ] Payment method can be updated
- [ ] Invoices viewable
- [ ] Subscription can be canceled
- [ ] Cancellation reflected in database
- [ ] Reactivation works (if canceled before period end)

### 8.5 Quota System Checklist

- [ ] Free tier cannot search drivers
- [ ] Free tier cannot view profiles
- [ ] Pro tier can search drivers
- [ ] Pro tier can view up to 25 profiles/month
- [ ] 26th view blocked with upgrade prompt
- [ ] Enterprise tier has unlimited views
- [ ] Quota counter updates in real-time
- [ ] Quota resets on renewal
- [ ] Duplicate views same day don't count

### 8.6 Webhook Processing Checklist

- [ ] Health check endpoint returns 200
- [ ] Valid webhooks processed successfully
- [ ] Invalid signatures rejected
- [ ] Duplicate events handled (idempotency)
- [ ] checkout.session.completed creates subscription
- [ ] invoice.paid resets quota
- [ ] invoice.payment_failed updates status
- [ ] customer.subscription.deleted cancels subscription
- [ ] checkout.session.expired tracks abandonment

### 8.7 Abandonment Email Checklist

- [ ] Abandoned checkout creates record
- [ ] Email 1 sent after 2 hours
- [ ] Email 2 sent after 3 days
- [ ] Email 3 sent after 7 days
- [ ] Completed checkout stops email sequence
- [ ] Recovery tracked when user converts

### 8.8 Placement Deposit Checklist

- [ ] Staffing form validates inputs
- [ ] Checkout shows correct quantity and total
- [ ] Payment completes successfully
- [ ] Success page displays correctly
- [ ] Metadata recorded correctly
- [ ] No subscription created (one-time payment)

---

## 9. Test Data Reference

### 9.1 Test Carriers

| Carrier DOT | Purpose | Email |
|-------------|---------|-------|
| TEST12345 | General testing | test@example.com |
| TEST_FREE | Free tier testing | free@example.com |
| TEST_PRO | Pro tier testing | pro@example.com |
| TEST_ENT | Enterprise testing | enterprise@example.com |

### 9.2 Test Subscription States

Create these subscription records for state testing:

```javascript
// Free tier (no record needed - default)

// Active Pro subscription
{
  carrier_dot: "TEST_PRO",
  plan_type: "pro",
  status: "active",
  is_active: true,
  monthly_view_quota: 25,
  views_used_this_month: 10,
  quota_reset_date: /* future date */
}

// Exhausted Pro subscription
{
  carrier_dot: "TEST_PRO_EXHAUSTED",
  plan_type: "pro",
  status: "active",
  is_active: true,
  monthly_view_quota: 25,
  views_used_this_month: 25
}

// Enterprise subscription
{
  carrier_dot: "TEST_ENT",
  plan_type: "enterprise",
  status: "active",
  is_active: true,
  monthly_view_quota: -1,
  views_used_this_month: 100
}

// Past due subscription
{
  carrier_dot: "TEST_PAST_DUE",
  plan_type: "pro",
  status: "past_due",
  is_active: true
}

// Canceled subscription
{
  carrier_dot: "TEST_CANCELED",
  plan_type: "pro",
  status: "canceled",
  is_active: false
}
```

### 9.3 Webhook Event Samples

**checkout.session.completed**
```json
{
  "id": "evt_test123",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test123",
      "customer": "cus_test123",
      "customer_email": "test@example.com",
      "subscription": "sub_test123",
      "metadata": {
        "carrier_dot": "TEST12345",
        "source": "lmdr_platform"
      }
    }
  }
}
```

**customer.subscription.created**
```json
{
  "id": "evt_test456",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_test123",
      "customer": "cus_test123",
      "status": "active",
      "current_period_start": 1704067200,
      "current_period_end": 1706745600,
      "metadata": {
        "carrier_dot": "TEST12345"
      },
      "items": {
        "data": [{
          "price": {
            "id": "price_pro_monthly"
          }
        }]
      }
    }
  }
}
```

**invoice.paid**
```json
{
  "id": "evt_test789",
  "type": "invoice.paid",
  "data": {
    "object": {
      "id": "in_test123",
      "subscription": "sub_test123",
      "amount_paid": 24900,
      "currency": "usd",
      "billing_reason": "subscription_cycle",
      "period_start": 1706745600,
      "period_end": 1709424000,
      "subscription_details": {
        "metadata": {
          "carrier_dot": "TEST12345"
        }
      }
    }
  }
}
```

---

## Appendix A: Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Checkout fails silently | Missing price ID | Check Wix Secrets Manager |
| Webhook returns 401 | Invalid signature | Verify STRIPE_WEBHOOK_SECRET |
| Subscription not created | Missing carrier_dot in metadata | Check checkout session creation |
| Quota not resetting | invoice.paid not processing | Check webhook logs |
| Portal URL not working | No customer ID | Verify subscription exists |

### Debug Logging

Enable detailed logging by checking:
- Wix Site Logs (Dashboard > Developer Tools > Logs)
- Stripe Webhook Logs (Dashboard > Developers > Webhooks > Select endpoint > Attempts)
- Browser Console (F12) for frontend errors

---

## Appendix B: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial test plan |
