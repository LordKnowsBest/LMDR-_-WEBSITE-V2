# Security Audit: Permissions & CORS Policy

**Date:** 2026-03-03
**Status:** CRITICAL FINDINGS
**Auditor:** Jules (AI Security Specialist)

## Executive Summary
A comprehensive audit of the `src/backend/permissions.json` and `src/backend/apiGateway.jsw` files has revealed critical security misconfigurations. The current permissions model allows unauthenticated (Anonymous) users to invoke *any* backend web method, including sensitive administrative and financial operations. Additionally, the CORS policy is overly permissive, allowing any origin to interact with the API.

## 1. Permissions Audit (`src/backend/permissions.json`)

### Critical Finding: Global Anonymous Access
The `permissions.json` file contains a global wildcard configuration that grants `invoke` rights to `Anonymous`, `SiteMember`, and `SiteOwner` for **all** web modules and **all** methods.

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

**Risk Level:** **CRITICAL**
**Impact:** Any user on the internet can potentially:
1.  Trigger Stripe subscription updates or resets (`stripeService.upsertSubscription`, `stripeService.resetQuota`).
2.  Access administrative dashboards and revenue data (`adminRevenueService`, `adminDashboardService`).
3.  Bypass authentication checks by directly calling internal helpers if they are exported.
4.  Generate new webhook secrets (`apiAuthService.generateWebhookSecret`).
5.  Read or modify sensitive data via `dataAccess.jsw` (if methods are exposed).

### Sensitivity Analysis of Exposed Modules

| Module | Sensitivity | Reason |
| :--- | :--- | :--- |
| `stripeService.jsw` | **HIGH** | Handles payments, subscriptions, and financial data. |
| `admin*Service.jsw` | **HIGH** | Administrative functions (Billing, Commission, Revenue, Users). |
| `dataAccess.jsw` | **HIGH** | Direct database access, potentially bypassing row-level security. |
| `apiAuthService.jsw` | **HIGH** | API Key validation and management. |
| `b2b*Service.jsw` | **HIGH** | Business-to-Business logic, pipeline management, and analytics. |
| `memberService.jsw` | MEDIUM | User profile management. Should be restricted to `SiteMember`. |
| `driverProfiles.jsw` | MEDIUM | Driver personal data. Should be restricted to `SiteMember` or `SiteOwner`. |
| `messaging.jsw` | MEDIUM | User communication. Should be restricted to `SiteMember`. |
| `contentService.jsw` | LOW | Public content (blogs, job listings). Safe for `Anonymous`. |
| `publicStatsService.jsw` | LOW | Aggregated public statistics. Safe for `Anonymous`. |
| `weatherAlertService.jsw` | MIXED | Public alerts (Low) vs. Subscription management (Medium). |

### Recommendations
1.  **Immediate Action:** Remove the global wildcard for `Anonymous` and `SiteMember`.
2.  **Least Privilege:** Explicitly whitelist only the specific methods that require `Anonymous` access (e.g., `stripeService.getPublishableKey`, `contentService.*`).
3.  **Default Deny:** Configure the wildcard `*` to allow only `SiteOwner` (Admin) by default.
4.  **Role-Based Access:** restrict user-centric modules (like `memberService`) to `SiteMember`.

---

## 2. CORS Audit (`src/backend/apiGateway.jsw`)

### Finding 1: Overly Permissive Origin
The `handleGatewayRequest` function sets the `Access-Control-Allow-Origin` header to `*`.

```javascript
const JSON_HEADERS = {
  // ...
  'Access-Control-Allow-Origin': '*',
  // ...
};
```

**Risk Level:** **MEDIUM/HIGH**
**Impact:** Allows any website to make requests to your API via the browser. While API keys provide authentication, this configuration increases the attack surface for Cross-Site Scripting (XSS) proxies and unexpected usage.
**Recommendation:** Restrict this to known trusted domains, such as:
- `https://www.lastmiledeliveryrecruiting.com`
- `https://lastmiledr.app` (if applicable)

### Finding 2: Missing Max-Age
The `Access-Control-Max-Age` header is missing.
**Impact:** Browsers will trigger a preflight (OPTIONS) request for every single API call, increasing latency and server load.
**Recommendation:** Add `Access-Control-Max-Age: 86400` (24 hours) to cache preflight responses.

### Finding 3: Rate Limit Bypass Header
The code checks for `x-lmdr-bypass-rate-limit` to skip rate limiting.
**Risk Level:** **HIGH**
**Impact:** If a malicious user discovers this header (and if it doesn't require a special secret value), they can bypass rate limits and DOS the service or exhaust quotas.
**Recommendation:** Ensure this header is only honored if the request originates from a trusted internal source or is accompanied by a super-admin key (not just the header presence).

## 3. Proposed Remediation
A proposed `permissions_proposed.json` file will be created to implement the Least Privilege model.
For `apiGateway.jsw`, the CORS headers should be updated in the code.
