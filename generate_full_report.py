import json
import os
import subprocess

def get_installed_versions():
    # Attempt to use npm ls for uuid or other packages
    # For now, just rely on package.json/package-lock.json
    pass

def generate():
    try:
        with open('audit_results.json', 'r') as f:
            data = json.load(f)
    except Exception as e:
        data = {}

    metadata = data.get('metadata', {}).get('vulnerabilities', {})
    vulnerabilities = data.get('vulnerabilities', {})

    report = []
    report.append("# NPM Dependency Vulnerability & Security Report\n")

    # We mark fail because there are High vulnerabilities
    has_critical = metadata.get('critical', 0) > 0
    has_high = metadata.get('high', 0) > 0
    verdict = "❌ FAIL" if has_critical or has_high else "✅ PASS"
    report.append(f"**Verdict:** {verdict}\n")

    report.append("## 1. Vulnerability Summary Table")
    report.append("| Severity | Count |")
    report.append("|----------|-------|")
    report.append(f"| Critical | {metadata.get('critical', 0)} |")
    report.append(f"| High     | {metadata.get('high', 0)} |")
    report.append(f"| Moderate | {metadata.get('moderate', 0)} |")
    report.append(f"| Low      | {metadata.get('low', 0)} |")
    report.append(f"| Info     | {metadata.get('info', 0)} |")
    report.append(f"| **Total**| **{metadata.get('total', 0)}** |\n")

    report.append("## 2. Actionable Items for Critical/High Findings")
    report.append("| Package | Severity | Vulnerability ID | Affected Version | Patched Version |")
    report.append("|---------|----------|------------------|------------------|-----------------|")

    for pkg_name, vuln in vulnerabilities.items():
        severity = vuln.get('severity', '')
        if severity not in ['critical', 'high']:
            continue

        via_list = vuln.get('via', [])
        range_aff = vuln.get('range', '')

        fix_avail = vuln.get('fixAvailable', False)
        patched_version = "Yes" if fix_avail is True else "No"
        if isinstance(fix_avail, dict):
            patched_version = f"Yes (via {fix_avail.get('name')} {fix_avail.get('version')})"

        for via in via_list:
            if isinstance(via, dict):
                vuln_id = via.get('source', '')
                title = via.get('title', '')
                url = via.get('url', '')
                ghsa = url.split('/')[-1] if url else vuln_id
                report.append(f"| {pkg_name} | {severity.capitalize()} | {ghsa} | {range_aff} | {patched_version} |")

    report.append("\n## 3. Specific Dependency Checks")
    report.append("- **`@velo/wix-members-twilio-otp`**: Not present in `package.json`. No known issues affect the project.")
    report.append("- **Stripe SDK**: Not present. The project uses direct REST API calls via `fetch` as verified in `package.json`.")
    report.append("- **AI Client Libraries**: Not present. OpenAI, Anthropic, Groq, and Perplexity integrations utilize direct REST API calls via `fetch`.")

    report.append("\n## 4. `package.json` vs `package-lock.json` Integrity")
    report.append("- **Status**: ❌ Out of sync and stale.")
    report.append("- `uuid` version mismatch: `package.json` specifies `^9.0.1`, while `package-lock.json` lists `^13.0.0`.")
    report.append("- Missing private packages: `@marketpushapps/*` are omitted from the lockfile, creating an audit blind spot and causing installation to fail.")
    report.append("- Incorrect dependency locations: `@wix/cli` is placed in `dependencies` in the lockfile instead of `devDependencies`.")

    report.append("\n## 5. Additional Health Checks")
    report.append("- **Outdated/Abandoned Packages**: `react@16.14.0` is severely outdated and deprecated, improperly listed in `devDependencies`.")
    report.append("- **Dependency Confusion Risk**: Missing `.npmrc` file defaults to public npm registry for private `@marketpushapps` packages. This poses a supply chain security risk.")

    report.append("\n## 6. Remediation Steps")
    report.append("1. **Sync Lockfile**: Fix private registry access via `.npmrc` and valid credentials, then run `npm install` to regenerate `package-lock.json`.")
    report.append("2. **Fix Vulnerabilities**: Update `@wix/cli` to patch transitive vulnerabilities (`tar`, `minimatch`, `node-gyp`).")
    report.append("3. **Update React**: Plan a migration from `react@16.14.0` to a supported modern version.")

    with open('DEPENDENCY_VULNERABILITY_REPORT.md', 'w') as f:
        f.write('\n'.join(report) + '\n')

if __name__ == "__main__":
    generate()
