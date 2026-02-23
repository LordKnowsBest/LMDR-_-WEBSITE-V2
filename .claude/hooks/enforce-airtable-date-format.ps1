# enforce-airtable-date-format.ps1
#
# Blocks .toISOString() used as a field value in Airtable write operations.
#
# Root cause: Airtable date fields only accept YYYY-MM-DD.
# .toISOString() returns YYYY-MM-DDTHH:mm:ss.sssZ — Airtable rejects this
# with a 422 that airtableClient catches and swallows as { success: false }.
# The call *appears* to succeed while writing nothing, causing silent data loss.
#
# Safe alternatives:
#   new Date().toISOString().slice(0, 10)  → "2026-02-23"  (date fields)
#   new Date().toISOString()               → OK only for text/long-text fields
#
# This hook fires on every Write/Edit to src/backend/*.jsw

param(
    [string]$ToolName,
    [string]$ToolInput
)

# Only check backend .jsw files
$filePath = ""
try {
    $inputObj = $ToolInput | ConvertFrom-Json -ErrorAction Stop
    $filePath = $inputObj.file_path
    if (-not $filePath) { $filePath = $inputObj.path }
} catch { exit 0 }

if (-not $filePath) { exit 0 }
if ($filePath -notmatch '\\src\\backend\\' -and $filePath -notmatch '/src/backend/') { exit 0 }
if ($filePath -notmatch '\.jsw$' -and $filePath -notmatch '\.js$') { exit 0 }

# Read the file content
if (-not (Test-Path $filePath)) { exit 0 }
$content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
if (-not $content) { exit 0 }

# Check: file has Airtable write calls AND unsliced .toISOString()
$hasAirtableWrite = $content -match '(insertRecord|updateRecord|createRecord|upsertRecord)\s*\('
if (-not $hasAirtableWrite) { exit 0 }

# Look for .toISOString() NOT immediately followed by .slice(0, 10)
# Match: .toISOString() that is NOT followed by .slice
$bareIsoMatches = [regex]::Matches($content, '\.toISOString\(\)(?!\s*\.slice\s*\(\s*0\s*,\s*10\s*\))')

if ($bareIsoMatches.Count -eq 0) { exit 0 }

# Find line numbers for context
$lines = $content -split "`n"
$violations = @()
foreach ($match in $bareIsoMatches) {
    $charPos = $match.Index
    $lineNum = ($content.Substring(0, $charPos) -split "`n").Count
    $lineContent = $lines[$lineNum - 1].Trim()
    # Only flag if it looks like it's being assigned as a field value
    if ($lineContent -match ':\s.*toISOString\(\)\s*[,}]?' -or
        $lineContent -match 'toISOString\(\)\s*$' -or
        $lineContent -match 'toISOString\(\)\s*,') {
        $violations += "  Line $lineNum`: $($lineContent.Substring(0, [Math]::Min(80, $lineContent.Length)))"
    }
}

if ($violations.Count -eq 0) { exit 0 }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║  AIRTABLE DATE FORMAT VIOLATION                                  ║" -ForegroundColor Red
Write-Host "╠══════════════════════════════════════════════════════════════════╣" -ForegroundColor Red
Write-Host "║                                                                  ║" -ForegroundColor Red
Write-Host "║  .toISOString() returns YYYY-MM-DDTHH:mm:ssZ                     ║" -ForegroundColor Red
Write-Host "║  Airtable DATE fields only accept YYYY-MM-DD                     ║" -ForegroundColor Red
Write-Host "║                                                                  ║" -ForegroundColor Red
Write-Host "║  This causes a 422 that airtableClient SILENTLY SWALLOWS.       ║" -ForegroundColor Red
Write-Host "║  The write appears to succeed but NO record is ever created.    ║" -ForegroundColor Red
Write-Host "╠══════════════════════════════════════════════════════════════════╣" -ForegroundColor Red
Write-Host "║  FIX:                                                            ║" -ForegroundColor Yellow
Write-Host "║    new Date().toISOString().slice(0, 10)   ← date fields        ║" -ForegroundColor Yellow
Write-Host "║    new Date().toISOString()                ← text fields only   ║" -ForegroundColor Yellow
Write-Host "╠══════════════════════════════════════════════════════════════════╣" -ForegroundColor Red
Write-Host "║  VIOLATIONS FOUND:                                               ║" -ForegroundColor Red
foreach ($v in $violations) {
    Write-Host "║  $($v.PadRight(66))║" -ForegroundColor Red
}
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

exit 1
