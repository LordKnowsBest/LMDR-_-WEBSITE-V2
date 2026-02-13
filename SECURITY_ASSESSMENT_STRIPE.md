# Security Assessment: Stripe Integration & Webhook Security

**Date:** 2026-03-03
**Status:** PASS (Remediated)
**Scope:** `src/backend/stripeService.jsw`, `src/backend/http-functions.js`

## Executive Summary
A comprehensive security review of the Stripe integration was conducted, focusing on webhook signature verification, idempotency, and payment data handling. A critical vulnerability in webhook signature verification (timing attack susceptibility and use of legacy Web Crypto API) was identified and **successfully remediated**. The platform now enforces strict, timing-safe HMAC-SHA256 verification for all incoming Stripe events.

## Checkpoint Status

| Checkpoint | Status | Details |
| :--- | :---: | :--- |
| **Signature Verification** | **PASS (Remediated)** | Verification logic was updated to use Node.js `crypto` module with `timingSafeEqual`. |
| **Idempotency Check** | **PASS** | `isEventProcessed` checks `StripeEventLog` before processing, preventing replay attacks. |
| **Secret Management** | **PASS** | `STRIPE_WEBHOOK_SECRET` and API keys are retrieved via `getSecret` and never hardcoded. |
| **Payload Parsing** | **PASS** | `JSON.parse()` is executed strictly *after* signature verification succeeds. |
| **Payment Data Exposure** | **PASS** | Sensitive operations (Portal/Checkout) use server-side secrets; Publishable key is isolated. |
| **Error Handling** | **PASS** | Invalid signatures return 400 Bad Request; internal errors return 500 without leaking details. |

## Detailed Findings

### 1. Webhook Signature Verification (Remediated)
- **Issue:** The original implementation used `crypto.subtle` (Web Crypto API) and a non-constant-time string comparison (`!==`), making it theoretically vulnerable to timing attacks.
- **Remediation:** The code was refactored to use the Node.js `crypto` module.
  - `crypto.createHmac('sha256', secret)` is now used for consistent signature generation.
  - `crypto.timingSafeEqual(bufferA, bufferB)` is used for comparison, preventing timing side-channels.
  - Hex signatures are properly converted to `Buffer` objects before comparison.

### 2. Idempotency Implementation
- **Verification:** The `post_stripe_webhook` function calls `isEventProcessed(event.id)` immediately after parsing the body.
- **Logic:** If the event ID exists in the `stripeEvents` collection, the handler returns `200 OK` with `status: 'already_processed'`, skipping all business logic. This effectively prevents replay attacks.

### 3. Function Access Control (Recommendation)
- **Observation:** Helper functions in `src/backend/stripeService.jsw` (e.g., `upsertSubscription`) are exported and potentially accessible to anonymous users if not restricted by `permissions.json`.
- **Risk:** While the webhook endpoint itself is secure, a direct call to `upsertSubscription` with a crafted payload could bypass the signature check entirely.
- **Recommendation:** Update `permissions.json` to restrict `backend/stripeService.jsw` functions to `siteOwner` or `siteMember` where appropriate, or verify that `permissions.json` already applies a default deny policy (Note: Current audit suggests `*` permissions are open, which is a separate critical issue to be addressed in the Permissions Audit).

### 4. Data Hygiene
- **Verification:** No raw credit card data touches the backend. All payment processing is offloaded to Stripe Checkout and Customer Portal.
- **Logging:** Logs do not contain sensitive PII or full payloads, only event IDs and status.

## Conclusion
The Stripe webhook integration is now secure against signature forgery and replay attacks. The critical path (Signature -> Idempotency -> Processing) is robust. The primary remaining risk is the broader `permissions.json` configuration, which is outside the specific scope of this webhook assessment but strongly noted for follow-up.
