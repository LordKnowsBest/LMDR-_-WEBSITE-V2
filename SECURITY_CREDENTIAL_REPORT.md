# Secrets & Credential Exposure Scan Report

**Scan Date:** 2024-05-23
**Auditor:** Jules

## Executive Summary
A comprehensive scan of the LMDR codebase was performed to identify hardcoded secrets, API keys, and credentials. The scan covered `src/backend`, `src/public`, and root configuration files.

## Findings

### 1. Critical Exposures (High Severity)
Two hardcoded secrets were identified in the `.mcp.json` file. This file appears to be a configuration for the Model Context Protocol (MCP) server.

| File Path | Line | Pattern Matched | Finding | Remediation |
| :--- | :--- | :--- | :--- | :--- |
| `.mcp.json` | 19 | `pat...` | `AIRTABLE_API_KEY` exposed as raw string. | Replace with environment variable or `wix-secrets-backend`. |
| `.mcp.json` | 26 | `Bearer ...` | Notion `Authorization` Bearer token exposed. | Replace with environment variable or `wix-secrets-backend`. |

**Recommendation:** Immediately rotate these keys as they have been exposed in the codebase.

### 2. Configuration Gaps (Medium Severity)
The `.mcp.json` file containing sensitive credentials was not excluded from version control.

| File Path | Issue | Remediation |
| :--- | :--- | :--- |
| `.gitignore` | Missing `.mcp.json` entry | Add `.mcp.json` to `.gitignore` to prevent future commits. |

### 3. Cleanliness Confirmation (Pass)
The following directories were scanned and found to be free of hardcoded secrets:
- `src/backend/`: Consistently uses `wix-secrets-backend.getSecret()` for sensitive values (Stripe, OpenAI, Anthropic, etc.).
- `src/public/`: No exposed private keys found. Public keys (e.g., Stripe publishable key) are acceptable in frontend code but are handled via backend proxies in this architecture.

## Remediation Plan
1.  **Sanitize**: The `.mcp.json` file will be sanitized in this PR to remove the exposed secrets.
2.  **Ignore**: The `.mcp.json` file will be added to `.gitignore`.
3.  **Rotate**: The project maintainers must rotate the exposed Airtable and Notion keys immediately upon merging this report.

## Conclusion
The codebase is generally secure with consistent use of `wix-secrets-backend`. The only exception is the local development configuration file `.mcp.json`, which must be secured.
