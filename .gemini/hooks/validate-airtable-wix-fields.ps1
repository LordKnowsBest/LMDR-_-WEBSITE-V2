# validate-airtable-wix-fields.ps1
# Gemini CLI hook to remind users to verify Airtable tables match Wix collection schemas
# This is informational (exit 0) - it warns but does not block

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$input = $InputJson | ConvertFrom-Json

# Only check Airtable create_table tool
if ($input.tool_name -ne "mcp__airtable__create_table") {
    exit 0
}

# Get the table name from tool input
$tableName = $input.tool_input.table_name

# Skip if no table name
if (-not $tableName) {
    exit 0
}

# Wix site ID for this project
$wixSiteId = "13e6ba60-5a5d-4a4a-8adc-5948ff78d4ef"

# Convert Airtable table name to Wix collection name
# Pattern: "v2_Driver Profiles" -> "DriverProfiles"
function ConvertTo-WixCollectionName {
    param([string]$airtableName)

    # Remove v2_ prefix if present
    $name = $airtableName -replace "^v2_", ""

    # Remove spaces and ensure PascalCase
    $words = $name -split " "
    $pascalCase = ($words | ForEach-Object {
        if ($_.Length -gt 0) {
            $_.Substring(0, 1).ToUpper() + $_.Substring(1)
        }
    }) -join ""

    return $pascalCase
}

# Get the Wix collection name
$wixCollectionName = ConvertTo-WixCollectionName -airtableName $tableName

# Output warning message
Write-Output ""
Write-Output "=========================================="
Write-Output "WARNING: Creating Airtable table '$tableName'"
Write-Output "=========================================="
Write-Output ""
Write-Output "Corresponding Wix collection: '$wixCollectionName'"
Write-Output "Site ID: $wixSiteId"
Write-Output ""
Write-Output "REMINDER: Use Wix MCP to fetch the collection schema first:"
Write-Output "  mcp__wix-mcp-remote__CallWixSiteAPI"
Write-Output "  GET https://www.wixapis.com/wix-data/v2/collections/$wixCollectionName"
Write-Output ""
Write-Output "Ensure all Wix fields are included in the Airtable table."
Write-Output "=========================================="
Write-Output ""

# Exit 0 to allow the operation (this is informational only)
exit 0
