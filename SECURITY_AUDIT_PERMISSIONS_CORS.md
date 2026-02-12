# Security Audit: Permissions & CORS

## Executive Summary
A critical security vulnerability was identified in the backend permissions configuration, allowing Anonymous users to invoke any backend web module. Additionally, the API Gateway is configured with a permissive CORS policy allowing requests from any origin.

## Findings

### 1. Global Wildcard Permission (Critical)
**File:** `src/backend/permissions.json`

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
This configuration grants `Anonymous` access to **every** exported function in **every** `.jsw` file in the backend. This includes sensitive administrative functions, database access methods, and payment processing logic.

**High-Risk Methods Exposed:**
- **`src/backend/dataAccess.jsw`**:
  - `queryRecords`, `insertRecord`, `updateRecord`, `deleteRecord`: These methods are exposed to the public. Since `dataAccess` supports a `suppressAuth: true` parameter, an attacker could potentially read or modify any collection in the database.
- **`src/backend/stripeService.jsw`**:
  - `upsertSubscription`: Allows creation or modification of subscription records given a valid Stripe subscription object.
  - `getSubscriptionDetails`: Allows viewing subscription details for any carrier.
- **`src/backend/admin_service.jsw`**:
  - `getDriversList`, `updateDriverStatus`: While these methods contain internal `requireAdmin()` checks, they are exposed to the public internet. This increases the attack surface and potential for Denial of Service (DoS) or information leakage via error messages.

### 2. Permissive CORS Policy (High)
**File:** `src/backend/apiGateway.jsw`

**Current Configuration:**
```javascript
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};
```

**Impact:**
The API accepts requests from any origin (`*`). This allows any website to make requests to the API. While the API uses API keys for authentication (mitigating some CSRF risks), a wildcard origin is a violation of the principle of least privilege and can facilitate other browser-based attacks.

**Recommendation:**
Restrict `Access-Control-Allow-Origin` to a specific list of trusted domains (e.g., `https://www.lastmiledr.app`, `https://admin.lastmiledr.app`) or echo the `Origin` header only if it matches a whitelist.

### 3. Missing Method Restrictions
**Observation:**
Most backend modules do not have specific entries in `permissions.json`, causing them to fall back to the global wildcard. This includes sensitive internal modules like `admin_commissionService.jsw`, `admin_invoiceService.jsw`, etc.

## Recommendations

### Immediate Actions
1.  **Replace `permissions.json`**: Implement a "deny-by-default" strategy.
    - Explicitly list public modules (e.g., `contentService.jsw`).
    - Note: `apiGateway.jsw` is used by `http-functions.js` and should be restricted to `siteOwner` to prevent direct client access.
    - Explicitly list member-only modules (e.g., `memberService.jsw`, `driverProfiles.jsw`).
    - **Restrict everything else (`*`) to `siteOwner`**.
2.  **Restrict `dataAccess.jsw`**: This module should **never** be exposed to `Anonymous` or `siteMember`. It must be restricted to `siteOwner` (Admin) only.
3.  **Update CORS**: Change `Access-Control-Allow-Origin` to reflect the actual production domains or a configured environment variable.

### Long-Term
- **Linting**: Implement a linting rule or CI check to prevent `"*": { "anonymous": { "invoke": true } }` in `permissions.json`.
- **Refactoring**: Refactor `dataAccess.jsw` to be a plain `.js` file (not a web module) if it is not intended to be called directly from the client. If it must be a `.jsw` for specific admin dashboards, strictly enforce permissions via `permissions.json`.

## Remediation Plan
A proposed permissions file `src/backend/permissions_proposed.json` has been generated to address these issues. This file:
- Restricts `dataAccess.jsw` to `siteOwner`.
- Restricts `apiGateway.jsw` to `siteOwner`.
- Restricts `admin_*.jsw` to `siteOwner`.
- Restricts `stripeService.jsw` sensitive methods to `siteOwner`, leaving only `createPlacementDepositCheckout`, `getPublishableKey`, and `getCheckoutSession` open to `Anonymous`.
- Sets a global default of `siteOwner` only.
