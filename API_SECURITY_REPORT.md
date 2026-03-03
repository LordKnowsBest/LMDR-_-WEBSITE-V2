# LMDR API Security Report

**Date:** 2026-10-25

## Executive Summary
This report verifies that the authentication, authorization, and rate-limiting logic within the LMDR platform's external API gateway (`apiGateway.jsw` and `apiAuthService.jsw`) is fully active, secure, and has not been bypassed.

Several critical security controls were found to be weakened, bypassed, or missing. Recent patches have remediated some, but others remain unfixed. **FAILs remain in the system.**

## Security Control Checklist

### 1. Authentication Enforcement (PASS)
- **Check:** Ensure `validateApiKey` (or equivalent) is called on every API route handler before processing.
- **File:** `src/backend/apiGateway.jsw`
- **Line(s):** 60
- **Status:** **PASS**
- **Details:** The main entry point `handleGatewayRequest` explicitly calls `validateApiKey` (line 60) before checking usage or routing the request. If it fails, the request immediately terminates with an error response (line 65).

### 2. Secure API Key Hashing & Comparison (PASS)
- **Check:** Confirm API keys are hashed with SHA-256 before database comparison and never compared as plaintext.
- **File:** `src/backend/apiAuthService.jsw`
- **Line(s):** 234-236, 147-156
- **Status:** **PASS**
- **Details:** API keys are hashed via `sha256Hex` using the Node.js `crypto` module (lines 234-236) and a pepper (`API_KEY_PEPPER`). Hashes are securely compared using a custom `secureCompare` function that leverages `crypto.timingSafeEqual` (lines 147-156) to prevent timing side-channel attacks.

### 3. IP Whitelisting (PASS)
- **Check:** Verify that IP whitelisting logic is active and not bypassed.
- **File:** `src/backend/apiAuthService.jsw`
- **Line(s):** 161-166
- **Status:** **PASS**
- **Details:** The `isIpAllowed` function utilizes a fail-closed strategy. If a whitelist is configured but the IP address is missing from the request, the function correctly denies access (`return false;`).

### 4. Subscription Tier Checks (PASS)
- **Check:** Confirm subscription tier checks are enforced (e.g., starter cannot access enterprise endpoints).
- **File:** `src/backend/apiGateway.jsw`
- **Line(s):** 173-181
- **Status:** **PASS**
- **Details:** The `assertTier` helper function verifies the required tier against the partner's actual tier, throwing a `forbidden_tier` error if access is insufficient. This is actively enforced on endpoints like `/v1/engagement/achievements/check`.

### 5. Rate Limiting Integrity (PASS)
- **Check:** Confirm rate limiting is applied per key/tier and not set to unlimited or bypassed.
- **File:** `src/backend/apiGateway.jsw`, `src/backend/rateLimitService.jsw`
- **Line(s):** `apiGateway.jsw` (line 542-546)
- **Status:** **PASS**
- **Details:** The `shouldBypassRateLimit` bypass header vulnerability (`x-lmdr-bypass-rate-limit`) has been permanently disabled. The function now explicitly returns `false`, ensuring that rate limits are strictly enforced by `checkAndTrackUsage`.

### 6. Codebase Sanitation (PASS)
- **Check:** Search for `// TODO`, `// HACK`, `// FIXME`, `// BYPASS`, `// SKIP`, `// TEMP`, or `// DISABLE` anywhere near auth code.
- **File:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`
- **Line(s):** N/A
- **Status:** **PASS**
- **Details:** A thorough `grep` of both `apiGateway.jsw` and `apiAuthService.jsw` found no such markers, verifying that no temporary bypasses or hacks are present in the authentication or authorization flow.

### 7. Unauthorized Key Rotation (FAIL - IDOR)
- **Check:** Verify that API keys cannot be rotated without proper authorization.
- **File:** `src/backend/apiAuthService.jsw`
- **Line(s):** 104
- **Status:** **FAIL**
- **Details:** The `rotateApiKey` function lacks any authorization check to ensure the caller actually owns the `partnerId` being modified. Due to global wildcard invoke permissions in `permissions.json`, this allows any anonymous or unauthorized user to arbitrarily rotate keys for any partner.

### 8. Permissive CORS (WARN)
- **Check:** Ensure CORS headers are restricted to trusted domains rather than allowing wildcards.
- **File:** `src/backend/apiGateway.jsw`
- **Line(s):** 54
- **Status:** **WARN**
- **Details:** The `Access-Control-Allow-Origin` header in `JSON_HEADERS` uses a wildcard `*`. While often necessary for public APIs intended for consumption by unknown origins, it inherently relaxes cross-origin protections. This should be verified as the intended architectural design.

## Conclusion
The API Gateway is **NOT FULLY SECURE**. While critical vulnerabilities regarding rate-limit bypass, IP whitelisting fail-open logic, and timing attacks in hash comparison have been actively patched, the severe **IDOR vulnerability in `rotateApiKey` remains a blocker** and must be resolved before production deployment.
