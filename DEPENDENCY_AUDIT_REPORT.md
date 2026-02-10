# LMDR Dependency Vulnerability Audit Report

## Executive Summary

This audit assesses the security posture of the LMDR project's npm dependencies and custom implementation of critical services (Stripe, Authentication, AI).

**Overall Status:** **FAIL** (Critical Implementation Vulnerabilities Detected)

While `npm audit` reports 0 vulnerabilities, this is a false negative due to the project structure where production dependencies are managed via the Wix environment or implemented directly in code. Manual code review revealed **Critical** vulnerabilities in the custom Stripe and API Authentication implementations that expose the system to timing attacks and potential Denial of Service.

### Vulnerability Summary Table

| Severity | Count | Category | Description |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | 2 | Implementation | Insecure string comparison in Stripe Webhook Signature Verification and API Key Validation (Timing Attack). |
| **HIGH** | 1 | Dependency | Phantom/Unverified Dependencies (References to `@velo` and `@marketpushapps` packages in backup but missing from `package.json`). |
| **MODERATE** | 1 | Architecture | Potential DoS in API Key Validation (Loads all partners into memory). |
| **LOW** | 5 | DevDependency | Outdated/Deprecated `devDependencies` (`cross-env`, `react`, `eslint`, `glob`, `inflight`). |

---

## Detailed Findings

### 1. `npm audit` Results (False Negative)

Running `npm audit` returned **0 vulnerabilities**.
- **Reason:** The `package.json` file lists **0 dependencies** in the `dependencies` section. Production dependencies are either managed implicitly by the Wix runtime or implemented as custom code.
- **Risk:** Automated tools cannot detect vulnerabilities in the actual runtime environment or custom implementations.

### 2. Implementation Security Audit (Critical Findings)

Since key functionalities (Payment, Auth) are implemented directly in backend files rather than using standard SDKs, the security burden falls on the implementation code.

#### A. Stripe Webhook Signature Verification (CRITICAL)
**File:** `src/backend/http-functions.js`
**Issue:** The webhook signature verification uses insecure string comparison (`!==`).
**Vulnerability:** This allows for **timing attacks**, where an attacker can deduce the expected signature byte-by-byte by measuring the time it takes for the comparison to fail.
**Snippet:**
```javascript
// Current Insecure Implementation
if (expectedSignature !== signatureHash) {
  return { success: false, error: 'Signature mismatch' };
}
```

#### B. API Key Validation (CRITICAL)
**File:** `src/backend/apiAuthService.jsw`
**Issue:** The API key validation uses insecure string comparison (`===`) for both key hashing and validation.
**Vulnerability:** Timing attacks can reveal valid API keys or hashes.
**Snippet:**
```javascript
// Current Insecure Implementation
if (key.key_hash === keyHash) { ... }
```

#### C. API Auth Scalability / DoS (MODERATE)
**File:** `src/backend/apiAuthService.jsw`
**Issue:** The `resolvePartnerByKeyHash` function queries up to 1000 partners (`PARTNER_QUERY_LIMIT`) and loads them into memory to find a matching key hash.
**Vulnerability:** As the number of partners grows, this becomes a performance bottleneck and a potential Denial of Service (DoS) vector if an attacker floods the endpoint with invalid keys, forcing expensive database queries and memory allocation.

### 3. Phantom Dependencies (High Risk)

The file `package.json.test-backup` lists dependencies that are missing from the active `package.json`:
- `@velo/wix-members-twilio-otp-backend`
- `@velo/wix-members-twilio-otp`
- `@marketpushapps/calendly-embed-backend`
- `@marketpushapps/airtable-connector`
- `@marketpushapps/calendly-embed`

**Status:** These appear to be "phantom" dependencies. Code analysis suggests they are **not currently used** in the active codebase (no imports found in `src/backend`), but their presence in backup files indicates a potential inconsistent state or past usage.
**Recommendation:** Verify if these are needed. If not, delete the backup file to avoid confusion. If needed, they must be properly installed and audited.

### 4. Dev Dependencies (Low Risk)

The `devDependencies` are significantly outdated:
- `cross-env`: `7.0.3` (Latest: `10.1.0`)
- `react`: `16.14.0` (Latest: `18.2.0`)
- `eslint`: `8.25.0` (Latest: `9.x`)
- `glob`: `7.2.3` (Deprecated, security issues in older versions)
- `inflight`: `1.0.6` (Deprecated, memory leaks)

**Risk:** Low for production (as they are dev-only), but affects development security and compatibility.

---

## Actionable Items & Remediation

### 1. Fix Stripe Webhook Verification (Priority: Immediate)
Update `src/backend/http-functions.js` to use `crypto.timingSafeEqual`.

```javascript
import crypto from 'crypto'; // Ensure this import is added

// ... inside verifyStripeSignature function ...

// Compute expected signature
const signedPayload = `${timestamp}.${payload}`;
const expectedSignature = await computeHmacSignature(signedPayload, webhookSecret);

// Convert to Buffers for timing-safe comparison
const expectedBuffer = Buffer.from(expectedSignature);
const actualBuffer = Buffer.from(signatureHash);

// Verify length match first to prevent errors in timingSafeEqual
if (expectedBuffer.length !== actualBuffer.length) {
    return { success: false, error: 'Signature mismatch' };
}

// Compare signatures (timing-safe)
if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return { success: false, error: 'Signature mismatch' };
}
```

### 2. Fix API Key Validation (Priority: Immediate)
Update `src/backend/apiAuthService.jsw` to use `crypto.timingSafeEqual`.

```javascript
import crypto from 'crypto'; // Ensure this import is added

// ... inside hasMatchingKey function ...

function secureCompare(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

// Usage
if (secureCompare(key.key_hash, keyHash)) { ... }
```

### 3. Update Dev Dependencies (Priority: Medium)
Run the following to update development tools:
```bash
npm install -D cross-env@latest eslint@latest jest@latest
# Note: React update might require code changes, verify compatibility first.
```

### 4. Clean Up Phantom Dependencies (Priority: Low)
If `@velo` and `@marketpushapps` packages are not used, remove `package.json.test-backup` or explicitly uninstall them to prevent accidental usage.
