<#
.SYNOPSIS
    Auto-syncs the globally installed @wix/cli version into package.json.

.DESCRIPTION
    Runs before wix dev / wix publish / wix preview.
    Reads the globally installed CLI version, compares to package.json,
    and updates package.json if they differ — preventing 404s caused by
    version mismatches between the local project and the installed CLI.
#>

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$hookData = $InputJson | ConvertFrom-Json
$tool     = $hookData.tool_name
$command  = $hookData.tool_input.command

# Only fire on wix dev / wix publish / wix preview
if ($tool -ne "Bash") { exit 0 }
if ($command -notmatch "^\s*wix\s+(dev|publish|preview)") { exit 0 }

$projectRoot = "C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2"
$packageJsonPath = Join-Path $projectRoot "package.json"

# Get the globally installed CLI version
try {
    $globalVersion = (& wix --version 2>$null).Trim()
} catch {
    exit 0  # wix not in PATH — nothing to do
}

if (-not $globalVersion -or $globalVersion -notmatch '^\d+\.\d+\.\d+') { exit 0 }

# Read package.json
$pkg = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$currentPin = $pkg.devDependencies.'@wix/cli'

# Strip leading ^ or ~ if present
$currentVersion = $currentPin -replace '^[\^~]', ''

if ($currentVersion -eq $globalVersion) { exit 0 }

# Update the pin to match the global CLI
$pkg.devDependencies.'@wix/cli' = $globalVersion
$pkg | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8

Write-Host "[wix-version-sync] Updated @wix/cli pin: $currentVersion -> $globalVersion"
Write-Host "[wix-version-sync] Remember to commit package.json after this run."

exit 0
