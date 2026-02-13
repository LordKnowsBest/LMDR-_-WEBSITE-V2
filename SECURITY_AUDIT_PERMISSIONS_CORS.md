# Permissions & CORS Policy Audit Report

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Specialist)
**Target Files:** `src/backend/permissions.json`, `src/backend/apiGateway.jsw`

## Executive Summary

The audit has identified **CRITICAL** security vulnerabilities in the current backend configuration.

1.  **Global Permissions Warning:** The `permissions.json` file contains a global wildcard that grants **Anonymous** users full access to **every exported web method** in the backend. This includes sensitive administrative functions, database operations, and payment controls.
2.  **CORS Misconfiguration:** The API Gateway allows `Access-Control-Allow-Origin: *`, permitting any website to make requests to the API.
3.  **Privilege Escalation:** Specific methods like `rotateApiKey` and `createPortalSession` lack internal authorization checks and rely entirely on the compromised `permissions.json`, allowing unauthorized API key rotation and subscription hijacking.

## 1. Permissions Audit (`src/backend/permissions.json`)

### Finding 1.1: Universal Anonymous Access
**Severity: CRITICAL**

The current configuration is:
```json
{
  "web-methods": {
    "*": {
      "*": {
        "siteOwner": { "invoke": true },
        "siteMember": { "invoke": true },
        "anonymous": { "invoke": true }
      }
    }
  }
}
```
**Impact:**
- **All 3 roles (Anonymous, SiteMember, SiteOwner) have identical unrestricted access.**
- Every `.jsw` file in `src/backend/` is public.
- Any user can invoke any exported function via the Wix Velo client SDK.

### Finding 1.2: Exposed Critical Modules
The following modules are exposed to Anonymous users and pose immediate risks:

| Module | Risk | Impact |
| :--- | :--- | :--- |
| **`dataAccess.jsw`** | **CRITICAL** | Exports `queryRecords`, `updateRecord`, `insertRecord` with `suppressAuth` options. An attacker can read/write the entire database. |
| **`apiAuthService.jsw`** | **CRITICAL** | Exports `rotateApiKey`. An attacker can rotate any partner's API key without authentication. |
| **`stripeService.jsw`** | **CRITICAL** | Exports `createPortalSession` (Subscription hijacking), `upsertSubscription` (Fake subscriptions), `getSubscriptionDetails` (Data leak). |
| **`admin_*.jsw`** | **HIGH** | Exports admin functions. While most have internal `requireAdmin()` checks, they should not be public. |
| **`apiGateway.jsw`** | **HIGH** | Exports `handleGatewayRequest`. Allows bypassing the gateway logic if invoked directly. |

### Finding 1.3: Sensitive Method Analysis

**High Sensitivity (Must be Restricted to SiteOwner/Admin):**
- `dataAccess.jsw`: All methods (`queryRecords`, `insertRecord`, etc.)
- `apiAuthService.jsw`: `rotateApiKey`, `generateApiKey`
- `stripeService.jsw`: `createPortalSession`, `upsertSubscription`, `getSubscriptionDetails`, `getBillingHistory`
- `admin_*.jsw`: All methods

**Medium Sensitivity (Restricted to SiteMember/SiteOwner):**
- `stripeService.jsw`: `createCheckoutSession` (Prevents spam, though less critical than portal session)
- `memberService.jsw`: Profile management methods
- `driverProfiles.jsw`: Driver specific methods

**Low Sensitivity (Public/Anonymous OK):**
- `contentService.jsw`: Public content retrieval
- `publicStatsService.jsw`: Aggregated stats
- `weatherAlertService.jsw`: Public alerts

## 2. CORS Audit (`src/backend/apiGateway.jsw`)

### Finding 2.1: Wildcard Origin
**Severity: HIGH**

Configuration:
```javascript
'Access-Control-Allow-Origin': '*'
```
**Impact:** Any malicious website can make authenticated requests to the API on behalf of a user (CSRF-like, though API keys mitigate this, it allows unauthorized clients to consume the API).
**Recommendation:** Restrict to known domains (e.g., `https://www.lastmiledr.app`, specific partner domains).

### Finding 2.2: Allowed Methods
**Severity: LOW**

Configuration:
```javascript
'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
```
**Status:** Acceptable. `DELETE` is used for `deleteAlertSubscription`. `OPTIONS` is required for preflight.

### Finding 2.3: Allowed Headers
**Severity: LOW**

Configuration:
```javascript
'Access-Control-Allow-Headers': 'Authorization, Content-Type'
```
**Status:** Acceptable. Strict and limits attack surface.

### Finding 2.4: Missing Max-Age
**Severity: LOW**

**Status:** Missing `Access-Control-Max-Age`.
**Recommendation:** Add `Access-Control-Max-Age: 86400` (24 hours) to reduce preflight requests.

### Finding 2.5: Rate Limit Bypass Vulnerability
**Severity: HIGH**

Configuration:
```javascript
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}
```
**Impact:** Any user with a valid API key can bypass rate limits by adding this header.
**Recommendation:** Add an authorization check (e.g., verify the user has `Admin` role or a specific `bypass_rate_limit` permission in their subscription/partner record) before honoring this header.

## 3. Recommendations

1.  **Immediate Action:** Replace `src/backend/permissions.json` with a strict "deny-by-default" policy. Only explicitly allow necessary public methods.
2.  **Lock Down Critical Modules:** Ensure `dataAccess.jsw`, `apiAuthService.jsw`, and `stripeService.jsw` (administrative methods) are restricted to `siteOwner`.
3.  **Refine CORS:** Change `Access-Control-Allow-Origin` to reflect the requesting origin if it matches an allowlist, or a strict list of domains.
4.  **Secure Rate Limit Bypass:** Modify `shouldBypassRateLimit` to check for administrative privileges or a specific partner flag.
