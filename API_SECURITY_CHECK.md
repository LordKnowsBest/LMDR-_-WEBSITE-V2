# API Security Integrity Check Report

**Date:** 2024-02-23
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/rateLimitService.jsw`, `src/backend/http-functions.js`
**Auditor:** Jules (AI Security Engineer)

## Executive Summary

The LMDR platform's API gateway was reviewed to confirm the integrity of authentication, authorization, and rate limiting controls.
All core security controls are **ACTIVE** and **IMPLEMENTED**.
However, three (3) potential risks (WARN) were identified that may require policy review or remediation depending on the threat model.

## Security Controls Checklist

| Control | Status | File / Context | Notes |
| :--- | :---: | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `apiGateway.jsw` (Line 52) | `validateApiKey` is called immediately for all requests in `handleGatewayRequest`. |
| **Secure Key Storage** | **PASS** | `apiAuthService.jsw` (Line 46) | Keys are hashed with SHA-256 (and optional pepper) before storage/comparison. |
| **No Plaintext Comparison** | **PASS** | `apiAuthService.jsw` (Line 64) | Incoming keys are hashed *before* being used in database lookups. |
| **Secure Key Generation** | **PASS** | `apiAuthService.jsw` (Line 163) | Uses `crypto.getRandomValues` for high-entropy key generation. |
| **IP Whitelisting** | **PASS** | `apiAuthService.jsw` (Line 69) | `isIpAllowed` logic is present and enforced. See **WARN #2** below. |
| **Subscription Tier Checks** | **PASS** | `apiGateway.jsw` | `assertTier` is called in `routeRequest` to enforce `growth`/`enterprise` limits. |
| **Rate Limiting** | **PASS** | `rateLimitService.jsw` | `checkAndTrackUsage` enforces per-minute and monthly quotas. |
| **Code Hygiene** | **PASS** | Multiple Files | No `TODO`, `HACK`, `BYPASS`, or `FIXME` comments found in critical paths. |
| **Logging** | **PASS** | `apiGateway.jsw` (Line 104) | Failed requests (401/403/429) are logged via `logRequest` in the `finally` block. |
| **Endpoint Coverage** | **PASS** | `http-functions.js` | All API traffic is correctly routed through `handleGatewayRequest`. |

## Findings & Recommendations

### 1. WARN: Rate Limit Bypass via Header
**Location:** `src/backend/apiGateway.jsw` (Line 348)
**Issue:** The header `x-lmdr-bypass-rate-limit: true` allows **any** authenticated user to completely bypass rate limits and quotas.
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}
```
**Risk:** A malicious or compromised valid user could exhaust system resources or scrape data without restriction.
**Recommendation:** Restrict this bypass to specific internal partner IDs or tiers (e.g., 'custom' tier only), or remove it if it is a debug artifact.

### 2. WARN: IP Whitelist Fail-Open
**Location:** `src/backend/apiAuthService.jsw` (Line 137)
**Issue:** If the `ipAddress` cannot be determined (returns `null`), the whitelist check returns `true` (allowed).
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // Fail Open
  // ...
}
```
**Risk:** An attacker who can strip `x-forwarded-for` / `x-real-ip` headers (or bypass the load balancer logic) could bypass IP restrictions.
**Recommendation:** Change logic to fail-closed (`return false`) if an IP address cannot be resolved, or ensure the upstream infrastructure guarantees these headers.

### 3. WARN: Auth Error Information Leakage
**Location:** `src/backend/apiAuthService.jsw` (Lines 60-77)
**Issue:** The API returns distinct error codes/messages for different auth failures:
- `invalid_api_key`: Key not found.
- `forbidden_ip`: Key found, but IP blocked.
- `subscription_inactive`: Key found, but sub inactive.
**Risk:** Allows an attacker to enumerate valid API keys by distinguishing between "invalid key" and "valid key but blocked".
**Recommendation:** Normalize all authentication failures to a generic `401 Unauthorized` / "Invalid credentials" response, or accept this risk for better debugging experience for partners.
