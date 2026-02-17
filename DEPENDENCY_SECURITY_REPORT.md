# Dependency Security Audit Report

**Date:** 2026-03-03
**Analyst:** Supply Chain Security Agent

## Executive Summary

A comprehensive security audit of the project's npm dependencies was performed. The audit identified **9 vulnerabilities** (5 High, 4 Moderate), primarily stemming from the `@wix/cli` development toolkit. Additionally, a critical phantom dependency (`uuid`) was identified and remediated.

**Overall Status:** **FAIL** (High severity vulnerabilities present in dev tools) / **PASS** (Production code dependencies remediated)

## Vulnerability Summary

| Severity | Count | Primary Culprit | Status |
| :--- | :--- | :--- | :--- |
| **Critical** | 0 | - | - |
| **High** | 5 | `tar` (via `@wix/cli`) | Unresolved (Upstream) |
| **Moderate** | 4 | `undici`, `vite` | Unresolved (Upstream) |
| **Low** | 0 | - | - |

## Critical Findings & Remediation

### 1. High Severity: `tar` (Arbitrary File Overwrite)
-   **Package:** `tar` (versions <= 6.2.1)
-   **Dependency Chain:** `@wix/cli` -> `node-gyp` -> `make-fetch-happen` -> `cacache` -> `tar`
-   **Impact:** Vulnerable to arbitrary file overwrite and symlink poisoning.
-   **Remediation:** The vulnerability lies within the `@wix/cli` dependency tree. `npm audit` suggests a fix that may be breaking or is not yet available in a stable release for the current major version.
    -   **Action:** Monitor `@wix/cli` for updates. Current installed version: `1.1.162`.

### 2. Phantom Dependency: `uuid`
-   **Issue:** The package `uuid` was imported in `src/backend/documentCollectionService.jsw` and `src/backend/recruiterAnalyticsService.jsw` but was missing from `package.json` and `package-lock.json`.
-   **Risk:** Application failure in clean environments or CI/CD pipelines.
-   **Remediation:** **FIXED**. `uuid` has been explicitly added to `package.json`.

## Code Usage & SDK Analysis

### Stripe
-   **Status:** **Secure / Manual**
-   **Implementation:** The project does **not** use the official `stripe` npm SDK. Instead, it uses a custom `stripeRequest` helper function in `src/backend/stripeService.jsw` that performs direct HTTP `fetch` calls to `https://api.stripe.com/v1`.
-   **Auth:** Uses `Bearer` token auth via `wix-secrets-backend`.
-   **Recommendation:** This approach reduces dependency bloat but requires manual maintenance of API types and endpoints.

### AI Clients (OpenAI / Anthropic)
-   **Status:** **Secure / Manual**
-   **Implementation:** AI services are accessed via direct HTTP `fetch` calls in `src/backend/aiEnrichment.jsw`. No official SDKs (`openai`, `anthropic`) are installed.
-   **Auth:** Secrets managed via `wix-secrets-backend`.

### Twilio
-   **Status:** **Unused / Hidden**
-   **Observation:** References to `@velo/wix-members-twilio-otp` exist in backup configuration (`package.json.test-backup`), but no explicit imports or usage of Twilio were found in the active `src/backend` codebase during this scan.

## Actionable Next Steps

1.  **Monitor `@wix/cli`**: Periodically check for a newer version of `@wix/cli` that updates its internal dependency on `node-gyp` / `tar` to resolve the high-severity vulnerabilities.
2.  **Verify `uuid`**: Ensure the newly installed `uuid` package works correctly with the Velo imports (e.g. `import { v4 as uuidv4 } from 'uuid'`).
