<#
.SYNOPSIS
    Restores package.json after tests complete.

.DESCRIPTION
    This hook runs after `npm test` commands to restore the original package.json
    from the backup created by prepare-test-env.ps1.
#>

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$hookData = $InputJson | ConvertFrom-Json
$tool = $hookData.tool_name
$toolInput = $hookData.tool_input

# Only run for Bash commands that look like test commands
if ($tool -ne "Bash") {
    exit 0
}

$command = $toolInput.command
if (-not ($command -match "npm\s+test" -or $command -match "jest" -or $command -match "npm\s+run\s+test")) {
    exit 0
}

$projectRoot = "C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2"
$packageJson = Join-Path $projectRoot "package.json"
$backupFile = Join-Path $projectRoot "package.json.test-backup"

# Check if backup exists
if (-not (Test-Path $backupFile)) {
    exit 0
}

Write-Host "[test-hook] Restoring original package.json..."

# Restore original
Move-Item $backupFile $packageJson -Force

Write-Host "[test-hook] package.json restored"

exit 0
