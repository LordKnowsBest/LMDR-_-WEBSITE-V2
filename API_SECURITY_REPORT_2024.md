# API Security Integrity Check Report (2024)

**Date:** 2024-05-27
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/rateLimitService.jsw`

## Executive Summary

The API Gateway has critical security vulnerabilities that must be addressed immediately. While basic authentication and tier enforcement are active, critical controls like IP whitelisting and rate limiting are bypassed or implemented insecurely. Additionally, permission misconfiguration exposes sensitive administrative functions to anonymous users.

| Control Category | Status | Details |
| :--- | :--- | :--- |
| **Authentication Enforcement** | **PASS** | `validateApiKey` is called on all routes. |
| **Key Hashing** | **PASS** | SHA-256 with pepper is used. |
| **IP Whitelisting** | **FAIL** | Fails open if IP is missing or whitelist is empty. |
| **Rate Limiting** | **FAIL** | Bypassed via header `x-lmdr-bypass-rate-limit`. |
| **Permission Configuration** | **FAIL** | Wildcard permissions allow anonymous access to admin functions. |
| **Information Leakage** | **WARN** | Error messages reveal valid keys vs IPs vs subscriptions. |
| **Key Comparison** | **WARN** | Uses timing-vulnerable equality checks. |
| **DoS Protection** | **WARN** | In-memory load of all partners creates scalability/DoS risk. |

---

## Detailed Findings

### 1. Authentication Enforcement
**Status:** **PASS**
**File:** `src/backend/apiGateway.jsw`
**Description:** The `handleGatewayRequest` function correctly calls `validateApiKey` before processing any request.
```javascript
// Line 65
authContext = await validateApiKey({
  authorizationHeader: getHeader(request, 'authorization'),
  ipAddress
});
```

### 2. Key Hashing
**Status:** **PASS**
**File:** `src/backend/apiAuthService.jsw`
**Description:** API keys are hashed using SHA-256 with a pepper before storage/comparison.
```javascript
// Line 48
const payload = `${apiKey}:${pepper || ''}`;
return await sha256Hex(payload);
```

### 3. IP Whitelisting Bypass (Fail-Open)
**Status:** **FAIL**
**File:** `src/backend/apiAuthService.jsw`
**Line:** 151, 153
**Description:** The `isIpAllowed` function returns `true` (access granted) if the IP address is missing from the request or if the partner's whitelist is empty. This allows attackers to bypass IP restrictions by spoofing headers or omitting them.
```javascript
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // FAIL OPEN
  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];
  if (!whitelist.length) return true; // FAIL OPEN
  return whitelist.includes(ipAddress);
}
```

### 4. Rate Limiting Bypass Header
**Status:** **FAIL** (CRITICAL)
**File:** `src/backend/apiGateway.jsw`
**Line:** 375
**Description:** The gateway respects a header `x-lmdr-bypass-rate-limit` which allows **any** caller (including anonymous/standard users) to bypass all rate limits. There is no permission check for this header.
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true'; // NO AUTH CHECK
}
```

### 5. Permission Misconfiguration (Wildcard Access)
**Status:** **FAIL** (CRITICAL)
**File:** `src/backend/permissions.json`
**Description:** The permissions file grants `anonymous` access to **all** backend functions, including sensitive administrative functions in `apiAuthService.jsw` like `rotateApiKey`.
```json
"web-methods": {
  "*": {
    "*": {
      "anonymous": { "invoke": true }
    }
  }
}
```
**Impact:** An unauthenticated attacker can call `rotateApiKey(partnerId, keyId)` directly if they know/guess the partner ID, potentially creating new valid keys or disabling existing ones.

### 6. Information Leakage (User Enumeration)
**Status:** **WARN**
**File:** `src/backend/apiAuthService.jsw`
**Line:** 68, 73, 80
**Description:** The `validateApiKey` function returns distinct error codes for "Invalid API key" vs "IP not allowed" vs "Subscription inactive". This allows an attacker to enumerate valid API keys by observing the error response (e.g., if they get "IP not allowed", they know the key is valid).

### 7. Timing Attack Vulnerability
**Status:** **WARN**
**File:** `src/backend/apiAuthService.jsw`
**Line:** 147
**Description:** Key hash comparison uses strict equality (`===`) instead of a constant-time comparison algorithm. While the risk is mitigated by comparing hashes (not plain text), it is theoretically vulnerable to timing attacks.
```javascript
return keys.some((key) => key.is_active !== false && key.key_hash === keyHash);
```

### 8. Denial of Service (DoS) Risk
**Status:** **WARN**
**File:** `src/backend/apiAuthService.jsw`
**Line:** 183
**Description:** `resolvePartnerByKeyHash` loads up to 1000 active partners into memory to find a matching key hash. As the number of partners grows, this will degrade performance and could be exploited for DoS.

---

## Remediation Recommendations

1.  **Remove Bypass Header:** Immediately remove the `x-lmdr-bypass-rate-limit` check or restrict it to `ADMIN` users only.
2.  **Fix IP Whitelisting:** Change `isIpAllowed` to return `false` if IP is missing (fail-closed) or if strict IP enforcement is required.
3.  **Restrict Permissions:** Update `permissions.json` to remove `anonymous` access. Explicitly grant `siteOwner` or `admin` roles to sensitive modules (`apiAuthService`, `dataAccess`).
4.  **Standardize Auth Errors:** Return a generic "Invalid credentials" error for all authentication failures (key not found, IP invalid, subscription inactive) to prevent enumeration.
5.  **Optimize Key Lookup:** Refactor the data model to allow querying partners directly by `api_keys.key_hash` (if supported by the DB) instead of loading all partners.
6.  **Implement Constant-Time Comparison:** Use `crypto.timingSafeEqual` (with Buffer conversion) for hash comparison.
