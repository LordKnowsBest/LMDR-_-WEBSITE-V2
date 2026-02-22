import os
import re

# Patterns to search for
patterns = [
    (r"sk_live_[a-zA-Z0-9]+", "Stripe Live Secret Key", "CRITICAL"),
    (r"pk_live_[a-zA-Z0-9]+", "Stripe Live Publishable Key", "WARNING"),
    (r"sk_test_[a-zA-Z0-9]+", "Stripe Test Secret Key", "WARNING"),
    (r"pk_test_[a-zA-Z0-9]+", "Stripe Test Publishable Key", "INFO"),
    (r"pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}", "Airtable PAT", "CRITICAL"),
    (r"key[a-zA-Z0-9]{14}", "Airtable Legacy Key", "CRITICAL"),
    (r"ntn_[a-zA-Z0-9]+", "Notion Token", "CRITICAL"),
    (r"xox[baprs]-[a-zA-Z0-9-]+", "Slack Token", "CRITICAL"),
    (r"ghp_[a-zA-Z0-9]+", "GitHub Personal Access Token", "CRITICAL"),
    (r"glpat-[a-zA-Z0-9\-]+", "GitLab Personal Access Token", "CRITICAL"),
    # Generic assignments
    (r"(?i)(api_?key|secret|token|password|auth)\s*[:=]\s*['\"](?!YOUR|Placeholder|Bearer)[a-zA-Z0-9_\-\.]{10,}['\"]", "Generic Secret Assignment", "WARNING"),
    (r"(?i)(api_?key|secret|token|password|auth)\s*[:=]\s*`(?!YOUR|Placeholder|Bearer)[a-zA-Z0-9_\-\.]{10,}`", "Generic Secret Assignment (Template)", "WARNING"),
]

# Known safe placeholders or test values
allowlist = [
    "YOUR_AIRTABLE_PAT_HERE",
    "YOUR_NOTION_TOKEN_HERE",
    "Bearer YOUR_NOTION_TOKEN_HERE",
    "PERPLEXITY_API_KEY",
    "CLAUDE_API_KEY",
    "OPENAI_API_KEY",
    "GROQ_API_KEY",
    "GEMINI_API_KEY",
    "MISTRAL_API_KEY",
    "FMCSA_WEB_KEY",
    "SECRET_KEY_STRIPE",
    "PUBLISHABLE_STRIPE",
    "STRIPE_WEBHOOK_SECRET",
    "API_KEY_PEPPER",
    "GROQ",
    "LMDR_INTERNAL_KEY",
    "test-token-abc",
    "whsec_test",
    "pk_test_abc123",
    "sk_test_mock_key",
    "lmdr_live_xxx", # From documentation example
    "Bearer lmdr_live_xxx",
    "key_1234567890", # Dummy keys
    "process.env",
    "getSecret",
]

# Files/Dirs to ignore
ignore_dirs = ['node_modules', '.git', '.idea', '.vscode', 'dist', 'build', 'artifacts']
ignore_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.lock', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm']
test_dirs = ['__tests__', '__mocks__', 'tests', 'test']

findings = []

def is_safe(match_text, line):
    # Check against allowlist
    for allowed in allowlist:
        if allowed in match_text or allowed in line:
            return True

    # Check for test files logic (handled in loop, but here check content context)
    if "example" in line.lower() or "sample" in line.lower() or "dummy" in line.lower():
        return True

    return False

def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')

            for i, line in enumerate(lines):
                line_stripped = line.strip()
                if not line_stripped:
                    continue

                # Skip comments (basic check)
                if line_stripped.startswith('//') or line_stripped.startswith('#') or line_stripped.startswith('*'):
                    continue

                for pattern, description, severity in patterns:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        match_text = match.group(0)

                        if is_safe(match_text, line):
                            continue

                        # Determine if it's a test file
                        is_test = any(td in filepath for td in test_dirs) or filepath.endswith('.test.js') or filepath.endswith('.spec.js')

                        current_severity = severity
                        if is_test:
                            current_severity = "INFO" # Downgrade severity for test files

                        findings.append({
                            "file": filepath,
                            "line": i + 1,
                            "match": match_text,
                            "description": description,
                            "severity": current_severity,
                            "content": line_stripped
                        })
    except UnicodeDecodeError:
        # Binary file, skip
        pass
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

def main():
    print("Starting Secrets Scan...")

    # Scan root files
    root_files = ['.mcp.json', 'wix.config.json', 'lmdr-branding-skill.json', '.env', '.env.local']
    for rf in root_files:
        if os.path.exists(rf):
            scan_file(rf)

    # Scan src directory
    for root, dirs, files in os.walk('src'):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]

        for file in files:
            if any(file.endswith(ext) for ext in ignore_extensions):
                continue

            filepath = os.path.join(root, file)
            scan_file(filepath)

    # Output findings
    if findings:
        print(f"\nFound {len(findings)} potential issues:")

        # Sort by severity
        severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
        sorted_findings = sorted(findings, key=lambda x: severity_order.get(x['severity'], 3))

        for f in sorted_findings:
            print(f"[{f['severity']}] {f['description']}")
            print(f"  File: {f['file']}:{f['line']}")
            print(f"  Match: {f['match']}")
            print(f"  Context: {f['content']}")
            print("-" * 40)
    else:
        print("\nSUCCESS: No hardcoded secrets found matching the patterns.")

if __name__ == "__main__":
    main()
