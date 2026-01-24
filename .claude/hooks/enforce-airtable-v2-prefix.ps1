# enforce-airtable-v2-prefix.ps1
# Claude Code hook to enforce v2_ prefix on Airtable table names during migration
# This prevents naming conflicts with existing tables in the base

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

# Check if table name starts with v2_
if ($tableName.StartsWith("v2_")) {
    exit 0
}

# Block the operation - table name doesn't have v2_ prefix
$suggestedName = "v2_$tableName"

Write-Output "BLOCKED: Airtable table names must use 'v2_' prefix during migration"
Write-Output ""
Write-Output "Attempted name: $tableName"
Write-Output "Correct name:   $suggestedName"
Write-Output ""
Write-Output "This prefix prevents conflicts with existing tables in the base."
Write-Output "Once migration is complete, tables can be renamed to remove the prefix."
Write-Output ""
Write-Output "See Conductor/tracks/airtable_migration_20260121/spec.md for details."

exit 2
