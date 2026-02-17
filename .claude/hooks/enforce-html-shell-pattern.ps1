# enforce-html-shell-pattern.ps1
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

$ErrorActionPreference = "Continue"

# Read tool input from stdin
$input = $null
try {
    $input = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
    exit 0
}

# Only check Write and Edit tools
if ($input.tool_name -notin @("Write", "Edit")) {
    exit 0
}

$filePath = $input.tool_input.file_path
if (-not $filePath) {
    exit 0
}

# Only check HTML files in src/public/
if ($filePath -notmatch "src[/\\]public[/\\].*\.(html|HTML)$") {
    exit 0
}

# Skip archive, tests, utility/email
if ($filePath -match "_archive|__tests__|utility[/\\]email") {
    exit 0
}

# Get content to analyze
$content = $null
if ($input.tool_input.content) {
    $content = $input.tool_input.content
} elseif (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
}

if (-not $content) {
    exit 0
}

$fileName = Split-Path $filePath -Leaf
$totalLines = ($content -split "`n").Count

# --- Parse inline <script> blocks ---
# Match <script> blocks WITHOUT src attribute
$inlinePattern = [regex]::new('<script(?![^>]*\bsrc\b)[^>]*>(.*?)</script>', 'Singleline,IgnoreCase')
$cdnPattern = [regex]::new('<script[^>]+src=[''"]https?://cdn\.jsdelivr\.net/', 'IgnoreCase')

$matches = $inlinePattern.Matches($content)
$totalInlineLines = 0
$maxBlockLines = 0

foreach ($match in $matches) {
    $blockContent = $match.Groups[1].Value
    $lines = ($blockContent -split "`n" | Where-Object { $_.Trim() -ne "" }).Count
    $totalInlineLines += $lines
    if ($lines -gt $maxBlockLines) {
        $maxBlockLines = $lines
    }
}

$cdnScriptCount = $cdnPattern.Matches($content).Count

# --- Evaluate rules ---
$blocked = $false
$reasons = @()

# Rule 1: Single inline <script> block > 80 lines
if ($maxBlockLines -gt 80) {
    $blocked = $true
    $reasons += "  - Inline <script> block has $maxBlockLines lines (max: 80)"
    $reasons += "    Extract to src/public/<surface>/js/<module>.js and load via CDN"
}

# Rule 2: Total inline JS > 150 lines
if ($totalInlineLines -gt 150) {
    $blocked = $true
    $reasons += "  - Total inline JS: $totalInlineLines lines (max: 150)"
    $reasons += "    Split business logic into external JS modules"
}

# Rule 3: HTML > 200 lines but no CDN script references
if ($totalLines -gt 200 -and $cdnScriptCount -eq 0) {
    $blocked = $true
    $reasons += "  - HTML is $totalLines lines with 0 external CDN scripts"
    $reasons += "    Must use cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@... pattern"
}

if ($blocked) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "  HTML SHELL PATTERN VIOLATION"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "  File: $fileName"
    Write-Host "  Total lines: $totalLines | Inline JS: $totalInlineLines lines | CDN scripts: $cdnScriptCount"
    Write-Host ""
    Write-Host "  Violations:"
    foreach ($r in $reasons) {
        Write-Host $r
    }
    Write-Host ""
    Write-Host "  REQUIRED: Follow the Shell + CDN Modules pattern:"
    Write-Host ""
    Write-Host "    1. HTML shell: markup, root container, Tailwind inline config"
    Write-Host "    2. External JS: cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/..."
    Write-Host "    3. External CSS: same CDN pattern for stylesheets"
    Write-Host "    4. Inline JS: only bootstrap/init code (<80 lines per block)"
    Write-Host ""
    Write-Host "  Gold standard: src/public/recruiter/os/RecruiterOS.html (100 lines)"
    Write-Host "  See CLAUDE.md 'HTML Shell Pattern' for full details."
    Write-Host ""
    Write-Host "================================================================"
    Write-Host ""
    exit 1
}

exit 0
