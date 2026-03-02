# enforce-jsw-facade-imports.ps1
# Claude Code Hook: Blocks direct imports from backend/*.js (non-.jsw) in page code
# Prevents silent Wix bundler crash when large .js files get bundled client-side
#
# Root cause: configData.js (1384 lines) imported directly into RECRUITER_OS page code
# silently killed $w.onReady — zero errors, zero console output, completely dead page.
# Fix: Route all backend .js imports through a .jsw facade so they resolve server-side.

param(
    [string]$FilePath,
    [string]$FileContent
)

$ErrorActionPreference = "Continue"

# Only check page code files
if ($FilePath -notmatch "src[\\/]pages[\\/].*\.js$") {
    exit 0
}

# Use FileContent if provided, otherwise read file
if (-not $FileContent) {
    $FileContent = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
}

if (-not $FileContent) {
    exit 0
}

$fileName = Split-Path $FilePath -Leaf

# Find all import lines from 'backend/...'
$importMatches = [regex]::Matches($FileContent, "(?m)^import\s+.+\s+from\s+['""]backend/([^'""]+)['""]")

$blocked = @()

foreach ($match in $importMatches) {
    $importPath = $match.Groups[1].Value

    # Skip .jsw imports — those are fine (server-side RPC)
    if ($importPath -match "\.jsw$") {
        continue
    }

    # Skip Wix system modules (they resolve correctly client-side)
    if ($importPath -match "^(wix-|wixWindow|wixLocation|wixUsers|wixSite|wixSeo)") {
        continue
    }

    # Everything else is a backend .js file being bundled client-side — BLOCK
    $blocked += "  import from 'backend/$importPath'"
}

if ($blocked.Count -gt 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host " BLOCKED: Direct backend .js import in page code" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host " File: $fileName" -ForegroundColor Yellow
    Write-Host ""
    foreach ($b in $blocked) {
        Write-Host " [X] $b" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host " WHY: Backend .js files (not .jsw) get bundled CLIENT-SIDE by" -ForegroundColor Cyan
    Write-Host " the Wix page bundler. Large files like configData.js silently" -ForegroundColor Cyan
    Write-Host " crash the bundler — `$w.onReady never fires, zero errors." -ForegroundColor Cyan
    Write-Host ""
    Write-Host " FIX: Route through a .jsw facade file instead:" -ForegroundColor Green
    Write-Host ""
    Write-Host "   // In your facade.jsw:" -ForegroundColor Gray
    Write-Host "   import { FEATURE_FLAGS } from 'backend/configData';" -ForegroundColor Gray
    Write-Host "   export function getFeatureFlags() { return FEATURE_FLAGS; }" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   // In page code:" -ForegroundColor Gray
    Write-Host "   import { getFeatureFlags } from 'backend/myFacade.jsw';" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

exit 0
