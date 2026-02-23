# Stripe Webhook Security Assessment

**Date:** 2026-10-18
**Assessor:** Jules (AI Security Specialist)
**Status:** PASS (After Remediation)

## Executive Summary
A comprehensive security review of the Stripe webhook integration in `src/backend/http-functions.js` and `src/backend/stripeService.jsw` was conducted. A critical vulnerability involving unsafe signature comparison (timing attack) was identified and remediated. All other security controls were found to be effective.

## Checklist & Findings

| Control | Status | Details |
| :--- | :--- | :--- |
| **Signature Verification** | **PASS** (Remediated) | Previous implementation used `!==` string comparison, which is vulnerable to timing attacks. **Remediation:** Refactored to use Node.js `crypto` module with `crypto.timingSafeEqual` for constant-time comparison. |
| **Secret Management** | **PASS** | `STRIPE_WEBHOOK_SECRET` and `SECRET_KEY_STRIPE` are securely retrieved via `wix-secrets-backend`. No hardcoded secrets were found in the source code. |
| **Idempotency** | **PASS** | Webhooks are checked against `StripeEventLog` (via `isEventProcessed`) before processing to prevent replay attacks and duplicate processing. |
| **Payload Integrity** | **PASS** | `JSON.parse()` is only called *after* successful signature verification, preventing potential parsing exploits on unverified data. |
| **Event Whitelisting** | **PASS** | The handler uses a strict `switch` statement for `handleStripeEvent`. Unrecognized events are logged and ignored (safe default). |
| **Subscription Logic** | **PASS** | Subscription updates correctly check `partner_id` or `carrier_dot` metadata and use database transactions (upsert) to maintain state consistency. |

## Remediation Details

### Vulnerability: Timing Attack on Signature Verification
The original implementation compared the computed signature with the header signature using standard string comparison:
```javascript
// Vulnerable Code
if (expectedSignature !== signatureHash) { ... }
```
This allows an attacker to deduce the valid signature byte-by-byte by measuring response times.

**Fix Applied:**
The code was updated to use the `crypto` module's constant-time comparison function:
```javascript
// Secure Code
const expectedBuffer = Buffer.from(expectedSignature, 'hex');
const signatureBuffer = Buffer.from(signatureHash, 'hex');
if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) { ... }
```

## Recommendations
1.  **Secret Rotation:** Ensure `STRIPE_WEBHOOK_SECRET` is rotated periodically in the Wix Secrets Manager.
2.  **Monitoring:** Set up alerts for `[Webhook] Signature verification failed` logs to detect potential attack attempts.
