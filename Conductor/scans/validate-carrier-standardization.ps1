param(
    [string]$Path = "src/public/carrier"
)

$files = Get-ChildItem -Path $Path -Filter *.html
$failed = $false

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $relPath = $file.Name

    # Check 1: Inline Tailwind Config
    if ($content -match "tailwind\.config\s*=") {
        Write-Host "[$relPath] FAILED: Found inline tailwind.config" -ForegroundColor Red
        $failed = $true
    }

    # Check 2: Missing lmdr-config.js (Only if Tailwind CDN is present)
    if ($content -match "cdn\.tailwindcss\.com") {
        if ($content -notmatch "src=['`"]\.\./lmdr-config\.js['`"]") {
            Write-Host "[$relPath] FAILED: Missing lmdr-config.js import (required when using Tailwind)" -ForegroundColor Red
            $failed = $true
        }
    }

    # Check 3: Material Symbols (Should use Font Awesome)
    # Check 4: Hardcoded Colors (Basic Heuristic)
    # We only check for the specific high-priority ones we migrated
    $badColors = @("bg-blue-600", "text-blue-600", "bg-yellow-400", "text-yellow-400", "bg-slate-900", "text-slate-900")
    foreach ($color in $badColors) {
        if ($content -match $color) {
            Write-Host "[$relPath] FAILED: Found hardcoded color '$color'" -ForegroundColor Red
            $failed = $true
        }
    }
}

if ($failed) {
    Write-Host "Validation FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Validation PASSED" -ForegroundColor Green
    exit 0
}
