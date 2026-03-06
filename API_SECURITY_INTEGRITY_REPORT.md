# API Security & Integrity Report

**Date:** 2026-10-18
**Auditor:** Jules (API Security Engineer)
**Goal:** Verify that the LMDR platform's external API gateway and internal services have not had their authentication, authorization, or rate limiting logic weakened, bypassed, or accidentally disabled.

## Executive Summary
**Overall Status: FAIL**
Critical vulnerabilities were identified in the codebase, including active developer bypasses in production code, rate limit bypass headers, and global permission wildcards allowing anonymous access. Immediate remediation is required before any production deployment.

---

## Detailed Checklist

### 1. Authentication Enforcement
| Status | Check | File Path | Line | Details |
| :--- | :--- | :--- | :--- | :--- |
| **PASS** | `validateApiKey` called on gateway | `src/backend/apiGateway.jsw` | 66 | Correctly called at start of `handleGatewayRequest`. |
| **FAIL** | Dev Mode Role Bypass Active | `src/backend/driverMatching.jsw` | 43 | `const DEV_MODE_BYPASS_ROLES = true;` prevents role verification. |
| **FAIL** | Dev Mode Carrier Bypass Active | `src/backend/driverMatching.jsw` | 46 | `const DEV_MODE_BYPASS_CARRIER = true;` bypasses carrier auth & subscription checks. |
| **FAIL** | Dev Mode Carrier Bypass Active | `src/backend/driverOutreach.jsw` | 22 | `const DEV_MODE_BYPASS_CARRIER = true;` bypasses recruiter access verification. |

### 2. Authorization Controls
| Status | Check | File Path | Line | Details |
| :--- | :--- | :--- | :--- | :--- |
| **FAIL** | Global Wildcard Permissions | `src/backend/permissions.json` | 4 | `"*": { "anonymous": { "invoke": true } }` allows unauthenticated access to all backend web modules. |
| **FAIL** | Insecure Direct Object Reference | `src/backend/apiAuthService.jsw` | 100 | `rotateApiKey` is exposed publicly (via wildcard) and lacks internal caller verification. |
| **WARN** | Subscription Tier Checks | `src/backend/apiGateway.jsw` | 360 | `assertTier` logic exists but relies on `DEV_MODE_BYPASS` variables not being true in downstream logic. |

### 3. Rate Limiting & Quotas
| Status | Check | File Path | Line | Details |
| :--- | :--- | :--- | :--- | :--- |
| **FAIL** | Rate Limit Bypass Header | `src/backend/apiGateway.jsw` | 543 | `shouldBypassRateLimit` checks for `x-lmdr-bypass-rate-limit` header, allowing full bypass. |
| **PASS** | Rate Limit Logic Present | `src/backend/rateLimitService.jsw` | 36 | `checkAndTrackUsage` implements token bucket algorithm correctly. |
| **WARN** | Unlimited Quota Config | `src/backend/rateLimitService.jsw` | 10 | Enterprise tier has `Number.MAX_SAFE_INTEGER` (unlimited) requests. |

### 4. IP Whitelisting
| Status | Check | File Path | Line | Details |
| :--- | :--- | :--- | :--- | :--- |
| **FAIL** | IP Whitelist Logic Fail-Open | `src/backend/apiAuthService.jsw` | 152 | `if (!ipAddress) return true;` allows requests with no IP header (or stripped header) to bypass whitelist. |

### 5. Code Hygiene & Suspicious Markers
| Status | Check | File Path | Line | Details |
| :--- | :--- | :--- | :--- | :--- |
| **FAIL** | TODO/HACK/BYPASS Comments | `src/backend/driverMatching.jsw` | 43 | `// TODO: Set to false for production` explicitly marks the bypass. |
| **FAIL** | TODO/HACK/BYPASS Comments | `src/backend/driverOutreach.jsw` | 22 | `// TODO: Set to false for production` explicitly marks the bypass. |

---

## Recommendations
1.  **Immediate Remediation:**
    - Set all `DEV_MODE_BYPASS_*` constants to `false` in `driverMatching.jsw` and `driverOutreach.jsw`.
    - Remove the `x-lmdr-bypass-rate-limit` header check in `apiGateway.jsw`.
    - Modify `src/backend/permissions.json` to remove the global wildcard and strictly list allowed modules/methods.
    - Fix `isIpAllowed` in `apiAuthService.jsw` to return `false` if IP is missing but a whitelist exists.

2.  **Process Improvements:**
    - Implement a pre-commit hook that rejects commits containing `DEV_MODE_BYPASS = true` or `// TODO` in critical security files.
    - Review `permissions.json` strategy to ensure least privilege.
