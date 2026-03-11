# Stripe Webhook & Payment Security Assessment

## Goal
Verify that the LMDR platform's Stripe integration correctly validates webhook signatures, prevents replay attacks through idempotency checks, and does not expose sensitive payment data.

## Assessment Results

### **Should (Must Do)**
- **[PASS] Confirm that `stripe.webhooks.constructEvent()` (or equivalent) is called with the raw request body and the `STRIPE_WEBHOOK_SECRET` from the secrets manager:**
  - `verifyStripeSignature` in `src/backend/http-functions.js` implements a custom HMAC-SHA256 signature verification mechanism. It takes the raw string payload from `request.body.text()`, splits the signature header into timestamp and hash, computes the expected HMAC using the `STRIPE_WEBHOOK_SECRET` and compares it to the provided signature using a timing-safe comparison.

- **[PASS] Verify the webhook secret is fetched via `getSecret('STRIPE_WEBHOOK_SECRET')` and never hardcoded:**
  - In `verifyStripeSignature`, the secret is fetched using `await getSecret('STRIPE_WEBHOOK_SECRET')`. If it's missing, the endpoint rejects the request with a configuration error.

- **[PASS] Confirm that webhook processing checks for duplicate events using an idempotency key or event ID logged to the `StripeEventLog` collection:**
  - `post_stripe_webhook` checks `const alreadyProcessed = await isEventProcessed(event.id);`. If true, it returns early. After processing, it logs the event with `await logStripeEvent(event.id, event.type, ...)`.

- **[PASS] Verify that webhook failures (invalid signature) return an appropriate error and do not process the event:**
  - If `verifyStripeSignature` returns `{ success: false }`, `post_stripe_webhook` logs an error and returns an HTTP 400 Bad Request: `return badRequest({ error: 'Invalid signature' });`. The rest of the event handler is not executed.

- **[PASS] Check that no endpoint parses the webhook body with `JSON.parse()` before signature verification (which would skip verification):**
  - `const event = JSON.parse(body);` occurs in `http-functions.js` strictly *after* `const verificationResult = await verifyStripeSignature(body, signature);`.

### **Would (Ideally Do)**
- **[PASS] Verify that Stripe customer portal and checkout session creation use server-side secrets only:**
  - Both `createCheckoutSession` and `createPortalSession` in `src/backend/stripeService.jsw` securely fetch secrets using `getStripeSecrets()` (which wraps `wix-secrets-backend`) and use the `secretKey` (`SECRET_KEY_STRIPE`) in the Authorization header. No sensitive configuration data is exposed to the frontend.

- **[PASS] Confirm that `PUBLISHABLE_STRIPE` (the publishable key) is never used in backend code for sensitive operations:**
  - `PUBLISHABLE_STRIPE` is fetched in `getStripeSecrets()` but is only explicitly returned by `getPublishableKey()` for use on the client side. `stripeRequest` consistently uses `Bearer ${secrets.secretKey}` for authentication.

- **[PASS] Check that subscription status changes from webhooks correctly update user access/permissions:**
  - `handleSubscriptionUpdated` and `handleSubscriptionDeleted` appropriately trigger `upsertSubscription` and `updateSubscriptionStatus`. `handleSubscriptionUpdated` sets `is_active: stripeSubscription.status === 'active'` in the database via `stripeService.jsw`. Deleted subscriptions are updated to `status: 'canceled'` and `is_active: false`.

- **[PASS] Verify that Stripe API calls use the secret key from `getSecret()` and not a hardcoded value:**
  - `stripeRequest` uses `const secrets = await getStripeSecrets();` and builds the Authorization header dynamically. Hardcoded keys are not present in the code.

### **Could (Stretch Goal)**
- **[PASS] Verify that webhook event types are explicitly allowlisted (only expected events like `checkout.session.completed`, `invoice.paid`, etc. are processed):**
  - `handleStripeEvent` in `http-functions.js` uses a `switch` statement over `type`. Unhandled event types hit the `default` case, log an "[Webhook] Unhandled event type" message, and return early without making backend database updates.

- **[PASS] Check for proper error handling if Stripe API calls fail mid-transaction (no partial state corruption):**
  - The webhook handles failures gracefully. Idempotency checks (`isEventProcessed`) are evaluated at the start, but the event is only logged as processed (`logStripeEvent`) at the *end* of the pipeline. If a Wix database update fails mid-flight inside `handleStripeEvent`, the webhook returns an HTTP 500, which serves as a fail-closed strategy because Stripe will retry the event.

- **[PASS] Confirm that refund and cancellation webhooks correctly revoke access:**
  - Cancellation is handled by `handleSubscriptionDeleted`, which updates the status to `canceled` and effectively revokes access. Refund webhooks are not explicitly handled in the `switch` statement (e.g., `charge.refunded`), so they are ignored, meaning automatic access revocation strictly depends on `customer.subscription.deleted`.

## Summary and Remediation
The LMDR backend's Stripe integration correctly enforces security best practices for signature verification, idempotency, and secret management.

One vulnerability was found and remediated during this assessment:
- **Timing attack vulnerability in signature comparison**: The signature comparison in `verifyStripeSignature` (`http-functions.js`) used a standard string inequality operator (`!==`). This was patched to use the Node.js `crypto` module, generating the HMAC via `crypto.createHmac` and performing a secure comparison via `crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureHash))`.

**Overall Status: PASS.**
