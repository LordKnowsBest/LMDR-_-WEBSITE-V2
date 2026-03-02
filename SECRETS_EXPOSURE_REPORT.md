# Secrets & Credential Exposure Report

**Date**: 2026-10-18
**Auditor**: LMDR Security Automation
**Status**: **PASS**

## Executive Summary
A comprehensive security scan was performed across the `src/` directory and root configuration files (`.mcp.json`, `wix.config.json`, `lmdr-branding-skill.json`) to detect hardcoded API keys, tokens, and credentials.

The scan identified **53 potential matches**, but after manual verification, **0 actual secrets were exposed in production code**. All findings were verified as false positives consisting of:
- Test tokens in mock files
- Documentation examples
- Placeholder values in local configuration
- Variable names holding the string *name* of a secret (which is then securely fetched via `getSecret()`)

## Scope of Audit
- Files scanned: `.js`, `.jsw`, `.json`, `.html` in `src/` and root configurations
- Patterns targeted:
  - Stripe Keys (`sk_live_`, `pk_live_`, `sk_test_`, `pk_test_`)
  - Airtable PATs and Legacy Keys
  - Bearer Tokens
  - Notion/Slack Tokens
  - Generic string assignments resembling high-entropy secrets (e.g., `apiKey: "..."`)

## Detailed Findings Analysis

### 1. Placeholder Values in Local Config
**Severity:** None (False Positive)
- **File:** `.mcp.json` (Line 26)
  - **Match:** `Bearer YOUR_NOTION_TOKEN_HERE`
  - **Context:** `"OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer YOUR_NOTION_TOKEN_HERE\", \"Notion-Version\": \"2022-06-28\"}"`
  - **Fix:** Confirmed as a placeholder. No change needed.
  - **Remediation Action Taken:** Added `.mcp.json` to `.gitignore` to prevent any future actual credentials from being committed.

### 2. Error Message String Literals
**Severity:** None (False Positive)
- **File:** `src/backend/apiAuthService.jsw` (Line 63)
  - **Match:** `Bearer token`
  - **Context:** `return { success: false, errorCode: 'invalid_api_key', message: 'Missing Bearer token' };`
  - **Fix:** Standard error messaging. Not a secret.

### 3. API Documentation Examples
**Severity:** None (False Positive)
- **File:** `src/backend/apiPortalService.jsw` (Lines 84, 89, 96)
  - **Match:** `Bearer lmdr_live_xxx`
  - **Context:** Example cURL and fetch requests in documentation strings.
  - **Fix:** Safe placeholder.

### 4. Secret Names Passed to `getSecret()`
**Severity:** None (False Positive)
- **Files:**
  - `src/backend/socialScanner.jsw` (Line 12): `groqSecret: 'GROQ_API_KEY'`
  - `src/backend/b2bResearchAgentService.jsw` (Line 43): `claudeSecret: 'CLAUDE_API_KEY'`
  - `src/backend/b2bContentAIService.jsw` (Line 48): `claudeSecret: 'CLAUDE_API_KEY'`
  - `src/backend/ocrService.jsw` (Line 36): `geminiSecret: 'GEMINI_API_KEY'`
  - `src/backend/aiEnrichment.jsw` (Lines 16, 22, 27): `GROQ_API_KEY`, `CLAUDE_API_KEY`, `GEMINI_API_KEY`
- **Fix:** These are the *names* of the secrets stored in Wix Secrets Manager, not the secrets themselves. They are securely passed to `getSecret(secretName)` at runtime. No action required.

### 5. Frontend Test Data / Standalone Mode
**Severity:** None (False Positive)
- **File:** `src/public/driver/js/document-upload-logic.js` (Line 245)
  - **Match:** `uploadToken: 'test-token-abc'`
  - **Context:** Hardcoded test data used when the iframe is run in standalone mode (`window.parent === window`).
  - **Fix:** Verified as dummy test data.

### 6. Test Suite Mocks (`src/public/__tests__/`)
**Severity:** None (False Positive)
- **Files:**
  - `apiAuthService.test.js`: `Bearer abc123`, `Bearer not_a_real_key`
  - `externalApiPlatformPhase8Flows.test.js`: `apiKey: 'lmdr_live_x'`
  - `apiWebhookService.test.js`: `webhook_secret: 'whsec_test'`
  - `socialPostingService.test.js`: Various mock access/refresh tokens (`new-token`, `expired-token`, `fb-token-xyz`)
  - `apiGateway.external.test.js`: `Bearer test_key`, `whsec_test`
  - `checkout.html.test.js` & `checkout.bridge.test.js`: `pk_test_abc123`
  - `jobBoardService.test.js`: `api_key: 'test-key'`
  - `socialTokenService.test.js`: `access_token: 'long-lived-token'`
  - `stripeWebhookCommission.test.js`: `whsec_test_1234567890abcdef`
  - `__mocks__/wix-secrets-backend.js`: `STRIPE_SECRET_KEY: 'sk_test_mock_key'`
- **Fix:** All instances are isolated within the `__tests__` directory and represent mock data for unit tests. No action required.

## Recommendations & Remediation
1. **Secrets Management:** The codebase correctly utilizes `wix-secrets-backend` (`getSecret()`) for all external API integrations (Stripe, AI providers, internal keys). This pattern should be maintained for any new integrations.
2. **Gitignore Gap Closed:** Identified that `.mcp.json` was omitted from `.gitignore`. This file has now been explicitly added to prevent accidental exposure of local development credentials.

## Conclusion
The codebase is currently free of hardcoded secrets in production files. The security architecture relying on Wix Secrets Manager is intact and properly implemented.
