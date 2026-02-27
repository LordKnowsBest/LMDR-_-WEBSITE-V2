# Stripe Security Assessment

## Overview
This assessment reviews the Stripe integration for webhook signature verification, idempotency, and data exposure risks.

**Date:** 2025-05-15
**Status:** FAIL (Remediation Required)

## Findings Checklist

| Checkpoint | Status | Description |
| :--- | :--- | :--- |
| **Signature Verification** | **FAIL** | Logic exists but uses insecure string comparison (`!==`), vulnerable to timing attacks. |
| **Idempotency Check** | **PASS** | `isEventProcessed` checks `stripeEvents` collection before processing. |
| **Sensitive Data Exposure** | **FAIL** | `createPortalSession` allows anonymous users to generate portal URLs for any carrier via `carrierDot`. |
| **JSON Parsing** | **PASS** | `request.body.text()` is used for signature verification before `JSON.parse()`. |
| **Secret Management** | **PASS** | Secrets are retrieved via `getSecret()`; no hardcoded keys found. |

## Detailed Findings

### 1. Signature Verification Vulnerability (Timing Attack)
**Location:** `src/backend/http-functions.js` -> `verifyStripeSignature`
**Issue:** The comparison `if (expectedSignature !== signatureHash)` is not constant-time.
**Risk:** An attacker could forge a valid signature by measuring the time taken for the server to reject invalid signatures, byte by byte.
**Remediation:** Use `crypto.timingSafeEqual` for comparison.

### 2. IDOR in Customer Portal Creation
**Location:** `src/backend/stripeService.jsw` -> `createPortalSession`
**Issue:** The function accepts `carrierDot` as a public argument and returns a billing portal URL. It does not verify if the caller is the owner of that `carrierDot`.
**Risk:** An attacker can enumerate `carrierDot` values (US DOT numbers are public) to access the billing portal of any customer, potentially modifying subscriptions or viewing invoice history.
**Remediation:** Enforce authentication (`wix-users-backend`) and verify that the logged-in user is authorized to manage the specified carrier.

## Next Steps
1. Refactor `verifyStripeSignature` to use `crypto.timingSafeEqual`.
2. Add authorization checks to `createPortalSession` to require a logged-in user.
