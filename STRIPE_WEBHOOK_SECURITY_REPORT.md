# Stripe Webhook Security Report
**Date:** 2024-05-24
**Status:** PASS

## Summary
A security assessment of the LMDR platform's Stripe integration confirms that webhook signatures are properly validated to mitigate timing attacks, replay attacks are prevented through fail-closed idempotency checks, and sensitive payment logic relies exclusively on backend secrets.

## Should (Must Do) - Critical Path

*   **[PASS] Confirm that `stripe.webhooks.constructEvent()` (or equivalent) is called with the raw request body and the `STRIPE_WEBHOOK_SECRET`:**
    *   Wix Velo cannot use the official `stripe.webhooks.constructEvent()` due to environment limitations. Instead, an equivalent custom `verifyStripeSignature` function in `src/backend/http-functions.js` performs HMAC-SHA256 signature verification.
    *   **Remediation:** Refactored `verifyStripeSignature` and `computeHmacSignature` to use the standard Node.js `crypto` module (`crypto.createHmac`, `crypto.timingSafeEqual`) with `Buffer` instances, replacing the vulnerable Web Crypto API implementation to prevent timing attacks.
*   **[PASS] Verify the webhook secret is fetched via `getSecret('STRIPE_WEBHOOK_SECRET')` and never hardcoded:**
    *   Verified in `verifyStripeSignature` (line 113) that the secret is securely fetched via `getSecret`.
*   **[PASS] Confirm that webhook processing checks for duplicate events using an idempotency key or event ID logged to the `StripeEventLog` collection:**
    *   `post_stripe_webhook` checks `isEventProcessed(event.id)` before processing.
    *   **Remediation:** Updated `isEventProcessed` in `src/backend/stripeService.jsw` to "fail closed" (throw the error in its catch block instead of returning false), ensuring that a database outage triggers a 500 error, allowing Stripe to retry and avoiding duplicate or dropped event processing.
*   **[PASS] Verify that webhook failures (invalid signature) return an appropriate error and do not process the event:**
    *   If `verifyStripeSignature` fails, the webhook handler returns a 400 Bad Request (`badRequest({ error: 'Invalid signature' })`) and execution halts.
*   **[PASS] Check that no endpoint parses the webhook body with `JSON.parse()` before signature verification:**
    *   In `post_stripe_webhook`, `verifyStripeSignature` is called using the raw string `body` before `JSON.parse(body)` is invoked.

## Would (Ideally Do)

*   **[PASS] Verify that Stripe customer portal and checkout session creation use server-side secrets only:**
    *   `createCheckoutSession` and `createPortalSession` in `src/backend/stripeService.jsw` securely fetch secrets via `getStripeSecrets()` and do not expose them to the client.
*   **[PASS] Confirm that `PUBLISHABLE_STRIPE` (the publishable key) is never used in backend code for sensitive operations:**
    *   The backend relies entirely on `SECRET_KEY_STRIPE` (the secret key) for all authenticated API requests. `PUBLISHABLE_STRIPE` is only exposed via a public getter function.
*   **[PASS] Check that subscription status changes from webhooks correctly update user access/permissions:**
    *   Webhook handlers (`handleSubscriptionUpdated`, `handleSubscriptionDeleted`) correctly propagate status changes to `upsertSubscription` and `updateSubscriptionStatus`, which in turn update the backend database records governing API access and UI views.
*   **[PASS] Verify that Stripe API calls use the secret key from `getSecret()` and not a hardcoded value:**
    *   `stripeRequest` securely accesses `secrets.secretKey` via `getStripeSecrets()`.

## Could (Stretch Goal)

*   **[PASS] Verify that webhook event types are explicitly allowlisted:**
    *   The `handleStripeEvent` switch statement only processes specific known events (`customer.subscription.created`, `invoice.paid`, `checkout.session.completed`, etc.). Unhandled events are logged and safely ignored.
*   **[PASS] Check for proper error handling if Stripe API calls fail mid-transaction:**
    *   `stripeRequest` and database functions appropriately throw or return structured errors on failure.
*   **[PASS] Confirm that refund and cancellation webhooks correctly revoke access:**
    *   `handleSubscriptionDeleted` successfully triggers `updateSubscriptionStatus(subscription.id, 'canceled')`, revoking the `is_active` flag.

## Conclusion
The Stripe integration logic has been fully reviewed and fortified. Cryptographic operations rely on the standard `crypto` module to defend against timing attacks. Idempotency logic properly fails closed, meaning an attacker cannot exploit a database hiccup to force double processing. No secrets are exposed, and the system acts on a strict allowlist of webhook events. The critical path—signature verification → idempotency check → event processing → state update—is secure.