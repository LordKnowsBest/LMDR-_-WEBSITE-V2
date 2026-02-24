import os
import re

# Known secret names to check for assignments
known_secret_names = [
    "CLAUDE_API_KEY", "PERPLEXITY_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY",
    "GEMINI_API_KEY", "MISTRAL_API_KEY", "FMCSA_WEB_KEY", "SECRET_KEY_STRIPE",
    "PUBLISHABLE_STRIPE", "STRIPE_WEBHOOK_SECRET", "AIRTABLE_PAT", "API_KEY_PEPPER"
]

# Patterns to search for
patterns = [
    (r"sk_live_[a-zA-Z0-9]+", "Stripe Live Secret Key", "Critical"),
    (r"pk_live_[a-zA-Z0-9]+", "Stripe Live Publishable Key", "Critical"),
    (r"sk_test_[a-zA-Z0-9]+", "Stripe Test Secret Key", "High"),
    (r"pk_test_[a-zA-Z0-9]+", "Stripe Test Publishable Key", "High"),
    (r"pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}", "Airtable PAT", "Critical"),
    (r"key[a-zA-Z0-9]{14}", "Airtable Legacy Key", "Critical"),
    (r"Bearer\s+[a-zA-Z0-9\-\._~+/]+=*", "Bearer Token", "Critical"),
    (r"ntn_[a-zA-Z0-9]+", "Notion Token", "Critical"),
    (r"xox[baprs]-[a-zA-Z0-9-]+", "Slack Token", "Critical"),
    # Generic assignment checks
    (r"(?i)(api_key|apikey|secret|token|password)\s*[:=]\s*['\"](?!YOUR_|INSERT_|PLACEHOLDER)[a-zA-Z0-9_\-\.]{8,}['\"]", "Generic API Key/Secret Assignment", "High"),
    (r"(?i)(api_key|apikey|secret|token|password)\s*[:=]\s*`(?!YOUR_|INSERT_|PLACEHOLDER)[a-zA-Z0-9_\-\.]{8,}`", "Generic API Key/Secret Assignment (Template Literal)", "High"),
]

# Add patterns for known secret names
for name in known_secret_names:
    patterns.append((rf"{name}\s*[:=]\s*['\"](?!YOUR_|INSERT_|PLACEHOLDER)[^'\"]+['\"]", f"Assignment to {name}", "Critical"))


# Files and directories to ignore
ignore_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.lock', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4']
ignore_dirs = ['node_modules', '.git', '.idea', '.vscode', 'dist', 'build', 'artifacts']
ignore_files = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

findings = []

def is_test_file(filepath):
    return '__tests__' in filepath or 'test' in filepath.lower() or 'spec' in filepath.lower()

def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')

            for i, line in enumerate(lines):
                line_stripped = line.strip()
                # Skip full line comments
                if line_stripped.startswith('//') or line_stripped.startswith('#') or line_stripped.startswith('*'):
                    continue

                for pattern, description, severity in patterns:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        match_str = match.group()

                        # Filter out common false positives
                        if "process.env" in line or "getSecret" in line:
                            continue
                        if "YOUR_" in match_str or "INSERT_" in match_str or "PLACEHOLDER" in match_str:
                            continue
                        if "example" in match_str.lower():
                            continue

                        # Adjust severity if it's a test file
                        final_severity = severity
                        if is_test_file(filepath):
                            final_severity = "Warning (Test File)"

                        findings.append({
                            "file": filepath,
                            "line": i + 1,
                            "match": match_str,
                            "description": description,
                            "severity": final_severity,
                            "content": line_stripped
                        })
    except Exception as e:
        # print(f"Error reading {filepath}: {e}")
        pass

def main():
    # Scan root files
    root_files = ['.mcp.json', 'wix.config.json', 'lmdr-branding-skill.json']
    for rf in root_files:
        if os.path.exists(rf):
            scan_file(rf)

    # Scan src directory
    for root, dirs, files in os.walk('src'):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]

        for file in files:
            if any(file.endswith(ext) for ext in ignore_extensions) or file in ignore_files:
                continue

            filepath = os.path.join(root, file)
            scan_file(filepath)

    # Output findings to a report file
    report_lines = []
    report_lines.append("# Secrets Audit Report")
    report_lines.append("")

    if findings:
        report_lines.append(f"Found {len(findings)} potential secrets:")
        report_lines.append("")
        for f in findings:
            report_lines.append(f"## {f['description']}")
            report_lines.append(f"- **File:** `{f['file']}`")
            report_lines.append(f"- **Line:** {f['line']}")
            report_lines.append(f"- **Severity:** {f['severity']}")
            report_lines.append(f"- **Match:** `{f['match']}`")
            report_lines.append(f"- **Context:** `{f['content']}`")
            report_lines.append("")

            # Recommendation
            if "Stripe" in f['description'] or "Token" in f['description'] or "Key" in f['description']:
                report_lines.append(f"**Recommendation:** Replace hardcoded value with `wix-secrets-backend.getSecret('SECRET_NAME')`.")

            report_lines.append("---")
    else:
        report_lines.append("No secrets found matching the patterns in production code.")
        report_lines.append("The codebase passes the credential exposure check.")

    output_file = 'SECRETS_SCAN_RAW.md'
    with open(output_file, 'w') as f:
        f.write('\n'.join(report_lines))

    print(f"Scan complete. Report generated at {output_file}")
    print(f"Found {len(findings)} issues.")

if __name__ == "__main__":
    main()
