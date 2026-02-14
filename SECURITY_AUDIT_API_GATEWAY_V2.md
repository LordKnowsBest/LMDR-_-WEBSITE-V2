# API Security Integrity Check Report

**Date:** 2026-03-03
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/rateLimitService.jsw`
**Auditor:** Jules (AI Security Engineer)

## Summary
The API Gateway implements standard security controls including API key validation, SHA-256 hashing, IP whitelisting, and rate limiting. However, **critical vulnerabilities** were identified that allow security controls to be bypassed.

### Key Findings
*   **FAIL:** Rate limits can be bypassed by any client sending the header `x-lmdr-bypass-rate-limit: true`.
*   **FAIL:** IP whitelisting fails open. If an attacker omits the IP address (e.g., via spoofed headers) or if the partner has an empty whitelist, access is granted.
*   **WARN:** Rate limiting for per-minute quotas is stored in-memory, meaning it is not distributed across server instances and resets on instance restart.
*   **WARN:** API Key comparison uses standard string comparison (`===`) instead of constant-time comparison, theoretically allowing timing attacks.

## Detailed Checklist

| Control | Status | Location | Details |
| :--- | :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `apiGateway.jsw` | `validateApiKey` is called on every request before processing. |
| **Key Hashing** | **PASS** | `apiAuthService.jsw` | API keys are hashed using SHA-256 (Web Crypto API) with a pepper before comparison. |
| **IP Whitelisting** | **FAIL** | `apiAuthService.jsw` | `isIpAllowed` returns `true` if `ipAddress` is null/undefined or if the whitelist is empty. |
| **Tier Enforcement** | **PASS** | `apiGateway.jsw` | `assertTier` correctly restricts access to premium endpoints based on subscription tier. |
| **Rate Limiting (Month)** | **PASS** | `rateLimitService.jsw` | Monthly quotas are tracked in the database (`apiUsage` collection) and enforced correctly. |
| **Rate Limiting (Minute)** | **WARN** | `rateLimitService.jsw` | Minute limits are tracked in-memory (`minuteBuckets`), making them instance-local and non-distributed. |
| **Rate Limit Integrity** | **FAIL** | `apiGateway.jsw` | `shouldBypassRateLimit` explicitly allows bypassing rate limits if `x-lmdr-bypass-rate-limit: true` is present. |
| **Timing Safe Comparison** | **WARN** | `apiAuthService.jsw` | Key hash comparison uses `===`. While less critical for hashes, `crypto.timingSafeEqual` is preferred. |
| **Bypass Markers** | **FAIL** | `apiGateway.jsw` | Found functional bypass code (`shouldBypassRateLimit`) even without explicit `TODO` or `HACK` comments. |

## Recommendations

1.  **Remove Rate Limit Bypass:** Immediately remove the `shouldBypassRateLimit` function and its usage in `apiGateway.jsw`. If needed for internal testing, restrict it to `siteOwner` or a specific internal secret header.
2.  **Fix IP Whitelisting:** Update `isIpAllowed` to:
    *   Fail (return `false`) if `ipAddress` is missing.
    *   Fail (return `false`) if `ip_whitelist` is configured but empty (or clarify business logic: empty = allow all?).
    *   Ensure `apiGateway.jsw` reliably resolves IP addresses or rejects requests where IP cannot be determined.
3.  **Implement Distributed Rate Limiting:** Move minute-level tracking to a persistent, fast store (like Wix Data or an external Redis if available) to ensure limits are respected across instances.
4.  **Use Constant-Time Comparison:** Update `apiAuthService.jsw` to use `crypto.timingSafeEqual` (via Node `crypto` module) for comparing key hashes.

## Verification
This report was generated based on static code analysis and verified by a standalone script (`verify_logic.js`) that confirmed the fail-open behavior of IP whitelisting and the existence of the rate limit bypass.
