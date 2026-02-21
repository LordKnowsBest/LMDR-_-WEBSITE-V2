# API Security Integrity Report
**Date:** 2026-10-18
**Reviewer:** Jules (API Security Engineer)

## Overview
This report details the findings of a security integrity check on the LMDR platform's external API gateway (`src/backend/apiGateway.jsw` and `src/backend/apiAuthService.jsw`). The review focused on authentication, authorization, rate limiting, and secure coding practices.

## Summary of Findings
| Control | Status | File | Issues Found |
| :--- | :---: | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `src/backend/apiGateway.jsw` | `validateApiKey` is correctly called on every route. |
| **Key Hashing** | **PASS** | `src/backend/apiAuthService.jsw` | SHA-256 hashing with pepper is used. Keys are never compared in plaintext. |
| **IP Whitelisting** | **FAIL** | `src/backend/apiAuthService.jsw` | Logic fails open if IP address is null or missing (Line 150). |
| **Subscription Tier Checks** | **PASS** | `src/backend/apiGateway.jsw` | `assertTier` enforces access levels correctly. |
| **Rate Limiting** | **WARN** | `src/backend/apiGateway.jsw` | Rate limiting is applied, but `x-lmdr-bypass-rate-limit` header allows bypass (Line 223). |
| **Permission Configuration** | **FAIL** | `src/backend/permissions.json` | Global wildcard (`*`) grants Anonymous access to all backend functions. |
| **Sensitive Function Exposure** | **FAIL** | `src/backend/apiAuthService.jsw` | `rotateApiKey` is publicly exposed and lacks internal authorization checks. |
| **Information Leakage** | **WARN** | `src/backend/apiAuthService.jsw` | Error messages distinguish between "Invalid API key" and "IP address not allowed", leaking key validity. |
| **Code Hygiene** | **PASS** | Multiple | No `TODO`, `HACK`, or `FIXME` comments found in critical paths. |

## Detailed Analysis

### 1. Authentication Enforcement (PASS)
-   **File:** `src/backend/apiGateway.jsw`
-   **Line:** 76
-   **Observation:** The `handleGatewayRequest` function is the single entry point for all API traffic. It calls `validateApiKey` immediately. If validation fails, it returns an error response.
-   **Conclusion:** Authentication is structurally enforced.

### 2. Key Hashing (PASS)
-   **File:** `src/backend/apiAuthService.jsw`
-   **Line:** 46 (`hashApiKey`), 147 (`hasMatchingKey`)
-   **Observation:** Keys are hashed using `crypto.subtle.digest('SHA-256')` combined with a pepper (`API_KEY_PEPPER`). Comparisons are done on hashes (`key.key_hash === keyHash`).
-   **Conclusion:** Secure storage and comparison practices are followed.

### 3. IP Whitelisting (FAIL)
-   **File:** `src/backend/apiAuthService.jsw`
-   **Line:** 150
-   **Snippet:** `if (!ipAddress) return true;`
-   **Issue:** The logic explicitly allows requests where the IP address cannot be determined (e.g., if `x-forwarded-for` is missing or spoofed to be empty). This defeats the purpose of an IP whitelist.
-   **Recommendation:** Change logic to fail closed: `if (!ipAddress) return false;` (unless the partner has no whitelist configured).

### 4. Permission Configuration (FAIL)
-   **File:** `src/backend/permissions.json`
-   **Line:** 2
-   **Snippet:** `"web-methods": { "*": { "*": { "anonymous": { "invoke": true } } } }`
-   **Issue:** This configuration grants `Anonymous` (unauthenticated users) the right to invoke *any* exported backend function, including sensitive ones like `rotateApiKey` in `apiAuthService.jsw`.
-   **Recommendation:** Adopt a whitelist approach (as proposed in `permissions_revised.json`) where only specific public functions are exposed, and all others default to `siteOwner` or `siteMember`.

### 5. Sensitive Function Exposure (FAIL)
-   **File:** `src/backend/apiAuthService.jsw`
-   **Line:** 101 (`rotateApiKey`)
-   **Issue:** `rotateApiKey` is exported and takes `partnerId` as an argument. It does not verify that the caller is the partner or an admin. Combined with the global permissions issue, any anonymous user can rotate any partner's API key if they guess the `partnerId`.
-   **Recommendation:** Restrict this function to `siteOwner` in `permissions.json` or add internal authorization checks (e.g., `wixUsersBackend.currentUser`).

### 6. Rate Limiting Bypass (WARN)
-   **File:** `src/backend/apiGateway.jsw`
-   **Line:** 223 (`shouldBypassRateLimit`)
-   **Snippet:** `return headerValue === 'true';`
-   **Issue:** The header `x-lmdr-bypass-rate-limit` allows any caller (with a valid API key) to bypass rate limits. While useful for testing, it is a risk if discovered by a malicious partner.
-   **Recommendation:** Restrict this bypass to specific internal IPs or require a special secret value instead of just "true".

### 7. Information Leakage (WARN)
-   **File:** `src/backend/apiAuthService.jsw`
-   **Line:** 71 vs 84
-   **Issue:** Returns `invalid_api_key` for bad keys, but `forbidden_ip` for good keys from bad IPs.
-   **Risk:** Allows an attacker to brute-force API keys by distinguishing between "wrong key" and "right key, wrong IP".
-   **Recommendation:** Return a generic "Unauthorized" or "Invalid credentials" error for both cases to prevent enumeration.

## Conclusion
The API Gateway has a solid structural foundation (hashing, mandatory auth checks), but suffers from critical configuration flaws (`permissions.json`) and logic errors (IP whitelist bypass, exposed rotation function). Immediate remediation is required for the **FAIL** items.
