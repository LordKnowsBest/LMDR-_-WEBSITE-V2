# enforce-surface-branding.ps1
# Claude Code PostToolUse hook
# Ensures non-driver HTML files use VelocityMatch branding (not LMDR).
# Driver files (src/public/driver/) are exempt — they keep LMDR branding.

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$input = $InputJson | ConvertFrom-Json

# Only check Write and Edit tools
if ($input.tool_name -notin @("Write", "Edit")) {
    exit 0
}

$filePath = $input.tool_input.file_path

# Skip if not an HTML file
if (-not $filePath.EndsWith(".html")) {
    exit 0
}

$normalizedPath = $filePath -replace '\\', '/'

# Skip driver files — they keep LMDR branding
if ($normalizedPath -match "src/public/driver/") {
    exit 0
}

# Skip non-public files
if ($normalizedPath -notmatch "src/public/") {
    exit 0
}

# Determine content to scan
$contentToCheck = ""
if ($input.tool_name -eq "Edit") {
    $contentToCheck = $input.tool_input.new_string
} elseif ($input.tool_name -eq "Write") {
    $contentToCheck = $input.tool_input.content
}

if (-not $contentToCheck) {
    exit 0
}

$violations = @()

# Check for old logo icon
if ($contentToCheck -match '>LM</div>') {
    $violations += "Logo icon uses 'LM' — must be 'VM' on non-driver surfaces"
}

# Check for old brand name patterns
if ($contentToCheck -match 'LMDR<span') {
    $violations += "Brand name uses 'LMDR' — must be 'VelocityMatch' on non-driver surfaces"
}
if ($contentToCheck -match 'LMDR\.ai') {
    $violations += "Brand name uses 'LMDR.ai' — must be 'VelocityMatch' on non-driver surfaces"
}

# Check for LMDR in title tags
if ($contentToCheck -match '<title>[^<]*LMDR[^<]*</title>') {
    $violations += "Page title contains 'LMDR' — must use 'VelocityMatch' on non-driver surfaces"
}

if ($violations.Count -eq 0) {
    exit 0
}

# Report violations
Write-Output "BLOCKED: Non-driver HTML file contains LMDR branding"
Write-Output ""
Write-Output "File: $filePath"
Write-Output ""
Write-Output "Violations:"
foreach ($v in $violations) {
    Write-Output "  - $v"
}
Write-Output ""
Write-Output "RULE: All non-driver surfaces use VelocityMatch branding."
Write-Output "  Logo icon: VM  |  Brand: VelocityMatch  |  Title: ... | VelocityMatch"
Write-Output ""
Write-Output "See .claude/docs/surface-branding.md for the full branding table."

exit 2
