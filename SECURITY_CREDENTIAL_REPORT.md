# Credential Hygiene & Secrets Audit Report

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Auditor)
**Status:** PASS

## 1. Executive Summary

A comprehensive scan of the LMDR codebase was conducted to identify and remediate hardcoded secrets, API keys, and credentials.

**Result:** The audit identified **2 critical findings** in a local configuration file (`.mcp.json`). These have been successfully remediated. The production codebase (`src/backend`, `src/public`) was found to be clean of exposed credentials.

## 2. Methodology

The audit utilized a custom detection script (`verify_secrets.js`) combined with manual review to scan for:
- **Patterns:** `sk_live_`, `pk_live_`, `pat...`, `ntn_...`, `Bearer`, `api_key`, `token`, `password`.
- **Files:** All `.js`, `.jsw`, `.json`, `.html` files in `src/` and root configuration files.
- **Context:** Differentiating between actual secrets, test mocks, and variable names.

## 3. Findings & Remediation

### 3.1 Critical Findings (Remediated)

| Severity | File | Finding | Remediation |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | `.mcp.json` | Hardcoded Airtable Personal Access Token (PAT) | Replaced with placeholder `YOUR_AIRTABLE_API_KEY_HERE` |
| **CRITICAL** | `.mcp.json` | Hardcoded Notion Integration Token | Replaced with placeholder `YOUR_NOTION_TOKEN_HERE` |

**Root Cause:** The `.mcp.json` file, used for Model Context Protocol server configuration, contained actual credentials in the `env` block.

**Fix:**
```json
// Before
"AIRTABLE_API_KEY": "pat..."
"OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_...\"}"

// After
"AIRTABLE_API_KEY": "YOUR_AIRTABLE_API_KEY_HERE"
"OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer YOUR_NOTION_TOKEN_HERE\"...}"
```

### 3.2 False Positives & Verified Safe Patterns

The following patterns were flagged during the initial scan but verified as safe:

*   **`src/backend/fmcsaService.jsw`**: Uses `getSecret('FMCSA_WEB_KEY')` correctly.
*   **`src/backend/aiRouterService.jsw`**: Uses `getSecret` for all AI provider keys (Anthropic, OpenAI, etc.).
*   **`src/public/driver/DRIVER_DOCUMENT_UPLOAD.html`**: Contains `uploadToken: 'test-token-abc'` inside a conditional block explicitly for standalone testing (`if (window.parent === window)`).
*   **`src/backend/apiWebhookService.jsw`**: Regex matched substrings in function names (e.g., `dispatch` -> `patch` match). Verified as false positives.

## 4. Verification

A final run of the `verify_secrets.js` script confirms **0 exposed secrets** in the codebase.

```bash
$ node verify_secrets.js
Starting secret scan...
PASS: No secrets found.
```

## 5. Recommendations

1.  **Environment Variables:** Ensure `.mcp.json` is added to `.gitignore` or that developers are instructed to use a local-only `.mcp.local.json` if supported.
2.  **Secret Management:** Continue enforcing the use of `wix-secrets-backend` for all backend services.
3.  **Pre-commit Hooks:** Consider adding a pre-commit hook that runs a secret scan to prevent future regressions.
