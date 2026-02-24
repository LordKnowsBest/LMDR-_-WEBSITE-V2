# API Security Integrity Checklist

**Date:** 2026-10-18
**Reviewer:** Jules (API Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`

## Summary of Findings

The API Gateway has **2 CRITICAL FAILURES** related to security bypasses. Immediate remediation is required.

| Control | Status | Location | Details |
| :--- | :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `apiGateway.jsw:56` | `validateApiKey` is correctly called before any request processing. |
| **Key Hashing** | **PASS** | `apiAuthService.jsw:44` | Keys are hashed using SHA-256 with a pepper (`API_KEY_PEPPER`). |
| **IP Whitelisting** | **FAIL** | `apiAuthService.jsw:143` | Logic fails open (allows access) if the IP address cannot be determined (is null/undefined). This bypasses the whitelist entirely for requests without IP headers. |
| **Subscription Tier Checks** | **PASS** | `apiGateway.jsw` | `assertTier` is consistently applied to restricted endpoints (e.g., `growth`, `enterprise`). |
| **Rate Limiting Enforcement** | **FAIL** | `apiGateway.jsw:74` | `shouldBypassRateLimit` allows any request with header `x-lmdr-bypass-rate-limit: true` to bypass limits, without checking for admin privileges. |
| **Code Comments / Backdoors** | **PASS** | (Multiple) | No `TODO`, `HACK`, `FIXME`, or suspicious comments found in critical paths. |
| **Error Message Security** | **WARN** | `apiAuthService.jsw:59` | Distinguishes between "Invalid API key" and "IP address not allowed", leaking valid key existence to attackers. |
| **Logging** | **PASS** | `apiGateway.jsw:102` | Failed attempts and all requests are logged with request IDs and partner IDs. |
| **Key Generation** | **PASS** | `apiAuthService.jsw:35` | Uses `crypto.getRandomValues` (CSPRNG) for key generation. |

## Detailed Vulnerability Analysis

### 1. IP Whitelist Bypass (Critical)
**File:** `src/backend/apiAuthService.jsw`
**Line:** 143
**Code:**
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // <--- VULNERABILITY
  // ...
}
```
**Impact:** An attacker who can strip `X-Forwarded-For` or `X-Real-IP` headers (or if the platform fails to provide them) can bypass IP restrictions even if the partner has a strict whitelist configured.

### 2. Rate Limit Bypass (Critical)
**File:** `src/backend/apiGateway.jsw`
**Line:** 375
**Code:**
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true'; // <--- VULNERABILITY
}
```
**Impact:** Any user with a valid API key can bypass rate limits simply by adding this header. There is no check to ensure the user is an admin or a specific internal service.

## Verification Evidence

The following output from `scripts/verify_api_security.js` confirms the findings:

```text
--- STARTING API SECURITY VERIFICATION ---

[TEST 1] IP Whitelist Logic Check (src/backend/apiAuthService.jsw)
  Case A (Valid IP): ALLOWED (Expected: ALLOWED)
  Case B (Invalid IP): DENIED (Expected: DENIED)
  Case C (Missing IP): ALLOWED (FAIL - BYPASS)
  Case D (Empty Whitelist): ALLOWED (WARN - OPEN)

[TEST 2] Rate Limit Bypass Header Check (src/backend/apiGateway.jsw)
  Case A (Normal Request): Bypass is INACTIVE (Expected: INACTIVE)
  Case B (Bypass Header): Bypass is ACTIVE (FAIL - UNPROTECTED)

--- VERIFICATION COMPLETE ---
     !! CRITICAL: IP Check fails open when IP is missing !!
    !! CRITICAL: Rate limit bypass header is active and unprotected !!
```

## Recommendations

1.  **Fix IP Whitelist:** Change `isIpAllowed` to return `false` if `ipAddress` is null and a whitelist exists.
2.  **Secure Rate Limit Bypass:** Restrict `shouldBypassRateLimit` to only allow the bypass if the `authContext.partner` has a specific flag (e.g., `is_internal_admin: true`) or remove the header-based bypass entirely.
3.  **Unified Error Messages:** Return a generic "Unauthorized" or "Forbidden" message for both invalid keys and invalid IPs to prevent enumeration.
