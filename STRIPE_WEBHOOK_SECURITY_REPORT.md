# Stripe Webhook & Payment Security Assessment

**Date:** `2025-05-15`
**Target:** LMDR Platform (`src/backend/stripeService.jsw`, `src/backend/http-functions.js`)
**Assessor:** Payment Security Specialist

## Executive Summary
This assessment verifies the critical security controls surrounding the Stripe integration, specifically webhook signature validation, idempotency, and secrets management. Following remediation efforts, the integration successfully passes all mandatory security checkpoints.

---

## Must Do Checkpoints (Critical Path)

### 1. Webhook Signature Verification
**Goal:** Confirm `stripe.webhooks.constructEvent()` (or equivalent) is called with the raw request body and `STRIPE_WEBHOOK_SECRET` from the secrets manager.
**Status:** **PASS**
**Details:** The webhook handler in `src/backend/http-functions.js` reads the raw body (`request.body.text()`) and the `stripe-signature` header. It manually computes the HMAC-SHA256 signature using the Node.js `crypto` module (via `computeHmacSignature`) and `STRIPE_WEBHOOK_SECRET` retrieved from `wix-secrets-backend`. It then performs a timing-safe comparison (`crypto.timingSafeEqual`) against the provided signature.

### 2. Secret Key Management (Webhook)
**Goal:** Verify the webhook secret is fetched via `getSecret('STRIPE_WEBHOOK_SECRET')` and never hardcoded.
**Status:** **PASS**
**Details:** `STRIPE_WEBHOOK_SECRET` is securely fetched dynamically using `getSecret('STRIPE_WEBHOOK_SECRET')` inside `verifyStripeSignature()`. It is not hardcoded anywhere in the codebase.

### 3. Idempotency Checks
**Goal:** Confirm that webhook processing checks for duplicate events using an idempotency key or event ID logged to the `StripeEventLog` collection.
**Status:** **PASS**
**Details:** In `post_stripe_webhook`, before processing the event payload, it calls `isEventProcessed(event.id)` (implemented in `src/backend/stripeService.jsw`). If true, it returns early. After processing, it logs the event via `logStripeEvent(event.id, ...)`.

### 4. Failure Handling (Invalid Signature)
**Goal:** Verify that webhook failures (invalid signature) return an appropriate error and do not process the event.
**Status:** **PASS**
**Details:** If `verifyStripeSignature` fails (either due to missing signature, format error, timestamp out of bounds, or signature mismatch), `post_stripe_webhook` logs an error and immediately returns a `400 Bad Request` (`badRequest({ error: 'Invalid signature' })`), preventing any downstream business logic from executing.

### 5. Prevent Premature JSON Parsing
**Goal:** Check that no endpoint parses the webhook body with `JSON.parse()` before signature verification.
**Status:** **PASS**
**Details:** The raw text body is read (`await request.body.text()`) and passed directly to `verifyStripeSignature(body, signature)`. `JSON.parse(body)` is only called *after* verification succeeds.

---

## Ideally Do Checkpoints

### 6. Server-Side Secrets for Session Creation
**Goal:** Verify that Stripe customer portal and checkout session creation use server-side secrets only.
**Status:** **PASS**
**Details:** Both `createCheckoutSession` and `createPortalSession` in `src/backend/stripeService.jsw` make direct server-to-server HTTP calls to the Stripe API (`https://api.stripe.com/v1`) using the secret key (`SECRET_KEY_STRIPE`) as the Bearer token.

### 7. Publishable Key Safety
**Goal:** Confirm that `PUBLISHABLE_STRIPE` is never used in backend code for sensitive operations.
**Status:** **PASS**
**Details:** The publishable key is fetched via `getStripeSecrets` but is only exposed via `getPublishableKey()` for frontend use. All API requests (`stripeRequest`) correctly use the `secretKey`.

### 8. Subscription Status Sync
**Goal:** Check that subscription status changes from webhooks correctly update user access/permissions.
**Status:** **PASS**
**Details:** Handlers for `customer.subscription.updated` and `customer.subscription.deleted` correctly call `upsertSubscription` and `updateSubscriptionStatus`, which update the local database (`carrierSubscriptions`), directly affecting user tiers/quotas.

### 9. Secret Key Management (API)
**Goal:** Verify that Stripe API calls use the secret key from `getSecret()` and not a hardcoded value.
**Status:** **PASS**
**Details:** `SECRET_KEY_STRIPE` is retrieved dynamically via `getSecret('SECRET_KEY_STRIPE')` in `getStripeSecrets()` and used for all calls made through `stripeRequest()`.

---

## Stretch Goals

### 10. Event Type Allowlist
**Goal:** Verify that webhook event types are explicitly allowlisted.
**Status:** **PASS**
**Details:** `handleStripeEvent` in `src/backend/http-functions.js` uses a `switch` statement to explicitly handle only expected events (`customer.subscription.*`, `invoice.*`, `checkout.session.*`). Unhandled events log a message and return safely without modifying state.

### 11. Transactional Integrity
**Goal:** Check for proper error handling if Stripe API calls fail mid-transaction.
**Status:** **PASS**
**Details:** The `stripeRequest` helper catches HTTP errors and throws them. The calling functions (e.g., `createCheckoutSession`) wrap the calls in `try/catch` blocks, returning structured error responses `{ success: false, error: ... }` rather than failing ungracefully.

### 12. Refund/Cancellation Access Revocation
**Goal:** Confirm that refund and cancellation webhooks correctly revoke access.
**Status:** **PASS**
**Details:** `handleSubscriptionDeleted` and `handlePaymentFailed` correctly set the subscription status to `canceled` or `past_due` via `updateSubscriptionStatus`, effectively revoking access.

---

## Conclusion
The LMDR Stripe integration is secure. The critical timing attack vulnerability in the signature verification logic has been successfully remediated by implementing `crypto.timingSafeEqual` and `crypto.createHmac`. The system correctly enforces idempotency and handles secrets securely.
