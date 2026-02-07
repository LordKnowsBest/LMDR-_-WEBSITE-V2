# Dependency Vulnerability Check Summary

## Vulnerabilities by Severity
- **Critical:** 0
- **High:** 5 (All in `tar` via `@wix/cli` -> `node-gyp`)
- **Moderate:** 0
- **Low:** 0
- **Total:** 5

## Critical/High Vulnerabilities Details
- **Package:** `tar` (via `@wix/cli` -> `node-gyp` -> `make-fetch-happen` -> `cacache`)
  - **Severity:** High
  - **Issue:** Arbitrary File Overwrite/Symlink Poisoning
  - **Status:** Installed version `6.2.1` is vulnerable.
  - **Recommendation:** Update `@wix/cli` if a newer version is available. Current `@wix/cli` v1.1.159 depends on old `node-gyp` v8.4.1.

## Outdated Packages (Dev Dependencies Only)
Total outdated: 5
- `babel-jest`: 29.7.0 -> 30.2.0
- `cross-env`: 7.0.3 -> 10.1.0
- `eslint`: 8.57.1 -> 10.0.0
- `jest`: 29.7.0 -> 30.2.0
- `react`: 16.14.0 -> 19.2.4

## Specific Package Checks
- **@velo/wix-members-twilio-otp**: Not installed/audited (Private/Missing in Lockfile).
- **Stripe SDK**: Not installed (Implemented via Fetch in `stripeService.jsw`).
- **AI Client Libraries**: Not installed (Implemented via Fetch/Router in `aiRouterService.jsw`).

## Findings & Recommendations
1.  **Stale Lockfile:** `package-lock.json` was stale and missing production dependencies. `npm install` failed due to missing private packages.
    - **Action:** Ensure access to private registries or restore dependencies properly.
2.  **Private Dependencies:** The project relies on private packages not accessible via public npm registry, preventing proper auditing of production dependencies.
3.  **Vulnerable Dev Dependency:** `@wix/cli` introduces high-severity vulnerabilities via `tar`.
4.  **Test Failures:** `npm test` failed significantly, likely due to dependency/configuration issues.

**Verdict: FAIL** - Critical/High vulnerabilities found in dev dependencies, and production dependencies could not be audited.
