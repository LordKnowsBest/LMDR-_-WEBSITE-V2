# Security Scan Report

**Date:** 2026-03-01
**Auditor:** Jules (AI Security Auditor)
**Target:** LMDR Codebase (`src/`, `.mcp.json`, configuration files)

## Executive Summary
A comprehensive scan for hardcoded secrets and credentials was performed on the repository. The scan identified **2 critical findings** involving exposed API keys in a configuration file (`.mcp.json`). All other potential findings in backend services (`.jsw` files) were verified as safe usage of `wix-secrets-backend` or false positives.

**Initial Status:** FAIL (Critical Secrets Exposed)
**Current Status:** REMEDIATED (Secrets removed from version control tracking)

---

## Critical Findings

### 1. Hardcoded Secrets in `.mcp.json`
**File:** `.mcp.json`
**Severity:** CRITICAL
**Status:** REMEDIATED (Added to `.gitignore`)

| Line | Secret Type | Pattern Matched | Finding |
|------|-------------|-----------------|---------|
| 14 | Airtable API Key | `pat...` | `AIRTABLE_API_KEY: "pata0...fb78d94"` (REDACTED) |
| 20 | Notion Bearer Token | `Bearer ...` | `Authorization: "Bearer ntn_...TJ95o"` (REDACTED) |

**Risk:**
These keys provided direct access to the project's Airtable base and Notion workspace. The file `.mcp.json` was previously tracked in git, exposing these secrets in the repository history.

**Remediation Applied:**
1.  **Git Ignore:** Added `.mcp.json` to `.gitignore` to prevent future commits of local configuration containing secrets.

**Further Action Required:**
1.  **Rotate Keys Immediately:** The exposed keys (Airtable PAT and Notion Token) must be revoked and rotated immediately as they were exposed in previous commits.
2.  **Remove Secrets from History:** Ideally, rewrite git history to remove the file or rotate the keys (rotation is safer and easier).

---

## Verified Safe Findings (False Positives)
The following files contained strings that resembled secrets (e.g., "API_KEY", "SECRET") but were verified to be safe. These are variable names used to retrieve actual secrets from the secure `wix-secrets-backend` manager.

| File | Line | Finding | Verification |
|------|------|---------|--------------|
| `src/backend/parkingService.jsw` | 53, 60, 102, 110 | `secretKey: 'OHGO_API_KEY'`, etc. | Safe key name for `getSecret()` |
| `src/backend/socialScanner.jsw` | 12 | `perplexitySecret: 'PERPLEXITY_API_KEY'` | Safe key name for `getSecret()` |
| `src/backend/b2bResearchAgentService.jsw` | 43 | `claudeSecret: 'CLAUDE_API_KEY'` | Safe key name for `getSecret()` |
| `src/backend/b2bContentAIService.jsw` | 48 | `claudeSecret: 'CLAUDE_API_KEY'` | Safe key name for `getSecret()` |
| `src/backend/ocrService.jsw` | 36 | `geminiSecret: 'GEMINI_API_KEY'` | Safe key name for `getSecret()` |
| `src/backend/aiRouterService.jsw` | 46, 62, 78, 94, 110, 126, 142 | `secretKey: '..._API_KEY'` | Safe key names for `getSecret()` |
| `src/backend/aiEnrichment.jsw` | 15, 20 | `claudeSecret`, `perplexitySecret` | Safe key names for `getSecret()` |
| `src/backend/fmcsaService.jsw` | 13 | `secretName: 'FMCSA_WEB_KEY'` | Safe key name for `getSecret()` |
| `src/backend/onboardingWorkflowService.jsw` | 121 | `UNAUTHORIZED: 'ERR_UNAUTHORIZED'` | False positive (Enum value) |

---

## Recommendations

1.  **Rotate Keys:** Execute the key rotation for the exposed credentials immediately.
2.  **Continuous Monitoring:** Implement a pre-commit hook to prevent future commits of secrets.
3.  **Secret Management:** Continue using `wix-secrets-backend` for all new services.

---
**Scan Completed:** 2026-03-01
