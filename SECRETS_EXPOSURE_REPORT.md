# Secrets & Credential Exposure Scan Report

**Date:** 2026-10-18
**Status:** PASS
**Critical Findings:** 0
**Warnings:** 0
**False Positives Reviewed:** 53

## Overview

A comprehensive credential hygiene scan was performed across the LMDR codebase. The objective was to identify any hardcoded API keys, tokens, passwords, or secrets embedded in source code (`.js`, `.jsw`, `.json`) under `src/` and root configurations that should instead be managed via `wix-secrets-backend`.

The scan evaluated the codebase using heuristic patterns for known API key formats (Stripe `sk_live_`, `pk_live_`, Airtable PATs, Bearer tokens, etc.) and generic assignment patterns (e.g., `apiKey = "..."`).

## Conclusion

**The codebase PASSES the secrets exposure check.**

Zero hardcoded secrets were found in production code. All 53 flagged instances have been manually reviewed and verified as safe false positives (mock values in tests, placeholder text, or secret keys passed to `getSecret()`).

## Findings Analysis

The scanner identified 53 potential matches. A detailed review confirmed they fall into the following safe categories:

### 1. Secret Names Passed to `getSecret()` (Safe)
Many backend modules define a configuration object that stores the **name** of the secret to be fetched from Wix Secrets Manager, not the secret itself.

**Examples:**
* `src/backend/socialScanner.jsw:12` -> `perplexitySecret: 'PERPLEXITY_API_KEY'`
* `src/backend/b2bResearchAgentService.jsw:43` -> `claudeSecret: 'CLAUDE_API_KEY'`
* `src/backend/b2bContentAIService.jsw:48` -> `claudeSecret: 'CLAUDE_API_KEY'`
* `src/backend/ocrService.jsw:36` -> `geminiSecret: 'GEMINI_API_KEY'`
* `src/backend/aiEnrichment.jsw:22` -> `claudeSecret: 'CLAUDE_API_KEY'`
* `src/backend/aiEnrichment.jsw:27` -> `geminiSecret: 'GEMINI_API_KEY'`
* `src/backend/aiEnrichment.jsw:33` -> `perplexitySecret: 'PERPLEXITY_API_KEY'`

### 2. API Documentation / Placeholders (Safe)
Placeholders used in documentation or generic code examples.

**Examples:**
* `.mcp.json:26` -> `"Authorization": "Bearer YOUR_NOTION_TOKEN_HERE"` (Remediated previously)
* `src/backend/apiPortalService.jsw:84,89,96` -> `Bearer lmdr_live_xxx`
* `src/backend/apiAuthService.jsw:63` -> `Missing Bearer token` (Error message text)
* `src/public/driver/js/document-upload-logic.js:245` -> `uploadToken: 'test-token-abc'`

### 3. Test Mocks and Fixtures (Safe)
Values found in the `src/public/__tests__/` directory used explicitly for unit testing. These are intentionally hardcoded mock values.

**Examples:**
* `src/public/__tests__/apiAuthService.test.js` -> `Bearer abc123`, `Bearer not_a_real_key`
* `src/public/__tests__/externalApiPlatformPhase8Flows.test.js` -> `apiKey: 'lmdr_live_x'`
* `src/public/__tests__/apiWebhookService.test.js` -> `webhook_secret: 'whsec_test'`
* `src/public/__tests__/socialPostingService.test.js` -> Mock access and refresh tokens (`fb-token-xyz`, `old-refresh-token`, etc.)
* `src/public/__tests__/apiGateway.external.test.js` -> `Bearer test_key`, `whsec_test`
* `src/public/__tests__/checkout.html.test.js` -> Multiple instances of `pk_test_abc123`
* `src/public/__tests__/jobBoardService.test.js` -> `apiKey: 'test-key'`
* `src/public/__tests__/checkout.bridge.test.js` -> Multiple instances of `pk_test_abc123`
* `src/public/__tests__/socialTokenService.test.js` -> `access_token: 'long-lived-token'`
* `src/public/__tests__/stripeWebhookCommission.test.js` -> `whsec_test_1234567890abcdef`
* `src/public/__tests__/__mocks__/wix-secrets-backend.js` -> `STRIPE_SECRET_KEY: 'sk_test_mock_key'`

## Recommendations & Remediation

*   **Status:** No immediate code changes are required for secrets management in the `src/` directory.
*   **`.gitignore` Gap Identified:** The `.mcp.json` file, which previously contained real secrets (since remediated to placeholders), was missing from `.gitignore`.
    *   **Action Taken:** `.mcp.json` has been added to `.gitignore` to prevent developers from accidentally committing local configuration containing real MCP API keys in the future.
