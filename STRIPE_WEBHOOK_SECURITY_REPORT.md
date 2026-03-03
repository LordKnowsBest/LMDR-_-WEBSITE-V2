# Stripe Webhook Security Report

## Goal
Verify that the LMDR platform's Stripe integration correctly validates webhook signatures, prevents replay attacks through idempotency checks, and does not expose sensitive payment data.

## Assessment

### Must Do (Critical Path)
- **PASS**: Confirm that `stripe.webhooks.constructEvent()` (or equivalent) is called with the raw request body and the `STRIPE_WEBHOOK_SECRET` from the secrets manager. The custom function `verifyStripeSignature` acts as the equivalent in Velo and correctly uses the raw request payload.
- **PASS**: Verify the webhook secret is fetched via `getSecret('STRIPE_WEBHOOK_SECRET')` and never hardcoded.
- **PASS**: Confirm that webhook processing checks for duplicate events using an idempotency key or event ID logged to the `StripeEventLog` collection. The code uses `isEventProcessed(event.id)` and logs events using `logStripeEvent`.
- **PASS**: Verify that webhook failures (invalid signature) return an appropriate error and do not process the event. Returning `badRequest({ error: 'Invalid signature' })` handles this correctly.
- **PASS**: Check that no endpoint parses the webhook body with `JSON.parse()` before signature verification (which would skip verification). The body is retrieved using `await request.body.text()`, verified, and then passed to `JSON.parse()`.
- **FAIL (CRITICAL)**: The signature comparison in `verifyStripeSignature` uses standard string inequality (`!==`). This is vulnerable to timing attacks and should be replaced with `crypto.timingSafeEqual`.

### Would Do (Ideal)
- **PASS**: Verify that Stripe customer portal and checkout session creation use server-side secrets only. Both operations (found in `stripeService.jsw`) retrieve the Stripe API key dynamically using `getStripeSecrets()`.
- **PASS**: Confirm that `PUBLISHABLE_STRIPE` (the publishable key) is never used in backend code for sensitive operations. It is only fetched to be safely passed to the frontend via `getPublishableKey()`.
- **PASS**: Check that subscription status changes from webhooks correctly update user access/permissions. The event handlers `handleSubscriptionCreated` and `handleSubscriptionUpdated` accurately process subscriptions via `upsertSubscription`.
- **PASS**: Verify that Stripe API calls use the secret key from `getSecret()` and not a hardcoded value. The `stripeRequest` function pulls the secret key via `getStripeSecrets()`.

### Could Do (Stretch)
- **PASS**: Verify that webhook event types are explicitly allowlisted. `handleStripeEvent` evaluates explicitly handled events inside a `switch` statement and avoids processing arbitrary event types.
- **PASS**: Check for proper error handling if Stripe API calls fail mid-transaction. Error handling via `try/catch` is well implemented around asynchronous code paths.
- **PASS**: Confirm that refund and cancellation webhooks correctly revoke access. Handlers like `handleSubscriptionDeleted` and `handleSubscriptionUpdated` appropriately record updates like `"canceled"`.

## Conclusion
The security logic is mostly solid with the significant exception of the string comparison in the signature validation process. The **FAIL** in the "Must Do" path constitutes a timing attack vulnerability that requires immediate remediation by replacing insecure comparison operators with a constant-time check (`crypto.timingSafeEqual`).
