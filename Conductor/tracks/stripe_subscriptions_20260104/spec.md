# Specification: Stripe Subscription Billing Infrastructure

## 1. Overview

This track implements the complete Stripe subscription billing infrastructure for LMDR's carrier subscription model. Unlike the existing placement pricing flow (one-time payments for recruiting services), this system enables recurring SaaS-style subscriptions for self-service driver search access.

### Business Context

| Model | Placement (Existing) | Subscription (This Track) |
|-------|---------------------|---------------------------|
| **Revenue Type** | Per-hire fee ($1,200) | Monthly recurring ($199-999/mo) |
| **Service** | LMDR recruits for carrier | Carrier searches driver pool |
| **Payment** | One-time per event | Recurring monthly |
| **Stripe Integration** | Payment Links | Subscriptions + Webhooks |

---

## 2. Subscription Tiers

### 2.1 Tier Definitions

| Tier | Price | Billing | View Quota | Features |
|------|-------|---------|------------|----------|
| **Free** | $0 | N/A | 0 | See interest count, upgrade prompts |
| **Pro** | $249/mo | Monthly | 25/month | Search, filter, view profiles, contact |
| **Enterprise** | $749/mo | Monthly | Unlimited | + API access, real-time alerts, priority support |

### 2.2 Feature Matrix

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| See "X drivers interested" count | ✅ | ✅ | ✅ |
| View interested driver list | ❌ | ✅ | ✅ |
| Search driver pool | ❌ | ✅ | ✅ |
| Filter by CDL/endorsements | ❌ | ✅ | ✅ |
| Filter by location | ❌ | ✅ | ✅ |
| Filter by experience | ❌ | ✅ | ✅ |
| View full driver profile | ❌ | ✅ (quota) | ✅ (unlimited) |
| Contact driver | ❌ | ✅ | ✅ |
| Save to pipeline | ❌ | ✅ | ✅ |
| Real-time match alerts | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Dedicated support | ❌ | ❌ | ✅ |
| Team seats | 1 | 3 | Unlimited |

---

## 3. Architecture

### 3.1 System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUBSCRIPTION LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   CARRIER    │    │    STRIPE    │    │  WIX VELO    │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         │  1. Click "Subscribe"                 │                          │
│         ├──────────────────────────────────────►│                          │
│         │                   │                   │                          │
│         │                   │  2. Create Checkout Session                  │
│         │                   │◄──────────────────┤                          │
│         │                   │                   │                          │
│         │  3. Redirect to Stripe Checkout       │                          │
│         │◄──────────────────┤                   │                          │
│         │                   │                   │                          │
│         │  4. Complete Payment                  │                          │
│         ├──────────────────►│                   │                          │
│         │                   │                   │                          │
│         │                   │  5. Webhook: checkout.session.completed      │
│         │                   ├──────────────────►│                          │
│         │                   │                   │                          │
│         │                   │                   │  6. Create/Update        │
│         │                   │                   │     CarrierSubscriptions │
│         │                   │                   │                          │
│         │  7. Redirect to Success Page          │                          │
│         │◄──────────────────┴───────────────────┤                          │
│         │                   │                   │                          │
│         │                   │  8. Monthly: invoice.paid                    │
│         │                   ├──────────────────►│                          │
│         │                   │                   │  9. Reset quota          │
│         │                   │                   │                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
                    ┌─────────────────────┐
                    │   Stripe Products   │
                    │  - Pro Monthly      │
                    │  - Enterprise Mo.   │
                    └─────────┬───────────┘
                              │
                              ▼
┌──────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│  Carrier UI  │───►│  stripeService.jsw  │───►│  CarrierSubscriptions│
│  (Subscribe) │    │  - createCheckout() │    │  Collection          │
└──────────────┘    │  - getPortalURL()   │    └──────────────────────┘
                    │  - handleWebhook()  │              │
                    └─────────────────────┘              │
                              ▲                         │
                              │                         ▼
                    ┌─────────────────────┐    ┌──────────────────────┐
                    │   Stripe Webhooks   │    │ subscriptionService  │
                    │  (http-functions)   │    │  - checkViewQuota()  │
                    └─────────────────────┘    │  - recordView()      │
                                               └──────────────────────┘
```

---

## 4. Stripe Configuration

### 4.1 Products & Prices

Create in Stripe Dashboard:

**Product: LMDR Pro**
- Price ID: `price_pro_monthly`
- Amount: $249.00 USD
- Billing: Monthly recurring
- Metadata: `{ "tier": "pro", "view_quota": 25 }`

**Product: LMDR Enterprise**
- Price ID: `price_enterprise_monthly`
- Amount: $749.00 USD
- Billing: Monthly recurring
- Metadata: `{ "tier": "enterprise", "view_quota": -1 }`

### 4.2 Webhook Events

Configure Stripe to send these events to `https://{site}/_functions/stripeWebhook`:

| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | New subscription created |
| `customer.subscription.updated` | Plan change (upgrade/downgrade) |
| `customer.subscription.deleted` | Cancellation |
| `invoice.paid` | Successful renewal - reset quota |
| `invoice.payment_failed` | Failed payment - restrict access |
| `customer.subscription.trial_will_end` | 3-day trial ending warning |

### 4.3 Customer Portal

Enable Stripe Customer Portal for self-service:
- Update payment method
- View invoices
- Cancel subscription
- Switch plans (Pro ↔ Enterprise)

---

## 5. Data Model

### 5.1 CarrierSubscriptions (Extend Existing)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Wix member ID |
| `carrier_dot` | String | DOT number (FK to Carriers) |
| `plan_type` | String | 'free', 'pro', 'enterprise' |
| `status` | String | 'active', 'past_due', 'canceled', 'trialing' |
| `stripe_customer_id` | String | Stripe customer ID |
| `stripe_subscription_id` | String | Stripe subscription ID |
| `stripe_price_id` | String | Current price ID |
| `monthly_view_quota` | Number | Max views per month (-1 = unlimited) |
| `views_used_this_month` | Number | Current usage |
| `current_period_start` | DateTime | Billing period start |
| `current_period_end` | DateTime | Billing period end (quota resets) |
| `cancel_at_period_end` | Boolean | Scheduled for cancellation |
| `trial_ends_at` | DateTime | Trial end date (if applicable) |
| `billing_email` | String | Email for invoices |
| `_createdDate` | DateTime | Subscription created |
| `_updatedDate` | DateTime | Last modified |

### 5.2 StripeEvents (New - Audit Log)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `stripe_event_id` | String | Stripe event ID (idempotency) |
| `event_type` | String | e.g., 'invoice.paid' |
| `carrier_dot` | String | Related carrier |
| `stripe_customer_id` | String | Stripe customer |
| `payload` | Object | Full event payload |
| `processed` | Boolean | Successfully processed |
| `error` | String | Error message if failed |
| `_createdDate` | DateTime | Event received |

### 5.3 BillingHistory (New)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | DOT number |
| `event_type` | String | 'subscription_created', 'renewal', 'upgrade', 'downgrade', 'canceled' |
| `from_plan` | String | Previous plan (for changes) |
| `to_plan` | String | New plan |
| `amount` | Number | Amount in cents |
| `stripe_invoice_id` | String | Related invoice |
| `_createdDate` | DateTime | Event timestamp |

---

## 6. API Design

### 6.1 stripeService.jsw

```javascript
// ============================================================
// CHECKOUT & PORTAL
// ============================================================

/**
 * Create Stripe Checkout session for new subscription
 * @param {string} priceId - Stripe price ID (pro or enterprise)
 * @param {string} carrierDot - Carrier DOT number
 * @param {string} email - Billing email
 * @returns {Object} { sessionId, checkoutUrl }
 */
export async function createCheckoutSession(priceId, carrierDot, email)

/**
 * Create Stripe Customer Portal session for self-service
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} { portalUrl }
 */
export async function createPortalSession(carrierDot)

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

/**
 * Get current subscription status for carrier
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} Full subscription record
 */
export async function getSubscription(carrierDot)

/**
 * Cancel subscription at period end
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} { success, cancelsAt }
 */
export async function cancelSubscription(carrierDot)

/**
 * Reactivate a subscription scheduled for cancellation
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} { success }
 */
export async function reactivateSubscription(carrierDot)

// ============================================================
// WEBHOOK HANDLERS (Internal)
// ============================================================

/**
 * Process incoming Stripe webhook event
 * @param {Object} event - Stripe event object
 * @returns {Object} { processed, action }
 */
export async function processWebhookEvent(event)
```

### 6.2 http-functions.js (Webhook Endpoint)

```javascript
/**
 * POST /_functions/stripeWebhook
 * Receives Stripe webhook events, verifies signature, processes
 */
export async function post_stripeWebhook(request)
```

### 6.3 subscriptionService.jsw (Extend Existing)

```javascript
/**
 * Check if carrier can view more profiles this month
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} { canView, remaining, quota, resetDate }
 */
export async function checkViewQuota(carrierDot)

/**
 * Record a profile view and decrement quota
 * @param {string} carrierDot - Carrier DOT number
 * @param {string} driverId - Driver profile viewed
 * @returns {Object} { success, remaining }
 */
export async function recordProfileView(carrierDot, driverId)

/**
 * Get usage statistics for billing period
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object} { used, quota, percentage, daysRemaining }
 */
export async function getUsageStats(carrierDot)

/**
 * Reset quota for new billing period (called by webhook)
 * @param {string} carrierDot - Carrier DOT number
 * @param {DateTime} periodStart - New period start
 * @param {DateTime} periodEnd - New period end
 */
export async function resetQuota(carrierDot, periodStart, periodEnd)
```

---

## 7. UI Components

### 7.1 Subscription Selection (New Subscriber)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHOOSE YOUR PLAN                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │        FREE         │  │    PRO ⭐ POPULAR   │  │     ENTERPRISE      │ │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤ │
│  │                     │  │                     │  │                     │ │
│  │        $0           │  │       $249          │  │       $749          │ │
│  │      forever        │  │      /month         │  │      /month         │ │
│  │                     │  │                     │  │                     │ │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤ │
│  │ • See interest      │  │ • 25 profile views  │  │ • Unlimited views   │ │
│  │   counts            │  │ • Full driver       │  │ • Real-time alerts  │ │
│  │                     │  │   search            │  │ • API access        │ │
│  │                     │  │ • Contact drivers   │  │ • Priority support  │ │
│  │                     │  │ • Pipeline tools    │  │ • Unlimited seats   │ │
│  │                     │  │ • 3 team seats      │  │                     │ │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤ │
│  │   [Current Plan]    │  │   [Subscribe Now]   │  │   [Contact Sales]   │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Quota Indicator (Search Dashboard Header)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DRIVER SEARCH                                          Pro Plan  18/25 ▼  │
│                                                         ████████████░░░░░░ │
│                                                         Resets in 12 days  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Upgrade Prompt (Quota Exhausted)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  You've used all 25 profile views this month                            │
│                                                                             │
│  Your quota resets on January 15, 2026.                                    │
│                                                                             │
│  Need more views now?                                                       │
│  [Upgrade to Enterprise - Unlimited Views]                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Billing Management Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUBSCRIPTION & BILLING                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT PLAN                                                               │
│  ─────────────                                                              │
│  Pro • $249/month                                                           │
│  Next billing: January 15, 2026                                            │
│                                                                             │
│  USAGE THIS PERIOD                                                          │
│  ─────────────────                                                          │
│  Profile Views: 18/25                                                       │
│  ████████████████░░░░░░░░ 72%                                              │
│                                                                             │
│  [Upgrade Plan]  [Manage Payment Method]  [View Invoices]  [Cancel]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Security Considerations

### 8.1 Webhook Security

- **Signature Verification**: Verify Stripe signature on every webhook using `STRIPE_WEBHOOK_SECRET`
- **Idempotency**: Check `stripe_event_id` in `StripeEvents` to prevent duplicate processing
- **Timing**: Process webhooks within Stripe's retry window (72 hours)

### 8.2 API Security

- **Authentication**: All subscription endpoints require authenticated Wix member
- **Authorization**: Carrier can only access their own subscription data
- **Rate Limiting**: Prevent quota manipulation by rate limiting view recording

### 8.3 Secrets Management

Store in Wix Secrets Manager:
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_PRICE_PRO` - Pro tier price ID
- `STRIPE_PRICE_ENTERPRISE` - Enterprise tier price ID

---

## 9. Error Handling

### 9.1 Payment Failures

| Scenario | Action |
|----------|--------|
| Initial payment fails | Don't create subscription, show error |
| Renewal fails (1st attempt) | Status → 'past_due', send email, allow 3-day grace |
| Renewal fails (final) | Status → 'canceled', restrict to Free tier |

### 9.2 Webhook Failures

| Scenario | Action |
|----------|--------|
| Invalid signature | Log, reject (401) |
| Unknown event type | Log, acknowledge (200) |
| Processing error | Log to StripeEvents, Stripe will retry |
| Duplicate event | Skip processing, acknowledge (200) |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Checkout conversion | >40% | Started checkout → Subscribed |
| Free → Paid conversion | >10% | Free users upgrading |
| Monthly churn | <5% | Cancellations / Active |
| Failed payment recovery | >70% | Recovered within retry period |
| MRR growth | >15%/mo | Month-over-month recurring revenue |

---

## 11. Integration with Existing Services

### 11.1 subscriptionService.jsw

The existing `subscriptionService.jsw` (from Reverse Matching track) already implements quota checking. This track adds:
- Stripe sync on subscription changes
- Quota reset on renewal webhook
- Billing period tracking

### 11.2 driverMatching.jsw

Already checks subscription tier before returning results. No changes needed - just ensure `CarrierSubscriptions` is updated by webhooks.

### 11.3 Recruiter Console UI

Add to existing Recruiter Console:
- Quota indicator in header
- Billing management tab
- Upgrade prompts when quota exhausted

---

## 12. Open Questions

1. **Trial Period**: Should Pro have a 7-day free trial?
2. **Annual Billing**: Offer discount for annual commitment (e.g., 2 months free)?
3. **Overage**: Allow purchasing additional views beyond quota?
4. **Team Management**: How do Enterprise seats work with Wix Members?
5. **Proration**: How to handle mid-cycle upgrades/downgrades?
