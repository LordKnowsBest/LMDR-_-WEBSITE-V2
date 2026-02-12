# Security Assessment: Stripe Integration

**Date:** 2026-03-03
**Auditor:** Jules (AI Software Engineer)
**Scope:** `src/backend/stripeService.jsw`, `src/backend/http-functions.js`
**Status:** PASS (All critical findings remediated)

## Executive Summary
The Stripe integration was reviewed for security vulnerabilities, specifically focusing on webhook signature verification, idempotency, secret management, and access control. A critical vulnerability in signature verification (insecure string comparison and potential runtime instability) was identified and remediated. The system now enforces robust security controls for all payment-related events.

## detailed Findings

### 1. Webhook Signature Verification
**Status:** PASS (Remediated)
**Original Finding:** The implementation used `crypto.subtle` (Web Crypto API), which may be unstable in the Node.js backend environment, and performed a standard string comparison (`===`) for signature validation, making it vulnerable to timing attacks.
**Remediation:**
- Refactored `src/backend/http-functions.js` to use the standard Node.js `crypto` module.
- Implemented `crypto.createHmac` for reliable HMAC-SHA256 signature generation.
- Implemented `crypto.timingSafeEqual` for constant-time signature comparison to prevent timing attacks.
- Verified the fix with a standalone test script using valid and invalid signatures.

### 2. Idempotency & Replay Protection
**Status:** PASS
**Observation:**
- The webhook handler checks `isEventProcessed(event.id)` before processing any event.
- Successfully processed events are logged to the `stripeEvents` collection via `logStripeEvent`.
- This effectively prevents replay attacks and duplicate processing of the same webhook event.

### 3. Secret Management
**Status:** PASS
**Observation:**
- All sensitive keys (`STRIPE_WEBHOOK_SECRET`, `SECRET_KEY_STRIPE`) are retrieved securely using `wix-secrets-backend.getSecret()`.
- No hardcoded secrets were found in the codebase.
- `PUBLISHABLE_STRIPE` is exposed only via a dedicated public endpoint (`getPublishableKey`) for frontend use, which is standard practice.

### 4. Payload Validation & Parsing
**Status:** PASS
**Observation:**
- The raw request body is used for signature verification *before* `JSON.parse()` is called.
- This ensures that the signature matches the exact byte stream received from Stripe, preventing tampering.
- Parsing errors are handled gracefully.

### 5. Event Allowlisting & Logic
**Status:** PASS
**Observation:**
- The webhook handler uses a `switch` statement to explicitly handle specific event types (`customer.subscription.created`, `invoice.paid`, etc.).
- Unrecognized events fall through to a `default` case and are logged but not processed.
- Subscription status updates (cancellation, past due) correctly update the `is_active` flag in the `carrierSubscriptions` collection, ensuring access is revoked when necessary.

## Recommendations
- **Periodic Secret Rotation:** Ensure `STRIPE_WEBHOOK_SECRET` and API keys are rotated periodically in the Wix Secrets Manager.
- **Monitoring:** Set up alerts for `[Webhook] Signature verification failed` logs to detect potential attack attempts.
