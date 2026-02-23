# API Security & Integrity Checklist

**Date:** 2026-10-18
**Auditor:** Jules (AI Security Engineer)
**Target:** LMDR Platform API Gateway (`src/backend/apiGateway.jsw`, `src/backend/apiAuthService.jsw`, `src/backend/http-functions.js`)

## Executive Summary
The API Gateway contains critical security vulnerabilities that allow bypass of authentication, authorization, and rate limiting controls. Immediate remediation is required to secure the platform.

### critical Findings
- **Authentication Bypass:** Unauthorized users can invoke sensitive backend functions due to overly permissive wildcard permissions.
- **Rate Limit Bypass:** Rate limiting can be trivially bypassed by setting a specific HTTP header.
- **IP Whitelist Bypass:** IP restrictions can be circumvented by manipulating request headers to omit the client IP.
- **Unauthenticated Webhooks:** Several external webhook endpoints (Vapi, SendGrid, Job Boards) lack cryptographic signature verification, allowing data injection.

---

## Detailed Checklist

### 1. Authentication & Authorization Logic

| Control | Status | Location | Details |
| :--- | :---: | :--- | :--- |
| **Auth Function Called on All Routes** | **FAIL** | `src/backend/http-functions.js` | `handleGatewayRequest` correctly validates keys for `/v1/*` routes. However, `post_vapi_webhook`, `post_twilio_status`, and job board webhooks are exposed without any authentication. |
| **API Keys Hashed** | **PASS** | `src/backend/apiAuthService.jsw` | Keys are hashed using SHA-256 with a pepper before comparison. No plaintext storage detected. |
| **IP Whitelisting Active** | **FAIL** | `src/backend/apiAuthService.jsw` | `isIpAllowed` returns `true` if `ipAddress` is null/undefined. An attacker can bypass the whitelist by stripping `x-forwarded-for` headers. |
| **Subscription Tier Checks** | **PASS** | `src/backend/apiGateway.jsw` | `assertTier` is correctly implemented and called on restricted endpoints (e.g., Intelligence, Fuel). |
| **Permissions Configuration** | **FAIL** | `src/backend/permissions.json` | The file uses a wildcard `*` for both module and method names, granting `Anonymous` users invoke rights to all backend functions, including `rotateApiKey`. |

### 2. Rate Limiting & Abuse Prevention

| Control | Status | Location | Details |
| :--- | :---: | :--- | :--- |
| **Rate Limiting Enforced** | **FAIL** | `src/backend/apiGateway.jsw` | The function `shouldBypassRateLimit` allows any request with the header `x-lmdr-bypass-rate-limit: true` to bypass rate limits without further authorization. |
| **Quota Tracking** | **PASS** | `src/backend/apiGateway.jsw` | `trackQuotaUsage` is correctly implemented and called for billable endpoints. |

### 3. Code Hygiene & Information Leakage

| Control | Status | Location | Details |
| :--- | :---: | :--- | :--- |
| **No "TODO/HACK" Comments** | **PASS** | Entire Backend | No explicit tech debt markers (`TODO`, `HACK`, `FIXME`) found near auth logic. |
| **Error Message Security** | **WARN** | `src/backend/apiAuthService.jsw` | `validateApiKey` returns distinct error codes for "invalid_api_key" vs "forbidden_ip", allowing attackers to enumerate valid API keys via side-channel analysis. |
| **Logging of Failures** | **PASS** | `src/backend/apiGateway.jsw` | Failed requests are logged to `apiRequestLog` with status codes and metadata. |

### 4. Webhook Security (External Integrations)

| Control | Status | Location | Details |
| :--- | :---: | :--- | :--- |
| **Stripe Webhook Verification** | **PASS** | `src/backend/http-functions.js` | Uses `verifyStripeSignature` with `crypto.subtle` and timing-safe comparison. |
| **Vapi Webhook Verification** | **FAIL** | `src/backend/http-functions.js` | `post_vapi_webhook` accepts arbitrary tool calls without verifying the request source or signature. |
| **SendGrid Webhook Verification** | **FAIL** | `src/backend/http-functions.js` | `post_sendgrid_events` only verifies the signature *if* the header is present. If missing, it processes the event insecurely. |
| **Twilio Webhook Verification** | **FAIL** | `src/backend/http-functions.js` | `post_twilio_status` and `post_twilio_incoming` lack any signature verification. |

---

## Remediation Recommendations

1.  **Restrict Permissions:** Update `permissions.json` to remove the global wildcard. Explicitly list allowed modules and restrict sensitive functions (like `rotateApiKey`) to `Admin` or `SiteOwner`.
2.  **Fix IP Whitelist:** Update `isIpAllowed` to return `false` if `ipAddress` is missing when a whitelist is configured.
3.  **Remove Rate Limit Bypass:** Remove the `x-lmdr-bypass-rate-limit` check or restrict it to internal service accounts with a strong secret.
4.  **Implement Webhook Verification:** Add signature verification for Vapi, SendGrid (enforced), and Twilio webhooks.
5.  **Normalize Auth Errors:** Return a generic "Unauthorized" message for both invalid keys and IP restrictions to prevent enumeration.
