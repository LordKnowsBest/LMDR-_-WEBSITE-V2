# API Gateway Security Audit Report

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/rateLimitService.jsw`

## Executive Summary

The API Gateway implements several core security controls, including API key validation, hashing, tier enforcement, and request logging. However, critical vulnerabilities exist that allow attackers to bypass IP whitelisting and rate limiting. Additionally, the rate limiting implementation is not distributed, potentially allowing higher throughput than intended in a serverless environment.

## Security Control Checklist

| Control | Status | File Path | Line(s) | Notes |
| :--- | :---: | :--- | :--- | :--- |
| **Auth Function Call** | **PASS** | `src/backend/apiGateway.jsw` | 90 | `validateApiKey` is called on every request. |
| **Key Hashing** | **PASS** | `src/backend/apiAuthService.jsw` | 66-71 | SHA-256 used with pepper. |
| **IP Whitelisting** | **FAIL** | `src/backend/apiAuthService.jsw` | 151 | Bypassed if `ipAddress` is missing/null. |
| **Tier Checks** | **PASS** | `src/backend/apiGateway.jsw` | 257, 293+ | `assertTier` enforced on restricted endpoints. |
| **Rate Limiting (Enforcement)** | **FAIL** | `src/backend/apiGateway.jsw` | 536 | Bypassed via `x-lmdr-bypass-rate-limit` header. |
| **Rate Limiting (Architecture)** | **FAIL** | `src/backend/rateLimitService.jsw` | 15 | In-memory `minuteBuckets` are not distributed. |
| **Code Comments** | **PASS** | N/A | N/A | No `TODO`, `HACK`, `FIXME` found in critical paths. |
| **Information Leakage** | **WARN** | `src/backend/apiAuthService.jsw` | 94, 98 | Distinct error codes for "Invalid Key" vs "Forbidden IP". |
| **Logging** | **PASS** | `src/backend/apiGateway.jsw` | 134 | Requests (success & failure) are logged. |
| **Key Generation** | **PASS** | `src/backend/apiAuthService.jsw` | 171 | Uses `crypto.getRandomValues`. |
| **Authorization (Key Rotation)** | **FAIL** | `src/backend/apiAuthService.jsw` | 102 | `rotateApiKey` lacks caller authorization checks. |
| **Timing Side-Channel** | **WARN** | `src/backend/apiAuthService.jsw` | 145 | String comparison of key hashes. |

## Detailed Findings

### 1. IP Whitelisting Bypass (Critical)
**File:** `src/backend/apiAuthService.jsw` (Line 151)
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // VULNERABILITY
  // ...
}
```
**Impact:** If the `ipAddress` argument is `null` or `undefined` (e.g., if the `x-forwarded-for` header is missing or stripped), the function returns `true`, completely bypassing the whitelist check.
**Recommendation:** Change the default behavior to `return false` if `ipAddress` is missing and a whitelist exists.

### 2. Rate Limit Bypass Header (Critical)
**File:** `src/backend/apiGateway.jsw` (Line 536)
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true'; // VULNERABILITY
}
```
**Impact:** Any user (authenticated or not) can bypass rate limits by adding the header `x-lmdr-bypass-rate-limit: true` to their request. This is likely a debugging artifact left in production.
**Recommendation:** Remove this bypass mechanism or restrict it to internal admin users only.

### 3. Missing Authorization in Key Rotation (High)
**File:** `src/backend/apiAuthService.jsw` (Line 102)
```javascript
export async function rotateApiKey(partnerId, keyId, options = {}) {
  // No check to see if the caller is allowed to modify partnerId
  // ...
}
```
**Impact:** While `rotateApiKey` is likely intended to be called by an admin or the partner themselves, the function itself performs no authorization check. If exposed via a Velo web module without `permissions.json` restrictions, any user could rotate another partner's API key.
**Recommendation:** Add `authorizeAction(requestUser, partnerId)` check at the beginning of the function.

### 4. Non-Distributed Rate Limiting (High)
**File:** `src/backend/rateLimitService.jsw` (Line 15)
```javascript
const minuteBuckets = new Map();
```
**Impact:** Rate limits are stored in a module-level `Map`. In Wix Velo's serverless environment, multiple instances of the backend may run simultaneously. Rate limits will be enforced per-instance, not globally. A partner could exceed their rate limit by hitting different instances.
**Recommendation:** Use a distributed store (e.g., Wix Data or an external Redis) for rate limiting counters, or accept that limits are "soft" per instance.

### 5. Information Leakage (Medium)
**File:** `src/backend/apiAuthService.jsw` (Lines 94, 98)
**Impact:** The API returns `invalid_api_key` if the key is not found, but `forbidden_ip` if the key is valid but the IP is blocked. This allows an attacker to brute-force or enumerate valid API keys by observing the error code change from 401 to 403.
**Recommendation:** Return a generic "Invalid Credentials" or 401 error for both cases to mask the existence of the key.

### 6. Timing Side-Channel (Low)
**File:** `src/backend/apiAuthService.jsw` (Line 145)
```javascript
return keys.some((key) => key.is_active !== false && key.key_hash === keyHash);
```
**Impact:** String comparison (`===`) of hashes is not constant-time. While exploiting this over a network for SHA-256 hashes is theoretically difficult, it is a cryptographic weakness.
**Recommendation:** Use `crypto.timingSafeEqual` (available in Node.js `crypto` module) for hash comparisons.

## Conclusion
The API Gateway has foundational security controls but is currently vulnerable to trivial bypasses for IP whitelisting and rate limiting. These critical issues should be remediated immediately.
