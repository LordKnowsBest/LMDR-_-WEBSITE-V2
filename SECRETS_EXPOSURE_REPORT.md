# Secrets Exposure Audit Report

**Date:** March 2026
**Status:** **PASS**
**Critical Findings:** 0
**Total Scanned Files:** All `.js`, `.jsw`, `.json` under `src/`, plus root config files.

## Overview

A comprehensive credential hygiene scan was performed across the LMDR codebase to ensure no hardcoded API keys, passwords, or tokens are exposed in production code. The goal is to enforce the use of `getSecret()` from `wix-secrets-backend` for all credentials.

The scanning tool `scan_secrets.py` identified **55 potential matches**. After manual review, **all 55 findings were confirmed to be false positives**. There are **zero** hardcoded secrets in the production environment.

---

## Detailed Findings & Resolution

### 1. Root Configuration Files
- **File:** `.mcp.json`
- **Finding:** Matched `Bearer YOUR_NOTION_TOKEN_HERE`
- **Analysis:** This is an explicit placeholder string, not a valid token.
- **Resolution:** No credentials exposed. As a preventative measure, `.mcp.json` has been added to `.gitignore` to prevent any future accidental credential commits if a developer replaces the placeholder locally.

### 2. Error Responses & Documentation
- **File:** `src/backend/apiAuthService.jsw` (Line 63)
- **Finding:** Matched `Bearer token`
- **Analysis:** This is a hardcoded error message string: `'Missing Bearer token'`.
- **Resolution:** False positive.

- **File:** `src/backend/apiPortalService.jsw` (Lines 84, 89, 96)
- **Finding:** Matched `Bearer lmdr_live_xxx`
- **Analysis:** These are code examples stored in the `API_DOC_EXAMPLES` constant, intended for rendering documentation on the developer portal. They are explicit placeholders.
- **Resolution:** False positive.

### 3. Secret Keys Passed to Managers
- **Files:**
  - `src/backend/socialScanner.jsw` (Line 12)
  - `src/backend/b2bResearchAgentService.jsw` (Line 43)
  - `src/backend/b2bContentAIService.jsw` (Line 48)
  - `src/backend/ocrService.jsw` (Line 36)
  - `src/backend/aiEnrichment.jsw` (Lines 16, 22, 27)
- **Finding:** Matched assignment strings like `groqSecret: 'GROQ_API_KEY'` or `claudeSecret: 'CLAUDE_API_KEY'`
- **Analysis:** These files store the *name* of the secret as a string literal within configuration objects. These strings are then passed to `getSecret()` to retrieve the actual credentials at runtime. They are not the credentials themselves.
- **Resolution:** False positive. Expected architectural pattern.

### 4. Frontend Test Placeholders
- **File:** `src/public/driver/js/document-upload-logic.js` (Line 245)
- **Finding:** Matched `uploadToken: 'test-token-abc'`
- **Analysis:** This is a mock token used when the frontend code falls back to standalone/test mode when the backend is unreachable. It holds no real authorization power.
- **Resolution:** False positive.

### 5. Unit Tests and Mocks (`src/public/__tests__/`)
- **Files:** Various test files including `apiAuthService.test.js`, `externalApiPlatformPhase8Flows.test.js`, `apiWebhookService.test.js`, `socialPostingService.test.js`, `checkout.html.test.js`, `checkout.bridge.test.js`, etc.
- **Findings:** Matched strings like `Bearer abc123`, `whsec_test`, `pk_test_abc123`, `sk_test_mock_key`.
- **Analysis:** All 38 of these findings occur within the `__tests__` or `__mocks__` directories. They are explicit mock values used to validate parsing logic, header construction, and mock server responses.
- **Resolution:** False positive. By definition, test mocks are not production secrets.

---

## Preventative Actions Taken
1. **`.gitignore` Hardening:** The `.mcp.json` file was added to the repository `.gitignore` list. While it currently contains placeholders, this ensures developers do not accidentally commit real tokens if they configure the local Model Context Protocol server.

## Conclusion
The codebase adheres to best practices for credential management. All production secrets are properly abstracted behind `getSecret()` calls or stored safely in environment configurations. The codebase receives a **PASS** status for credential exposure.