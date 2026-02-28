# Dependency Security Report

## Executive Summary
**Verdict: FAIL**

A full dependency audit was conducted. Significant inconsistencies were found between `package.json` and `package-lock.json`, private dependency vulnerabilities via registry leakage, and outdated packages.

**Vulnerability Summary:**
* **Total:** 12
* **Critical:** 0
* **High:** 7
* **Moderate:** 5
* **Low:** 0
* **Info:** 0

## Findings by Severity

### High Severity Findings (7)

1. **minimatch (ReDoS via repeated wildcards)**
    * **CVE/GHSA:** GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74
    * **Affected Version:** <=3.1.3
    * **Patched Version:** >=3.1.4
    * **Note:** Nested within devDependencies via `@wix/cli`.

2. **node-gyp (Arbitrary File Read/Write via Path Traversal in tar / make-fetch-happen)**
    * **Affected Version:** <=10.3.1
    * **Patched Version:** Fix available via updating `@wix/cli` to `1.0.1` (SemVer Major)

3. **rollup (Arbitrary File Write via Path Traversal)**
    * **CVE/GHSA:** GHSA-mw96-cpmx-2vgc
    * **Affected Version:** 4.0.0 - 4.58.0
    * **Patched Version:** >=4.59.0
    * **Note:** Used internally via devDependencies.

4. **tar (Race Condition, Arbitrary File Overwrite/Creation via Path Traversal)**
    * **CVE/GHSA:** GHSA-r6q2-hw4h-h46w, GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97, GHSA-83g3-92jg-28cx
    * **Affected Version:** <=7.5.7
    * **Patched Version:** Fix available via updating `@wix/cli` to `1.0.1` (SemVer Major)

### Moderate Severity Findings (5)

1. **undici (Unbounded decompression chain resource exhaustion)**
    * **CVE/GHSA:** GHSA-g9mf-h72j-4rw9
    * **Affected Version:** <6.23.0
    * **Patched Version:** >=6.23.0

2. **vite (`server.fs.deny` bypasses, Path Traversal)**
    * **CVE/GHSA:** GHSA-356w-63v5-8wf4, GHSA-859w-5945-r5v3, GHSA-xcj6-pq6g-qj4x, GHSA-93m4-6634-74q7
    * **Affected Version:** 6.0.0 - 6.4.0
    * **Patched Version:** >=6.4.1 (or specific patch versions like 6.2.6+)

### Low Severity Findings (0)

None.

## Specific Package Checks

* **`@velo/wix-members-twilio-otp`:** Not present in `package.json` or `package-lock.json`. Unused dependency successfully removed.
* **Stripe SDK:** Not installed. The project utilizes direct REST API calls via `fetch` instead of the official npm SDK.
* **AI Client Libraries (OpenAI, Anthropic, Groq, Perplexity):** Not installed. The project utilizes direct REST API calls via `fetch` rather than official SDKs.
* **Twilio:** Not installed. Direct REST API calls used.

## Configuration & Health Issues

### `package-lock.json` Integrity

The lockfile is significantly out of sync with `package.json` and poses a supply chain risk.
1. **Version Mismatch:** `uuid` is versioned `^9.0.1` in `package.json` but locked to `13.0.0` in `package-lock.json`.
2. **Missing Private Packages:** None of the `@marketpushapps/*` private packages listed in `package.json` exist in `package-lock.json`.
3. **Misplaced Dependencies:** `@wix/cli` is present as a runtime dependency in the lockfile (`dependencies` tree) instead of the `devDependencies` tree where it belongs.

### Dependency Confusion Risk

The project defines `@marketpushapps` scoped private dependencies but lacks a `.npmrc` file. This means npm will attempt to fetch these from the public registry (registry.npmjs.org), exposing the project to a **Dependency Confusion** vulnerability. An attacker could publish malicious packages with these names to the public registry, which the build environment would unknowingly download and execute.

## Recommendations

1. **Remediate `.npmrc` (Critical):** Create a `.npmrc` file at the root of the project to map the `@marketpushapps` scope to the correct private registry URL, preventing dependency confusion.
2. **Synchronize Lockfile (High):** Re-generate `package-lock.json` to properly reflect the `devDependencies` vs `dependencies` distinction and lock the correct versions of all packages (including `uuid`). This requires having valid credentials for the private registry to run `npm install` successfully.
3. **Update `@wix/cli`:** The outdated Velo/Wix SDK dependency (`@wix/cli`) is pulling in several vulnerable transitive dependencies (like `tar`, `node-gyp`, `minimatch`). Consider bumping to the latest version to inherit security patches.
4. **Direct API Integrations:** Continue the current strategy of utilizing direct REST API calls (via `fetch`) for third-party services like Stripe and AI providers, as this effectively mitigates third-party supply chain risks.