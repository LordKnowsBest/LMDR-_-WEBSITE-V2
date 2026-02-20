# Dependency Security Audit Report

**Date:** 2026-03-03
**Analyst:** Jules (AI Software Engineer)
**Verdict:** **WARN** (Dev Environment) / **PASS** (Production Runtime)

## 1. Executive Summary

A comprehensive supply chain security audit of the LMDR project's npm dependencies was performed. The audit identified **37 known vulnerabilities** (31 High, 6 Moderate), primarily concentrated in the development toolchain (`@wix/cli`, `eslint`, `jest`).

Critical production systems (Stripe payments, AI services, Authentication) were manually verified and found to be **safe**, as they utilize direct API integrations or standard Wix platform modules rather than vulnerable third-party SDKs.

A significant **hygiene issue** was detected regarding `package-lock.json` synchronization and private package access, which blocks automated remediation.

## 2. Vulnerability Summary (npm audit)

| Severity | Count | Primary Culprits (Dev Dependencies) | Impact Analysis |
| :--- | :--- | :--- | :--- |
| **Critical** | 0 | - | None |
| **High** | 31 | `minimatch` (<10.2.1), `tar` (<=7.5.7) | Affects build/test tools (`eslint`, `jest`, `@wix/cli`). No impact on Velo runtime. |
| **Moderate** | 6 | `ajv`, `undici`, `vite` | Affects build tools (`vite` via `@wix/cli`). No impact on Velo runtime. |
| **Low** | 0 | - | - |

**Note:** All identified vulnerabilities are within `devDependencies` or their transitive dependencies. These packages are used during local development and building but are not bundled into the production Velo backend runtime, mitigating the security risk to the live application.

## 3. Critical Production Dependency Analysis

| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Stripe Payments** | **SECURE** | Uses direct `fetch` calls to `https://api.stripe.com/v1`. No vulnerable `stripe` npm package installed. Webhooks use native `crypto` for signature verification. |
| **AI (OpenAI/Claude)**| **SECURE** | Uses direct `fetch` calls (e.g., in `aiRouterService.jsw`). No `openai` or `anthropic` SDKs installed. |
| **Authentication** | **SECURE** | Uses built-in `wix-members-backend` and custom logic. Legacy `@velo/wix-members-twilio-otp` removed. |
| **Data/Storage** | **SECURE** | Uses `wix-data`. Private `@marketpushapps/airtable-connector` used for external sync. |

## 4. Health & Hygiene Findings

### ⚠️ Lockfile Desynchronization
**Issue:** `package.json` specifies `"uuid": "^9.0.1"`, but `package-lock.json` defines the root dependency as `"uuid": "^13.0.0"`. This indicates the lockfile was generated with a different version or modified manually.
**Risk:** Inconsistent builds between developers and CI environments.

### ⚠️ Private Package Access
**Issue:** The project depends on private packages (`@marketpushapps/*`) which require authentication to install.
**Impact:** `npm install` and `npm audit fix` cannot be run in this environment without credentials, preventing automated vulnerability patching.

### ✅ No Dependency Confusion
**Check:** Verified that `@marketpushapps/calendly-embed-backend` and other private packages do not exist in the public npm registry (returned 404).
**Result:** Low immediate risk of dependency confusion attacks, provided the scope remains private or secured.

### ✅ No Phantom Dependencies
**Check:** Scanned source code for imports not listed in `package.json`.
**Result:** All imports map to standard Node.js modules (`crypto`, `fs`), Wix platform modules (`wix-*`), local files, or explicitly listed dependencies (`uuid`).

## 5. Actionable Recommendations

### For Developers (with credentials):
1.  **Sync Lockfile:** Run `npm install` with valid `@marketpushapps` credentials to regenerate `package-lock.json` and resolve the `uuid` version mismatch.
    ```bash
    npm install
    ```
2.  **Patch Dev Tools:** Run `npm audit fix` to upgrade `@wix/cli`, `eslint`, and `jest` dependencies to safe versions.
    ```bash
    npm audit fix
    ```
3.  **Review `uuid`:** Confirm if `uuid` should be v9 or v13 and unify `package.json` and `package-lock.json`.

### For CI/CD:
*   Ensure `@marketpushapps` registry credentials are securely configured in `.npmrc` or environment variables to allow automated builds and security scans.
