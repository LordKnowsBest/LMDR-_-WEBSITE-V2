# Stripe Security Assessment & Remediation Report

**Date:** 2026-10-18
**Author:** Jules (Payment Security Specialist)
**Status:** **PASS** (With Remediations)

## Executive Summary

A comprehensive security review of the Stripe integration (`src/backend/http-functions.js`, `src/backend/stripeService.jsw`) was conducted. Critical vulnerabilities regarding timing attacks in signature verification were identified and remediated. The integration now complies with industry best practices for webhook security. A finding regarding permission configuration was noted for future attention.

## Detailed Findings

### 1. Webhook Signature Verification
**Status: PASS (Remediated)**
*   **Initial Finding:** The webhook handler (`post_stripe_webhook`) used `verifyStripeSignature` which relied on insecure string comparison (`!==`) of the HMAC signature. This introduced a potential timing attack vulnerability. It also used `crypto.subtle` which is less standard for Node.js backends.
*   **Remediation:** The function was refactored to use the Node.js `crypto` module.
    *   `crypto.createHmac('sha256', secret)` is now used for signature generation.
    *   `crypto.timingSafeEqual(expectedBuffer, signatureBuffer)` is used for constant-time comparison.
    *   Input validation and timestamp tolerance checks were verified and preserved.
*   **Verification:** Verified via code review and standalone testing of the crypto logic.

### 2. Idempotency Check
**Status: PASS**
*   **Finding:** The system implements a robust idempotency check using `isEventProcessed(event.id)`.
*   **Details:** Before processing, the event ID is checked against the `stripeEvents` collection. If found, the handler returns `200 OK` with `status: 'already_processed'`, preventing duplicate operations.
*   **Verification:** Logic confirmed in `src/backend/http-functions.js`.

### 3. Secret Management
**Status: PASS**
*   **Finding:** All sensitive keys are retrieved securely using `wix-secrets-backend`.
    *   `STRIPE_WEBHOOK_SECRET` is used for signature verification.
    *   `SECRET_KEY_STRIPE` is used for API calls.
*   **Details:** No hardcoded secrets were found in the reviewed files. `PUBLISHABLE_STRIPE` is used only where appropriate (frontend exposure via helper).

### 4. JSON Parsing Order
**Status: PASS**
*   **Finding:** The webhook handler correctly reads the raw body (`request.body.text()`) for signature verification *before* parsing it as JSON (`JSON.parse(body)`).
*   **Details:** This ensures that the signature matches the exact payload received, preventing tampering that could occur if JSON was parsed and re-serialized.

### 5. Sensitive Data Exposure (Permissions)
**Status: WARNING / FAIL**
*   **Finding:** `src/backend/permissions.json` grants `Anonymous` users `invoke` permission on all backend web modules (`*`).
*   **Risk:** Functions in `src/backend/stripeService.jsw` such as `getSubscriptionDetails(carrierDot)` and `getSubscriptionByCarrier(carrierDot)` can be invoked by unauthenticated users. If a malicious actor can guess or enumerate `carrierDot` values, they can retrieve subscription status and usage data.
*   **Recommendation:** Restrict `stripeService.jsw` permissions to `SiteMember` or `SiteOwner`, or implement internal user validation within the functions to ensure the caller owns the data.

### 6. Additional Remediation (API Auth)
**Status: PASS (Remediated)**
*   **Finding:** `src/backend/apiAuthService.jsw` also utilized insecure string comparison for validating API key hashes.
*   **Remediation:** Updated `validateApiKey` and `hasMatchingKey` to use `crypto.timingSafeEqual`. Modernized hashing logic to use Node.js `crypto` module.

## Conclusion

The critical path for Stripe Webhook security (Signature Verification -> Idempotency -> Processing) is now secure. The timing attack vulnerability has been eliminated. The platform is protected against forged webhooks and replay attacks. Attention is recommended for the permission configuration in a follow-up task.
