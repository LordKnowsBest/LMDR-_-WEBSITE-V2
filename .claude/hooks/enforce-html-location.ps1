# enforce-html-location.ps1
# Claude Code hook to enforce HTML files are placed in src/public/

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$input = $InputJson | ConvertFrom-Json

# Only check Write and Edit tools
if ($input.tool_name -notin @("Write", "Edit")) {
    exit 0
}

# Get the file path from tool input
$filePath = $input.tool_input.file_path

# Skip if not an HTML file
if (-not $filePath.EndsWith(".html")) {
    exit 0
}

# Normalize path separators
$normalizedPath = $filePath -replace '\\', '/'

# Check if file is in src/public/
if ($normalizedPath -match "src/public/") {
    exit 0
}

# Check if it's in coverage or node_modules (allow these)
if ($normalizedPath -match "(coverage|node_modules)/") {
    exit 0
}

# Block the operation - HTML file not in correct location
$suggestedPath = $normalizedPath -replace '^.*/([^/]+\.html)$', 'src/public/$1'

Write-Output "BLOCKED: HTML files must be placed in src/public/"
Write-Output ""
Write-Output "Attempted path: $filePath"
Write-Output "Correct path:   $suggestedPath"
Write-Output ""
Write-Output "See CLAUDE.md 'File Organization Standards' for details."

exit 2
