# Stripe Integration Setup Guide

## Wix Secrets Manager Configuration

Configure the following secrets in Wix Secrets Manager (Dashboard > Developer Tools > Secrets Manager):

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SECRET_KEY_STRIPE` | `sk_live_...` | Stripe Secret Key (from Stripe Dashboard > Developers > API Keys) |
| `PUBLISHABLE_STRIPE` | `pk_live_...` | Stripe Publishable Key |
| `STRIPE_PRICE_PRO` | `price_1Sq9ZDGDzwOlOJxzTkOsdyTI` | Pro Plan Monthly ($249/mo) |
| `STRIPE_PRICE_ENTERPRISE` | `price_1Sq9ZDGDzwOlOJxzmFDK7GDy` | Enterprise Plan Monthly ($749/mo) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_1Sq9ZDGDzwOlOJxzTkOsdyTI` | Same as STRIPE_PRICE_PRO |
| `STRIPE_PRICE_PRO_6MONTH` | `price_1SrKQsGDzwOlOJxzr4EQt5ky` | Pro Plan 6-Month ($1,494) |
| `STRIPE_PRICE_ENTERPRISE_6MONTH` | `price_1SrKQtGDzwOlOJxzqAoflgiH` | Enterprise Plan 6-Month ($3,594) |
| `STRIPE_PRICE_PLACEMENT_DEPOSIT` | `price_1SrKR7GDzwOlOJxzkIS9fCnY` | VelocityMatch Placement Deposit ($100) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook signing secret (from Stripe Dashboard > Developers > Webhooks) |

### Note on Pro Monthly Pricing
Your Stripe account has two Pro monthly prices:
- `price_1Sq9ZDGDzwOlOJxzTkOsdyTI` = $249/month (recommended)
- `price_1SrKQrGDzwOlOJxzyNPvkFEg` = $299/month (alternative)

Use the $249 price unless you want the higher rate.

---

## Success/Cancel Pages Setup

### 1. Create "Subscription Success" Page

**In Wix Editor:**
1. Create a new page: Add Page > Blank Page
2. Set page name: "Subscription Success"
3. Set URL: `/subscription-success`
4. Add HTML iframe component to the page
5. In HTML component settings, set to embed: `Subscription_Success.html` from `/src/public/`
6. Open the page code panel (bottom of editor)
7. Copy contents from `src/pages/Subscription Success.page-code.js`
8. Save and sync with `wix sync`

### 2. Verify "Subscription Canceled" Page
- Page should exist at URL: `/subscription-canceled`
- Should have HTML component with `Subscription_Canceled.html`
- Page code should be in `src/pages/Subscription Canceled.exqj3.js`

### 3. Verify "Placement Success" Page
- Page should exist at URL: `/placement-success`
- Should have HTML component with `Placement_Success.html`
- Page code is in `src/pages/Placement Success.tz647.js`

---

## Checkout Flow URLs

The `subscriptionService.jsw` is configured to redirect to:

| Checkout Type | Success URL | Cancel URL |
|--------------|-------------|------------|
| Subscription | `/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan={priceId}` | `/subscription-canceled?plan={priceId}` |
| Placement | `/placement-success?session_id={CHECKOUT_SESSION_ID}&drivers={count}` | `/subscription-canceled?service=placement` |

---

## Webhook Configuration

Configure a webhook endpoint in Stripe Dashboard > Developers > Webhooks:

**Endpoint URL:** `https://www.lastmiledr.app/_functions/stripeWebhook`

**Events to listen for:**
- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## Testing Checklist

- [ ] Wix Secrets Manager has all required secrets
- [ ] Subscription Success page exists with HTML component
- [ ] Subscription Canceled page exists with HTML component
- [ ] Placement Success page exists with HTML component
- [ ] Test Pro subscription checkout flow
- [ ] Test Enterprise subscription checkout flow
- [ ] Test Placement deposit checkout flow
- [ ] Verify webhook receives events
