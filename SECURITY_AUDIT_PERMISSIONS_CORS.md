# Security Audit: Permissions & CORS

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Specialist)

## Summary
This audit examines `src/backend/permissions.json` and `src/backend/apiGateway.jsw` to identify security misconfigurations in backend access control and cross-origin resource sharing.

---

## 1. Access Control Findings (`src/backend/permissions.json`)

The following web methods are exposed to **Anonymous** (unauthenticated) users. This configuration allows anyone on the internet to invoke these functions without logging in.

### **High Risk**
| Module | Method | Description | Recommendation |
| :--- | :--- | :--- | :--- |
| `stripeService.jsw` | `createPlacementDepositCheckout` | Initiates a Stripe Checkout session. Allows potential abuse of payment infrastructure. | Restrict to `SiteMember` (logged-in users). |
| `weatherAlertService.jsw` | `processNewAlerts` | Trigger for batch processing of weather alerts. Triggers emails and database updates. | Restrict to `SiteOwner` (Admin) only. |
| `reputationService.jsw` | `awardForumPoints` | Awards XP/points to users based on user ID. Vulnerable to manipulation and abuse. | Restrict to `SiteOwner` (Admin) or internal call only. |
| `roadConditionService.jsw` | `reportCondition` | Submit user-generated road reports. Vulnerable to spam. | Restrict to `SiteMember`. |
| `roadConditionService.jsw` | `verifyConditionReport` | Verify/upvote reports. | Restrict to `SiteMember`. |

### **Medium Risk**
| Module | Method | Description | Recommendation |
| :--- | :--- | :--- | :--- |
| `stripeService.jsw` | `getCheckoutSession` | Retrieves session details. Potential information leakage. | Restrict to `SiteMember` or `SiteOwner`. |
| `weatherAlertService.jsw` | `subscribeToAlerts` | Subscribe a driver to alerts. | Restrict to `SiteMember`. |
| `petFriendlyService.jsw` | `submitLocation` | Submit a new location. Contains internal code check for login, but should be blocked at gateway. | Restrict to `SiteMember`. |
| `petFriendlyService.jsw` | `submitReview` | Submit a review. Contains internal code check for login, but should be blocked at gateway. | Restrict to `SiteMember`. |

### **Low Risk (Public Content)**
These methods appear intended for public access (blogs, stats, read-only data) and are acceptable for Anonymous use.
*   `contentService.jsw`: All methods (`*`)
*   `publicStatsService.jsw`: All methods (`*`)
*   `weatherAlertService.jsw`: `getAlertsAtLocation`, `getRouteWeather`
*   `roadConditionService.jsw`: `getRouteConditions`, `getConditionsByState`, `getTruckRestrictions`
*   `petFriendlyService.jsw`: `searchLocations`, `getNearbyLocations`, `getLocationById`
*   `reputationService.jsw`: `getReputation` (Read-only profile)
*   `stripeService.jsw`: `getPublishableKey`

### **Identical Unrestricted Access**
The following modules grant identical `invoke: true` permissions to `Anonymous`, `SiteMember`, and `SiteOwner`. Ideally, privileged roles should have broader access while Anonymous is restricted.
*   `contentService.jsw`
*   `publicStatsService.jsw`
*   `weatherAlertService.jsw`
*   `roadConditionService.jsw`
*   `petFriendlyService.jsw`
*   `reputationService.jsw`

---

## 2. CORS Policy Findings (`src/backend/apiGateway.jsw`)

### **Critical Finding: Wildcard Origin**
The API Gateway is configured to allow requests from **any origin**. This allows unauthorized third-party sites to consume the API.

*   **Current Value:** `Access-Control-Allow-Origin: '*'`
*   **Risk:** High. Allows any website to make requests to the API.
*   **Recommendation:** Restrict to known domains (e.g., `https://www.lastmiledr.app`, `https://*.wix.com`).

### **Methods & Headers**
*   **Methods:** `GET,POST,DELETE,OPTIONS`
    *   **Status:** Acceptable.
*   **Headers:** `Authorization, Content-Type`
    *   **Status:** Acceptable (No broad wildcards).

---

## 3. Recommendations Summary

1.  **Implement Least Privilege:** Modify `permissions.json` to restrict write operations and sensitive data access to `SiteMember` or `SiteOwner`.
2.  **Lock Down CORS:** Change `Access-Control-Allow-Origin` in `apiGateway.jsw` to specific domains or a dynamic check against an allowlist.
3.  **Secure Admin Functions:** Ensure background jobs (like `processNewAlerts`) are never exposed to the public internet.
