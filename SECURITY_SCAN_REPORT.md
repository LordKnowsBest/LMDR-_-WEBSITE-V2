# Security Scan Report: Hardcoded Secrets

**Date:** June 14, 2024
**Auditor:** Jules (AI Security Auditor)
**Target Scope:** `src/`, `.mcp.json`, project root config files.

## Executive Summary
The codebase is largely secure and follows best practices for credential management, with **one critical exception** found in a local configuration file (`.mcp.json`). Aside from this file, all backend services correctly utilize `wix-secrets-backend` to retrieve API keys at runtime, and no hardcoded secrets were found in production source code (`src/backend/`, `src/public/`).

## Critical Findings

### 1. Hardcoded Secrets in `.mcp.json`
**Severity:** CRITICAL
**File:** `.mcp.json`
**Location:** Root Directory

**Description:**
The `.mcp.json` file contains plaintext credentials for Airtable and Notion integrations. This file is **not** listed in `.gitignore`, meaning these credentials are exposed to version control.

**Evidence:**
-   **Line 20:** `AIRTABLE_API_KEY: "[REDACTED]"` (Airtable Personal Access Token)
-   **Line 26:** `Authorization: "Bearer [REDACTED]"` (Notion Integration Token)

**Remediation Required:**
1.  **Immediate Rotation:** Revoke the exposed Airtable PAT and Notion token immediately as they are compromised.
2.  **Ignore File:** Add `.mcp.json` to `.gitignore` to prevent future commits.
3.  **Use Secrets Manager:** Refactor any local tooling to read these values from environment variables or a secure vault, rather than a committed JSON file.

## Safe Findings (False Positives / Expected)

### 1. Mock Secrets in Tests
**Severity:** INFO (Safe)
**Files:**
-   `tests/public/documentCollectionService.test.js`
-   `src/public/__tests__/__mocks__/wix-secrets-backend.js`

**Description:**
Test files contain mock tokens (e.g., `tok_valid_token_123`, `mock_claude_key`) used for unit testing. These are not real credentials and are safe to remain in the codebase.

### 2. Secret Name References
**Severity:** INFO (Safe)
**Files:** Various backend services (e.g., `src/backend/aiRouterService.jsw`, `src/backend/stripeService.jsw`)

**Description:**
The codebase frequently references secret *names* (e.g., `'CLAUDE_API_KEY'`, `'STRIPE_WEBHOOK_SECRET'`) as string literals. This is the correct pattern for using `wix-secrets-backend`.

## Verification Status
-   **`src/backend/`**: ✅ CLEAN. No hardcoded secrets found. All API keys are retrieved via `getSecret()`.
-   **`src/public/`**: ✅ CLEAN. No hardcoded secrets found.
-   **`config files`**: ⚠️ WARNING. `.mcp.json` contains secrets. `wix.config.json` and `jest.config.js` are clean.

## Conclusion
The project has a strong security posture regarding secret management in production code. However, the presence of `.mcp.json` with valid credentials in the repository root is a significant vulnerability that requires immediate attention.
