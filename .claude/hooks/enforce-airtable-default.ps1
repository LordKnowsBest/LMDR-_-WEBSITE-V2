# enforce-airtable-default.ps1
# Ensures all new backend services use Airtable as the default data source
# and that new collections added to config.jsw default to 'airtable'

param()

$ErrorActionPreference = "Continue"

# Read the tool input from stdin
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

# Only check backend .jsw files
if ($filePath -notmatch "src[/\\]backend[/\\].*\.jsw$") {
    exit 0
}

$fileName = Split-Path $filePath -Leaf

# Skip infrastructure files that don't need dual-source
$skipFiles = @(
    "airtableClient.jsw",
    "config.jsw",
    "setupCollections.jsw",
    "setupOnboardingCollections.jsw",
    "http-functions.js"
)
if ($skipFiles -contains $fileName) {
    exit 0
}

# Skip migration files
if ($filePath -match "migrations[/\\]") {
    exit 0
}

# Check if this is a new file or edit
$content = $null
if ($input.tool_input.content) {
    # Write tool - check the new content
    $content = $input.tool_input.content
} elseif ($input.tool_input.new_string) {
    # Edit tool - we'd need to check the resulting file
    # For Edit tool, we'll check the file after edit in PostToolUse
    exit 0
}

if (-not $content) {
    exit 0
}

# Check 1: If file imports wixData, it should also have dual-source imports
$hasWixData = $content -match "import wixData from 'wix-data'"
$hasDualSource = $content -match "import \{ usesAirtable|import \{ getDataSource"

if ($hasWixData -and -not $hasDualSource) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "  AIRTABLE ENFORCEMENT WARNING"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "  File: $fileName"
    Write-Host ""
    Write-Host "  This backend service imports 'wix-data' but does not include"
    Write-Host "  the dual-source pattern for Airtable support."
    Write-Host ""
    Write-Host "  REQUIRED: Add the following imports and helpers:"
    Write-Host ""
    Write-Host "    import { usesAirtable, getAirtableTableName } from 'backend/config';"
    Write-Host "    import * as airtable from 'backend/airtableClient';"
    Write-Host ""
    Write-Host "    const COLLECTION_KEYS = { ... };"
    Write-Host ""
    Write-Host "    async function queryData(collectionKey, wixCollectionName, options) { ... }"
    Write-Host ""
    Write-Host "  See existing services for the full pattern."
    Write-Host ""
    Write-Host "================================================================"
    Write-Host ""
    # Warning only - don't block
    exit 0
}

# Check 2: If this is config.jsw, ensure no unauthorized 'wix' values are being added
if ($fileName -eq "config.jsw") {
    # These 2 collections MUST remain in Wix (require Wix auth context)
    $allowedWixCollections = @(
        "adminUsers",           # Wix Members integration for authentication
        "memberNotifications"   # Requires Wix auth context
    )

    # Find all 'wix' entries
    $wixMatches = [regex]::Matches($content, "(\w+):\s*'wix'")

    foreach ($match in $wixMatches) {
        $collectionName = $match.Groups[1].Value
        if ($allowedWixCollections -notcontains $collectionName) {
            Write-Host ""
            Write-Host "================================================================"
            Write-Host "  AIRTABLE ENFORCEMENT ERROR"
            Write-Host "================================================================"
            Write-Host ""
            Write-Host "  File: config.jsw"
            Write-Host ""
            Write-Host "  Collection '$collectionName' is set to 'wix' but is not in the"
            Write-Host "  approved list of Wix-only collections."
            Write-Host ""
            Write-Host "  Allowed Wix collections (2 total):"
            Write-Host "    - adminUsers"
            Write-Host "    - memberNotifications"
            Write-Host ""
            Write-Host "  Change:  $collectionName`: 'wix'"
            Write-Host "  To:      $collectionName`: 'airtable'"
            Write-Host ""
            Write-Host "================================================================"
            Write-Host ""
            exit 1
        }
    }
}

exit 0
