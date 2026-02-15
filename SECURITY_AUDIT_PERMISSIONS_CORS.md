# Security Audit: Permissions & CORS Policy

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Specialist)
**Target:** LMDR Platform Backend (`src/backend`)

## 1. Executive Summary

A comprehensive audit of the backend access control (`permissions.json`) and CORS configuration (`apiGateway.jsw`) was conducted.

**Critical Findings:**
1.  **Global Permissions Wildcard:** The current `permissions.json` grants `Anonymous` (unauthenticated) users full access to invoke **all** exported functions in **all** backend web modules (`.jsw` files). This is a critical security vulnerability that exposes sensitive administrative, billing, and database operations to the public.
2.  **Unrestricted CORS:** The API Gateway (`apiGateway.jsw`) is configured with `Access-Control-Allow-Origin: *`, allowing any website to make requests to the API. While the API enforces authentication via Bearer tokens, this broad configuration increases the attack surface for key leakage and phishing.
3.  **Direct Gateway Access:** `apiGateway.jsw` is currently exposed to the client via the global wildcard. This allows potential attackers to bypass the standard HTTP endpoints and invoke the gateway logic directly from the browser console, potentially probing for vulnerabilities in the handler itself.

## 2. Detailed Findings

### 2.1 Permissions (`src/backend/permissions.json`)

**Current Configuration:**
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
Every exported function in the backend is callable by anyone. This includes:
*   **Critical Risk (Admin/Billing/DB):**
    *   `dataAccess.jsw`: `queryRecords`, `insertRecord`, `updateRecord`, `deleteRecord` (Allows arbitrary database manipulation if `suppressAuth` is passed or implied).
    *   `stripeService.jsw`: `upsertSubscription`, `resetQuota`, `updateSubscriptionStatus` (Allows manipulation of billing state).
    *   `apiAuthService.jsw`: `rotateApiKey` (Could allow unauthorized key rotation/hijacking).
    *   `admin_*.jsw`: All administrative services (e.g., `admin_service.jsw`, `admin_billingService.jsw`).
    *   `rateLimitService.jsw`: `checkAndTrackUsage`.
    *   `apiGateway.jsw`: `handleGatewayRequest` (Should be internal only).

*   **Medium Risk (Business Logic):**
    *   `emailService.jsw`: `sendEmail` (Spam risk).
    *   `notificationDispatcher.jsw`.

*   **Low Risk (Public Data):**
    *   `publicStatsService.jsw`.
    *   `weatherAlertService.jsw` (Read-only parts).

### 2.2 CORS Policy (`src/backend/apiGateway.jsw`)

**Current Configuration:**
```javascript
const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type'
};
```

**Impact:**
*   **Origin `*`**: Allows any domain to send requests. While standard for public APIs, it removes a layer of defense.
*   **Methods**: `GET`, `POST`, `DELETE`, `OPTIONS` are standard. `PUT` and `PATCH` are not enabled, which aligns with the current usage.
*   **Headers**: Restricted to `Authorization` and `Content-Type`, which is good practice.

## 3. Recommendations

### 3.1 Permissions Remediation

**Immediate Action Required:** Replace the global wildcard in `permissions.json` with a "Deny by Default" strategy.

1.  **Default Rule:** Restrict `*` (all files) to `SiteOwner` (Admin) only.
2.  **Public Exceptions:** Explicitly grant `Anonymous` access only to:
    *   `publicStatsService.jsw`
    *   `carrierLeadsService.jsw` (Specific methods: `submitCarrierStaffingRequest`, `getMatchPreview`)
    *   `weatherAlertService.jsw` (Read-only methods)
    *   `surveyService.jsw` (`processResponse`)
3.  **Member Exceptions:** Grant `SiteMember` access to user-centric modules:
    *   `recruiter_service.jsw`
    *   `driverProfiles.jsw`
    *   `memberService.jsw`
    *   `messaging.jsw`
    *   `savedSearchService.jsw` (Excluding admin batch jobs)
4.  **Internal Restriction:** Ensure `apiGateway.jsw` and `stripeService.jsw` are restricted to `SiteOwner`. They are used by `http-functions.js` (server-side), so client-side access is unnecessary and dangerous.

### 3.2 CORS Remediation

1.  **Restrict Origin:** If the API is intended only for specific partners or the main app, replace `*` with a whitelist of allowed domains (or dynamically check `Origin` header against a whitelist).
2.  **Verify Usage:** If `*` is required for a public API platform, ensure that `validateApiKey` is robust and that rate limiting (`rateLimitService`) effectively mitigates abuse.

### 3.3 Code-Level Improvements

*   **`apiAuthService.jsw`**: The `rotateApiKey` function should include an internal check to verify that the caller is authorized to rotate the key for the given `partnerId`, even if `permissions.json` is tightened.
*   **`dataAccess.jsw`**: Review the use of `suppressAuth: true`. It is widely used. Ensure that any function calling it performs its own strict permission checks before delegation.

## 4. Proposed Configuration

A revised permissions file has been generated at `src/backend/permissions_proposed.json` implementing the "Deny by Default" strategy.

### Risk Rating Summary
| Category | Status | Risk Level |
| :--- | :--- | :--- |
| **Permissions** | **FAIL** | **CRITICAL** |
| **CORS** | **WARN** | **HIGH** |
| **Auth Implementation** | **PASS** | **LOW** |

---
*End of Report*
