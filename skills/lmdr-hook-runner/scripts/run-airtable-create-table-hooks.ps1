# Run LMDR Airtable create-table checks (v2_ prefix + Wix schema reminder).

param(
    [Parameter(Mandatory = $true)]
    [string]$TableName
)

$ErrorActionPreference = "Continue"
$failed = $false

$payload = @{
    tool_name = "mcp__airtable__create_table"
    tool_input = @{
        table_name = $TableName
    }
} | ConvertTo-Json -Compress

$hooks = @(
    ".claude/hooks/enforce-airtable-v2-prefix.ps1",
    ".claude/hooks/validate-airtable-wix-fields.ps1"
)

foreach ($hook in $hooks) {
    if (-not (Test-Path $hook)) {
        Write-Host "SKIP missing hook: $hook"
        continue
    }
    $payload | & powershell -ExecutionPolicy Bypass -File $hook
    if ($LASTEXITCODE -ne 0) { $failed = $true }
}

if ($failed) {
    exit 1
}

exit 0
