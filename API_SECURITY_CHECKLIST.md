# API Security Integrity Checklist

This report documents the results of the API Authentication & Rate Limiting Integrity Check performed on the LMDR platform.

**Date:** 2026-10-18
**Status:** FAIL (Critical Vulnerabilities Found)

---

## 1. Authentication & Authorization

| Status | Control | File / Location | Notes |
| :--- | :--- | :--- | :--- |
| **PASS** | `validateApiKey` called on every request | `src/backend/apiGateway.jsw:57` | Function is invoked before processing any request logic. |
| **PASS** | API Keys Hashed (SHA-256) | `src/backend/apiAuthService.jsw:45` | Keys are hashed with SHA-256 and peppered before storage/comparison. |
| **PASS** | Subscription Tier Checks | `src/backend/apiGateway.jsw:127` | Tier checks (e.g., `assertTier`) are present on restricted endpoints. |
| **FAIL** | **Permissions.json Wildcard Exposure** | `src/backend/permissions.json:4` | `web-methods: { *: { *: { anonymous: { invoke: true } } } }` grants public access to ALL backend functions, including `rotateApiKey`. |
| **FAIL** | **IP Whitelist Bypass** | `src/backend/apiAuthService.jsw:146` | `isIpAllowed` returns `true` if `ipAddress` is null/undefined (fail-open). |
| **WARN** | Auth Error Information Leak | `src/backend/apiAuthService.jsw:69,74` | Returns distinct errors for `invalid_api_key` vs `forbidden_ip`, allowing attackers to enumerate valid keys. |

## 2. Rate Limiting

| Status | Control | File / Location | Notes |
| :--- | :--- | :--- | :--- |
| **FAIL** | **Rate Limit Bypass Header** | `src/backend/apiGateway.jsw:337` | `x-lmdr-bypass-rate-limit: true` header allows ANY authenticated user to bypass limits without role/admin verification. |
| **WARN** | In-Memory Rate Limiting | `src/backend/rateLimitService.jsw:14` | Uses local `minuteBuckets` (Map). Limits are per-instance, not global, leading to inconsistent enforcement across scaling. |
| **PASS** | Rate Limit Logic Active | `src/backend/apiGateway.jsw:65` | `checkAndTrackUsage` is called and enforced (unless bypassed). |

## 3. Code Integrity

| Status | Control | File / Location | Notes |
| :--- | :--- | :--- | :--- |
| **PASS** | No TODO/HACK Markers | Global Search | No security-related TODOs or HACK comments found in `apiGateway.jsw` or `apiAuthService.jsw`. |

---

## Recommendations

1.  **Restrict `permissions.json`**: Remove global wildcards. Explicitly list exposed functions and restrict sensitive ones (like `rotateApiKey`) to `siteOwner` or remove from web exposure.
2.  **Fix IP Whitelist Logic**: Change `isIpAllowed` to return `false` if `ipAddress` is missing and a whitelist is configured.
3.  **Secure Rate Limit Bypass**: Add a role check (e.g., verify user is an Admin) inside `shouldBypassRateLimit` or remove the client-controlled header entirely.
4.  **Unified Auth Errors**: Return a generic `401 Unauthorized` for both invalid keys and IP failures to prevent enumeration.
