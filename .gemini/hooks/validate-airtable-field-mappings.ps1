# validate-airtable-field-mappings.ps1
# Validates that backend services have complete field mappings in airtableClient.jsw
# Runs after edits to backend .jsw files

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

# Only check backend .jsw files (not config or airtableClient itself)
if ($filePath -notmatch "src[/\]backend[/\].*\.jsw$") {
    exit 0
}

$fileName = Split-Path $filePath -Leaf

# Skip infrastructure files
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
if ($filePath -match "migrations[/\]") {
    exit 0
}

# Read the backend service file
$servicePath = $filePath
if (-not (Test-Path $servicePath)) {
    exit 0
}
$serviceContent = Get-Content $servicePath -Raw -ErrorAction SilentlyContinue
if (-not $serviceContent) {
    exit 0
}

# Check if this service uses Airtable routing
$usesAirtable = $serviceContent -match "usesAirtable\(" -or $serviceContent -match "airtable\.(createRecord|queryRecords|updateRecord|getRecord)"
if (-not $usesAirtable) {
    exit 0
}

# Extract collection keys used (look for getAirtableTableName calls)
$collectionMatches = [regex]::Matches($serviceContent, "getAirtableTableName(['`"](\w+)['`"])")
$collections = @()
foreach ($match in $collectionMatches) {
    $collections += $match.Groups[1].Value
}

# Also look for direct table references in airtable.* calls
$tableMatches = [regex]::Matches($serviceContent, "airtable\.\w+(['`"]([^'`"]+)['`"])")
foreach ($match in $tableMatches) {
    $tableName = $match.Groups[1].Value
    if ($tableName -match "^v2_" -or $tableName -match "^[A-Z]") {
        $collections += $tableName
    }
}

$collections = $collections | Select-Object -Unique

if ($collections.Count -eq 0) {
    exit 0
}

# Read airtableClient.jsw to check FIELD_MAPPINGS
$airtableClientPath = Join-Path (Split-Path $servicePath -Parent) "airtableClient.jsw"
if (-not (Test-Path $airtableClientPath)) {
    exit 0
}
$airtableContent = Get-Content $airtableClientPath -Raw -ErrorAction SilentlyContinue

# Check if each collection has a FIELD_MAPPINGS entry
$missingMappings = @()
foreach ($collection in $collections) {
    # Check for both exact match and variations
    $hasMapping = $airtableContent -match "'$collection'\s*:`" -or
                  $airtableContent -match ""$collection"\s*:`"

    if (-not $hasMapping) {
        $missingMappings += $collection
    }
}

# Extract field names used in the service
$fieldPattern = "(\w+_\w+)\s*[:=]"
$fieldMatches = [regex]::Matches($serviceContent, $fieldPattern)
$fieldsUsed = @()
foreach ($match in $fieldMatches) {
    $field = $match.Groups[1].Value
    # Filter to likely Wix-style field names (snake_case with common patterns)
    if ($field -match "^(company_|contact_|driver_|carrier_|status_|created_|updated_|submitted_|linked_|source_|dot_|email|phone|additional_|staffing_)") {
        $fieldsUsed += $field
    }
}
$fieldsUsed = $fieldsUsed | Select-Object -Unique

if ($missingMappings.Count -gt 0) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "  AIRTABLE FIELD MAPPING CHECK"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "  Service: $fileName"
    Write-Host ""
    Write-Host "  The following tables may need FIELD_MAPPINGS in airtableClient.jsw:"
    Write-Host ""
    foreach ($table in $missingMappings) {
        Write-Host "    - $table"
    }
    Write-Host ""
    Write-Host "  Fields detected in service (snake_case):"
    Write-Host ""
    foreach ($field in ($fieldsUsed | Select-Object -First 10)) {
        Write-Host "    - $field"
    }
    if ($fieldsUsed.Count -gt 10) {
        Write-Host "    ... and $($fieldsUsed.Count - 10) more"
    }
    Write-Host ""
    Write-Host "  ACTION: Run '/audit-airtable $($fileName -replace '\.jsw$','')' for full audit"
    Write-Host ""
    Write-Host "================================================================"
    Write-Host ""
}

# Always exit 0 - this is a warning, not a blocker
exit 0
