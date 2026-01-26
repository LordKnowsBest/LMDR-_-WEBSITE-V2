# Run LMDR hook-equivalent checks after editing a file.

param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath
)

$ErrorActionPreference = "Continue"
$failed = $false

if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

$content = Get-Content -Raw $FilePath -ErrorAction SilentlyContinue
if (-not $content) {
    Write-Warning "No content read from: $FilePath"
}

$payload = @{
    tool_name = "Write"
    tool_input = @{
        file_path = $FilePath
        content = $content
    }
} | ConvertTo-Json -Compress

$hooks = @(
    ".claude/hooks/enforce-html-location.ps1",
    ".claude/hooks/validate-carrier-form.ps1",
    ".claude/hooks/check-wix-query-types.ps1",
    ".claude/hooks/validate-html-velo-bridge.ps1",
    ".claude/hooks/enforce-airtable-default.ps1",
    ".claude/hooks/validate-airtable-field-mappings.ps1"
)

foreach ($hook in $hooks) {
    if (-not (Test-Path $hook)) {
        Write-Host "SKIP missing hook: $hook"
        continue
    }

    if ($hook -like "*validate-html-velo-bridge.ps1") {
        & powershell -ExecutionPolicy Bypass -File $hook -FilePath $FilePath
        if ($LASTEXITCODE -ne 0) { $failed = $true }
        continue
    }

    $payload | & powershell -ExecutionPolicy Bypass -File $hook
    if ($LASTEXITCODE -ne 0) { $failed = $true }
}

if ($failed) {
    exit 1
}

exit 0
