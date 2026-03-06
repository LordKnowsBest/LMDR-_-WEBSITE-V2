# API Gateway Security Report

## 1. `validateApiKey` presence on route handlers
**Status:** PASS
**File:** `src/backend/apiGateway.jsw`
**Details:** `validateApiKey` is called at the beginning of `handleGatewayRequest` (Line 90). The request is rejected early with an appropriate error if authentication fails, before route matching or executing the specific handlers in `routeRequest`.

## 2. API key hashing with SHA-256
**Status:** PASS
**File:** `src/backend/apiAuthService.jsw`
**Details:** API keys are hashed with SHA-256 (via `crypto.subtle.digest` in `sha256Hex`) combined with a pepper retrieved from `wix-secrets-backend` (Line 41 in `hashApiKey`). The hashes are then compared instead of plaintext keys.

## 3. IP whitelisting logic
**Status:** PASS
**File:** `src/backend/apiAuthService.jsw`
**Details:** The `isIpAllowed` function (Line 115) enforces IP restrictions by checking if the partner's IP whitelist array contains the request's IP address. It fails closed correctly when the array has elements.

## 4. Subscription tier checks
**Status:** PASS
**File:** `src/backend/apiGateway.jsw`
**Details:** Subscription tiers are strictly enforced within `routeRequest`. Accessing higher-tier endpoints triggers the `assertTier` function (Line 368), which accurately throws a `forbidden_tier` error if the required tier is higher than the user's tier.

## 5. Rate limiting logic
**Status:** PASS
**File:** `src/backend/rateLimitService.jsw`
**Details:** The `checkAndTrackUsage` method enforces the per-minute limits and checks monthly quota limits properly, and earlier the bypass functionality which bypassed these restrictions has been completely removed. It responds with 429 when limits are exceeded.

## 6. TODO/HACK/FIXME markers near auth code
**Status:** PASS
**File:** Multiple
**Details:** A search was performed for `TODO`, `HACK`, `FIXME`, `BYPASS`, `SKIP`, `TEMP`, or `DISABLE` in `apiGateway.jsw`, `apiAuthService.jsw`, and `rateLimitService.jsw`. No remaining bypassing comments or disabling markers were found near authentication and authorization paths.

**Summary:** The API Gateway is secure, all controls are active and strictly enforced.