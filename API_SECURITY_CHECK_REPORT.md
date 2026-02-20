# API Security Integrity Check Report

**Date:** 2026-10-18
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`

## Executive Summary
The integrity check identified **3 Critical Failures** and **1 Warning**. The API Gateway is currently vulnerable to unauthorized access via permission misconfiguration, rate limit bypass via a simple header, and IP whitelist evasion. Immediate remediation is required.

---

## Detailed Findings

### 1. Authentication & Authorization Logic

| Status | Check | File / Location | Details |
| :--- | :--- | :--- | :--- |
| **PASS** | `validateApiKey` called on every route | `src/backend/apiGateway.jsw` (Line 46) | `handleGatewayRequest` calls validation before processing any logic. |
| **PASS** | API Keys hashed (SHA-256) | `src/backend/apiAuthService.jsw` (Line 45) | Keys are hashed with SHA-256 and a secret pepper before comparison. |
| **FAIL** | **IP Whitelisting Active & Secure** | `src/backend/apiAuthService.jsw` (Line 149) | **VULNERABILITY:** `isIpAllowed` returns `true` if `ipAddress` is null/undefined. Attackers can bypass whitelists by suppressing IP headers. |
| **PASS** | Subscription Tier Enforced | `src/backend/apiGateway.jsw` (Line 367) | `assertTier` logic correctly blocks lower-tier users from premium endpoints. |
| **FAIL** | **Public Permission Restriction** | `src/backend/permissions.json` (Global) | **CRITICAL:** The file grants `Anonymous` users `invoke: true` permissions on `*` (all modules). This exposes `rotateApiKey` and `generateApiKey` to the public. |

### 2. Rate Limiting & Quotas

| Status | Check | File / Location | Details |
| :--- | :--- | :--- | :--- |
| **FAIL** | **Rate Limiting Enforced (No Bypass)** | `src/backend/apiGateway.jsw` (Line 333) | **CRITICAL:** `shouldBypassRateLimit` checks for header `x-lmdr-bypass-rate-limit: true`. Any authenticated user can send this header to bypass all rate limits. |
| **PASS** | Rate Limits per Key/Tier | `src/backend/rateLimitService.jsw` (Line 15) | Limits are correctly defined in `TIER_LIMITS` and applied based on the user's tier. |
| **WARN** | Rate Limit Counter Integrity | `src/backend/rateLimitService.jsw` (Line 125) | `minuteBuckets` uses in-memory storage (`Map`). In a serverless environment (Wix Velo), this state is not shared across instances, allowing effectively higher limits than configured. |

### 3. Code Quality & Information Leakage

| Status | Check | File / Location | Details |
| :--- | :--- | :--- | :--- |
| **PASS** | No Suspicious Comments | `src/backend/` | No `TODO`, `HACK`, `FIXME`, `BYPASS` comments found in critical auth paths. |
| **WARN** | **Error Message Information Leakage** | `src/backend/apiAuthService.jsw` (Line 60, 68) | Returns "Invalid API key" vs "IP address not allowed". This distinction allows attackers to brute-force keys and confirm validity even if IP is blocked. |
| **PASS** | Secure Randomness | `src/backend/apiAuthService.jsw` (Line 207) | Uses `crypto.getRandomValues` for key generation. |

---

## Recommendations

1.  **Fix IP Whitelisting:** Modify `isIpAllowed` to return `false` if `ipAddress` is missing but a whitelist is defined.
2.  **Remove Rate Limit Bypass:** Remove the `x-lmdr-bypass-rate-limit` check or restrict it to `siteOwner` / admin users only (verified via context, not just header).
3.  **Restrict Permissions:** Update `permissions.json` to remove `Anonymous` access to backend modules. Only `apiGateway` (if intended to be public entry) or `http-functions.js` should be exposed. `apiAuthService.js` should likely be internal or restricted.
4.  **Generic Error Messages:** Change auth failures to a generic "Invalid credentials" message to prevent enumeration.
