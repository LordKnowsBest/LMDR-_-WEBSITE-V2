# Security Scan Report: Hardcoded Secrets

**Date:** 2026-03-03
**Status:** PASS (with remediations)

## Overview

A comprehensive scan of the LMDR codebase was performed to identify any hardcoded secrets, API keys, or tokens. The scan covered all `.js`, `.jsw`, `.json`, and HTML files within the `src/` directory and root configuration files.

## Findings & Remediation

### 1. Hardcoded Credentials in `.mcp.json` (CRITICAL - FIXED)

**Finding:**
Two hardcoded credentials were found in the `.mcp.json` file (used for Model Context Protocol configuration):
-   `AIRTABLE_API_KEY`: A real Airtable Personal Access Token (PAT).
-   `NotionApi` Authorization Header: A real Notion integration token.

**Remediation:**
These values have been replaced with placeholders (`YOUR_AIRTABLE_PAT_HERE` and `YOUR_NOTION_TOKEN_HERE`). This file should not contain real secrets in version control.

---

### 2. False Positives (VERIFIED SAFE)

The following patterns were flagged by the scanner but were manually verified as false positives or safe for their specific context:

#### A. Secret Name Configuration (Backend)
Several backend service files contain variables that look like secrets but are actually **configuration keys** passed to `wix-secrets-backend` to fetch the actual secret at runtime.

*   `src/backend/socialScanner.jsw`: `perplexitySecret: 'PERPLEXITY_API_KEY'`
*   `src/backend/b2bResearchAgentService.jsw`: `claudeSecret: 'CLAUDE_API_KEY'`
*   `src/backend/b2bContentAIService.jsw`: `claudeSecret: 'CLAUDE_API_KEY'`
*   `src/backend/ocrService.jsw`: `geminiSecret: 'GEMINI_API_KEY'`
*   `src/backend/aiEnrichment.jsw`: `claudeSecret: 'CLAUDE_API_KEY'`, `geminiSecret: 'GEMINI_API_KEY'`, `perplexitySecret: 'PERPLEXITY_API_KEY'`

**Verification:**
The code confirms these strings are used as arguments to `getSecret()`, e.g.:
```javascript
const apiKey = await getSecret(CONFIG.perplexitySecret);
```
This is the correct, secure pattern for handling secrets in Velo.

#### B. Standalone Test Mode (Frontend)
*   `src/public/driver/DRIVER_DOCUMENT_UPLOAD.html`: `uploadToken: 'test-token-abc'`

**Verification:**
This code is wrapped in a check that only executes when the file is running in standalone mode (i.e., not embedded in a Wix iframe), which is used for local testing.
```javascript
if (window.parent === window) {
    // ... loading test data ...
    uploadToken: 'test-token-abc',
}
```
This token is a mock value and poses no security risk.

#### C. Test Mocks (`src/public/__tests__`)
Various findings in `src/public/__tests__/` (e.g., `sk_test_mock`, `pk_test_abc123`, `whsec_test`) are explicit mock values used for unit testing. These are not real credentials.

## Conclusion

With the remediation of `.mcp.json`, the codebase is now free of hardcoded secrets in production logic. The remaining "secret-like" strings are either configuration identifiers or test data.

**Recommendation:**
-   Ensure `.mcp.json` remains free of secrets.
-   Continue using `wix-secrets-backend` for all credential access.
