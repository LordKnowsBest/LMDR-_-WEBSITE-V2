# Dependency Security & Vulnerability Audit Report

**Date:** 2026-10-18
**Auditor:** Jules (AI Security Analyst)
**Status:** **FAIL** (Critical Integrity Issues & High Vulnerabilities)

---

## 1. Vulnerability Summary

`npm audit` identified **12 known vulnerabilities** in the dependency tree.

| Severity | Count | Primary Packages Involved |
| :--- | :--- | :--- |
| **Critical** | 0 | - |
| **High** | 7 | `minimatch`, `rollup`, `tar` |
| **Moderate** | 5 | `ajv`, `undici` (via `miniflare`), `vite` |
| **Low** | 0 | - |
| **Total** | **12** | |

### Critical & High Severity Findings

| Package | Severity | ID | Vulnerability Type | Affected Version | Patched In | Path / Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **minimatch** | High | GHSA-3ppc-4f35-3m26 | ReDoS (Regular Expression Denial of Service) | <=3.1.3 | 3.1.4+ | `devDependencies` > `@wix/cli` dependency tree |
| **rollup** | High | GHSA-mw96-cpmx-2vgc | Arbitrary File Write via Path Traversal | 4.0.0 - 4.58.0 | 4.58.1 | `devDependencies` > `@wix/cli-app` > `vite` > `rollup` |
| **tar** | High | GHSA-r6q2-hw4h-h46w | Race Condition / Arbitrary File Overwrite | <=7.5.7 | 7.5.8+ | `devDependencies` > `@wix/cli` > `node-gyp` > `make-fetch-happen` > `cacache` > `tar` |

**Impact Analysis:**
- All high-severity vulnerabilities are located within the `devDependencies` tree, specifically stemming from `@wix/cli` and `@wix/cli-app`.
- **Production Risk:** Low. These tools are used for building and deploying the Velo application, not at runtime in the production backend.
- **Development Risk:** Moderate. A malicious actor could exploit these during the build process if the developer machine is compromised or if a malicious package is introduced.

---

## 2. Critical Integrity Failure: `uuid` Version Mismatch

A **severe integrity violation** exists between `package.json` and `package-lock.json`. This is a blocking issue that prevents reproducible builds and invalidates security guarantees.

| File | `uuid` Version | Status |
| :--- | :--- | :--- |
| `package.json` | `^9.0.1` | **Wanted** (Stable, widely used) |
| `package-lock.json` | `^13.0.0` | **INSTALLED** (Bleeding edge / Mismatch) |

**Finding:** The lockfile claims to have installed `uuid@13.0.0`, but the manifest requests `uuid@9.0.1`.
**Risk:** High. `uuid` is a core utility. A major version jump (v9 -> v13) implies breaking changes. The fact that they are out of sync indicates the lockfile was generated in an inconsistent state or manually tampered with.
**Action:** Delete `package-lock.json` and `node_modules`, then run `npm install` to regenerate a consistent lockfile.

---

## 3. "Phantom" Dependencies (Direct Fetch Usage)

The codebase utilizes several external services via direct HTTP `fetch` calls rather than installing their official SDKs. This is a deliberate architectural pattern to reduce bundle size and supply chain attack surface, but it requires manual API monitoring.

| Service | Usage Method | Location | Status |
| :--- | :--- | :--- | :--- |
| **Stripe** | `fetch` (REST API) | `src/backend/stripeInternal.js` | **Verified Safe.** Uses `crypto` for signature verification. |
| **OpenAI** | `fetch` (REST API) | `src/backend/aiRouterService.jsw` | **Verified.** No SDK dependency. |
| **Anthropic** | `fetch` (REST API) | `src/backend/aiRouterService.jsw` | **Verified.** No SDK dependency. |
| **Twilio** | `fetch` (REST API) | `src/backend/smsCampaignService.jsw` | **Verified.** No SDK dependency. |
| **Groq** | `fetch` (REST API) | `src/backend/aiRouterService.jsw` | **Verified.** No SDK dependency. |
| **Perplexity** | `fetch` (REST API) | `src/backend/aiRouterService.jsw` | **Verified.** No SDK dependency. |
| **Gemini** | `fetch` (REST API) | `src/backend/aiRouterService.jsw` | **Verified.** No SDK dependency. |

**Observation:** `package.json` is clean of these SDKs. This approach is secure but shifts the burden of API version management to the code maintenance team.

---

## 4. Private Package Configuration Gap

The project relies on private packages within the `@marketpushapps` scope:
- `@marketpushapps/calendly-embed-backend`
- `@marketpushapps/airtable-connector`
- `@marketpushapps/airtable-connector-backend`
- `@marketpushapps/calendly-embed`

**Finding:**
- **CRITICAL:** No `.npmrc` file exists in the repository root.
- **Consequence:** `npm install` and `npm audit` fail to authenticate with the private registry, resulting in 404 errors and incomplete vulnerability scans for these packages.
- **Risk:** High. We have zero visibility into vulnerabilities within `@marketpushapps/*` dependencies.

---

## 5. Remediation Plan

### Immediate Actions (Must Do)
1. **Fix Lockfile Integrity:**
   ```bash
   rm package-lock.json
   # Ensure .npmrc is configured first (see below)
   npm install
   ```
2. **Configure Private Registry:**
   - Create `.npmrc` with the appropriate registry URL and token configuration for `@marketpushapps` scope.
3. **Audit Private Packages:**
   - Once `.npmrc` is fixed, re-run `npm audit` to scan `@marketpushapps` dependencies.

### Secondary Actions (Should Do)
1. **Update Dev Dependencies:**
   - Run `npm update @wix/cli @wix/cli-app` to attempt to pull in patched versions of `rollup` and `tar`.
   - If that fails, `npm audit fix` may be used cautiously, verifying it doesn't break the Velo build process.

### Strategic Actions (Could Do)
1. **Formalize API Clients:**
   - Consider creating a dedicated internal module (e.g., `src/backend/http-clients/`) to centralize all direct `fetch` calls for external services, ensuring consistent timeout and error handling logic.

---

**Verdict:** **FAIL**. The project cannot be considered secure until the `uuid` version mismatch is resolved and the private package blind spot is addressed via `.npmrc`.
