# API Gateway Security Audit Report
**Date:** 2026-03-03
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`

## Executive Summary
The API Gateway authentication and rate limiting logic contains **critical security vulnerabilities**. While basic authentication (API Key validation) and subscription tier enforcement are present, multiple mechanisms allow for authentication bypass, rate limit evasion, and unauthorized access to sensitive administrative functions. Immediate remediation is required.

## Checklist Verification

| Security Control | Status | Location | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `apiGateway.jsw:48` | `validateApiKey` is called on every request. |
| **API Key Hashing** | **PASS** | `apiAuthService.jsw:34` | SHA-256 with pepper is used. Keys are never stored/compared in plaintext. |
| **IP Whitelisting** | **FAIL** | `apiAuthService.jsw:141` | Logic fails open (allows access) if IP is missing or whitelist is empty. |
| **Rate Limiting (Enforcement)** | **FAIL** | `apiGateway.jsw:161` | Header `x-lmdr-bypass-rate-limit` allows complete bypass of rate limits. |
| **Subscription Tier Checks** | **PASS** | `apiGateway.jsw:334` | `assertTier` correctly enforces access levels. |
| **Suspicious Code Markers** | **PASS** | N/A | No `TODO`, `HACK`, or `FIXME` comments found near auth logic. |
| **Authorization Boundaries** | **FAIL** | `permissions.json` | Wildcard allows `Anonymous` access to all backend web methods. |
| **Sensitive Function Exposure** | **FAIL** | `apiAuthService.jsw:84` | `rotateApiKey` is publicly exposed without internal auth checks. |
| **Error Handling** | **WARN** | `apiAuthService.jsw` | Error messages distinguish between "Invalid API Key" and "IP address not allowed", leaking info. |
| **Rate Limit Architecture** | **WARN** | `rateLimitService.jsw` | Minute-level rate limits are instance-local (not distributed). |

## Detailed Findings

### 1. Critical: IP Whitelist Bypass
**File:** `src/backend/apiAuthService.jsw`
**Line:** 141-144

The `isIpAllowed` function returns `true` (access granted) if the client IP address is not provided (e.g., header missing) or if the partner's whitelist is empty.
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // FAIL OPEN
  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];
  if (!whitelist.length) return true; // FAIL OPEN
  return whitelist.includes(ipAddress);
}
```
**Impact:** Attackers can bypass IP restrictions by omitting the `X-Forwarded-For` header or if the partner has not configured a whitelist.

### 2. Critical: Rate Limit Bypass Header
**File:** `src/backend/apiGateway.jsw`
**Line:** 378

The gateway explicitly checks for a header `x-lmdr-bypass-rate-limit` and disables rate limiting if set to `'true'`. There is no check to verify if the caller is authorized to use this bypass (e.g., an internal service or admin).
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true'; // FAIL
}
```
**Impact:** Any authenticated user can bypass rate limits, potentially leading to Denial of Service (DoS) or quota evasion.

### 3. Critical: Unauthorized Key Rotation
**File:** `src/backend/apiAuthService.jsw`
**Line:** 84

The `rotateApiKey` function is exposed via Velo web modules (due to `permissions.json` wildcard) and lacks internal authorization checks. It accepts `partnerId` and `keyId` as arguments.
```javascript
export async function rotateApiKey(partnerId, keyId, options = {}) {
  // No check if context.user is authorized for partnerId
  // ...
}
```
**Impact:** An attacker can rotate (invalidate and replace) API keys for any partner if they can guess the `partnerId` and `keyId` (which is predictable `key_${timestamp}`).

### 4. Critical: Public Exposure of Backend Modules
**File:** `src/backend/permissions.json`

The permissions configuration allows `Anonymous` users to invoke any backend function exported from a `.jsw` file.
```json
"web-methods": {
  "*": {
    "*": {
      "anonymous": { "invoke": true }
    }
  }
}
```
**Impact:** All exported backend functions are effectively public API endpoints, bypassing the intended `apiGateway` structure.

### 5. Warning: Information Leak in Error Messages
**File:** `src/backend/apiAuthService.jsw`

The `validateApiKey` function returns specific error codes that reveal the validity of the API key before checking IP restrictions.
```javascript
if (!resolved?.partner) { return ... 'invalid_api_key' }
if (!isIpAllowed(partner, ipAddress)) { return ... 'forbidden_ip' }
```
**Impact:** Allows attackers to valid API keys by observing the error message change from "Invalid API key" to "IP address not allowed".

## Recommendations

1.  **Fix IP Whitelisting:** Change `isIpAllowed` to return `false` if `ipAddress` is missing (if strict security is desired) or at least validate it properly. If empty whitelist means "allow all", that is a business decision, but failing open on missing IP is risky.
2.  **Remove Bypass Header:** Delete `shouldBypassRateLimit` or restrict it to specific internal secrets (not client headers).
3.  **Secure `rotateApiKey`:** Add `validateApiKey` check inside `rotateApiKey` or restrict it in `permissions.json`.
4.  **Lock Down `permissions.json`:** Remove the wildcard `*` permission for `Anonymous`. Explicitly grant `Anonymous` access only to `apiGateway` (if needed) or require all calls to go through HTTP functions.
5.  **Unify Error Messages:** Return a generic "Authentication Failed" message for both invalid keys and IP restrictions to prevent enumeration.

---
**Verification Script:** A script `verify_vulnerabilities.js` was created and run to confirm findings 1 and 2.
