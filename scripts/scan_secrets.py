import os
import re

# Configuration
SEARCH_PATHS = ["src"]
ROOT_FILES = [".mcp.json", "wix.config.json", "lmdr-branding-skill.json"]
IGNORE_DIRS = {"node_modules", ".git", "dist", "build", "coverage", "__pycache__"}
IGNORE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".lock", ".pdf", ".woff", ".woff2", ".ttf", ".eot", ".md", ".txt"}

# Known Secret Variable Names (case-insensitive partial match)
SECRET_VAR_NAMES = [
    "CLAUDE_API_KEY", "PERPLEXITY_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY",
    "GEMINI_API_KEY", "MISTRAL_API_KEY", "FMCSA_WEB_KEY", "SECRET_KEY_STRIPE",
    "PUBLISHABLE_STRIPE", "STRIPE_WEBHOOK_SECRET", "AIRTABLE_PAT", "API_KEY_PEPPER",
    "API_KEY", "ACCESS_TOKEN", "SECRET_KEY", "AUTH_TOKEN"
]

# Patterns to Search For (Regex, Description)
PATTERNS = [
    (r"sk_live_[a-zA-Z0-9]+", "Stripe Live Secret Key"),
    (r"pk_live_[a-zA-Z0-9]+", "Stripe Live Publishable Key"),
    (r"sk_test_[a-zA-Z0-9]+", "Stripe Test Secret Key"),
    (r"pk_test_[a-zA-Z0-9]+", "Stripe Test Publishable Key"),
    (r"pat[a-zA-Z0-9]{14}\.[a-zA-Z0-9]{64}", "Airtable PAT"),
    (r"key[a-zA-Z0-9]{14}", "Airtable Legacy Key"),
    (r"ntn_[a-zA-Z0-9]+", "Notion Token"),
    (r"xox[baprs]-[a-zA-Z0-9-]+", "Slack Token"),
    (r"Bearer\s+[a-zA-Z0-9\-\._~+/]+=*", "Bearer Token Authorization Header"),
    # Generic assignment: var = "high_entropy_string"
    # Captures: varName = "value", varName: "value"
    # We will refine this logic in the scan loop to check variable names against SECRET_VAR_NAMES
]

# Exclusions
SAFE_PATTERNS = [
    "process.env",
    "wix-secrets-backend",
    "getSecret",
    "YOUR_",
    "INSERT_",
    "PLACEHOLDER",
    "<",
    "EXAMPLE",
    "TEST_KEY",
    "MOCK_KEY"
]

findings = []

def is_safe(line):
    for safe in SAFE_PATTERNS:
        if safe in line:
            return True
    return False

def check_variable_assignment(line, line_num, filepath):
    # Check for assignments to known secret variables
    # Regex for: VAR_NAME = "value", VAR_NAME: "value", or "VAR_NAME": "value" (JSON)
    for var_name in SECRET_VAR_NAMES:
        # Allow optional quotes around the variable name for JSON keys
        pattern = re.compile(rf"['\"]?({var_name})['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)
        match = pattern.search(line)
        if match:
            var_found = match.group(1)
            value_found = match.group(2)

            # Additional check: value length > 8 to avoid short test strings
            if len(value_found) > 8 and not is_safe(line):
                findings.append({
                    "file": filepath,
                    "line": line_num,
                    "type": "Variable Assignment",
                    "match": f"{var_found} = ...",
                    "content": line.strip()
                })

def scan_file(filepath):
    try:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except UnicodeDecodeError:
            with open(filepath, 'r', encoding='latin-1') as f:
                lines = f.readlines()

        for i, line in enumerate(lines):
            line_content = line.strip()
            if not line_content:
                continue

            # Skip comments (basic check)
            if line_content.startswith("//") or line_content.startswith("#") or line_content.startswith("*"):
                continue

            # Check explicit patterns
            for pattern_re, desc in PATTERNS:
                matches = re.findall(pattern_re, line_content)
                for match in matches:
                    if not is_safe(line_content):
                        findings.append({
                            "file": filepath,
                            "line": i + 1,
                            "type": desc,
                            "match": match,
                            "content": line_content
                        })

            # Check variable assignments
            check_variable_assignment(line_content, i + 1, filepath)

    except Exception as e:
        print(f"Error reading {filepath}: {e}")

def main():
    print("Starting Advanced Secret Scan...")

    # Scan root files
    for rf in ROOT_FILES:
        if os.path.exists(rf):
            scan_file(rf)

    # Scan src directory
    for search_path in SEARCH_PATHS:
        for root, dirs, files in os.walk(search_path):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in IGNORE_EXTENSIONS:
                    continue

                filepath = os.path.join(root, file)
                scan_file(filepath)

    # Report Findings
    if findings:
        print(f"\nFAILURE: Found {len(findings)} potential secrets!\n")
        print("| File | Line | Type | Match Snippet |")
        print("|---|---|---|---|")
        for f in findings:
            # Redact part of the match for safety in logs
            match_display = f["match"]
            if len(match_display) > 10:
                match_display = match_display[:4] + "..." + match_display[-4:]

            print(f"| {f['file']} | {f['line']} | {f['type']} | {match_display} |")
            # print(f"  Context: {f['content']}") # Uncomment for full context
    else:
        print("\nSUCCESS: No hardcoded secrets found matching the patterns.")

if __name__ == "__main__":
    main()
