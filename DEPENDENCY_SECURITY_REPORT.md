# Dependency Security Audit Report
**Date:** 2026-02-16
**Auditor:** Jules (AI Software Engineer)
**Status:** ❌ FAIL (Vulnerabilities Detected)

## 1. Executive Summary

A comprehensive dependency audit was performed on the `LMDR-_-WEBSITE-V2` project. The audit identified **9 vulnerabilities** (5 High, 4 Moderate) within the project's dependencies. Additionally, critical configuration issues were found, including phantom dependencies (libraries used in code but not listed in `package.json`) and incorrect categorization of development tools as production dependencies.

| Severity | Count |
| :--- | :--- |
| **Critical** | 0 |
| **High** | 5 |
| **Moderate** | 4 |
| **Low** | 0 |
| **Total** | **9** |

---

## 2. Vulnerability Analysis (`npm audit`)

The following vulnerabilities were identified in the dependency tree, primarily stemming from `@wix/cli` and `@wix/cli-app`.

| Package | Severity | Vulnerability ID | Description | Impact | Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **node-tar** | **High** | GHSA-8qq5-rm4j-mr97 | Arbitrary File Overwrite via Insufficient Path Sanitization | Attackers could overwrite arbitrary files during extraction. | `@wix/cli` > `node-gyp` > `tar` |
| **node-tar** | **High** | GHSA-r6q2-hw4h-h46w | Race Condition in Path Reservations | Potential for file corruption or overwrite. | `@wix/cli` > `node-gyp` > `tar` |
| **node-tar** | **High** | GHSA-34x7-hfp2-rc4v | Arbitrary File Creation/Overwrite | Attackers could create or overwrite files outside extraction root. | `@wix/cli` > `node-gyp` > `tar` |
| **undici** | **Moderate** | GHSA-g9mf-h72j-4rw9 | Unbounded Decompression (DoS) | Processing malicious HTTP responses could lead to resource exhaustion. | `@wix/cli-app` > `miniflare` > `undici` |
| **vite** | **Moderate** | GHSA-356w-63v5-8wf4 | `server.fs.deny` Bypass | Attackers could access restricted files via crafted requests. | `@wix/cli-app` > `vite` |
| **vite** | **Moderate** | GHSA-859w-5945-r5v3 | `server.fs.deny` Bypass | Attackers could access files under project root. | `@wix/cli-app` > `vite` |
| **vite** | **Moderate** | GHSA-xcj6-pq6g-qj4x | `server.fs.deny` Bypass | Attackers could access files using relative paths. | `@wix/cli-app` > `vite` |

**Note:** These vulnerabilities are introduced via `@wix/cli` and `@wix/cli-app`. While labeled as `dependencies` in `package.json`, these are typically development-time tools. If not deployed to the production runtime, the risk is mitigated but still present in the development environment.

---

## 3. Configuration & Health Findings

### 3.1 Phantom Dependencies (Critical)
The following libraries are imported in the source code but are **missing** from `package.json` and `package-lock.json`. This can lead to runtime crashes if the environment does not implicitly provide them.

*   **`uuid`**: Used in `src/backend/documentCollectionService.jsw` (`import { v4 as uuidv4 } from 'uuid';`).
    *   **Action:** Must be added to `dependencies`.

### 3.2 Incorrect Dependency Scope (High)
*   **`@wix/cli`** and **`@wix/cli-app`** are listed in `dependencies` (production).
    *   **Risk:** Increases production bundle size and attack surface. These tools contain vulnerabilities (see Section 2) and should not be present in the production environment.
    *   **Action:** Move to `devDependencies`.

### 3.3 Private & Scoped Packages (Manual Review Required)
The following packages were found in `package.json.test-backup` or referenced in memory but could not be audited via public npm registry due to access restrictions:
*   `@velo/wix-members-twilio-otp`
*   `@marketpushapps/airtable-connector`
*   `@marketpushapps/calendly-embed`

**Status:** ⚠️ **Unknown**.
*   **Action:** Manually verify these packages against internal vulnerability databases or vendor advisories. Ensure you are using the latest stable versions.

### 3.4 Payment & AI Libraries
*   **Stripe**: No `stripe` npm package is used. Integration is implemented via direct HTTP `fetch` calls in `src/backend/stripeService.jsw`. **Pass** (No dependency vulnerability, but code review recommended).
*   **AI (OpenAI, Anthropic)**: No SDKs used. Integration via direct HTTP `fetch` in `src/backend/aiRouterService.jsw`. **Pass**.
*   **Twilio**: References exist but no active backend implementation using the package was found in the main `package.json`.

---

## 4. Remediation Plan

Execute the following commands to resolve the identified issues:

### Step 1: Fix Phantom Dependency
Add `uuid` to ensuring it is tracked and audited.
```bash
npm install uuid
```

### Step 2: Move CLI Tools to DevDependencies
Reduce production attack surface by moving Wix CLI tools.
```bash
npm install --save-dev @wix/cli @wix/cli-app
```

### Step 3: Address Vulnerabilities
Since `@wix/cli` is already at the latest version (`1.1.162`), you cannot upgrade to fix the transitive vulnerabilities in `node-tar` and `vite` immediately.
*   **Mitigation:** By moving these to `devDependencies` (Step 2), you ensure they are not deployed to production, significantly reducing the risk profile.
*   **Monitoring:** Watch for updates to `@wix/cli` that bump the internal `node-gyp` and `vite` versions.

### Step 4: Clean Install
Regenerate lockfile to ensure consistency.
```bash
npm ci
```
