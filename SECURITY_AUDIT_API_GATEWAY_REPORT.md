# API Security Audit Report

**Date:** 2026-03-03
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/permissions.json`
**Auditor:** Jules (AI Security Engineer)

## Executive Summary

The LMDR API Gateway contains **CRITICAL** security vulnerabilities that allow unauthorized access, rate limit bypassing, and potential Denial of Service (DoS) attacks. While basic authentication (API Key) and encryption (SHA-256) are present, the authorization and access control layers are severely compromised by "fail-open" logic and permissive configurations.

## Control Checklist

| Control | Status | Location | Details |
| :--- | :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `apiGateway.jsw:58` | `validateApiKey` is called on every request. |
| **API Key Hashing** | **PASS** | `apiAuthService.jsw:45` | Keys are hashed with SHA-256 + Pepper before comparison. |
| **Secure Key Comparison** | **PASS** | `apiAuthService.jsw:64` | Comparison is done on hashes, preventing timing attacks on raw keys. |
| **IP Whitelisting** | **FAIL** | `apiAuthService.jsw:149` | **Fails Open**: If IP is missing (null) or whitelist is empty, access is granted. |
| **Rate Limiting (Enforcement)** | **WARN** | `rateLimitService.jsw` | enforced in-memory (per instance), not distributed. |
| **Rate Limiting (Bypass)** | **FAIL** | `apiGateway.jsw:306` | **Critical**: `x-lmdr-bypass-rate-limit: true` header bypasses all limits. |
| **Authorization (Key Rotation)** | **FAIL** | `apiAuthService.jsw:100` | `rotateApiKey` is public (Anonymous) and lacks internal auth checks. |
| **Subscription Tier Checks** | **PASS** | `apiGateway.jsw` | `assertTier` is used correctly on sensitive endpoints. |
| **CORS Configuration** | **WARN** | `apiGateway.jsw:32` | `Access-Control-Allow-Origin: *` is permissive. |
| **DoS Protection** | **FAIL** | `apiAuthService.jsw:181` | Partner lookup fetches *all* partners (up to 1000) on cache miss. |

## Detailed Findings

### 1. Critical: Rate Limit Bypass Header
**Location:** `src/backend/apiGateway.jsw`
**Line:** 306
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}
```
**Impact:** Any attacker who discovers this header can flood the API without restriction, bypassing billing quotas and protective limits.
**Recommendation:** Remove this bypass mechanism immediately or restrict it to a specific, secret-protected internal key.

### 2. Critical: IP Whitelisting Fails Open
**Location:** `src/backend/apiAuthService.jsw`
**Line:** 149
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // Vulnerability 1
  const whitelist = ...;
  if (!whitelist.length) return true; // Vulnerability 2
  // ...
}
```
**Impact:** If the `x-forwarded-for` header is missing or stripped, the IP check is skipped. If a partner has an empty whitelist, they are not protected.
**Recommendation:** Change logic to `return false` if `ipAddress` is missing. Treat empty whitelist as "deny all" or explicitly document "allow all" behavior.

### 3. Critical: Unauthorized Key Rotation
**Location:** `src/backend/apiAuthService.jsw` & `src/backend/permissions.json`
**Impact:** The `rotateApiKey` function is exposed to `Anonymous` users via wildcard permissions. It accepts a `partnerId` and rotates keys without verifying if the caller owns that partner ID.
**Proof:**
```json
"web-methods": {
  "*": {
    "*": {
      "anonymous": { "invoke": true }
    }
  }
}
```
**Recommendation:** Restrict `apiAuthService.jsw` to `SiteOwner` or `Admin` in `permissions.json`. Add internal checks to verify `wix-users.currentUser` matches the `partnerId`.

### 4. High: Denial of Service Vector (Inefficient Lookup)
**Location:** `src/backend/apiAuthService.jsw`
**Line:** 181
**Impact:** On cache miss, the system fetches up to 1000 partners from the database and iterates in memory. This is computationally expensive and slow.
**Recommendation:** Create a separate `apiKeys` collection indexed by `key_hash` for O(1) lookups.

### 5. Medium: Missing Logging for Auth Failures
**Observation:** `logRequest` is called in `finally`, but specific auth failure reasons (e.g., "invalid_signature" vs "expired") are not detailed in a dedicated security log, only the HTTP status code.
**Recommendation:** specific security events should be logged to a separate `securityEvents` collection.

## Verification
A proof-of-concept script `scripts/verify_api_security.js` was created and executed, confirming the "fail open" behaviors and bypass vulnerabilities.

## Conclusion
The API Gateway is currently **UNSECURE** against sophisticated attacks and internal abuse. Immediate remediation of the findings above is required.
