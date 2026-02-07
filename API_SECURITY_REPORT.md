# API Security Audit Report

**Date:** 2024-05-23
**Target:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`

## Summary
The API Gateway was reviewed for authentication, authorization, rate limiting, and code quality. While core authentication mechanisms (API key validation, hashing) are secure, a critical vulnerability in the rate limiting logic was identified, along with several endpoints lacking explicit tier enforcement.

## Checklist

| Control | Status | File / Location | Notes |
| :--- | :---: | :--- | :--- |
| **Authentication Enforcement** | PASS | `src/backend/apiGateway.jsw`:60 | `validateApiKey` is called on all requests (except OPTIONS). |
| **API Key Hashing** | PASS | `src/backend/apiAuthService.jsw`:47 | Keys are hashed with SHA-256 + pepper. |
| **IP Whitelisting** | PASS | `src/backend/apiAuthService.jsw`:73 | `isIpAllowed` logic is active and enforced. |
| **Subscription Status Check** | PASS | `src/backend/apiAuthService.jsw`:79 | Inactive subscriptions are rejected. |
| **Rate Limiting Enforcement** | **FAIL** | `src/backend/apiGateway.jsw`:230 | **Critical:** `shouldBypassRateLimit` allows bypassing rate limits via `x-lmdr-bypass-rate-limit: true` header. |
| **Tier Enforcement (General)** | PASS | `src/backend/apiGateway.jsw`:178 | `assertTier` helper exists and is used in many routes. |
| **Tier Enforcement (Coverage)** | **WARN** | `src/backend/apiGateway.jsw` | Multiple endpoints lack `assertTier` calls (implicit 'starter' access). See details below. |
| **Code Markers (TODO/HACK)** | PASS | various | No TODO, HACK, FIXME, BYPASS, SKIP, TEMP, or DISABLE markers found. |
| **Key Generation** | PASS | `src/backend/apiAuthService.jsw`:225 | Uses `crypto.getRandomValues` for secure random generation. |

## Detailed Findings

### 1. Rate Limit Bypass Vulnerability (FAIL)
**File:** `src/backend/apiGateway.jsw`
**Line:** 230
**Description:** The function `shouldBypassRateLimit` checks for the presence of the header `x-lmdr-bypass-rate-limit`. If set to `true`, the `checkAndTrackUsage` service returns `allowed: true` immediately, bypassing all rate limits. This allows any authenticated user (even on 'starter' tier) to flood the API by simply adding this header.

```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}
```

### 2. Missing Explicit Tier Checks (WARN)
**File:** `src/backend/apiGateway.jsw`
**Description:** The following routes do not call `assertTier`. This implies they are accessible to all tiers (including 'starter'). While this may be intentional for basic features, it should be verified.

*   `/v1/safety/carrier/:dotNumber`
*   `/v1/safety/carriers/batch`
*   `/v1/safety/csa/:dotNumber`
*   `/v1/safety/csa/:dotNumber/history`
*   `/v1/safety/alerts/subscribe`
*   `/v1/safety/alerts/subscriptions`
*   `/v1/safety/alerts/:subscriptionId`
*   `/v1/intelligence/market`
*   `/v1/intelligence/carriers/search`
*   `/v1/parking/search`
*   `/v1/parking/location/:locationId`
*   `/v1/matching/carriers`
*   `/v1/matching/qualify`

### 3. Subscription Scalability (INFO)
**File:** `src/backend/apiAuthService.jsw`
**Line:** 183
**Description:** `resolvePartnerByKeyHash` queries all active partners with a limit of 1000. If the number of partners exceeds 1000, valid API keys belonging to partners outside the first 1000 results may be rejected (false negative). This is a scalability issue, not a direct security bypass.

## Recommendations

1.  **Remove Rate Limit Bypass:** Delete the `shouldBypassRateLimit` function and its usage in `handleGatewayRequest`. If a bypass is needed for internal testing, implement a secure mechanism (e.g., checking a specific internal API key or a secret environment variable).
2.  **Verify Tier Requirements:** Review the list of endpoints with missing `assertTier` calls to ensure 'starter' tier access is intended.
3.  **Optimize Partner Lookup:** Refactor `resolvePartnerByKeyHash` to query for the specific key hash directly (requires indexing `api_keys.key_hash` in the database) or handle pagination if scanning is necessary.
