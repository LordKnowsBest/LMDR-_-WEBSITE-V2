# Dependency Security Audit Report (V2)

**Date:** 2026-03-03
**Analyst:** Jules (AI Software Engineer)

## Executive Summary

A comprehensive security audit of the project's npm dependencies was performed. The audit identified **37 vulnerabilities** (31 High, 6 Moderate), primarily stemming from the `@wix/cli` development toolkit and its dependency tree. Additionally, critical dependency hygiene issues (phantom dependencies, unused packages) were identified and addressed in `package.json`.

**Overall Status:** **WARN** (Vulnerabilities in dev tools, Lockfile out of sync due to auth) / **PASS** (Production code dependencies remediated)

## Vulnerability Summary (npm audit)

| Severity | Count | Primary Culprit | Status |
| :--- | :--- | :--- | :--- |
| **Critical** | 0 | - | - |
| **High** | 31 | `minimatch` (via `eslint`, `jest`, `@wix/cli`), `tar` (via `@wix/cli`) | Unresolved (Dev Dependencies) |
| **Moderate** | 6 | `ajv`, `undici`, `vite` | Unresolved (Dev Dependencies) |
| **Low** | 0 | - | - |

**Note:** Most high-severity vulnerabilities are within `devDependencies` (`@wix/cli`, `jest`, `eslint`) and do not directly impact the production runtime of the Velo backend, but they pose a risk during development and build processes.

## Remediation Actions Taken

### 1. Fixed Phantom Dependency: `uuid`
-   **Issue:** The package `uuid` was imported in `src/backend/documentCollectionService.jsw` but was missing from `package.json`.
-   **Action:** Added `"uuid": "^9.0.1"` to `dependencies` in `package.json`.

### 2. Removed Unused Dependencies
-   **Issue:** Packages `@velo/wix-members-twilio-otp-backend` and `@velo/wix-members-twilio-otp` were listed in `package.json` but not used in the codebase.
-   **Action:** Removed from `package.json` to reduce attack surface and confusion.

### 3. Lockfile Status
-   **Issue:** `package-lock.json` could not be updated to reflect the changes in `package.json` because the environment lacks authentication credentials for private `@marketpushapps` packages.
-   **Action Required:** A developer with access to the private registry must run `npm install` to synchronize `package-lock.json`. Until then, `package.json` and `package-lock.json` are out of sync.

## Code Usage & SDK Analysis

### Stripe
-   **Status:** **Secure / Manual**
-   **Implementation:** The project does **not** use the official `stripe` npm SDK. Instead, it uses a custom `stripeRequest` helper function in `src/backend/stripeService.jsw` that performs direct HTTP `fetch` calls to `https://api.stripe.com/v1`.
-   **Auth:** Uses `Bearer` token auth via `wix-secrets-backend`.
-   **Webhook Verification:** `src/backend/http-functions.js` implements secure HMAC-SHA256 signature verification using the Web Crypto API (`crypto.subtle`).

### AI Clients (OpenAI / Anthropic)
-   **Status:** **Secure / Manual**
-   **Implementation:** AI services are accessed via direct HTTP `fetch` calls (e.g., in `src/backend/aiRouterService.jsw`). No official SDKs are installed.
-   **Auth:** Secrets managed via `wix-secrets-backend`.

### Twilio
-   **Status:** **Removed**
-   **Observation:** The unused `@velo/wix-members-twilio-otp` packages have been removed from `package.json`.

## Recommendations

1.  **Sync Lockfile:** Run `npm install` locally with valid credentials for `@marketpushapps` registry to update `package-lock.json`.
2.  **Update Dev Tools:** Run `npm audit fix` (after syncing lockfile) to attempt to resolve vulnerabilities in `devDependencies`. Many are likely resolvable by updating `@wix/cli` and `eslint` related packages.
3.  **Monitor `@wix/cli`:** Keep the Wix CLI tools updated to the latest version to mitigate supply chain risks in the build environment.
