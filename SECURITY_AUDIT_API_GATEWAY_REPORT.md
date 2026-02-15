# Security Audit Report: API Gateway & Authentication

**Date:** 2026-03-03
**Auditor:** Jules (AI Security Engineer)
**Scope:** `src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`

## Executive Summary
The API Gateway implements standard security controls including API key hashing (SHA-256), subscription tier enforcement, and rate limiting. However, **CRITICAL** vulnerabilities were identified that allow rate limit bypass and unauthorized API key rotation. Additionally, the IP whitelisting logic fails open when the IP address cannot be determined.

## Checklist Findings

| Status | Control | Details |
| :--- | :--- | :--- |
| **PASS** | Authentication Check | `validateApiKey` is correctly called at the entry of `handleGatewayRequest` in `src/backend/apiGateway.jsw` (Line 46). |
| **PASS** | API Key Hashing | Keys are hashed using SHA-256 with a pepper before comparison in `src/backend/apiAuthService.jsw` (Lines 52-56). |
| **FAIL** | IP Whitelisting | Logic in `isIpAllowed` (`src/backend/apiAuthService.jsw`, Line 126) fails open: `if (!ipAddress) return true;`. This allows attackers to bypass the whitelist by suppressing IP headers. |
| **PASS** | Tier Enforcement | `assertTier` is used consistently to enforce access levels (e.g., `assertTier(tier, 'growth')` in `src/backend/apiGateway.jsw`). |
| **FAIL** | Rate Limiting | Rate limits can be bypassed by setting the header `x-lmdr-bypass-rate-limit: true`. Logic found in `src/backend/apiGateway.jsw` (Lines 105, 536-539). |
| **PASS** | Code Comments | No `TODO`, `HACK`, `FIXME`, or `BYPASS` comments were found in the critical paths. |

## Critical Vulnerabilities

### 1. Unauthorized API Key Rotation
**Severity:** CRITICAL
**File:** `src/backend/apiAuthService.jsw`
**Line:** 92
**Description:** The function `rotateApiKey` is exposed as a public web method (via `permissions.json` wildcard) and accepts `partnerId` as an argument without verifying the caller's identity.
**Impact:** Any unauthenticated attacker can rotate the API key for any partner, effectively locking them out and seizing control of their API access.
**Remediation:**
- Restrict `rotateApiKey` to `siteOwner` in `permissions.json`.
- Or validiate `wixUsersBackend.currentUser.id` matches the `partnerId` owner.

### 2. Rate Limit Bypass Header
**Severity:** HIGH
**File:** `src/backend/apiGateway.jsw`
**Line:** 536
**Description:** The function `shouldBypassRateLimit` explicitly checks for `x-lmdr-bypass-rate-limit`. If set to 'true', all rate limits are skipped.
**Impact:** An attacker or abusive user can flood the API without restriction, potentially causing denial of service or excessive resource consumption.
**Remediation:** Remove this bypass logic immediately or restrict it to specific internal IP addresses/roles.

### 3. IP Whitelist Fails Open
**Severity:** HIGH
**File:** `src/backend/apiAuthService.jsw`
**Line:** 126
**Description:** `if (!ipAddress) return true;` grants access if the IP address is null or undefined.
**Impact:** Attackers can bypass IP restrictions by stripping `X-Forwarded-For` or `X-Real-IP` headers if the platform allows it.
**Remediation:** Change logic to fail closed: `if (!ipAddress) return false;` (unless explicit configuration allows unknown IPs).

## Recommendations
1.  **Immediate Action:** Remove the `x-lmdr-bypass-rate-limit` check from `src/backend/apiGateway.jsw`.
2.  **Immediate Action:** Restrict `src/backend/apiAuthService.jsw` (especially `rotateApiKey`) to `siteOwner` or authenticated members only in `permissions.json`.
3.  **Refactor:** Update `isIpAllowed` to deny access by default when IP is missing.

---
*Verification script `verify_vulnerabilities.js` was created and run to confirm these findings.*
