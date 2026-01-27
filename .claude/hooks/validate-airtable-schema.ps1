# validate-airtable-schema.ps1
# Validates that backend services use correct field names/types per Airtable schema docs
# Runs after edits to backend .jsw files that use Airtable

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

# Skip infrastructure files
$skipFiles = @(
    "airtableClient.jsw",
    "config.jsw",
    "setupCollections.jsw",
    "http-functions.js"
)
if ($skipFiles -contains $fileName) {
    exit 0
}

# Read the backend service file
if (-not (Test-Path $filePath)) {
    exit 0
}
$serviceContent = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
if (-not $serviceContent) {
    exit 0
}

# Check if this service uses Airtable
$usesAirtable = $serviceContent -match "airtable\.(createRecord|queryRecords|updateRecord|getRecord)"
if (-not $usesAirtable) {
    exit 0
}

# Get the project root
$projectRoot = Split-Path (Split-Path (Split-Path $filePath -Parent) -Parent) -Parent
$schemaDir = Join-Path $projectRoot "docs\schemas\airtable"

if (-not (Test-Path $schemaDir)) {
    exit 0
}

# Extract collection keys used in airtable.* calls
$collectionMatches = [regex]::Matches($serviceContent, "airtable\.\w+\(['\`"](\w+)['\`"]")
$collections = @()
foreach ($match in $collectionMatches) {
    $collections += $match.Groups[1].Value
}
$collections = $collections | Select-Object -Unique

if ($collections.Count -eq 0) {
    exit 0
}

$warnings = @()

foreach ($collection in $collections) {
    # Map collection key to schema file name (e.g., carrierStaffingRequests -> CarrierStaffingRequests.md)
    $schemaFileName = $collection.Substring(0,1).ToUpper() + $collection.Substring(1) + ".md"
    $schemaPath = Join-Path $schemaDir $schemaFileName

    # Also try PascalCase conversion
    if (-not (Test-Path $schemaPath)) {
        $pascalCase = ($collection -creplace '([a-z])([A-Z])', '$1$2') -replace '^(.)', { $_.Value.ToUpper() }
        $schemaPath = Join-Path $schemaDir "$pascalCase.md"
    }

    if (-not (Test-Path $schemaPath)) {
        $warnings += "No schema doc found for '$collection' at docs/schemas/airtable/"
        continue
    }

    $schemaContent = Get-Content $schemaPath -Raw -ErrorAction SilentlyContinue

    # Check for common field type issues based on schema

    # 1. Check if using arrays for "Single line text" fields (Driver Types issue)
    if ($schemaContent -match "\*\*Driver Types\*\*.*Single line text") {
        if ($serviceContent -match "driver_types:\s*Array\.isArray" -and $serviceContent -notmatch "JSON\.stringify") {
            $warnings += "[$collection] 'driver_types' is Single line text - must use JSON.stringify() for arrays"
        }
    }

    # 2. Check if staffing_type is being converted to lowercase
    if ($schemaContent -match "\*\*Staffing Type\*\*.*Single select.*`"emergency`".*`"strategic`"") {
        if ($serviceContent -match "staffing_type:" -and $serviceContent -notmatch "\.toLowerCase\(\)") {
            $warnings += "[$collection] 'staffing_type' single select expects lowercase values - use .toLowerCase()"
        }
    }

    # 3. Check date fields are formatted as YYYY-MM-DD
    if ($schemaContent -match "\*\*(Submitted Date|Last Updated)\*\*.*Date.*YYYY-MM-DD") {
        if ($serviceContent -match "(submitted_date|last_updated):\s*now" -and $serviceContent -notmatch "formatDate|toISOString.*split") {
            $warnings += "[$collection] Date fields require YYYY-MM-DD format, not Date objects"
        }
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "  AIRTABLE SCHEMA VALIDATION"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "  Service: $fileName"
    Write-Host ""
    Write-Host "  Issues detected based on docs/schemas/airtable/*.md:"
    Write-Host ""
    foreach ($warning in $warnings) {
        Write-Host "    ⚠️  $warning"
    }
    Write-Host ""
    Write-Host "  Reference: Check the schema doc for exact field names and types"
    Write-Host ""
    Write-Host "================================================================"
    Write-Host ""
}

# Always exit 0 - this is a warning, not a blocker
exit 0
