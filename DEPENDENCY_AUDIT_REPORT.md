# Dependency Audit Report

**Date:** 2026-03-03
**Scope:** NPM Dependencies (`package.json`, `package-lock.json`)
**Status:** FAIL (High Severity Vulnerabilities Present)

## 1. Vulnerability Summary

A total of **9** vulnerabilities were identified by `npm audit`.

| Severity | Count | Affected Package | Dependency Chain | Details | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Critical** | 0 | - | - | - | - |
| **High** | 5 | `tar` | `@wix/cli` -> `node-gyp` -> ... -> `tar` | Arbitrary File Overwrite/Creation. Affected versions: `<=7.5.6`. | **Unresolved**. Requires update to `@wix/cli`. Current available fix involves downgrading `@wix/cli` to `1.0.1`, which is a breaking change and rejected. |
| **Moderate** | 4 | `undici`, `vite` | `@wix/cli-app` -> `miniflare`/`vite` | Resource exhaustion (`undici`) and `server.fs.deny` bypass (`vite`). | **Unresolved**. Requires update to `@wix/cli-app`. Current available fix involves downgrading, which is rejected. |
| **Low** | 0 | - | - | - | - |

## 2. Phantom Dependencies

*   **Identified:** `uuid`
*   **Location:** Used in `src/backend/documentCollectionService.jsw` and imported in `src/backend/recruiterAnalyticsService.jsw`.
*   **Issue:** The package was used in backend code but missing from `package.json`, leading to potential runtime failures in environments where it is not pre-installed.
*   **Resolution:** Added `uuid: ^9.0.0` to `package.json` and updated `package-lock.json`.
*   **Status:** **RESOLVED**

## 3. Manual Implementation Review

The following critical integrations were reviewed for security and best practices:

*   **Stripe:**
    *   **Implementation:** Direct HTTP `fetch` in `src/backend/stripeService.jsw`.
    *   **SDK Status:** Not used.
    *   **Security:** Uses `wix-secrets-backend` for keys. No hardcoded credentials. Implementation appears standard.
    *   **Verdict:** **SAFE**

*   **AI Clients (OpenAI, Anthropic, etc.):**
    *   **Implementation:** Direct HTTP `fetch` (via `wix-fetch`) in `src/backend/aiRouterService.jsw`.
    *   **SDK Status:** Not used.
    *   **Security:** Uses `wix-secrets-backend` for API keys.
    *   **Verdict:** **SAFE**

*   **Twilio:**
    *   **Implementation:** No active backend implementation found in `src/backend/`. References exist only in test files (`src/public/__tests__`).
    *   **Verdict:** **SAFE** (Unused)

## 4. Recommendations

1.  **Monitor `@wix/cli` Updates:** The high-severity vulnerabilities in `tar` are transitive dependencies of the Wix CLI tools. Monitor for a new release of `@wix/cli` that updates `node-gyp` or its dependencies.
2.  **Do Not Downgrade:** Do not run `npm audit fix --force` blindly, as it suggests downgrading `@wix/cli` to version `1.0.1`, which would likely break the development environment.
3.  **Regular Audits:** Continue to run `npm audit` regularly to catch new vulnerabilities.

## 5. File Integrity

*   `package-lock.json` was present but stale (missing `uuid`). It has been updated and is now in sync with `package.json`.
