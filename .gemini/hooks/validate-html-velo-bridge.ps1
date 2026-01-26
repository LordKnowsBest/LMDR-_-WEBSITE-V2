# validate-html-velo-bridge.ps1
# Gemini CLI Hook: Validates HTML/Velo postMessage bridge patterns
# Runs when HTML files in src/public are created or modified

param(
    [string]$FilePath
)

$ErrorActionPreference = "Continue"

# Only process HTML files in src/public
if ($FilePath -notmatch "src[\\/]public[\\/].*\.html$") {
    exit 0
}

$fileName = Split-Path $FilePath -Leaf
$fileContent = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue

if (-not $fileContent) {
    exit 0
}

$errors = @()
$warnings = @()

# ============================================================ 
# CHECK 1: PostMessage patterns in HTML
# ============================================================ 
$hasPostMessage = $fileContent -match "window\.parent\.postMessage"
$hasMessageListener = $fileContent -match "window\.addEventListener\s*\(\s*['\"]message['\"]"

if ($hasPostMessage) {
    Write-Host "[HOOK] Detected postMessage bridge in: $fileName" -ForegroundColor Cyan

    # Extract message types being sent
    $messageTypes = [regex]::Matches($fileContent, "type:\s*['\"]([^'\"]+)['\"]") | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

    if ($messageTypes.Count -gt 0) {
        Write-Host "[HOOK] Message types found: $($messageTypes -join ', ')" -ForegroundColor Gray
    }

    # CHECK 1a: Must have a message listener if sending messages
    if (-not $hasMessageListener) {
        $warnings += "HTML sends postMessage but has no 'message' event listener for responses"
    }

    # CHECK 1b: Should have timeout handling for Velo responses
    $hasTimeout = $fileContent -match "setTimeout.*timeout|TIMEOUT"
    if (-not $hasTimeout) {
        $warnings += "Consider adding timeout handling for cases when Velo doesn't respond"
    }

    # CHECK 1c: Should have debug logging
    $hasDebugLogging = $fileContent -match "console\.log.*[FORM]|[HTML]"
    if (-not $hasDebugLogging) {
        $warnings += "Add [FORM] or [HTML] prefixed console.log statements for debugging postMessage flow"
    }
}

# ============================================================ 
# CHECK 2: Required form field IDs for carrier staffing forms
# ============================================================ 
$isCarrierForm = $fileContent -match "submitCarrierStaffingRequest|carrierStaffingForm"

if ($isCarrierForm) {
    Write-Host "[HOOK] Detected carrier staffing form pattern" -ForegroundColor Cyan

    $requiredFields = @(
        @{ id = "companyName"; desc = "Company Name input" },
        @{ id = "contactName"; desc = "Contact Name input" },
        @{ id = "email"; desc = "Email input" },
        @{ id = "phone"; desc = "Phone input" },
        @{ id = "dotNumber"; desc = "DOT Number input" },
        @{ id = "formSuccess"; desc = "Success message container" },
        @{ id = "formError"; desc = "Error message container" },
        @{ id = "submitBtn"; desc = "Submit button" }
    )

    foreach ($field in $requiredFields) {
        $pattern = "id\s*=\s*['\"]$($field.id)['\"]"
        if ($fileContent -notmatch $pattern) {
            $errors += "Missing required field: id='$($field.id)' ($($field.desc))"
        }
    }

    # Check for proper data collection
    $collectsAllFields = $fileContent -match "getElementById\(['\"]companyName['\"]\)" -and\
                         $fileContent -match "getElementById\(['\"]contactName['\"]\)" -and\
                         $fileContent -match "getElementById\(['\"]email['\"]\)" -and\
                         $fileContent -match "getElementById\(['\"]phone['\"]\)" -and\
                         $fileContent -match "getElementById\(['\"]dotNumber['\"]\)"

    if (-not $collectsAllFields) {
        $warnings += "Form may not be collecting all required fields via getElementById()"
    }
}

# ============================================================ 
# CHECK 3: Corresponding Velo page code
# ============================================================ 
if ($hasPostMessage) {
    # Try to find corresponding page code file
    $baseName = $fileName -replace "\.html$", "" 
    $pagesDir = Join-Path (Split-Path $FilePath -Parent | Split-Path -Parent) "pages"

    $matchingPageFiles = Get-ChildItem -Path $pagesDir -Filter "*.js" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match [regex]::Escape($baseName) -or $_.BaseName -like "$baseName*" }

    if ($matchingPageFiles.Count -eq 0) {
        $warnings += "No matching Velo page code found. Ensure page code handles postMessage from this HTML."
        $warnings += "Page code should include: `$w('#htmlX').onMessage() handler"
    } else {
        foreach ($pageFile in $matchingPageFiles) {
            $pageContent = Get-Content $pageFile.FullName -Raw -ErrorAction SilentlyContinue

            if ($pageContent) {
                # Check if page code has onMessage handler
                $hasOnMessage = $pageContent -match "\.onMessage\s*\("

                if (-not $hasOnMessage) {
                    $warnings += "Page code '$($pageFile.Name)' may be missing .onMessage() handler"
                }

                # Check if page code scans multiple HTML component IDs
                $scansMultipleIds = $pageContent -match "#html1.*#html2|possibleIds|htmlId"

                if (-not $scansMultipleIds -and $hasOnMessage) {
                    $warnings += "Page code should scan multiple HTML component IDs (html1-html5) since Wix assigns IDs dynamically"
                }

                # Check for debug logging in page code
                $hasVeloLogging = $pageContent -match "console\.log.*[VELO]"
                if (-not $hasVeloLogging) {
                    $warnings += "Add [VELO] prefixed console.log in page code for debugging"
                }
            }
        }
    }
}

# ============================================================ 
# OUTPUT RESULTS
# ============================================================ 
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host " ERRORS - Must fix before proceeding" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  [X] $err" -ForegroundColor Red
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " WARNINGS - Recommended improvements" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    foreach ($warn in $warnings) {
        Write-Host "  [!] $warn" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "[HOOK] HTML/Velo bridge validation passed" -ForegroundColor Green
}

# ============================================================ 
# HELPFUL TEMPLATE REMINDER
# ============================================================ 
if ($isCarrierForm -or $hasPostMessage) {
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host " VELO PAGE CODE TEMPLATE" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host @"

Add this to your page code to handle postMessage:

    function setupFormHandler() {
      const ids = ['#html1', '#html2', '#html3', '#html4', '#html5'];
      ids.forEach(id => {
        try {
          const comp = `$w(id);
          if (comp?.onMessage) {
            console.log('[VELO] Attached handler to', id);
            comp.onMessage(async (event) => {
              if (event.data?.type === 'submitCarrierStaffingRequest') {
                const result = await submitCarrierStaffingRequest(event.data.data);
                comp.postMessage({ type: 'staffingRequestResult', success: !!result });
              }
            });
          }
        } catch (e) {}
      });
    }

"@ -ForegroundColor Gray
}

# Exit with error code if there are blocking errors
if ($errors.Count -gt 0) {
    exit 1
}

exit 0
