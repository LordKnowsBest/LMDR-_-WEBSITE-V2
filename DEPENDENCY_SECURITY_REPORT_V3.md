# Dependency Security Audit Report (V3)

**Date:** 2026-10-18
**Analyst:** Jules
**Status:** **FAIL**

## Executive Summary

The dependency security audit identified **36 vulnerabilities** (31 High, 5 Moderate) within the project's dependency tree. More critically, the `package-lock.json` file is **out of sync** with `package.json`, causing discrepancies in dependency resolution and preventing accurate auditing of production dependencies (specifically `@marketpushapps` packages).

The production runtime environment appears relatively safe as most vulnerabilities are confined to development tools (`eslint`, `jest`, `@wix/cli`). However, the broken lockfile represents a significant supply chain risk and operational blocker.

**Verification Log:** See `AUDIT_LOG.txt` for the raw output of the audit tools, confirming the vulnerability scan and registry state.

## Vulnerability Summary

| Severity | Count | Primary Culprits |
| :--- | :--- | :--- |
| **Critical** | 0 | - |
| **High** | 31 | `minimatch`, `tar` (causing downstream issues in `eslint`, `jest`, `@wix/cli`) |
| **Moderate** | 5 | `vite` (via `@wix/cli-app`), `ajv` |
| **Low** | 0 | - |
| **Total** | **36** | |

### Detailed High Severity Vulnerabilities
The 31 high severity findings stem from the following root vulnerabilities in the dependency tree:

| Package | Severity | Vulnerability ID | Affected Version | Patched Version |
| :--- | :--- | :--- | :--- | :--- |
| `minimatch` | HIGH | [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | `<10.2.1` | `eslint@10.0.1` (Major Update) |
| `tar` | HIGH | [GHSA-r6q2-hw4h-h46w](https://github.com/advisories/GHSA-r6q2-hw4h-h46w) | `<=7.5.3` | `True` |
| `tar` | HIGH | [GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v) | `<7.5.7` | `True` |
| `tar` | HIGH | [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97) | `<=7.5.2` | `True` |
| `tar` | HIGH | [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx) | `<7.5.8` | `True` |

*Note: The multiple `tar` vulnerabilities affect `node-gyp` which is a dependency of `@wix/cli`. Resolving these likely requires an update to the Wix CLI toolchain or dependency overrides.*

## Detailed Findings

### 1. Critical Lockfile Integrity Failure
*   **Finding:** `package-lock.json` is stale and inconsistent with `package.json`.
    *   `package.json` specifies `uuid` version `^9.0.1`, but `package-lock.json` references `uuid` `^13.0.0` in the root definition.
    *   **Registry Verification:** `npm view uuid dist-tags` confirms `latest` is `13.0.0` (see `AUDIT_LOG.txt`), indicating the lockfile was generated in an environment where v13 was available, which matches the current registry state.
    *   `package.json` lists private dependencies `@marketpushapps/calendly-embed-backend`, `@marketpushapps/airtable-connector`, etc., but these are **completely missing** from `package-lock.json` or `node_modules` due to authentication failures during previous installs.
*   **Impact:** Reproducible builds are impossible. `npm audit` results may be inaccurate for production dependencies because they are not properly locked.

### 2. Runtime Dependency Analysis
*   **uuid:** Version `^9.0.1` is listed in `package.json`. No known vulnerabilities were found for this version in the audit.
*   **@marketpushapps/*:** Status **UNKNOWN**. Since these could not be installed (missing credentials) and are not in the lockfile, they were skipped by the audit. This is a blind spot.
*   **Twilio OTP:** The package `@velo/wix-members-twilio-otp` was explicitly checked and is **NOT** present in `package.json` or `package-lock.json`.
*   **Stripe:** No Stripe SDK is listed in `package.json`. Integration is handled via direct API calls (fetch), avoiding SDK supply chain risks.

### 3. Phantom Dependencies
*   `@wix/cli-app` is listed in `package-lock.json` dependencies but not explicitly in `package.json`. It appears to be pulled in transitively or from a previous state.

## Recommendations & Action Plan

1.  **Immediate: Restore Registry Access**
    *   Obtain valid `.npmrc` credentials for the `@marketpushapps` private registry. This is required to run `npm install` successfully.

2.  **Immediate: Regenerate Lockfile**
    *   Once authenticated, run `npm install` to generate a correct, up-to-date `package-lock.json` that includes all production dependencies and resolves the `uuid` version mismatch.

3.  **Short Term: Audit Private Packages**
    *   Re-run `npm audit` specifically to check the `@marketpushapps` packages once they are installed.

4.  **Long Term: Dev Dependency Updates**
    *   Monitor `@wix/cli` for updates that bundle newer versions of `node-gyp` and `tar`.
    *   Accept the risk for `eslint`/`jest` vulnerabilities in the short term, as they are dev-only and isolated from production data.

## Verdict
**FAIL** - The project fails the audit primarily due to the compromised integrity of `package-lock.json` and the inability to verify private production dependencies.
