# Dependency Security Audit Report

**Date:** 2026-03-03
**Analyst:** Jules (AI Security Agent)
**Project:** LMDR Website V2

## 1. Executive Summary

A supply chain security audit was performed on the project's npm dependencies.
**Status:** **PASS** (with warnings).

- **Production Dependencies:** 0 known vulnerabilities.
- **Development Dependencies:** 9 known vulnerabilities (5 High, 4 Moderate).
- **Phantom Dependencies:** 1 fixed (`uuid`).

The vulnerabilities are isolated to development tools (`@wix/cli` and `@wix/cli-app`) and do not impact the runtime security of the deployed application.

## 2. Findings & Remediation

### 2.1 Critical/High Vulnerabilities (Dev Only)

The following high-severity vulnerabilities were identified in the development dependency tree, stemming from `@wix/cli` version `1.1.162` (latest):

| Severity | Package | Vulnerability | Path | Remediation Status |
| :--- | :--- | :--- | :--- | :--- |
| **High** | `tar` | Arbitrary File Overwrite (GHSA-8qq5-rm4j-mr97) | `@wix/cli` > `node-gyp` > `tar` | **Acknowledged**. Isolated to dev environment. |
| **High** | `tar` | Race Condition (GHSA-r6q2-hw4h-h46w) | `@wix/cli` > `node-gyp` > `tar` | **Acknowledged**. Isolated to dev environment. |
| **High** | `tar` | Arbitrary File Creation (GHSA-34x7-hfp2-rc4v) | `@wix/cli` > `node-gyp` > `tar` | **Acknowledged**. Isolated to dev environment. |

**Note:** `npm audit fix --force` suggests downgrading `@wix/cli` to `1.0.1`, which is **NOT RECOMMENDED** as it is a major regression. These vulnerabilities should be addressed by Wix in a future release of the CLI.

### 2.2 Moderate Vulnerabilities (Dev Only)

| Severity | Package | Vulnerability | Path |
| :--- | :--- | :--- | :--- |
| **Moderate** | `undici` | DoS via unbounded decompression | `@wix/cli-app` > `miniflare` > `undici` |
| **Moderate** | `vite` | Server FS deny bypass (multiple) | `@wix/cli-app` > `vite` |

### 2.3 Phantom Dependencies

**Finding:** The package `uuid` was imported in backend code (`src/backend/documentCollectionService.jsw`) but missing from `package.json`.
**Action:** Added `uuid` to `dependencies` (v13.0.0).

### 2.4 Dependency Classification

**Finding:** `@wix/cli` and `@wix/cli-app` were incorrectly listed as production `dependencies`.
**Action:** Moved both packages to `devDependencies` to correctly reflect their usage and isolate their vulnerabilities from the production build artifact.

## 3. Specific Component Review

| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Stripe** | **SAFE** | Implemented via direct `fetch` calls to Stripe API. No vulnerable SDK present. |
| **Twilio** | **SAFE** | Not used in production code. No SDK present. |
| **OpenAI / AI** | **SAFE** | Implemented via direct `fetch` calls to provider APIs. No vulnerable SDK present. |
| **Wix SDK** | **WARN** | `@wix/cli` has known vulnerabilities in its dependency tree (see section 2.1). |

## 4. Recommendations

1.  **Do NOT run `npm audit fix --force`**: This will break the Wix CLI integration.
2.  **Monitor updates**: Periodically check for updates to `@wix/cli` that resolve the `node-tar` issues.
3.  **Safe for Production**: The application code itself relies only on `uuid` (which is safe) and standard Velo built-ins. The vulnerable packages are not bundled into the production runtime.
