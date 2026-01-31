# validate-table-names-sync.ps1
# Ensures camelCase aliases in airtableClient.jsw TABLE_NAMES stay in sync
# with AIRTABLE_TABLE_NAMES from config.jsw.
#
# Triggers: PostToolUse on Write|Edit of config.jsw or airtableClient.jsw

param()

$ErrorActionPreference = "Continue"

# Read tool input from stdin
$input = $null
try {
    $input = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
    exit 0
}

$filePath = $input.tool_input.file_path
if (-not $filePath) {
    exit 0
}

# Only check config.jsw or airtableClient.jsw
$fileName = Split-Path $filePath -Leaf
if ($fileName -ne "config.jsw" -and $fileName -ne "airtableClient.jsw") {
    exit 0
}

# Resolve project root from the file path
$projectRoot = $filePath
if ($filePath -match "(.*?)[/\\]src[/\\]backend[/\\]") {
    $projectRoot = $Matches[1]
} else {
    exit 0
}

$configPath = Join-Path $projectRoot "src/backend/config.jsw"
$airtablePath = Join-Path $projectRoot "src/backend/airtableClient.jsw"

if (-not (Test-Path $configPath) -or -not (Test-Path $airtablePath)) {
    exit 0
}

$configContent = Get-Content $configPath -Raw
$airtableContent = Get-Content $airtablePath -Raw

# Extract keys from AIRTABLE_TABLE_NAMES in config.jsw
# Pattern: camelCase key followed by colon in the AIRTABLE_TABLE_NAMES block
$inBlock = $false
$configKeys = @()
foreach ($line in ($configContent -split "`n")) {
    if ($line -match "AIRTABLE_TABLE_NAMES\s*=\s*\{") {
        $inBlock = $true
        continue
    }
    if ($inBlock) {
        if ($line -match "^\s*\};") {
            break
        }
        if ($line -match "^\s*(\w+)\s*:") {
            $configKeys += $Matches[1]
        }
    }
}

# Extract keys from TABLE_NAMES in airtableClient.jsw
$inBlock = $false
$tableKeys = @()
foreach ($line in ($airtableContent -split "`n")) {
    if ($line -match "^const TABLE_NAMES\s*=\s*\{") {
        $inBlock = $true
        continue
    }
    if ($inBlock) {
        if ($line -match "^\};") {
            break
        }
        if ($line -match "^\s*'([^']+)'\s*:") {
            $tableKeys += $Matches[1]
        }
    }
}

# Find config keys missing from TABLE_NAMES
$missing = @()
foreach ($key in $configKeys) {
    if ($tableKeys -notcontains $key) {
        $missing += $key
    }
}

if ($missing.Count -gt 0) {
    $missingList = $missing -join ", "
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "  TABLE_NAMES SYNC WARNING"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "  $($missing.Count) camelCase key(s) in config.jsw AIRTABLE_TABLE_NAMES"
    Write-Host "  are missing from airtableClient.jsw TABLE_NAMES:"
    Write-Host ""
    foreach ($key in $missing) {
        Write-Host "    - $key"
    }
    Write-Host ""
    Write-Host "  Add them to the 'camelCase aliases' section in"
    Write-Host "  airtableClient.jsw TABLE_NAMES to prevent 403 errors."
    Write-Host ""
    Write-Host "================================================================"
    Write-Host ""
    # Warning only - don't block the edit
    exit 0
}

exit 0
