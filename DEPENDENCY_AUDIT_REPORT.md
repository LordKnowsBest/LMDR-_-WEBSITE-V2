# Dependency Vulnerability Audit Report

**Date:** 2026-02-12
**Analyst:** Jules
**Target:** LMDR Project Dependencies

## 1. Vulnerability Summary

| Severity | Count | Affected Packages | Status |
| :--- | :---: | :--- | :--- |
| **Critical** | 0 | - | PASS |
| **High** | 5 | `@wix/cli`, `tar`, `cacache`, `make-fetch-happen`, `node-gyp` | **FAIL** |
| **Moderate** | 4 | `@wix/cli-app`, `miniflare`, `undici`, `vite` | WARN |
| **Low** | 0 | - | PASS |
| **Total** | **9** | | |

**Overall Verdict:** **FAIL** (Due to High severity vulnerabilities in core tooling and untracked dependencies)

---

## 2. Critical & High Severity Findings

### High Severity: Arbitrary File Overwrite / Symlink Poisoning
- **Package:** `tar` (transitive dependency of `@wix/cli`)
- **Vulnerable Versions:** `<=7.5.6`
- **Path:** `@wix/cli` -> `node-gyp` -> `make-fetch-happen` -> `cacache` -> `tar`
- **CVE/GHSA:** `GHSA-8qq5-rm4j-mr97`, `GHSA-r6q2-hw4h-h46w`, `GHSA-34x7-hfp2-rc4v`
- **Impact:** Potential for arbitrary file overwrite or creation via malicious tar archives. Given this is a CLI tool used in development/build, the risk is primarily to the developer's environment if processing untrusted tar files.
- **Remediation:** `npm audit` suggests `fixAvailable: { name: @wix/cli, version: 1.0.1 }`, which appears to be a downgrade from the current `1.1.162`. No clean patch is available for the `1.1.x` branch on npm.
  - **Action:** Monitor `@wix/cli` for updates. Avoid processing untrusted tar archives with this tool.

---

## 3. Outdated Packages & Supply Chain Risks

### React
- **Current:** `16.14.0` (Released Oct 2020)
- **Latest:** `19.2.4`
- **Status:** **Significantly Outdated / EOL**.
- **Risk:** While `npm audit` reports no *known* vulnerabilities for `16.14.0`, the version is End-of-Life and misses modern security hardenings.
- **Recommendation:** Plan a migration to React 18+ (Major breaking changes expected).

### @wix/cli
- **Current:** `1.1.162`
- **Status:** Vulnerable dependencies (as detailed above).
- **Recommendation:** Update immediately when a patch is released by Wix.

---

## 4. Manual & Untracked Implementations (Bypassing Audit)

The following critical integrations were audited for dependency usage:

| Feature | Implementation Method | Dependency Status | Risk Assessment |
| :--- | :--- | :--- | :--- |
| **Stripe** | Manual HTTP `fetch` in `src/backend/stripeCore.js` | **No SDK used** | **HIGH**. Manual implementation bypasses SDK security features and `npm audit`. Requires manual code review of API usage. |
| **Twilio OTP** | `package.json.test-backup` lists `@velo/wix-members-twilio-otp` | **Unused in Source** | **LOW**. Package listed in backup config but no imports found in `src/`. Logic appears unimplemented or removed. |
| **AI Clients** | Manual HTTP `fetch` in `src/backend/aiRouterService.jsw` | **No SDK used** | **MEDIUM**. Manual implementation. Vulnerabilities in `fetch` logic (e.g., header injection) must be checked manually. |

---

## 5. Phantom Dependencies

The following packages are imported in source code but **missing** from `package.json`:

- **`uuid`**
  - **Usage:** `src/backend/documentCollectionService.jsw`
  - **Risk:** Version is unmanaged. `npm audit` cannot check it. If the environment provides an old version, it could be vulnerable.
  - **Action:** Add `uuid` to `package.json` immediately.

---

## 6. Recommendations

1.  **Immediate Action:** Add `uuid` to `package.json` to track and audit its version.
    ```bash
    npm install uuid
    ```
2.  **Monitor:** Watch for updates to `@wix/cli` to resolve high-severity `tar` vulnerabilities.
3.  **Refactor:** Consider replacing manual Stripe/AI `fetch` implementations with official SDKs (if Wix environment permits) to leverage vendor security updates and `npm audit` coverage.
4.  **Cleanup:** Remove unused dependencies from `package.json.test-backup` to avoid confusion.
5.  **Long-term:** Plan React migration from 16.x to 18.x.
