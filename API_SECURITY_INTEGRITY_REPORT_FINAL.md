# API Security Integrity Report - Final

**Date:** 2026-10-18
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/rateLimitService.jsw`

## Summary of Findings

The API Gateway and Authentication services were reviewed for integrity, bypass vulnerabilities, and weakened controls. While the core authentication mechanism (API key hashing and validation) is robust, several critical vulnerabilities were identified in the authorization and rate limiting logic.

### Checklist

| Status | Component | Description | File |
| :--- | :--- | :--- | :--- |
| **PASS** | Authentication Check | `validateApiKey` is correctly called on every API route handler before processing requests. | `src/backend/apiGateway.jsw` |
| **PASS** | Key Storage | API keys are hashed using SHA-256 with a pepper and never compared in plaintext. | `src/backend/apiAuthService.jsw` |
| **PASS** | Subscription Tier | Tier checks (`assertTier`) are actively enforced on restricted endpoints. | `src/backend/apiGateway.jsw` |
| **FAIL** | IP Whitelisting | IP whitelisting logic fails open if the request lacks an IP address (e.g., direct access or spoofed headers). `isIpAllowed` returns `true` when `ipAddress` is null. | `src/backend/apiAuthService.jsw:83` |
| **FAIL** | Rate Limiting | Rate limiting can be bypassed by any authenticated user by setting the header `x-lmdr-bypass-rate-limit: true`. The gateway does not verify if the user has administrative privileges to use this bypass. | `src/backend/apiGateway.jsw:74` |
| **FAIL** | Authorization (Internal) | `permissions.json` grants `Anonymous` access to all backend web methods, exposing `rotateApiKey` to unauthenticated users. This allows anyone to rotate keys for any partner if they can guess the `partnerId`. | `src/backend/permissions.json` |
| **WARN** | Rate Limiting (Concurrency) | Rate limiting uses in-memory `minuteBuckets`, which is not distributed across server instances. This effectively multiplies the allowed request rate by the number of active instances. | `src/backend/rateLimitService.jsw:14` |
| **PASS** | Code Integrity | No suspicious comments (`TODO`, `HACK`, `FIXME`, `BYPASS`, `SKIP`) were found in critical authentication logic. | N/A |

## Critical Observations

While outside the direct scope of the API Gateway review, the following critical vulnerabilities were identified in `src/backend/http-functions.js`:

1.  **Unauthenticated Remote Code Execution (RCE) via Vapi Webhook**:
    -   The endpoint `post_vapi_webhook` accepts JSON payloads and executes backend tools (via `handleAgentTurn` or direct tool execution) without verifying any signature or secret.
    -   **File:** `src/backend/http-functions.js` (lines ~540-620)
    -   **Risk:** An attacker can POST to `/_functions/vapi_webhook` to execute arbitrary tools or database operations.

2.  **Weak SendGrid Webhook Verification**:
    -   The `post_sendgrid_events` endpoint attempts to verify a signature only if headers are present and the secret exists. If the signature header is missing, it proceeds to process the event without validation.
    -   **File:** `src/backend/http-functions.js` (lines ~650-670)
    -   **Risk:** An attacker can forge email events (delivery, open, click) by sending a payload without the signature header.

3.  **Missing Signature Verification on Other Webhooks**:
    -   `post_twilio_incoming`, `post_indeed_applications`, and `post_ziprecruiter_applications` process data without verifying the source authenticity.

## Recommendations

1.  **Fix IP Whitelisting**: Modify `isIpAllowed` in `apiAuthService.jsw` to return `false` if an IP address cannot be determined when a whitelist is active.
2.  **Restrict Rate Limit Bypass**: Update `shouldBypassRateLimit` in `apiGateway.jsw` to verify that the caller is an administrator or possesses a specific "admin" API key scope before honoring the bypass header.
3.  **Secure `permissions.json`**: Remove the wildcard `*` permission for `Anonymous` users. Explicitly list public methods or restrict access to `SiteMember`/`SiteOwner`.
4.  **Implement Webhook Security**: Add mandatory signature verification to all webhook endpoints in `http-functions.js`. Reject requests that lack a valid signature.
5.  **Distributed Rate Limiting**: Consider moving rate limit counters to a shared database (e.g., `apiUsage` collection with atomic increments or a dedicated Redis-like store if available) to enforce global limits.
