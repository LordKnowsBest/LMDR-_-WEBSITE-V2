# Security Audit: Permissions & CORS Policy

**Date:** 2024-05-24
**Target:** `src/backend/permissions.json` & `src/backend/apiGateway.jsw`
**Auditor:** Jules (AI Security Specialist)

## Executive Summary

A security audit of the backend permissions and CORS configuration revealed **CRITICAL** vulnerabilities. The current configuration grants unrestricted `Anonymous` access to all backend web modules, including sensitive administrative and database services. Additionally, the CORS policy is overly permissive, allowing any origin to invoke the API.

## 1. Permissions Audit (`src/backend/permissions.json`)

### Finding 1: Global Wildcard Exposure (CRITICAL)

The `permissions.json` file contains a global wildcard configuration that grants `Anonymous`, `SiteMember`, and `SiteOwner` identical `invoke: true` access to **every** web method in the backend.

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

### Impact Analysis

This misconfiguration exposes 120+ backend modules to the public internet. Authenticated checks within some modules provide a layer of defense, but many critical modules rely on the caller being trusted or use `suppressAuth` internally based on arguments.

#### High-Risk Exposures

| Module | Risk Level | Capability Exposed |
| :--- | :--- | :--- |
| **`src/backend/dataAccess.jsw`** | **CRITICAL** | **Full Database Control.** Exports `queryRecords`, `insertRecord`, `updateRecord`, `deleteRecord`. Accepts `{ suppressAuth: true }` in options, allowing an anonymous attacker to dump, modify, or delete the entire database. |
| **`src/backend/stripeService.jsw`** | **CRITICAL** | **Financial Manipulation.** Exports `upsertSubscription` which allows modifying subscription status and tiers directly. Also allows spamming Stripe with `createCheckoutSession`. |
| **`src/backend/apiAuthService.jsw`** | **HIGH** | **Credential Rotation.** Exports `rotateApiKey` which, if `partnerId` is guessed, could allow an attacker to invalidate and replace API keys. |
| **`src/backend/apiGateway.jsw`** | **HIGH** | **Internal Logic Exposure.** Exports `handleGatewayRequest` which is intended for internal use by `http-functions.js` but is exposed to the frontend. |
| **`src/backend/admin_*.jsw`** | **HIGH** | **Administrative Control.** All admin services (billing, dashboard, users) are publicly callable. |

### Recommendation

**Immediate Remediation Required:**
1.  Change the default wildcard policy to `ADMIN` (SiteOwner) only.
2.  Explicitly grant `SiteMember` or `Anonymous` access only to specific files/methods that require it.

## 2. CORS Audit (`src/backend/apiGateway.jsw`)

### Finding 2: Overly Permissive CORS Origin (HIGH)

The `apiGateway.jsw` module (used by `http-functions.js`) sets the `Access-Control-Allow-Origin` header to `*`.

```javascript
const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  ...
};
```

### Impact Analysis
-   **Phishing / CSRF**: Malicious websites can make requests to the API from a victim's browser. While the API requires an `Authorization` header (Bearer token), if a user's browser automatically sent credentials (cookies) or if the token was stored in a way accessible to the browser context, this would be catastrophic.
-   **Resource Abuse**: Any website can embed calls to the API, potentially consuming quotas or triggering costs.

### Finding 3: Missing Preflight Cache

The `Access-Control-Max-Age` header is missing.
-   **Impact**: Browsers will send a preflight `OPTIONS` request for every single API call, doubling the latency and server load.

### Recommendation

1.  **Restrict Origin**: Replace `*` with a whitelist of trusted domains (e.g., `https://www.lastmiledr.app`, `https://admin.lastmiledr.app`).
2.  **Cache Preflight**: Add `Access-Control-Max-Age: 86400` (24 hours) to reduce overhead.
3.  **Review Methods**: `DELETE` is enabled and used (`/v1/safety/alerts/:id`), so it must remain.

## 3. Remediation Plan

A revised `permissions_revised.json` file will be generated to implement the least-privilege principle.

### Proposed Permissions Model

| Role | Access Scope | Examples |
| :--- | :--- | :--- |
| **ADMIN** (Default) | All sensitive & internal modules | `dataAccess`, `stripeService` (sensitive methods), `admin_*`, `apiGateway` |
| **SiteMember** | User-centric business logic | `memberService`, `driverProfiles`, `applicationService` |
| **Anonymous** | Public content & entry points | `contentService`, `publicStatsService`, `stripeService` (checkout init only) |
