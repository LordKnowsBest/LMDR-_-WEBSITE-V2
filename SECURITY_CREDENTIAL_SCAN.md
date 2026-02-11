# Security Credential Scan Report

**Date:** 2024-12-20
**Scan Scope:** All `.js`, `.jsw`, `.json` files in `src/` and root configuration files.
**Auditor:** Jules (AI Security Auditor)

## Summary

A comprehensive scan was performed to identify hardcoded secrets, API keys, tokens, and passwords in the codebase. The scan included pattern matching for known key formats (e.g., `sk_`, `pk_`, `Bearer`, `pat...`) and assignment patterns.

**Status:** ⚠️ **Found 1 Critical Issue**

---

## Findings

### 1. Critical: Hardcoded Secrets in `.mcp.json`

**File:** `.mcp.json`
**Severity:** **CRITICAL**
**Description:** The file contains actual API keys and authorization tokens for external services (Airtable, Notion) in plain text. This file is currently **NOT** ignored by git, posing a significant risk of accidental exposure if committed.

**Evidence:**
```json
"airtable": {
  "env": {
    "AIRTABLE_API_KEY": "pat..." // Actual key exposed
  }
},
"notionApi": {
  "env": {
    "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_...\"}" // Actual token exposed
  }
}
```

**Recommendation:**
1.  **IMMEDIATE:** Add `.mcp.json` to `.gitignore`.
2.  **REMEDIATION:** Rotate the exposed keys immediately if this file has ever been pushed to a remote repository.
3.  **BEST PRACTICE:** Use environment variables or a secure secret management solution for local development tools.

---

## Safe Files (Verified)

The following areas were scanned and found to be **CLEAN**:

-   **`src/backend/`**: All backend services use `wix-secrets-backend` to retrieve credentials safely.
    -   `stripeService.jsw`: Uses `getSecret('SECRET_KEY_STRIPE')`, etc.
    -   `apiAuthService.jsw`: Uses `getSecret('API_KEY_PEPPER')`.
    -   `aiRouterService.jsw`: Uses `getSecret()` for all AI provider keys.
    -   `fmcsaService.jsw`: Uses `getSecret('FMCSA_WEB_KEY')`.
    -   `dataAccess.jsw`: No hardcoded secrets found.

-   **`src/public/`**: No hardcoded secrets found in client-side code.

-   **`src/backend/tests/`**: Contains only variable names referencing secrets (e.g., `'AIRTABLE_PAT'`), not the values themselves.

-   **`src/public/__tests__/`**: Contains **mock** credentials (e.g., `'sk_test_mock_key'`, `'pk_test_abc123'`), which is expected and safe for testing.

---

## Conclusion

The production codebase in `src/` demonstrates good security hygiene with consistent use of `wix-secrets-backend`. The only vulnerability identified is the local configuration file `.mcp.json`, which must be secured immediately.
