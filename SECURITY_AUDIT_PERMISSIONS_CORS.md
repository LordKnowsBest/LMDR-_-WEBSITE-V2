# Security Audit: Permissions & CORS Policy
**Date:** 2026-03-03
**Status:** DRAFT
**Auditor:** Jules (AI Agent)

## Executive Summary
A critical security vulnerability was identified in the backend permissions configuration (`permissions.json`). Currently, a global wildcard allows `Anonymous` (unauthenticated) users to invoke **any** exported function in **any** backend web module (`.jsw`). This exposes sensitive administrative, financial, and database operations to the public internet.

Additionally, the CORS policy in `apiGateway.jsw` is configured to allow all origins (`*`), which may be intended for a public API but poses risks if not coupled with strict authentication and rate limiting.

---

## 1. Permissions Audit (`src/backend/permissions.json`)

### Finding 1.1: Global Wildcard Permission (CRITICAL)
The `permissions.json` file contains the following configuration:
```json
"web-methods": {
  "*": {
    "*": {
      "siteOwner": { "invoke": true },
      "siteMember": { "invoke": true },
      "anonymous": { "invoke": true }
    }
  }
}
```
**Impact:** Any user, including unauthenticated attackers, can invoke sensitive backend functions directly from the browser console or via crafted HTTP requests.

### Exposed High-Risk Modules
The following modules are currently exposed to `Anonymous` but contain critical functionality that must be restricted to `SiteOwner` or internal use only:

| Module | Sensitivity | Impact of Exploitation | Recommendation |
| :--- | :--- | :--- | :--- |
| `backend/dataAccess.jsw` | **CRITICAL** | Allows arbitrary database operations (read, write, delete) via `suppressAuth: true` option. Attackers can dump the entire database or modify records. | Restrict to `SiteOwner` ONLY. |
| `backend/stripeService.jsw` | **CRITICAL** | Exposes `upsertSubscription`, `resetQuota`, and `updateSubscriptionStatus`. Attackers can grant themselves free subscriptions or unlimited API quotas. | Restrict sensitive methods to `SiteOwner`. |
| `backend/apiAuthService.jsw` | **CRITICAL** | Exposes `rotateApiKey`. Attackers can rotate API keys for any partner, causing Denial of Service or Account Takeover. | Restrict to `SiteOwner`. |
| `backend/admin_*.jsw` | **HIGH** | Exposes administrative dashboards and logic (e.g., `adminBillingService`, `adminRevenueService`). | Restrict to `SiteOwner`. |
| `backend/rateLimitService.jsw` | **HIGH** | Operational logic for rate limiting. | Restrict to `SiteOwner`. |
| `backend/config.jsw` | **HIGH** | System configuration. | Restrict to `SiteOwner`. |

### Exposed Medium-Risk Modules
These modules contain business logic that should be restricted to authenticated members (`SiteMember`) or specific roles:

| Module | Sensitivity | Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| `backend/memberService.jsw` | **MEDIUM** | Access to member dashboard data and notifications. Contains internal checks but relies on them. | Restrict to `SiteMember`. |
| `backend/carrier*.jsw` | **MEDIUM** | Carrier-specific logic (leads, profiles). | Restrict to `SiteMember` (Carrier). |
| `backend/driver*.jsw` | **MEDIUM** | Driver-specific logic (profiles, scoring). | Restrict to `SiteMember` (Driver). |
| `backend/applicationService.jsw`| **MEDIUM** | Job application handling. | Restrict to `SiteMember`. |

### Exposed Low-Risk Modules
These modules appear safe for public access:

| Module | Sensitivity | Notes | Recommendation |
| :--- | :--- | :--- | :--- |
| `backend/contentService.jsw` | **LOW** | Returns public blog posts, FAQs, and guides. | `Anonymous` OK. |
| `backend/gamificationService.jsw`| **LOW** | Public leaderboards and gamification stats. | `Anonymous` OK (if intended). |

---

## 2. CORS Policy Audit (`src/backend/apiGateway.jsw`)

### Finding 2.1: Broad Origin Allowance
The `apiGateway.jsw` module explicitly sets:
```javascript
'Access-Control-Allow-Origin': '*'
```
**Current State:** Allows any website to make requests to the API.
**Risk:** While this may be intended for a public API platform, it allows malicious sites to make requests on behalf of users if authentication relies on cookies (which it shouldn't for this API, as it uses Bearer tokens). However, it facilitates CSRF if cookie-based auth were ever introduced.
**Recommendation:** If the API is intended for specific partners or the main app, restrict to a whitelist (e.g., `https://www.lastmiledr.app`, `https://*.partner-domain.com`). If it must be public, ensure strictly token-based authentication (which `apiAuthService` seems to enforce).

### Finding 2.2: Missing Max-Age Header
**Current State:** `Access-Control-Max-Age` is missing.
**Risk:** Browsers will default to a short cache duration (e.g., 5 seconds), causing excessive preflight (OPTIONS) requests, increasing latency and server load.
**Recommendation:** Add `'Access-Control-Max-Age': '86400'` (24 hours) to cache preflight responses.

### Finding 2.3: Methods and Headers
**Current State:**
*   `Access-Control-Allow-Methods`: `GET,POST,DELETE,OPTIONS` (Good).
*   `Access-Control-Allow-Headers`: `Authorization, Content-Type` (Good).
**Assessment:** These are correctly scoped to the API's needs.

---

## 3. Recommended Remediation Plan

1.  **Modify `src/backend/permissions.json`**:
    *   Remove the global wildcard `*`.
    *   Explicitly list each module with appropriate permissions.
    *   Example structure:
        ```json
        {
          "web-methods": {
            "backend/dataAccess.jsw": { "*": { "siteOwner": { "invoke": true } } },
            "backend/stripeService.jsw": {
               "createCheckoutSession": { "siteMember": { "invoke": true }, "anonymous": { "invoke": true } },
               "*": { "siteOwner": { "invoke": true } }
            },
            ...
          }
        }
        ```

2.  **Refactor `stripeService.jsw`**:
    *   Move internal/admin-only logic (like `upsertSubscription`) to a new file `src/backend/stripeCore.js` (plain `.js` file, not web module) so it cannot be exposed to the client.
    *   Keep only client-facing logic in `stripeService.jsw` and import `stripeCore.js`.

3.  **Update `apiGateway.jsw`**:
    *   Add `Access-Control-Max-Age` header.
    *   Consider implementing a dynamic origin check against the `partner` configuration if strict security is required.
