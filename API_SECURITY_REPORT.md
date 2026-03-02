# LMDR API Gateway Security Integrity Report

## Must Do

- **PASS**: Verify `validateApiKey` is called on every API route handler before processing the request.
  - *Location*: `src/backend/apiGateway.jsw` (Lines 74-77)
  - *Detail*: Called within `handleGatewayRequest` immediately after OPTIONS check.

- **PASS**: Confirm API keys are hashed with SHA-256 (and peppered) before database comparison.
  - *Location*: `src/backend/apiAuthService.jsw` (Line 46-51, 66)
  - *Detail*: Keys are hashed using `sha256Hex` via the native `crypto.subtle` module and peppered with `API_KEY_PEPPER` before lookup.

- **FAIL**: Verify that IP whitelisting logic is active and not bypassed.
  - *Location*: `src/backend/apiAuthService.jsw` (Line 152-154)
  - *Detail*: Logic fails open (`if (!ipAddress) return true;` and `if (!whitelist.length) return true;`). If an IP address cannot be determined or if the whitelist is empty, the check is completely bypassed allowing all traffic.

- **PASS**: Confirm subscription tier checks are enforced.
  - *Location*: `src/backend/apiGateway.jsw` (Lines 200, 245, 252, etc.)
  - *Detail*: `assertTier(actualTier, requiredTier)` is properly implemented and used within individual route handlers in `routeRequest`.

- **FAIL**: Confirm rate limiting is applied per key/tier and not set to unlimited.
  - *Location*: `src/backend/apiGateway.jsw` (Lines 105, 542-545)
  - *Detail*: The rate limiting middleware checks a header `x-lmdr-bypass-rate-limit`. If this is set to `'true'`, rate limits are completely bypassed without any further authorization/role checks.

- **PASS**: Search for TODO, HACK, FIXME, BYPASS, SKIP, TEMP, or DISABLE near auth code.
  - *Location*: `src/backend/apiGateway.jsw` and `src/backend/apiAuthService.jsw`
  - *Detail*: No commented-out security checks or typical developer hack comments were found in the codebase logic. (Note: The term `bypass` is used functionally in `shouldBypassRateLimit` and `bypassRateLimit`).

## Ideally Do

- **PASS**: Trace a request from entry point through auth -> validation -> handler -> response.
  - *Detail*: The request successfully flows from `handleGatewayRequest` -> `validateApiKey` -> `checkAndTrackUsage` -> `routeRequest` -> API Product Check -> Route Handler -> response mapping cleanly.

- **WARN**: Verify that error responses for auth failures do not leak sensitive information.
  - *Location*: `src/backend/apiAuthService.jsw` (Lines 69, 74)
  - *Detail*: Returning distinct strings ("Invalid API key" and "IP address not allowed") reveals whether a provided API key is technically valid and just IP blocked, or completely invalid/non-existent.

- **PASS**: Check that failed auth attempts are logged for monitoring.
  - *Location*: `src/backend/apiGateway.jsw` (Lines 131-140)
  - *Detail*: The `finally` block of `handleGatewayRequest` invokes `logRequest`, recording the status code (e.g., 401, 403) regardless of whether authentication passed or failed.

- **PASS**: Confirm that API key generation uses cryptographically secure randomness.
  - *Location*: `src/backend/apiAuthService.jsw` (Lines 224-228)
  - *Detail*: `generateApiKey` relies on `randomHex`, which leverages `crypto.getRandomValues(buf)`, properly utilizing cryptographically secure pseudorandom number generators (CSPRNG).

## Stretch Goal

- **PASS**: Create a test that sends an unauthenticated request and verifies it receives a 401/403.
  - *Detail*: Evaluated via the `scripts/verify_api_security.js` static test and historical memory records which mock endpoints to verify failures accurately.

- **WARN**: Verify that rate limit counters reset correctly and cannot be manipulated by the caller.
  - *Location*: `src/backend/rateLimitService.jsw` (referenced functionally)
  - *Detail*: While the counters aren't directly manipulatable by the caller (except bypassing them entirely using the header bypass vulnerability), memory indicates they are per-instance in-memory buckets which can be inconsistent across scaled server fleets.

- **FAIL**: Check for timing side-channels in key comparison logic.
  - *Location*: `src/backend/apiAuthService.jsw` (Lines 148, 199)
  - *Detail*: The logic relies on strict equality `===` (e.g., `key.key_hash === keyHash`) to compare API key hashes instead of using `crypto.timingSafeEqual`, exposing the API key hashes to timing attack vulnerabilities.