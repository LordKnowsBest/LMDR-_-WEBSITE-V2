# Security Audit Report: Permissions & CORS
**Date:** October 26, 2023
**Auditor:** Jules (AI Security Specialist)
**Scope:** `src/backend/permissions.json` and `src/backend/apiGateway.jsw`

## Executive Summary
A comprehensive audit of the LMDR platform's access control and CORS configuration revealed **critical security vulnerabilities**. The current configuration grants `Anonymous` (unauthenticated) users full access to all backend web modules, including raw database access and administrative functions. Additionally, the API Gateway employs an insecure "wildcard" CORS policy that allows any origin to invoke the API.

## 1. Permissions Audit (`src/backend/permissions.json`)

### Critical Findings

#### 1. Global Anonymous Access (High Risk)
The `permissions.json` file contains a global wildcard that explicitly grants `invoke: true` to `Anonymous`, `SiteMember`, and `SiteOwner` for **all** web methods in **all** backend modules.

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

**Impact:** Any internet user can invoke any exported function in `src/backend/*.jsw` directly from the client (browser console), bypassing all frontend UI controls.

#### 2. Raw Database Exposure (`backend/dataAccess.jsw`)
The `dataAccess` module exports functions like `queryRecords`, `insertRecord`, and `updateRecord` that accept an `options` object. The implementation respects `options.suppressAuth`, allowing the caller to bypass Wix/Airtable permissions.

**Impact:** An attacker can read, modify, or delete any record in the database (including users, payments, and logs) by calling `dataAccess.queryRecords('users', { suppressAuth: true })`.

#### 3. Subscription Manipulation (`backend/stripeService.jsw`)
This module mixes public-facing methods (e.g., `createCheckoutSession`) with administrative methods (e.g., `upsertSubscription`). Since the file permissions must be set for the whole module, the administrative methods are exposed.

**Impact:** An attacker could call `upsertSubscription` with a crafted payload to grant themselves a free "Enterprise" subscription without paying.

#### 4. PII Exposure (`backend/driverProfiles.jsw`)
The function `getProfileById(profileId)` returns the full driver profile, including email, phone, and documents.

**Impact:** Because of the wildcard permission, `Anonymous` users can iterate through IDs and harvest driver PII.

### Categorization & Risk Assessment

| Module Pattern | Examples | Sensitivity | Recommended Role |
| :--- | :--- | :--- | :--- |
| **Data Access** | `dataAccess.jsw` | **CRITICAL** | `ADMIN` (SiteOwner) |
| **Admin Services** | `admin*Service.jsw`, `seeds/*.jsw`, `tests/*.jsw` | **HIGH** | `ADMIN` (SiteOwner) |
| **Billing Internal** | `stripeService.jsw` (upsert methods) | **HIGH** | `ADMIN` (SiteOwner) |
| **User Data** | `driverProfiles.jsw`, `memberService.jsw` | **MEDIUM** | `MEMBER` (SiteMember) |
| **Public Services** | `apiAuthService.jsw` (if public), `contentService.jsw` | **LOW** | `ANYONE` (Anonymous) |

---

## 2. CORS Audit (`src/backend/apiGateway.jsw`)

### Critical Findings

#### 1. Wildcard Origin (`Access-Control-Allow-Origin: *`)
The API Gateway hardcodes the `Access-Control-Allow-Origin` header to `*`.

```javascript
const JSON_HEADERS = {
  // ...
  'Access-Control-Allow-Origin': '*',
  // ...
};
```

**Impact:** Any malicious website can make authenticated requests to the API on behalf of a user if the user is logged in (though API Key auth mitigates this slightly, browser-based attacks are still possible if cookies were used). More importantly, it allows resource embedding from anywhere.

#### 2. Missing Preflight Cache (`Access-Control-Max-Age`)
The `OPTIONS` response does not include `Access-Control-Max-Age`.

**Impact:** Browsers will issue a preflight `OPTIONS` request for every single API call, doubling the latency and server load.

### Recommendations

1.  **Restrict Origin:** Change `*` to a specific domain (e.g., `https://www.lastmiledeliveryrecruiting.com`) or a whitelist of trusted partners.
2.  **Add Max-Age:** Set `Access-Control-Max-Age` to `86400` (24 hours) to cache preflight responses.

---

## 3. Remediation Plan

### Immediate Actions
1.  **Replace `permissions.json`:** Remove the global wildcard. Set the default to `ADMIN` (SiteOwner). Explicitly whitelist only necessary modules for `MEMBER` and `ANYONE`.
2.  **Lock Down `dataAccess.jsw`:** Ensure it is strictly restricted to `ADMIN`.
3.  **Refactor `stripeService.jsw`:** Split it into `stripeClient.jsw` (for Checkout UI) and `stripeAdmin.jsw` (for Webhooks/Internal). *Note: For the immediate fix, we will restrict `stripeService.jsw` to `MEMBER` to keep Checkout working, but this leaves a risk window.*
4.  **Fix CORS:** Update `apiGateway.jsw` to reflect trusted origins.

### Code Snippet: Recommended CORS Headers
```javascript
const ALLOWED_ORIGINS = ['https://www.lastmiledeliveryrecruiting.com', 'https://www.lastmiledr.app'];
const origin = request.headers['origin'];
const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': allowOrigin,
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-lmdr-bypass-rate-limit',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400'
};
```
