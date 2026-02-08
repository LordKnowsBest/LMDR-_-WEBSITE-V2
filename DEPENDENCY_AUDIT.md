# Dependency Vulnerability Audit Report

**Date:** February 17, 2025
**Analyst:** Jules (Supply Chain Security Analyst)
**Verdict:** ⚠️ **FAIL** (Due to Critical Configuration Issues)

## 1. Vulnerability Summary

| Severity | Count | Notes |
| :--- | :--- | :--- |
| **Critical** | 0* | *Potential hidden criticals due to stale lockfile* |
| **High** | 1 | `@wix/cli` (v1.1.159) - Transitive dependency on `tar` |
| **Moderate** | 0 | |
| **Low** | 0 | |
| **Total** | 1 | |

> **Note:** The `npm audit` tool reported 0 vulnerabilities, but this is a **false negative**. The `package-lock.json` file is critically stale and missing almost all production dependencies, rendering automated auditing ineffective for those packages.

## 2. Detailed Findings

### 2.1 Critical Configuration Issue: Stale `package-lock.json`
-   **Finding:** The `package-lock.json` file is significantly out of sync with `package.json`.
-   **Details:**
    -   `package.json` lists 6 production dependencies (`@velo/wix-members-twilio-otp`, `@marketpushapps/*`) and 9 dev dependencies.
    -   `package-lock.json` lists only 1 dependency in the root `dependencies` object (`@wix/eslint-plugin-cli`) and a different set of dev dependencies.
    -   **Impact:** `npm audit` only scans what is in the lockfile. Therefore, 90% of the project's dependencies are **NOT being audited**.
-   **Remediation:** Must regenerate `package-lock.json` by running `npm install` with access to the private Wix npm registry.

### 2.2 Known Vulnerability: `@wix/cli`
-   **Package:** `@wix/cli`
-   **Current Version:** `^1.0.0` (v1.1.159 identified in context)
-   **Vulnerability:** High severity. Contains an outdated transitive dependency on `tar` (via `node-gyp` -> `make-fetch-happen`) which has arbitrary file overwrite vulnerabilities.
-   **Status:** Missing from `package-lock.json`.
-   **Remediation:** Update `@wix/cli` to the latest version (`npm install @wix/cli@latest`).

### 2.3 Unused "Phantom" Dependencies
-   **Finding:** Several packages are listed in `package.json` but appear to be completely unused in the codebase (0 references found in `src/`).
    -   `@velo/wix-members-twilio-otp-backend`
    -   `@velo/wix-members-twilio-otp`
    -   `@marketpushapps/calendly-embed-backend`
    -   `@marketpushapps/airtable-connector`
    -   `@marketpushapps/airtable-connector-backend`
    -   `@marketpushapps/calendly-embed`
-   **Risk:** Increases attack surface and install time for no benefit.
-   **Remediation:** Remove these dependencies from `package.json`.

### 2.4 Manual Implementations (No SDKs)
-   **Stripe:** The project uses manual `fetch` calls to `https://api.stripe.com` (found in `src/backend/stripeService.jsw`) instead of the official `stripe` npm package.
    -   **Pros:** Smaller bundle size.
    -   **Cons:** Higher maintenance burden, potential for security bugs in manual signature verification (though `src/backend/http-functions.js` implements secure comparison).
-   **AI Clients (OpenAI/Anthropic):** The project uses manual `fetch` calls (found in `src/backend/aiRouterService.jsw`) instead of official SDKs.
    -   **Risk:** Low, assuming API keys are handled securely via Wix Secrets (verified: `getSecret` is used).

### 2.5 Authentication (Twilio OTP)
-   **Finding:** Despite the `@velo/wix-members-twilio-otp` dependency, the codebase does **not** appear to use Twilio for OTP.
-   **Evidence:**
    -   `grep` for `twilio` only yields results in a test file (`src/public/__tests__/matchNotifications.test.js`) checking for secrets.
    -   `src/backend/notificationDispatcher.jsw` contains a placeholder `deliverSms` function that returns `true` without doing anything.
-   **Conclusion:** SMS/OTP authentication is **not currently implemented** or enabled in the backend.

## 3. Action Plan

1.  **Immediate:** Remove unused dependencies from `package.json`:
    ```bash
    npm uninstall @velo/wix-members-twilio-otp-backend @velo/wix-members-twilio-otp @marketpushapps/calendly-embed-backend @marketpushapps/airtable-connector @marketpushapps/airtable-connector-backend @marketpushapps/calendly-embed
    ```
2.  **High Priority:** Restore access to the private Wix registry and run `npm install` to generate a valid `package-lock.json`.
3.  **High Priority:** Update `@wix/cli` to the latest version to resolve the known `tar` vulnerability.
4.  **Verification:** Once the lockfile is fixed, re-run `npm audit` to catch any vulnerabilities in the previously missing dependencies.
