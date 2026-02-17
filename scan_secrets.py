import os
import re

# Patterns to search for
patterns = [
    (r"sk_live_[a-zA-Z0-9]+", "Stripe Live Secret Key"),
    (r"pk_live_[a-zA-Z0-9]+", "Stripe Live Publishable Key"),
    (r"sk_test_[a-zA-Z0-9]+", "Stripe Test Secret Key"),
    (r"pk_test_[a-zA-Z0-9]+", "Stripe Test Publishable Key"),
    (r"pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}", "Airtable PAT"),
    (r"key[a-zA-Z0-9]{14}", "Airtable Legacy Key"),
    (r"Bearer [a-zA-Z0-9\-\._~+/]+=*", "Bearer Token"),
    (r"ntn_[a-zA-Z0-9]+", "Notion Token"),
    (r"xox[baprs]-[a-zA-Z0-9-]+", "Slack Token"),
    (r"(?i)(api_key|apikey|secret|token|password)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.]{8,}['\"]", "Generic API Key/Secret Assignment"),
    (r"(?i)(api_key|apikey|secret|token|password)\s*[:=]\s*`[a-zA-Z0-9_\-\.]{8,}`", "Generic API Key/Secret Assignment (Template Literal)"),
]

# Files to ignore (e.g. package-lock.json, images)
ignore_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.lock', '.pdf', '.woff', '.woff2', '.ttf', '.eot']
ignore_dirs = ['node_modules', '.git', '.idea', '.vscode']

findings = []

def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')

            for i, line in enumerate(lines):
                # Skip comments if possible (simple check)
                if line.strip().startswith('//') or line.strip().startswith('#'):
                    continue

                for pattern, description in patterns:
                    matches = re.findall(pattern, line)
                    for match in matches:
                        # Filter out common false positives
                        if "process.env" in line or "getSecret" in line:
                            continue

                        # If generic match, check if it looks like a real secret (entropy/length check roughly done by regex)
                        # Also avoid matching things like "Bearer <token>" in comments/docs if not filtered by comment check

                        findings.append({
                            "file": filepath,
                            "line": i + 1,
                            "match": match,
                            "description": description,
                            "content": line.strip()
                        })
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

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
            if any(file.endswith(ext) for ext in ignore_extensions):
                continue

            filepath = os.path.join(root, file)
            scan_file(filepath)

    # Output findings
    if findings:
        print(f"Found {len(findings)} potential secrets:")
        for f in findings:
            print(f"[{f['description']}] {f['file']}:{f['line']}")
            print(f"  Match: {f['match']}")
            print(f"  Context: {f['content']}")
            print("-" * 20)
    else:
        print("No secrets found matching the patterns.")

if __name__ == "__main__":
    main()
