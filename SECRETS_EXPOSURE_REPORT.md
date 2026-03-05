# Secrets & Credential Exposure Scan Report

**Status:** PASS
**Findings:** 55 potential secrets found, 0 actual hardcoded credentials in production code. All findings have been verified as false positives (placeholders, documentation, test tokens, or secret names to be used with `getSecret`).

---

## Scan Methodology
The codebase was scanned using the `scan_secrets.py` tool for common credential patterns:
- Stripe Live and Test Keys (`sk_live_...`, `pk_live_...`, `sk_test_...`, `pk_test_...`)
- Airtable Legacy Keys and PATs
- Bearer Tokens
- Notion Tokens
- Slack Tokens
- Generic API Key/Secret Variable Assignments

The scan covered all `.js`, `.jsw`, and `.json` files under `src/`, as well as configuration files at the root (`.mcp.json`, `wix.config.json`, `lmdr-branding-skill.json`).

---

## Detailed Findings

Below is the list of all flagged items, categorized by file, line number, pattern matched, severity, and the reasoning why they are not exposed secrets.

### Configuration / Root Files
- **File:** `.mcp.json`
  - **Line:** 26
  - **Match:** `Bearer YOUR_NOTION_TOKEN_HERE`
  - **Severity:** Informational
  - **Reason:** This is a placeholder value.

### Backend (`src/backend/`)
- **File:** `src/backend/apiAuthService.jsw`
  - **Line:** 63
  - **Match:** `Bearer token`
  - **Severity:** Informational
  - **Reason:** Error message string: `return { success: false, errorCode: 'invalid_api_key', message: 'Missing Bearer token' };`

- **File:** `src/backend/apiPortalService.jsw`
  - **Lines:** 84, 89, 96
  - **Match:** `Bearer lmdr_live_xxx`
  - **Severity:** Informational
  - **Reason:** Example/documentation payload string.

- **File:** `src/backend/socialScanner.jsw`
  - **Line:** 12
  - **Match:** `Secret` (Context: `groqSecret: 'GROQ_API_KEY'`)
  - **Severity:** Informational
  - **Reason:** Variable holding the *name* of the secret to fetch via `getSecret()`.

- **File:** `src/backend/b2bResearchAgentService.jsw`
  - **Line:** 43
  - **Match:** `Secret` (Context: `claudeSecret: 'CLAUDE_API_KEY'`)
  - **Severity:** Informational
  - **Reason:** Variable holding the *name* of the secret to fetch via `getSecret()`.

- **File:** `src/backend/b2bContentAIService.jsw`
  - **Line:** 48
  - **Match:** `Secret` (Context: `claudeSecret: 'CLAUDE_API_KEY'`)
  - **Severity:** Informational
  - **Reason:** Variable holding the *name* of the secret to fetch via `getSecret()`.

- **File:** `src/backend/ocrService.jsw`
  - **Line:** 36
  - **Match:** `Secret` (Context: `geminiSecret: 'GEMINI_API_KEY'`)
  - **Severity:** Informational
  - **Reason:** Variable holding the *name* of the secret to fetch via `getSecret()`.

- **File:** `src/backend/aiEnrichment.jsw`
  - **Lines:** 16, 22, 27
  - **Match:** `Secret` (Context: `groqSecret: 'GROQ_API_KEY'`, `claudeSecret: 'CLAUDE_API_KEY'`, `geminiSecret: 'GEMINI_API_KEY'`)
  - **Severity:** Informational
  - **Reason:** Variables holding the *name* of the secret to fetch via `getSecret()`.

### Frontend (`src/public/`)
- **File:** `src/public/driver/js/document-upload-logic.js`
  - **Line:** 245
  - **Match:** `Token` (Context: `uploadToken: 'test-token-abc'`)
  - **Severity:** Informational
  - **Reason:** Hardcoded test token for standalone mode.

### Tests (`src/public/__tests__/`)
- **File:** `src/public/__tests__/apiAuthService.test.js`
  - **Lines:** 22, 74
  - **Match:** `Bearer abc123`, `Bearer not_a_real_key`
  - **Severity:** Informational
  - **Reason:** Test token value.

- **File:** `src/public/__tests__/externalApiPlatformPhase8Flows.test.js`
  - **Lines:** 120, 127
  - **Match:** `apiKey` / `Bearer lmdr_live_x`
  - **Severity:** Informational
  - **Reason:** Test API key value.

- **File:** `src/public/__tests__/apiWebhookService.test.js`
  - **Lines:** 30, 43, 63, 76
  - **Match:** `secret` / `Secret` (Context: `webhook_secret: 'whsec_test'`)
  - **Severity:** Informational
  - **Reason:** Test webhook secret value.

- **File:** `src/public/__tests__/socialPostingService.test.js`
  - **Lines:** 42, 203, 284, 326, 355, 360, 368, 376, 401
  - **Match:** `token` (Context: `access_token: 'new-token'`, `fb-token-xyz`, etc.)
  - **Severity:** Informational
  - **Reason:** Mock access tokens for testing.

- **File:** `src/public/__tests__/apiGateway.external.test.js`
  - **Lines:** 77, 247
  - **Match:** `Bearer test_key`, `secret` (Context: `webhook_secret: 'whsec_test'`)
  - **Severity:** Informational
  - **Reason:** Mock API keys and webhook secrets.

- **File:** `src/public/__tests__/checkout.html.test.js`
  - **Lines:** 248, 256, 263, 278, 297, 314, 342, 356, 371
  - **Match:** `pk_test_abc123`
  - **Severity:** Informational
  - **Reason:** Test publishable key.

- **File:** `src/public/__tests__/jobBoardService.test.js`
  - **Lines:** 149, 274
  - **Match:** `api_key` / `apiKey` (Context: `test-key`)
  - **Severity:** Informational
  - **Reason:** Test API key.

- **File:** `src/public/__tests__/checkout.bridge.test.js`
  - **Lines:** 197, 210, 221, 240, 267, 282, 325
  - **Match:** `pk_test_abc123`
  - **Severity:** Informational
  - **Reason:** Test publishable key.

- **File:** `src/public/__tests__/socialTokenService.test.js`
  - **Line:** 38
  - **Match:** `token` (Context: `access_token: 'long-lived-token'`)
  - **Severity:** Informational
  - **Reason:** Mock access token.

- **File:** `src/public/__tests__/agentMailService.test.js`
  - **Line:** 46
  - **Match:** `Bearer am_test_key`
  - **Severity:** Informational
  - **Reason:** Mock API key.

- **File:** `src/public/__tests__/agentMailWebhook.test.js`
  - **Line:** 74
  - **Match:** `secret` (Context: `secret = 'whsec_agentmail_test'`)
  - **Severity:** Informational
  - **Reason:** Mock webhook secret.

- **File:** `src/public/__tests__/stripeWebhookCommission.test.js`
  - **Line:** 58
  - **Match:** `SECRET` (Context: `whsec_test_1234567890abcdef`)
  - **Severity:** Informational
  - **Reason:** Mock webhook secret.

- **File:** `src/public/__tests__/__mocks__/wix-secrets-backend.js`
  - **Line:** 9
  - **Match:** `sk_test_mock_key`
  - **Severity:** Informational
  - **Reason:** Mock implementation file explicitly returning dummy secret values.

---

## Conclusion
The audit confirms that there are **zero** hardcoded secrets in the production codebase. All secrets are properly referenced by name and retrieved securely using `getSecret()` from `wix-secrets-backend` during runtime.

### `.gitignore` Check
A manual review of `.gitignore` confirms that test files (if applicable locally) are not an issue, but `.mcp.json` is properly ignored (if containing actual secrets, though it has been remediated to use placeholders).

**Final Recommendation:** Maintain current practices. The codebase is clean.
