# Stripe Webhook Security Assessment Report

**Date:** $(date +%Y-%m-%d)
**Goal:** Verify webhook signature validation, idempotency logic, and ensure sensitive payment data and state updates are protected from forged requests.

## Security Checkpoints

### 1. Signature Validation (Critical) - PASS
**Requirement:** Confirm that webhook events are validated using Stripe's HMAC-SHA256 signature verification before any business logic executes.
**Finding:** The custom implementation in `src/backend/http-functions.js` (`verifyStripeSignature`) validates signatures using a timestamp check and HMAC-SHA256 computation via the Node.js `crypto` module (`crypto.createHmac`). Critically, the signature comparison was updated to use `crypto.timingSafeEqual` with `Buffer.from` to securely compare the computed and incoming hashes, preventing timing attack vulnerabilities that existed in the previous native string comparison implementation.
**Remediation:** Replaced `expectedSignature !== signatureHash` with `crypto.timingSafeEqual` and Web Crypto API with Node.js native `crypto`.

### 2. Secure Secret Retrieval - PASS
**Requirement:** Verify the webhook secret is fetched via `getSecret('STRIPE_WEBHOOK_SECRET')` and never hardcoded.
**Finding:** The secret is dynamically fetched from Wix Secrets Manager using `await getSecret('STRIPE_WEBHOOK_SECRET')` at the beginning of `verifyStripeSignature()`. No hardcoded secrets exist in the codebase.

### 3. Idempotency & Replay Protection - PASS
**Requirement:** Confirm that webhook processing checks for duplicate events using an idempotency key or event ID logged to the `StripeEventLog` collection.
**Finding:** Inside `post_stripe_webhook`, before routing the event, the system checks `await isEventProcessed(event.id)`. If `true`, it logs "already processed" and returns HTTP 200 OK without executing business logic. Upon successful processing, `logStripeEvent(event.id, ...)` records the event to prevent future replays.

### 4. Fail-Closed Error Handling - PASS
**Requirement:** Verify that webhook failures (invalid signature) return an appropriate error and do not process the event.
**Finding:** If `verifyStripeSignature()` fails (returns `success: false`), `post_stripe_webhook` logs an error and immediately returns a `badRequest` (HTTP 400). Execution stops before any parsing or business logic occurs.

### 5. Proper JSON Parsing Sequence - PASS
**Requirement:** Check that no endpoint parses the webhook body with `JSON.parse()` before signature verification.
**Finding:** The raw request body is read via `await request.body.text()`. This raw string is passed to `verifyStripeSignature`. `JSON.parse(body)` is only called *after* `verifyStripeSignature` returns success. This guarantees the signature is verified against the exact unparsed payload.

### 6. Server-Side Secret Enforcement for Portals - PASS
**Requirement:** Verify that Stripe customer portal and checkout session creation use server-side secrets only.
**Finding:** Functions `createCheckoutSession` and `createPortalSession` in `src/backend/stripeService.jsw` retrieve secrets via `getStripeSecrets()` (which calls `getSecret`) and use the `secretKey` to authorize requests (`Authorization: Bearer ${secrets.secretKey}`) to the Stripe API.

### 7. Publishable Key Security - PASS
**Requirement:** Confirm that `PUBLISHABLE_STRIPE` is never used in backend code for sensitive operations.
**Finding:** The `publishableKey` is fetched in `getStripeSecrets()` but is only exposed to the frontend via the `getPublishableKey()` facade. It is explicitly not used to construct Authorization headers for backend API requests.

### 8. Subscription Status Updates - PASS
**Requirement:** Check that subscription status changes from webhooks correctly update user access/permissions.
**Finding:** Handlers like `handleSubscriptionUpdated` and `handleSubscriptionDeleted` call `upsertSubscription` and `updateSubscriptionStatus`. These update the respective database collections (e.g. changing `status` to `canceled` or `past_due` and `is_active` to `false`), correctly locking or granting access as determined by the `carrierSubscriptions` data flow.

### 9. Stripe API Authorization - PASS
**Requirement:** Verify that Stripe API calls use the secret key from `getSecret()` and not a hardcoded value.
**Finding:** `stripeRequest()` constructs the Authorization header using `secrets.secretKey`, which is reliably sourced from `getSecret('SECRET_KEY_STRIPE')` and cached in memory.

### 10. Explicit Event Allowlist - PASS
**Requirement:** Verify that webhook event types are explicitly allowlisted.
**Finding:** `handleStripeEvent` contains a `switch(type)` statement covering only explicit expected events (`customer.subscription.created`, `invoice.paid`, `checkout.session.completed`, etc.). The `default` case returns `status: 'unhandled'` without triggering any state changes.

## Conclusion
The Stripe Webhook integration securely validates signatures, prevents replay attacks via robust idempotency checks, handles parsing securely, and restricts secret usage properly. The critical timing-safe equality vulnerability has been remediated. The system meets all security requirements.
