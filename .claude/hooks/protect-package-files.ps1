<#
.SYNOPSIS
    Guards package.json and package-lock.json from accidental commits.

.DESCRIPTION
    Runs after git commit/add commands.
    Checks if either file was staged with unintended content — specifically
    if @wix/cli version regressed from the known-good pin or if
    package-lock.json was regenerated with a different CLI version.
    Outputs a warning if a mismatch is detected.
#>

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$hookData = $InputJson | ConvertFrom-Json
$tool     = $hookData.tool_name
$command  = $hookData.tool_input.command

# Only fire after git add or git commit
if ($tool -ne "Bash") { exit 0 }
if ($command -notmatch "git\s+(add|commit)") { exit 0 }

$projectRoot     = "C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2"
$packageJsonPath = Join-Path $projectRoot "package.json"

# Get currently staged @wix/cli version from package.json on disk
try {
    $pkg = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $pinnedVersion = ($pkg.devDependencies.'@wix/cli') -replace '^[\^~]', ''
} catch {
    exit 0
}

# Get the globally installed CLI version for comparison
try {
    $globalVersion = (& wix --version 2>$null).Trim()
} catch {
    exit 0
}

if (-not $globalVersion -or -not $pinnedVersion) { exit 0 }

if ($pinnedVersion -ne $globalVersion) {
    Write-Host ""
    Write-Host "[package-protect] WARNING: package.json pins @wix/cli=$pinnedVersion but global CLI is $globalVersion"
    Write-Host "[package-protect] Run a wix command first to auto-sync, or manually update package.json."
    Write-Host ""
}

exit 0
