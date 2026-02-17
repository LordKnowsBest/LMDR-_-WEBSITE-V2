# LMDR API Gateway Security Audit Report

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/rateLimitService.jsw`

## Executive Summary

The API Gateway has robust foundational security controls (mandatory auth, hashed keys, subscription checks) but contains **three critical vulnerabilities** that undermine these protections:
1.  **IP Whitelisting Bypass:** The IP check logic fails open if the client IP is not detected (e.g., stripped headers).
2.  **Rate Limit Bypass:** A specific HTTP header (`x-lmdr-bypass-rate-limit`) completely disables rate limiting without any authorization check.
3.  **Unprotected Key Rotation:** The `rotateApiKey` function is publicly exposed and lacks authorization, allowing anyone to rotate a partner's API key if they know the Partner ID.

---

## 1. Authentication & Authorization Checklist

| Status | Control | File | Line | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PASS** | `validateApiKey` called on every route | `src/backend/apiGateway.jsw` | 44-47 | Auth is the first step in request handling. |
| **PASS** | API Keys Hashed (SHA-256 + Pepper) | `src/backend/apiAuthService.jsw` | 43-47 | Keys are hashed before storage/comparison. |
| **PASS** | Subscription Tier Enforcement | `src/backend/apiGateway.jsw` | 338, 350, etc. | `assertTier` helper ensures correct access level. |
| **FAIL** | IP Whitelisting Logic Integrity | `src/backend/apiAuthService.jsw` | 149 | `if (!ipAddress) return true;` fails open. |
| **FAIL** | Secure Key Rotation Endpoint | `src/backend/apiAuthService.jsw` | 98 | `rotateApiKey` is public and lacks caller auth check. |
| **WARN** | Auth Error Information Leakage | `src/backend/apiAuthService.jsw` | 65-71 | Distinguishes between "Invalid API key" and "IP not allowed". |
| **PASS** | Secure Random Key Generation | `src/backend/apiAuthService.jsw` | 224 | Uses `crypto.getRandomValues`. |

## 2. Rate Limiting & Abuse Prevention

| Status | Control | File | Line | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PASS** | Rate Limiting Enabled | `src/backend/apiGateway.jsw` | 54 | `checkAndTrackUsage` called for every request. |
| **FAIL** | Rate Limit Bypass Protection | `src/backend/apiGateway.jsw` | 398 | `x-lmdr-bypass-rate-limit: true` bypasses checks freely. |
| **WARN** | Rate Limit Scalability | `src/backend/rateLimitService.jsw` | 13 | Uses in-memory `Map` (`minuteBuckets`), won't scale horizontally. |
| **PASS** | Quota Enforcement | `src/backend/rateLimitService.jsw` | 80 | Monthly quotas (e.g., driver searches) enforced. |

## 3. Data Protection & Configuration

| Status | Control | File | Line | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **WARN** | CORS Policy | `src/backend/apiGateway.jsw` | 25 | `Access-Control-Allow-Origin: *` allows all origins. |
| **WARN** | Constant-Time Key Comparison | `src/backend/apiAuthService.jsw` | 145 | Hashed keys compared via standard string equality, not `crypto.timingSafeEqual`. |
| **PASS** | No Hardcoded Secrets | `src/backend/apiAuthService.jsw` | 1 | Uses `wix-secrets-backend`. |
| **PASS** | Suspicious Comments Check | Multiple | N/A | No `TODO`, `HACK`, or `FIXME` markers found near critical auth code. |

---

## 4. Critical Findings Detail

### 1. IP Whitelist Fails Open (FAIL)
**File:** `src/backend/apiAuthService.jsw` (Line 149)
**Code:** `if (!ipAddress) return true;`
**Risk:** High. An attacker can bypass IP restrictions by stripping `X-Forwarded-For` or `X-Real-IP` headers (if the platform allows) or if the platform fails to provide them.
**Remediation:** Change default behavior to `return false` if IP is required but missing.

### 2. Rate Limit Bypass Header (FAIL)
**File:** `src/backend/apiGateway.jsw` (Line 398) & `src/backend/rateLimitService.jsw` (Line 50)
**Code:** `const headerValue = ... 'x-lmdr-bypass-rate-limit' ... return headerValue === 'true';`
**Risk:** High. Any user (or attacker) who discovers this header can flood the API without restriction, potentially causing Denial of Service (DoS) or incurring high costs.
**Remediation:** Remove this bypass mechanism or restrict it to internal admin calls only (verified by a secret or specific admin permission).

### 3. Unprotected Key Rotation (FAIL)
**File:** `src/backend/apiAuthService.jsw` (Line 98)
**Function:** `rotateApiKey(partnerId, keyId)`
**Risk:** Critical. This function is exported as a web module method, making it publicly callable. It takes `partnerId` as an argument and trusts it without verifying if the *caller* is that partner (or an admin).
**Remediation:** Implement `checkUser()` or similar to verify the caller owns the `partnerId`. Remove the export if it's not intended for public client-side use.

---

## 5. Verification
A verification script `scripts/verify_api_security.js` was created and executed to confirm these findings.
**Command:** `node scripts/verify_api_security.js`
**Result:** Confirmed IP whitelist bypass and rate limit bypass logic are active.
