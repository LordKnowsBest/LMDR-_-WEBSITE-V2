# Security Audit: Secrets & Credential Exposure

**Date:** 2026-03-03
**Status:** ⚠️ FAIL (Critical Findings)
**Auditor:** Jules (AI Security Agent)

## 1. Executive Summary

A comprehensive scan of the LMDR codebase was performed to identify hardcoded API keys, tokens, passwords, and other sensitive credentials. The audit covered all `.js`, `.jsw`, and `.json` files in `src/`, as well as configuration files in the root directory.

**Result:** The codebase is largely clean of hardcoded secrets in source files, with backend services correctly utilizing `wix-secrets-backend`. However, a **critical vulnerability** was identified in the `.mcp.json` configuration file, which contains active, plaintext API keys and is not excluded from version control.

## 2. Findings

### 🚨 Critical: Hardcoded Secrets in Configuration File

**File:** `.mcp.json`
**Status:** **EXPOSED**
**Details:**
This file contains plaintext credentials for external services (Airtable and Notion). It is currently tracked in git (absent from `.gitignore`).

- **Line 16:** `AIRTABLE_API_KEY`: `pata0...[REDACTED]` (Full PAT exposed)
- **Line 22:** `Authorization`: `Bearer ntn_288883...[REDACTED]` (Notion Integration Token exposed)

**Risk:** High. Anyone with access to the repository (or if the repo is public/leaked) can immediately access and modify the connected Airtable base and Notion workspace.

**Recommendation:**
1.  **Revoke** the exposed Airtable PAT and Notion token immediately.
2.  **Add** `.mcp.json` to `.gitignore`.
3.  **Replace** real values in `.mcp.json` with placeholders (e.g., `YOUR_AIRTABLE_API_KEY_HERE`) if the file must be kept as a template.
4.  **Use** environment variables or a secure vault for local development secrets.

---

### ✅ PASSED: Backend Service Configuration

**Files Scanned:** `src/backend/**/*.jsw`, `src/backend/**/*.js`
**Status:** Clean

The backend services follow secure practices by retrieving sensitive values from Wix Secrets Manager.

-   **`src/backend/apiAuthService.jsw`**: correctly uses `getSecret('API_KEY_PEPPER')` for hashing.
-   **`src/backend/stripeService.jsw`**: correctly retrieves Stripe keys via `getStripeSecrets()` which calls `getSecret`.
-   **`src/backend/aiRouterService.jsw`**: correctly retrieves provider keys (OpenAI, Claude, etc.) using `getSecret(provider.secretKey)`.
-   **`src/backend/parkingService.jsw`**: correctly retrieves TPIMS API keys using `getSecret`.
-   **`src/backend/b2bResearchAgentService.jsw`**: correctly uses `getSecret`.

### ✅ PASSED: Configuration Files

**Files Scanned:**
-   `src/backend/configData.js`
-   `src/backend/config.jsw`
-   `src/public/lmdr-config.js`
-   `lmdr-branding-skill.json`

**Status:** Clean
These files contain configuration logic, data source mappings, and design tokens but **no** hardcoded secrets.

### ℹ️ Note: False Positives & Test Data

The scan identified several "potential" secrets which were verified as safe:

-   **Test Files (`src/public/__tests__/`)**: Files like `checkout.html.test.js` contain mock keys (e.g., `pk_test_abc123`) or mock implementations. These are safe.
-   **Variable Names**: Occurrences of `webhook_secret` or `api_key` in `src/backend/apiPortalService.jsw` and `src/backend/apiGateway.jsw` refer to property names or variable assignments from input/database, not hardcoded values.
-   **Log Messages**: Warnings about missing secrets (e.g., in `state511.js`) do not expose the secrets themselves.

## 3. Conclusion

The LMDR codebase demonstrates a strong adherence to security best practices regarding credential management in its source code. The usage of `wix-secrets-backend` is consistent and correct.

The **only** remediation required is to secure the `.mcp.json` file and revoke the exposed credentials.

**Action Required:**
- [ ] Revoke Airtable PAT `pata0...`
- [ ] Revoke Notion Token `ntn_...`
- [ ] Add `.mcp.json` to `.gitignore`
- [ ] Sanitize `.mcp.json` in the repo
