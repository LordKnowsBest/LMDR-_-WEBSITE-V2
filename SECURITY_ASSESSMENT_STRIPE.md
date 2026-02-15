# Security Assessment: Stripe Integration

**Date:** 2026-03-03
**Assessor:** AI Security Specialist
**Scope:** `src/backend/stripeService.jsw`, `src/backend/http-functions.js`

## Executive Summary
The Stripe integration was reviewed for security vulnerabilities, focusing on webhook signature verification, idempotency, and secret management. A critical vulnerability (timing attack in signature verification) was identified and remediated. The system now passes all critical security checks.

## Detailed Findings

### 1. Webhook Signature Verification
**Status:** **PASS (Remediated)**
- **Verification Logic:** The webhook endpoint `post_stripe_webhook` correctly extracts the `Stripe-Signature` header and raw body.
- **Secret Management:** `STRIPE_WEBHOOK_SECRET` is retrieved securely via `wix-secrets-backend` and is not hardcoded.
- **Algorithm:** Uses HMAC-SHA256 as required by Stripe.
- **Timing Attack Mitigation:** The original implementation used a non-constant-time string comparison (`!==`). This has been remediated by switching to `crypto.timingSafeEqual` from the Node.js `crypto` module.
- **Replay Protection:** Timestamp tolerance is enforced (5 minutes).

### 2. Idempotency & Replay Protection
**Status:** **PASS**
- **Mechanism:** The system checks `isEventProcessed(event.id)` before processing any business logic.
- **Logging:** Successfully processed events are logged to the `StripeEventLog` (or `stripeEvents` collection) via `logStripeEvent`.
- **Concurrency:** Events are marked as processed *after* successful execution, but the check happens *before*. Ideally, a "processing" state should be set immediately to prevent race conditions, but for the current load and Velo's environment, the existing check provides reasonable protection against simple retries.

### 3. Secret Management
**Status:** **PASS**
- **Storage:** All Stripe keys (`SECRET_KEY_STRIPE`, `PUBLISHABLE_STRIPE`, `STRIPE_WEBHOOK_SECRET`) are stored in Wix Secrets Manager.
- **Usage:** Backend operations use `SECRET_KEY_STRIPE`. `PUBLISHABLE_STRIPE` is exposed via `getPublishableKey` for client-side use only, which is standard practice.
- **Codebase Scan:** No hardcoded secrets were found in the source code.

### 4. Input Validation & Processing
**Status:** **PASS**
- **JSON Parsing:** The raw body is used for signature verification *before* `JSON.parse` is called, ensuring the signature matches the exact payload received.
- **Event Allowlisting:** The handler explicitly switches on supported event types (`customer.subscription.*`, `invoice.*`, `checkout.session.*`). Unknown events are logged and ignored, preventing unintended execution paths.

### 5. API Security
**Status:** **PASS**
- **HTTPS:** All Wix Velo `_functions` endpoints are served over HTTPS.
- **Error Handling:** Signature failures return `400 Bad Request` without revealing internal details. Server errors return `500` but generic messages.

## Remediation Actions Taken
- **Refactored `src/backend/http-functions.js`**: Replaced the custom `computeHmacSignature` (Web Crypto) with Node.js `crypto.createHmac` and implemented `crypto.timingSafeEqual` to prevent timing attacks during signature verification.

## Recommendations (Future Improvements)
- **Concurrency Locking:** Implement a distributed lock or "processing" state in the database to robustly handle race conditions if webhook delivery is highly concurrent.
- **Rotate Secrets:** Ensure `STRIPE_WEBHOOK_SECRET` is rotated periodically.
- **Monitor Logs:** Set up alerts for repeated signature failures, which could indicate an attack attempt.
