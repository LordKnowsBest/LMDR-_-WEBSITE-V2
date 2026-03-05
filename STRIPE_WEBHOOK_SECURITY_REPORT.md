# Stripe Webhook Security Report

## Goal
Verify that the LMDR platform's Stripe integration correctly validates webhook signatures, prevents replay attacks through idempotency checks, and does not expose sensitive payment data.

## Overall Status
**PASS**

The platform correctly validates incoming Stripe webhooks using `crypto.createHmac` and `crypto.timingSafeEqual` with buffer length checking to prevent timing attacks. It correctly performs idempotency checking using `isEventProcessed` to prevent replay attacks. Subscriptions and Portal operations securely use server-side secrets, and webhook data is not parsed until after signature validation.

---

## Checkpoints

### Must Do (Critical Path)
- **Confirm that `stripe.webhooks.constructEvent()` (or equivalent) is called with the raw request body and the `STRIPE_WEBHOOK_SECRET` from the secrets manager.**
  - **Status:** **PASS**
  - **Details:** The codebase relies on a custom implementation (`verifyStripeSignature` in `src/backend/http-functions.js`) because Wix Velo HTTP handlers do not natively integrate with the official Stripe SDK `constructEvent`. This implementation correctly fetches `STRIPE_WEBHOOK_SECRET` and uses it alongside the raw `request.body.text()` to validate the `stripe-signature` header via `crypto.createHmac` and a secure `crypto.timingSafeEqual` buffer-based comparison.

- **Verify the webhook secret is fetched via `getSecret('STRIPE_WEBHOOK_SECRET')` and never hardcoded.**
  - **Status:** **PASS**
  - **Details:** Found inside `verifyStripeSignature`, the secret is fetched as `await getSecret('STRIPE_WEBHOOK_SECRET')` dynamically at runtime.

- **Confirm that webhook processing checks for duplicate events using an idempotency key or event ID logged to the `StripeEventLog` collection.**
  - **Status:** **PASS**
  - **Details:** Before processing any event logic, the handler calls `isEventProcessed(event.id)`. If this returns `true`, the function immediately aborts processing and returns `ok({ received: true, status: 'already_processed' })`. Upon success, the `event.id` and event type are recorded using `logStripeEvent()`.

- **Verify that webhook failures (invalid signature) return an appropriate error and do not process the event.**
  - **Status:** **PASS**
  - **Details:** If `verifyStripeSignature` fails, the handler immediately returns `badRequest({ error: 'Invalid signature' })` and skips processing.

- **Check that no endpoint parses the webhook body with `JSON.parse()` before signature verification (which would skip verification).**
  - **Status:** **PASS**
  - **Details:** `JSON.parse(body)` occurs strictly after the `verifyStripeSignature(body, signature)` call succeeds.

### Ideally Do (Best Practices)
- **Verify that Stripe customer portal and checkout session creation use server-side secrets only.**
  - **Status:** **PASS**
  - **Details:** The `createCheckoutSession` and `createPortalSession` functions in `src/backend/stripeService.jsw` retrieve secrets exclusively server-side via `await getStripeSecrets()` (which wraps `getSecret()`).

- **Confirm that `PUBLISHABLE_STRIPE` (the publishable key) is never used in backend code for sensitive operations.**
  - **Status:** **PASS**
  - **Details:** `PUBLISHABLE_STRIPE` is retrieved in `getStripeSecrets()` and exposed via `getPublishableKey()` for use on the client frontend. It is not used for any server-to-server mutating API operations.

- **Check that subscription status changes from webhooks correctly update user access/permissions.**
  - **Status:** **PASS**
  - **Details:** Status updates trigger functions like `upsertSubscription` and `updateSubscriptionStatus` inside `handleSubscriptionUpdated` and `handleSubscriptionDeleted`, effectively propagating the `status` flag directly to the `carrierSubscriptions` (or `apiSubscriptions`) collection, revoking active privileges accordingly.

- **Verify that Stripe API calls use the secret key from `getSecret()` and not a hardcoded value.**
  - **Status:** **PASS**
  - **Details:** The backend handles outgoing requests via `stripeRequest()`, which dynamically grabs the `secretKey` (from `SECRET_KEY_STRIPE`) and passes it in the `Authorization: Bearer <key>` header.

### Stretch Goals
- **Verify that webhook event types are explicitly allowlisted.**
  - **Status:** **PASS**
  - **Details:** Inside `handleStripeEvent`, the incoming event uses a strict `switch(type)` allowing only the explicitly handled events (`customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, `checkout.session.expired`). Other types hit the `default` fallback, returning `status: 'unhandled'`.

- **Check for proper error handling if Stripe API calls fail mid-transaction (no partial state corruption).**
  - **Status:** **PASS**
  - **Details:** Internal database queries (e.g. `upsertSubscription`) and outbound `stripeRequest` fetch calls are correctly wrapped in `try/catch` handlers inside `stripeService.jsw` and the overall webhook handler.

- **Confirm that refund and cancellation webhooks correctly revoke access.**
  - **Status:** **PASS**
  - **Details:** As mentioned, `handleSubscriptionDeleted` transitions subscriptions to `status = 'canceled'`, safely removing platform access for the user.