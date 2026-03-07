# Secrets Exposure Report

## Overview
A comprehensive credential exposure scan was conducted on the codebase to identify any hardcoded API keys, tokens, passwords, or secrets that should instead be securely stored in the Wix Secrets Manager.

## Methodology
The audit utilized a Python script (`scan_secrets.py`) that scanned all `.js`, `.jsw`, `.json` files in the `src/` directory, as well as root configuration files including `.mcp.json`. The script uses regex patterns designed to catch:
- Known formats (e.g., Stripe keys `sk_live`, `pk_test`, Airtable PATs)
- Generic bearer tokens
- Variable assignments (e.g., `apiKey = "..."`, `token: "..."`)

## Findings Summary
**Total Potential Secrets Found:** 55
**Total Genuine Hardcoded Secrets in Production Code:** 0

The script flagged 55 instances. Upon manual inspection of the source code, **all findings were verified as false positives**.

## Detailed Breakdown of Findings

### 1. Root Configurations & Documentation Placeholders
- `.mcp.json:26`: `Bearer YOUR_NOTION_TOKEN_HERE` (Placeholder string for local MCP setup)
- `src/backend/apiPortalService.jsw` (multiple): Example cURL and request headers in documentation arrays (`Bearer lmdr_live_xxx`).

### 2. Secret Key References (wix-secrets-backend)
Several backend files pass the **name of the secret** to the `getSecret()` function. These are not the actual secret values.
- `src/backend/socialScanner.jsw:12`: `groqSecret: 'GROQ_API_KEY'`
- `src/backend/b2bResearchAgentService.jsw:43`: `claudeSecret: 'CLAUDE_API_KEY'`
- `src/backend/b2bContentAIService.jsw:48`: `claudeSecret: 'CLAUDE_API_KEY'`
- `src/backend/ocrService.jsw:36`: `geminiSecret: 'GEMINI_API_KEY'`
- `src/backend/aiEnrichment.jsw`: Various references (`GROQ_API_KEY`, `CLAUDE_API_KEY`, `GEMINI_API_KEY`)

### 3. Error Messages / Constants
- `src/backend/apiAuthService.jsw:63`: Rejection error string `"Missing Bearer token"`

### 4. Frontend Standalone / Test Mode
- `src/public/driver/js/document-upload-logic.js:245`: `uploadToken: 'test-token-abc'` (Explicit standalone mode payload for offline UI testing)

### 5. Unit Tests and Mocks (`src/public/__tests__/*`)
The vast majority of the 55 findings were test files utilizing mock keys to validate authentication mechanisms and webhook handlers.
- **API Gateway & Webhook Tests:** Hardcoded `Bearer test_key`, `whsec_test`, etc.
- **Social Services Tests:** Fake Facebook access tokens (`fb-token-xyz`, `new-access-token`)
- **Stripe / Checkout Tests:** Various instances of `pk_test_abc123`
- **AgentMail / Job Boards Tests:** Mock headers (`Bearer am_test_key`, `apiKey: 'test-key'`)
- **Mocks:** `__mocks__/wix-secrets-backend.js` using `sk_test_mock_key`

## Conclusion

**Status: PASS**

Zero genuine hardcoded secrets were found in production or configuration files. The codebase correctly relies on `wix-secrets-backend` (`getSecret`) for credential management, and any flagged strings are appropriately scoped test data, system constants, or placeholders.

## Recommended Actions
None required. Codebase credential hygiene is excellent.

_Scan executed and verified on 2026-03-07._