# API Authentication & Rate Limiting Integrity Check

**Date:** 2024-05-21
**Auditor:** Jules (AI Security Engineer)
**Goal:** Verify that the LMDR platform's external API gateway has not had its authentication, authorization, or rate limiting logic weakened, bypassed, or accidentally disabled.

## Executive Summary

The API Gateway implementation contains critical security vulnerabilities that allow bypass of rate limits, unauthorized API key rotation, and IP whitelist bypass. While basic authentication and tier checks are present, several controls fail secure implementation standards.

## Security Control Checklist

| Control | Status | File / Location | Findings / Details |
| :--- | :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `src/backend/apiGateway.jsw:90` | `validateApiKey` is correctly called at the start of `handleGatewayRequest` before any processing. |
| **Secure Key Hashing** | **PASS** | `src/backend/apiAuthService.jsw:47` | API keys are hashed using SHA-256 via `hashApiKey` before storage/comparison. |
| **Secure Key Comparison** | **WARN** | `src/backend/apiAuthService.jsw:145` | Uses standard string comparison (`===`) for hash verification. Vulnerable to timing attacks. Recommend `crypto.timingSafeEqual` or `crypto.subtle.verify`. |
| **IP Whitelisting** | **FAIL** | `src/backend/apiAuthService.jsw:151` | Logic fails open: `if (!ipAddress) return true;`. An attacker can bypass the whitelist by omitting the IP header or if the gateway fails to forward it. Also, if whitelist is empty, it returns `true`. |
| **Subscription Tier Checks** | **PASS** | `src/backend/apiGateway.jsw:173` | `assertTier` is correctly enforced on premium endpoints (e.g., `assertTier(tier, 'growth')` at line 230). |
| **Rate Limiting Enforcement** | **FAIL** | `src/backend/apiGateway.jsw:542` | Logic includes an intentional bypass via header `x-lmdr-bypass-rate-limit`. Any user knowing this header can bypass all rate limits. |
| **Bypass/TODO Comments** | **PASS** | `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw` | No `// TODO`, `// HACK`, or similar comments found in critical paths. |
| **Key Rotation Security** | **FAIL** | `src/backend/apiAuthService.jsw:92` | `rotateApiKey` does not verify that the caller is authorized to rotate keys for the target `partnerId`. This is an IDOR vulnerability allowing any user with access to the function to rotate any partner's key. |
| **CORS Configuration** | **FAIL** | `src/backend/apiGateway.jsw:41` | `Access-Control-Allow-Origin: *` allows any website to make requests to the API, exposing it to CSRF-like attacks if cookie-based auth were added, and general abuse. |
| **Error Response Security** | **PASS** | `src/backend/apiGateway.jsw:452` | Error messages are generic (`invalid_api_key` vs `invalid_request`) and do not leak whether a key exists vs is invalid. |
| **Request Logging** | **PASS** | `src/backend/apiGateway.jsw:141` | `logRequest` captures status, IP, and timing for all requests. |

## Detailed Vulnerability Report

### 1. Rate Limit Bypass (Critical)
**File:** `src/backend/apiGateway.jsw:542`
**Code:**
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}
```
**Impact:** Allows complete bypass of rate limiting controls by adding a simple HTTP header.

### 2. IP Whitelist Bypass (High)
**File:** `src/backend/apiAuthService.jsw:151`
**Code:**
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // FAIL OPEN
  ...
}
```
**Impact:** If the IP address is not forwarded or spoofed to be empty, the whitelist check is skipped entirely.

### 3. Unauthorized Key Rotation (Critical)
**File:** `src/backend/apiAuthService.jsw:92`
**Code:**
```javascript
export async function rotateApiKey(partnerId, keyId, options = {}) {
  // No check if currentUser owns partnerId
  const partner = await dataAccess.findByField(COLLECTIONS.partners, 'partner_id', partnerId, ...);
  ...
}
```
**Impact:** IDOR vulnerability. An attacker can disable a legitimate partner's key and generate a new one for themselves if they know the `partnerId`.

### 4. Permissive CORS (Medium)
**File:** `src/backend/apiGateway.jsw:41`
**Code:**
```javascript
'Access-Control-Allow-Origin': '*',
```
**Impact:** Allows any origin to access the API.

## Recommendations

1.  **Remove the Rate Limit Bypass:** Delete `shouldBypassRateLimit` or restrict it to internal admin checks only.
2.  **Fix IP Whitelist Logic:** Change `if (!ipAddress) return true;` to `if (!ipAddress) return false;` (fail closed) or strictly require IP presence if a whitelist is configured.
3.  **Secure Key Rotation:** Add an authorization check in `rotateApiKey` to ensure the current user is an admin or the owner of the `partnerId`.
4.  **Restrict CORS:** Set `Access-Control-Allow-Origin` to a specific list of allowed domains.
5.  **Use Constant-Time Comparison:** Replace `===` with `crypto.timingSafeEqual` or `crypto.subtle.verify` for key hash verification.