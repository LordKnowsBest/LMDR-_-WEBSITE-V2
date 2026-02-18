# Dependency Security Audit Report

**Date:** 2026-03-03
**Analyst:** Supply Chain Security Agent (Jules)

## Executive Summary

A comprehensive security audit of the project's npm dependencies was performed. The audit identified **13 vulnerabilities** (5 High, 8 Moderate) in the existing `package-lock.json`. Additionally, a critical phantom dependency (`uuid`) was identified and remediated.

**Overall Status:** **WARN** (Manual fixes applied to `package.json`, but `package-lock.json` update pending credentials)

## Vulnerability Summary

| Severity | Count (Original) | Primary Culprit | Status |
| :--- | :--- | :--- | :--- |
| **Critical** | 0 | - | - |
| **High** | 5 | `tar` (via `@wix/cli`) | **Fixed in `package.json`** (Updated to `^1.1.163`) |
| **Moderate** | 8 | `ajv`, `undici`, `vite` | Unresolved (Requires `npm install`) |
| **Low** | 0 | - | - |

## Critical Findings & Remediation

### 1. High Severity: `tar` (Arbitrary File Overwrite)
-   **Package:** `tar` (versions <= 6.2.1)
-   **Dependency Chain:** `@wix/cli` -> `node-gyp` -> `make-fetch-happen` -> `cacache` -> `tar`
-   **Impact:** Vulnerable to arbitrary file overwrite and symlink poisoning.
-   **Remediation:** **FIXED in `package.json`**. Manually updated `@wix/cli` to `^1.1.163` and `@wix/eslint-plugin-cli` to `^1.0.2`.
    -   **Action Required:** A developer with valid npm registry credentials must run `npm install` to update `package-lock.json`.

### 2. Phantom Dependency: `uuid`
-   **Issue:** The package `uuid` was imported in `src/backend/documentCollectionService.jsw` but was missing from `package.json`.
-   **Risk:** Application failure in clean environments or CI/CD pipelines.
-   **Remediation:** **FIXED**. `uuid` (`^9.0.0`) has been explicitly added to `dependencies` in `package.json`.

### 3. Unused Dependency: Twilio
-   **Issue:** `@velo/wix-members-twilio-otp` and `@velo/wix-members-twilio-otp-backend` were listed in `dependencies` but not used in the codebase.
-   **Risk:** Unnecessary attack surface.
-   **Remediation:** **FIXED**. These packages have been removed from `package.json`.

## Code Usage & SDK Analysis

### Stripe
-   **Status:** **Secure / Manual**
-   **Implementation:** The project does **not** use the official `stripe` npm SDK. Instead, it uses a custom `stripeRequest` helper function in `src/backend/stripeService.jsw` that performs direct HTTP `fetch` calls to `https://api.stripe.com/v1`.
-   **Auth:** Uses `Bearer` token auth via `wix-secrets-backend`.

### AI Clients (OpenAI / Anthropic)
-   **Status:** **Secure / Manual**
-   **Implementation:** AI services are accessed via direct HTTP `fetch` calls in `src/backend/aiEnrichment.jsw`. No official SDKs (`openai`, `anthropic`) are installed.
-   **Auth:** Secrets managed via `wix-secrets-backend`.

## Actionable Next Steps

1.  **Run `npm install`**: A developer with valid credentials for the `@marketpushapps` private registry must run `npm install` to:
    -   Install the newly added `uuid` dependency.
    -   Update `@wix/cli` to the secure version specified in `package.json`.
    -   Regenerate `package-lock.json` to reflect these changes.
2.  **Verify `uuid`**: Ensure the newly installed `uuid` package works correctly with the Velo imports (e.g. `import { v4 as uuidv4 } from 'uuid'`).
