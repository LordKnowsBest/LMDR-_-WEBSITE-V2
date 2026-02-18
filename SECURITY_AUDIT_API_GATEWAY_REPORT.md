# API Gateway Security Audit Report

**Date:** 2026-03-03
**Auditor:** AI Security Engineer
**Status:** **FAILED** (Critical Vulnerabilities Found)

## Summary
The API Gateway contains critical security vulnerabilities that allow unauthorized access and resource abuse. Specifically, rate limiting can be bypassed by anyone knowing a specific header, and IP whitelisting fails open when IP headers are missing. Additionally, a sensitive administrative function (`rotateApiKey`) is publicly exposed.

## Detailed Checklist

| Control | Status | File / Line | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `src/backend/apiGateway.jsw` (Line 90) | `validateApiKey` is called on every request before processing. |
| **Credential Security** | **PASS** | `src/backend/apiAuthService.jsw` (Line 47) | API keys are hashed with SHA-256 and a pepper before comparison. |
| **IP Whitelisting** | **FAIL** | `src/backend/apiAuthService.jsw` (Line 152) | `if (!ipAddress) return true;` allows requests with missing IP headers to bypass the whitelist. Validated by `scripts/verify_api_security.js`. |
| **Rate Limiting Integrity** | **FAIL** | `src/backend/apiGateway.jsw` (Line 105, 536-539) | The function `shouldBypassRateLimit` explicitly checks for `x-lmdr-bypass-rate-limit: true` header, allowing any client to bypass limits. Validated by `scripts/verify_api_security.js`. |
| **Subscription Tier Checks** | **PASS** | `src/backend/apiGateway.jsw` (Multiple) | Explicit `assertTier` checks are present for all tiered endpoints (e.g., Line 219). |
| **Authorization & Access** | **FAIL** | `src/backend/apiAuthService.jsw` (Line 102) | `rotateApiKey` is publicly exported and `permissions.json` grants `Anonymous` `invoke` rights globally (`*`), allowing unauthorized key rotation. |
| **Information Leakage** | **WARN** | `src/backend/apiAuthService.jsw` | Error messages distinguish between "Invalid API key" and "IP address not allowed", enabling key enumeration. |
| **Code Hygiene** | **PASS** | N/A | No `TODO`, `HACK`, `FIXME`, or suspicious comments found in reviewed files. |

## Verification
A verification script `scripts/verify_api_security.js` was created and executed to reproduce the vulnerabilities.
- **IP Bypass:** Confirmed that `isIpAllowed` returns `true` when IP is `null` or `undefined`.
- **Rate Limit Bypass:** Confirmed that passing `x-lmdr-bypass-rate-limit: true` header results in `shouldBypassRateLimit` returning `true`.

## Recommendations
1. **Immediate Fix:** Remove `shouldBypassRateLimit` logic entirely or restrict it to a verified internal role/secret.
2. **Immediate Fix:** Update `isIpAllowed` to return `false` if `ipAddress` is missing and a whitelist is configured.
3. **Immediate Fix:** Restrict `rotateApiKey` in `permissions.json` to `SiteOwner` or move it to an internal `.js` file to prevent public access.
4. **Improvement:** Unify authentication error messages to "Unauthorized" or "Forbidden" to prevent user enumeration.
