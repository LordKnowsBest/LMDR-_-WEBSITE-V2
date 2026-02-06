<#
.SYNOPSIS
    Prepares the test environment by temporarily removing Wix marketplace packages
    that are not available in the public npm registry.

.DESCRIPTION
    This hook runs before `npm test` commands to:
    1. Backup package.json
    2. Remove @marketpushapps/* and @velo/* packages (Wix-specific)
    3. Remove @wix/* packages and postinstall script
    4. Allow Jest to run without registry errors

    The cleanup-test-env.ps1 hook restores package.json after tests complete.
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

# Check if already prepared (backup exists)
if (Test-Path $backupFile) {
    Write-Host "[test-hook] Test environment already prepared"
    exit 0
}

Write-Host "[test-hook] Preparing test environment..."

# Backup original
Copy-Item $packageJson $backupFile -Force

# Read and modify package.json
$content = Get-Content $packageJson -Raw | ConvertFrom-Json

# Remove Wix marketplace dependencies
$depsToRemove = @(
    "@marketpushapps/airtable-connector",
    "@marketpushapps/airtable-connector-backend",
    "@marketpushapps/calendly-embed",
    "@marketpushapps/calendly-embed-backend",
    "@velo/wix-members-twilio-otp",
    "@velo/wix-members-twilio-otp-backend"
)

$newDeps = @{}
if ($content.dependencies) {
    $content.dependencies.PSObject.Properties | ForEach-Object {
        if ($_.Name -notin $depsToRemove) {
            $newDeps[$_.Name] = $_.Value
        }
    }
}
$content.dependencies = $newDeps

# Remove Wix CLI from devDependencies
$newDevDeps = @{}
if ($content.devDependencies) {
    $content.devDependencies.PSObject.Properties | ForEach-Object {
        if ($_.Name -notmatch "^@wix/") {
            $newDevDeps[$_.Name] = $_.Value
        }
    }
}
$content.devDependencies = $newDevDeps

# Remove postinstall script (calls wix sync-types)
if ($content.scripts -and $content.scripts.postinstall) {
    $content.scripts.PSObject.Properties.Remove("postinstall")
}

# Write modified package.json
$content | ConvertTo-Json -Depth 10 | Set-Content $packageJson -Encoding UTF8

Write-Host "[test-hook] Removed Wix marketplace packages from package.json"
Write-Host "[test-hook] Original backed up to package.json.test-backup"

# Check if node_modules needs updating
$babelPreset = Join-Path $projectRoot "node_modules\@babel\preset-env"
if (-not (Test-Path $babelPreset)) {
    Write-Host "[test-hook] Installing test dependencies..."
    Push-Location $projectRoot
    npm install --ignore-scripts 2>&1 | Out-Null
    Pop-Location
    Write-Host "[test-hook] Dependencies installed"
}

exit 0
