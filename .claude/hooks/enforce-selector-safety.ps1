# enforce-selector-safety.ps1
# Claude Code hook to enforce $w selector safety pattern in page code
# Ensures all $w('#elementId') usages have existence checks before property access

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$input = $InputJson | ConvertFrom-Json

# Only check Write and Edit tools
if ($input.tool_name -notin @("Write", "Edit")) {
    exit 0
}

# Get the file path from tool input
$filePath = $input.tool_input.file_path

# Normalize path separators
$normalizedPath = $filePath -replace '\\', '/'

# Only check page code files (src/pages/*.js)
if (-not ($normalizedPath -match "src/pages/.*\.js$")) {
    exit 0
}

# Read the file content
if (-not (Test-Path $filePath)) {
    exit 0
}

$content = Get-Content $filePath -Raw

# Skip empty files
if ([string]::IsNullOrWhiteSpace($content)) {
    exit 0
}

# Pattern to find direct $w selector usage that accesses properties/methods without safety check
# This finds patterns like: $w('#id').text = or $w('#id').onClick( without preceding checks

# List of unsafe patterns - direct property/method access without check
$unsafePatterns = @(
    # Direct property assignment: $w('#id').text =
    '\$w\s*\(\s*[''"]#[^''"]+[''"]\s*\)\s*\.\s*(text|value|src|html|label|placeholder|checked|collapsed|hidden|expanded|enabled|disabled|options|selectedIndex|currentIndex|data)\s*='

    # Direct method call on single line: $w('#id').onClick(
    '\$w\s*\(\s*[''"]#[^''"]+[''"]\s*\)\s*\.\s*(onClick|onChange|onInput|onFocus|onBlur|onKeyPress|onMouseIn|onMouseOut|onViewportEnter|onViewportLeave|show|hide|expand|collapse|enable|disable|scrollTo|focus|postMessage)\s*\('
)

# Patterns that indicate safe usage (element is checked before use)
$safeContextPatterns = @(
    # Variable assignment followed by check: const el = $w('#id'); if (el...
    'const\s+\w+\s*=\s*\$w\s*\([^)]+\)'
    'let\s+\w+\s*=\s*\$w\s*\([^)]+\)'
    'var\s+\w+\s*=\s*\$w\s*\([^)]+\)'

    # Conditional check: if ($w('#id').rendered) or if ($w('#id') &&
    'if\s*\(\s*\$w\s*\([^)]+\)\s*\.\s*rendered'
    'if\s*\(\s*\$w\s*\([^)]+\)\s*&&'
    'if\s*\(\s*\$w\s*\([^)]+\)\s*\)'

    # Ternary with check
    '\$w\s*\([^)]+\)\s*\?\s*\$w'

    # Try-catch wrapper (check if the whole block is in try-catch)
    'try\s*\{'
)

$violations = @()
$lines = $content -split "`n"

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1

    foreach ($pattern in $unsafePatterns) {
        if ($line -match $pattern) {
            # Extract the element ID for the error message
            if ($line -match '\$w\s*\(\s*[''"]#([^''"]+)[''"]') {
                $elementId = $matches[1]
            } else {
                $elementId = "unknown"
            }

            # Check if this line is inside a safe context by looking at surrounding lines
            $isSafe = $false

            # Look back up to 5 lines for safety checks
            $startLine = [Math]::Max(0, $i - 5)
            $contextBefore = ($lines[$startLine..$i] -join "`n")

            # Check if element was assigned to a variable and checked
            if ($contextBefore -match "(const|let|var)\s+(\w+)\s*=\s*\$w\s*\(\s*['""]#$elementId['""]\s*\)") {
                $varName = $matches[2]
                if ($contextBefore -match "if\s*\(\s*$varName\s*(&&|\.\s*rendered|\))") {
                    $isSafe = $true
                }
            }

            # Check if there's a direct if check on the same element
            if ($contextBefore -match "if\s*\(\s*\$w\s*\(\s*['""]#$elementId['""]\s*\)\s*(&&|\.\s*rendered|\))") {
                $isSafe = $true
            }

            # Check if we're inside a try-catch block (simple heuristic)
            $openTry = ([regex]::Matches($contextBefore, 'try\s*\{')).Count
            $closeTry = ([regex]::Matches($contextBefore, '\}\s*catch')).Count
            if ($openTry -gt $closeTry) {
                $isSafe = $true
            }

            # Check for inline conditional: element && element.property
            if ($line -match "\w+\s*&&\s*\w+\s*\.\s*(text|value|src|onClick|postMessage)") {
                $isSafe = $true
            }

            if (-not $isSafe) {
                $violations += @{
                    Line = $lineNum
                    Element = $elementId
                    Code = $line.Trim()
                }
            }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Output "BLOCKED: Unsafe `$w selector usage detected in page code"
    Write-Output ""
    Write-Output "File: $filePath"
    Write-Output ""
    Write-Output "The following `$w('#elementId') usages access properties/methods without checking if the element exists:"
    Write-Output ""

    foreach ($v in $violations) {
        Write-Output "  Line $($v.Line): #$($v.Element)"
        Write-Output "    $($v.Code)"
        Write-Output ""
    }

    Write-Output "FIX: Always check element existence before accessing properties:"
    Write-Output ""
    Write-Output "  // Option 1: Use .rendered check"
    Write-Output "  const element = `$w('#elementId');"
    Write-Output "  if (element.rendered) {"
    Write-Output "      element.text = 'value';"
    Write-Output "  }"
    Write-Output ""
    Write-Output "  // Option 2: Check element exists"
    Write-Output "  const el = `$w('#myElement');"
    Write-Output "  if (el && el.text !== undefined) {"
    Write-Output "      el.text = 'value';"
    Write-Output "  }"
    Write-Output ""
    Write-Output "  // Option 3: Wrap in try-catch"
    Write-Output "  try {"
    Write-Output "      `$w('#optionalElement').onClick(() => { });"
    Write-Output "  } catch (e) {"
    Write-Output "      // Element may not exist"
    Write-Output "  }"
    Write-Output ""
    Write-Output "See CLAUDE.md 'UI Safety Pattern' for details."

    exit 2
}

exit 0
