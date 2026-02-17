#!/usr/bin/env bash
# enforce-html-shell-pattern.sh
# PostToolUse hook — blocks Write/Edit of HTML files that violate the shell pattern.
#
# The "shell pattern" means:
#   1. HTML is a lightweight shell (markup + root container)
#   2. Business logic JS lives in external modules loaded via CDN
#   3. Only tiny inline <script> blocks allowed (init, bootstrap, small helpers)
#   4. CSS externalized to CDN except inline Tailwind config
#
# Gold standard: RecruiterOS.html (100 lines, zero business logic inline)
#
# Thresholds:
#   - Max total inline <script> content: 150 lines
#   - Must have >=1 external CDN <script src> if HTML > 200 lines
#   - Single inline <script> block > 80 lines = BLOCKED

set -euo pipefail

# Read tool input JSON from stdin
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

# Only check Write and Edit tools
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# Only check HTML files in src/public/
if [[ ! "$FILE_PATH" =~ src/public/.*\.[hH][tT][mM][lL]$ ]]; then
  exit 0
fi

# Skip archive, tests, utility/email templates
if [[ "$FILE_PATH" =~ (_archive|__tests__|utility/email) ]]; then
  exit 0
fi

# For Write tool, use the content directly; for Edit, read the file after edit
CONTENT=""
if [[ "$TOOL_NAME" == "Write" ]]; then
  CONTENT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('content',''))" 2>/dev/null || echo "")
else
  # Edit tool — read the file on disk (post-edit)
  if [[ -f "$FILE_PATH" ]]; then
    CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
  fi
fi

if [[ -z "$CONTENT" ]]; then
  exit 0
fi

FILENAME=$(basename "$FILE_PATH")
TOTAL_LINES=$(echo "$CONTENT" | wc -l)

# --- Count inline <script> lines (not <script src=...>) ---
# Use Python for reliable multi-line parsing
read -r INLINE_JS_LINES MAX_BLOCK_LINES CDN_SCRIPT_COUNT <<< $(echo "$CONTENT" | python3 -c "
import sys, re

html = sys.stdin.read()

# Find all <script>...</script> blocks that are NOT <script src=...>
# Match inline scripts (no src attribute)
inline_pattern = re.compile(r'<script(?![^>]*\bsrc\b)[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
cdn_pattern = re.compile(r'<script[^>]+src=['\''\"](https?://cdn\.jsdelivr\.net/|https?://[^'\''\"]*/js/)[^'\''\">]*['\''\"]\s*/?\s*>', re.IGNORECASE)

inline_blocks = inline_pattern.findall(html)

total_inline = 0
max_block = 0
for block in inline_blocks:
    lines = len([l for l in block.strip().split('\n') if l.strip()])
    total_inline += lines
    if lines > max_block:
        max_block = lines

cdn_count = len(cdn_pattern.findall(html))

print(f'{total_inline} {max_block} {cdn_count}')
" 2>/dev/null || echo "0 0 0")

BLOCKED=false
REASONS=""

# Rule 1: Single inline <script> block > 80 lines
if [[ "$MAX_BLOCK_LINES" -gt 80 ]]; then
  BLOCKED=true
  REASONS="${REASONS}\n  - Inline <script> block has ${MAX_BLOCK_LINES} lines (max: 80)"
  REASONS="${REASONS}\n    Extract to src/public/<surface>/js/<module>.js and load via CDN"
fi

# Rule 2: Total inline JS > 150 lines
if [[ "$INLINE_JS_LINES" -gt 150 ]]; then
  BLOCKED=true
  REASONS="${REASONS}\n  - Total inline JS: ${INLINE_JS_LINES} lines (max: 150)"
  REASONS="${REASONS}\n    Split business logic into external JS modules"
fi

# Rule 3: HTML > 200 lines but no CDN script references
if [[ "$TOTAL_LINES" -gt 200 && "$CDN_SCRIPT_COUNT" -eq 0 ]]; then
  BLOCKED=true
  REASONS="${REASONS}\n  - HTML is ${TOTAL_LINES} lines with 0 external CDN scripts"
  REASONS="${REASONS}\n    Must use cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@... pattern"
fi

if [[ "$BLOCKED" == "true" ]]; then
  echo ""
  echo "================================================================"
  echo "  HTML SHELL PATTERN VIOLATION"
  echo "================================================================"
  echo ""
  echo "  File: $FILENAME"
  echo "  Total lines: $TOTAL_LINES | Inline JS: $INLINE_JS_LINES lines | CDN scripts: $CDN_SCRIPT_COUNT"
  echo ""
  echo "  Violations:"
  echo -e "$REASONS"
  echo ""
  echo "  REQUIRED: Follow the Shell + CDN Modules pattern:"
  echo ""
  echo "    1. HTML shell: markup, root container, Tailwind inline config"
  echo "    2. External JS: cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/..."
  echo "    3. External CSS: same CDN pattern for stylesheets"
  echo "    4. Inline JS: only bootstrap/init code (<80 lines per block)"
  echo ""
  echo "  Gold standard: src/public/recruiter/os/RecruiterOS.html (100 lines)"
  echo "  See CLAUDE.md 'HTML Shell Pattern' for full details."
  echo ""
  echo "================================================================"
  echo ""
  exit 1
fi

exit 0
