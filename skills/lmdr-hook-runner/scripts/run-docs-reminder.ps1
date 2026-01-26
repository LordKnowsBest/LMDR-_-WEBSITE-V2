# Run LMDR documentation reminder hook for a set of changed files.

param(
    [Parameter(Mandatory = $true)]
    [string]$ChangedFiles,

    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Continue"

$hook = ".claude/hooks/update-docs-on-commit.ps1"
if (-not (Test-Path $hook)) {
    Write-Error "Missing hook: $hook"
    exit 1
}

& powershell -ExecutionPolicy Bypass -File $hook -ChangedFiles $ChangedFiles -CommitMessage $CommitMessage
exit $LASTEXITCODE
