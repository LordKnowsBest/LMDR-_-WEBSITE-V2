# Dependency Security & Supply Chain Audit Report (V4)

**Date:** 2026-10-18
**Auditor:** Supply Chain Security Analyst (Jules)
**Status:** **FAIL**

## 1. Executive Summary

The dependency health of the LMDR project is currently **compromised**. While the production runtime appears relatively clean of direct high-severity vulnerability exploits (due to custom implementations of sensitive integrations), the supply chain infrastructure is broken.

**Key Failures:**
1.  **Critical Integrity Failure:** `package-lock.json` contains a suspicious version for `uuid` (`13.0.0`) while `package.json` requests `^9.0.1`.
2.  **Broken Environment:** `npm install` and `npm audit fix` fail due to missing credentials for private `@marketpushapps` packages, preventing security patching.
3.  **High Severity Vulnerabilities:** 31 High severity vulnerabilities detected in the `devDependencies` tree (affecting `@wix/cli`).

## 2. Vulnerability Summary

| Severity | Count | Primary Culprits |
| :--- | :--- | :--- |
| **Critical** | 0 | - |
| **High** | 31 | `tar` (Arbitrary File Overwrite), `node-gyp`, `minimatch` (ReDoS), `rimraf` |
| **Moderate** | 5 | `undici` (DoS), `vite` (Auth Bypass) |
| **Low** | 0 | - |
| **Total** | **36** | |

## 3. Critical Findings & Analysis

### 3.1. `uuid` Version Mismatch (CRITICAL)
*   **Observation:** `package.json` specifies `uuid: "^9.0.1"`. However, `package-lock.json` locks it to `13.0.0`.
*   **Risk:** `uuid` v13.0.0 is an anomaly (standard versioning is currently v9/v10). While `npm view` confirms v13.0.0 exists on the registry, such a massive version jump without `package.json` alignment indicates a corrupted lockfile or a potential supply chain injection attempt.
*   **Remediation:** **Immediate Action Required.**
    ```bash
    npm uninstall uuid
    npm install uuid@9.0.1 --save-exact
    ```

### 3.2. Broken Supply Chain (CRITICAL)
*   **Observation:** `npm install` fails with `404 Not Found` / `Unauthorized` for `@marketpushapps/*` packages.
*   **Risk:** Security patches cannot be applied. `package-lock.json` cannot be regenerated to fix inconsistencies. The project is effectively frozen in an insecure state.
*   **Remediation:** Obtain valid `.npmrc` credentials for `@marketpushapps` scope or replace these private dependencies with mock implementations for local development.

### 3.3. DevDependency Vulnerabilities (HIGH)
*   **Observation:** `@wix/cli` depends on outdated versions of `tar` and `node-gyp` which contain high-severity vulnerabilities (Arbitrary File Creation/Overwrite).
*   **Risk:** Malicious packages or build scripts could exploit these to overwrite system files during `npm install` or build processes on developer machines/CI servers.
*   **Remediation:** Update `@wix/cli` to the latest version or use `overrides` in `package.json` to force patched versions of `tar` (>=7.5.8).

## 4. Target Specific Analysis

| Target | Status | Notes |
| :--- | :--- | :--- |
| **Stripe SDK** | **CLEAN** | Not installed. Implemented via custom `fetch` wrapper in `stripeService.jsw`. |
| **OpenAI / AI Clients** | **CLEAN** | Not installed. Implemented via custom `fetch` to REST endpoints. |
| **Twilio OTP** | **CLEAN** | `@velo/wix-members-twilio-otp` is confirmed removed from codebase. |
| **Phantom Dependencies** | **PASS** | No imports detected for undeclared packages in `src/`. |

## 5. Remediation Plan

### Step 1: Fix `uuid` (High Priority)
Run the following to align the manifest and lockfile:
```bash
npm install uuid@9.0.1 --save-exact --ignore-scripts
```
*(Note: This requires fixing the private registry auth first, or temporarily removing private packages to fix the public ones.)*

### Step 2: Restore Registry Access
Configure `.npmrc` with a valid token for `@marketpushapps`:
```ini
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
@marketpushapps:registry=https://registry.npmjs.org/
```

### Step 3: Patch Dev Dependencies
Add overrides to `package.json` to force secure versions of transitive dependencies:
```json
"overrides": {
  "tar": "^7.5.8",
  "minimatch": "^10.0.0"
}
```

### Step 4: Verify
Run `npm audit` again to confirm zero high-severity vulnerabilities.
