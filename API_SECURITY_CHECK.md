# API Security Integrity Check

## Status Summary

| Control | Status | File / Line | Notes |
| :--- | :---: | :--- | :--- |
| **Auth Validation** | PASS | `src/backend/apiGateway.jsw:58` | `validateApiKey` is called on every request. |
| **API Key Hashing** | PASS | `src/backend/apiAuthService.jsw:43` | Keys are hashed with SHA-256 + pepper. Plaintext keys are not stored. |
| **IP Whitelisting** | PASS | `src/backend/apiAuthService.jsw:72` | `isIpAllowed` checks whitelist if configured. Default allows all if whitelist empty. |
| **Tier Checks** | PASS | `src/backend/apiGateway.jsw` | `assertTier` is used on endpoints (e.g., lines 193, 313, 329, etc.). |
| **Rate Limiting** | **WARN** | `src/backend/rateLimitService.jsw:54` | **Critical:** `x-lmdr-bypass-rate-limit` header allows *any* authenticated user to bypass limits. |
| **Suspicious Comments** | PASS | `src/backend/*.jsw` | No `TODO`, `HACK`, `BYPASS` found near auth code. |

## Detailed Findings

### 1. Authentication Validation (PASS)
- **Location:** `src/backend/apiGateway.jsw` (Line 58)
- **Observation:** The `handleGatewayRequest` function calls `validateApiKey` early in the request lifecycle.
- **Code:**
  ```javascript
  authContext = await validateApiKey({
    authorizationHeader: getHeader(request, 'authorization'),
    ipAddress
  });
  if (!authContext.success) { ... }
  ```
- **Integrity:** The check is mandatory and enforced before any business logic executes.

### 2. API Key Hashing (PASS)
- **Location:** `src/backend/apiAuthService.jsw` (Line 43)
- **Observation:** Keys are hashed using `SHA-256` with a secret pepper (`API_KEY_PEPPER`). Plaintext keys are generated once during rotation but never stored in the database; only the hash is persisted.
- **Code:**
  ```javascript
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  ```
- **Integrity:** Hashing prevents compromised databases from leaking valid API keys.

### 3. IP Whitelisting (PASS)
- **Location:** `src/backend/apiAuthService.jsw` (Line 72)
- **Observation:** The `isIpAllowed` function checks against `partner.ip_whitelist`. If the whitelist is empty or the IP address cannot be determined (rare), access is allowed. This is standard behavior for optional IP restrictions.
- **Code:**
  ```javascript
  if (!whitelist.length) return true;
  return whitelist.includes(ipAddress);
  ```

### 4. Subscription Tier Checks (PASS)
- **Location:** `src/backend/apiGateway.jsw`
- **Observation:** Endpoints requiring higher tiers explicitly call `assertTier`. For example, fuel price search requires `growth` tier.
- **Code:**
  ```javascript
  assertTier(tier, 'growth');
  ```
- **Integrity:** Logic correctly prevents `starter` tier users from accessing premium features.

### 5. Rate Limiting Logic (WARN)
- **Location:** `src/backend/rateLimitService.jsw` (Line 54) & `src/backend/apiGateway.jsw` (Line 430)
- **Issue:** The `checkAndTrackUsage` function implements a bypass mechanism triggered by the `x-lmdr-bypass-rate-limit` header.
- **Vulnerability:** **Any authenticated user** can include this header to bypass both per-minute and monthly rate limits. While likely intended for internal testing, it lacks authorization checks (e.g., verifying the user is an admin or a specific partner).
- **Code:**
  ```javascript
  // src/backend/apiGateway.jsw
  function shouldBypassRateLimit(request) {
    const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
    return headerValue === 'true';
  }

  // src/backend/rateLimitService.jsw
  if (bypassRateLimit) {
    // Returns allowed: true immediately
    return { allowed: true, ... };
  }
  ```
- **Recommendation:** Restrict this bypass to specific partner IDs or remove it from production code.

### 6. Suspicious Comments (PASS)
- **Observation:** A search for `TODO`, `HACK`, `FIXME`, `BYPASS`, `SKIP`, `TEMP`, and `DISABLE` yielded no results in the relevant backend files.

## Additional Notes
- **Instance-Local Rate Limiting:** The per-minute rate limiting uses an in-memory `Map` (`minuteBuckets`) which is local to the server instance. In a scaled environment with multiple instances, the effective rate limit will be higher than configured (Limit * N instances). This is an architectural limitation but not a code integrity failure.
- **Partner Lookup Scalability:** `resolvePartnerByKeyHash` loads up to 1000 partners into memory to find a matching key hash. As the partner base grows, this will become a performance bottleneck.
