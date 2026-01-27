# enforce-inline-tailwind-config.ps1
# Ensures HTML files in src/public/ have inline Tailwind config, not external references
# External config files don't load correctly in Wix iframes

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

# Only check HTML files in src/public/
if ($filePath -notmatch "src[/\\]public[/\\].*\.(html|HTML)$") {
    exit 0
}

# Skip archive and test folders
if ($filePath -match "_archive|__tests__|test") {
    exit 0
}

# Check if this is a Write or Edit operation with content
$newContent = $null
if ($input.tool_input.content) {
    $newContent = $input.tool_input.content
} elseif ($input.tool_input.new_string) {
    # For Edit tool, we need to read the file to check full content
    if (Test-Path $filePath) {
        $newContent = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
    }
}

if (-not $newContent) {
    exit 0
}

# Check if file uses Tailwind (has tailwindcss CDN)
$usesTailwind = $newContent -match "cdn\.tailwindcss\.com"
if (-not $usesTailwind) {
    exit 0
}

# Check for external lmdr-config.js reference
$hasExternalConfig = $newContent -match 'src=[''"]\.\.\/lmdr-config\.js[''"]'

# Check for inline tailwind.config
$hasInlineConfig = $newContent -match "tailwind\.config\s*=\s*\{"

# Check if using custom lmdr- color classes
$usesLmdrColors = $newContent -match "(bg|text|border)-lmdr-(dark|blue|yellow|canvas)"

if ($hasExternalConfig -or ($usesLmdrColors -and -not $hasInlineConfig)) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "  INLINE TAILWIND CONFIG REQUIRED"
    Write-Host "================================================================"
    Write-Host ""
    Write-Host "  File: $(Split-Path $filePath -Leaf)"
    Write-Host ""

    if ($hasExternalConfig) {
        Write-Host "  ❌ External config reference detected:"
        Write-Host '     <script src="../lmdr-config.js"></script>'
        Write-Host ""
        Write-Host "  This WILL NOT WORK in Wix iframes!"
        Write-Host ""
    }

    if ($usesLmdrColors -and -not $hasInlineConfig) {
        Write-Host "  ❌ Uses lmdr- color classes but no inline config found"
        Write-Host ""
    }

    Write-Host "  REQUIRED FIX: Add inline Tailwind config after CDN script:"
    Write-Host ""
    Write-Host '  <script src="https://cdn.tailwindcss.com"></script>'
    Write-Host "  <script>"
    Write-Host "      tailwind.config = {"
    Write-Host "          theme: {"
    Write-Host "              extend: {"
    Write-Host "                  colors: {"
    Write-Host "                      lmdr: {"
    Write-Host "                          dark: '#0f172a',"
    Write-Host "                          blue: '#2563eb',"
    Write-Host "                          yellow: '#fbbf24',"
    Write-Host "                          canvas: '#f8fafc',"
    Write-Host "                      }"
    Write-Host "                  }"
    Write-Host "              }"
    Write-Host "          }"
    Write-Host "      }"
    Write-Host "  </script>"
    Write-Host ""
    Write-Host "================================================================"
    Write-Host ""

    # Block the operation
    exit 1
}

exit 0
