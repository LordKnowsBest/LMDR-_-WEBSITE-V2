# validate-carrier-form.ps1
# Gemini CLI PreToolUse hook to validate carrier staffing landing pages
#
# Ensures carrier landing pages include required form elements, PostMessage bridge,
# and follow LMDR brand guidelines for proper integration.
#
# BRAND GUIDE: docs/LMDR_Brand_skill.toon
# - Inter font (weights 300-900)
# - LMDR Dark: #0f172a (slate-900)
# - LMDR Blue: #2563eb (blue-600) - Carrier CTAs, trust markers
# - LMDR Yellow: #fbbf24 (amber-400) - Driver CTAs, highlights
# - Canvas: #f9fafb (gray-50) - Page backgrounds
# - Drivers = LEFT, Yellow accents, dark cards
# - Carriers = RIGHT, Blue accents, white cards
#
# WIX COLLECTIONS USED:
# - carrierStaffingRequests: Stores all form submissions (leads)
# - Carriers: Used for DOT number lookup and linking via linked_carrier_id
#
# BACKEND SERVICE: src/backend/carrierLeadsService.jsw

param()

# Read the tool input from stdin
$input_json = $input | Out-String
$tool_input = $input_json | ConvertFrom-Json -ErrorAction SilentlyContinue

if (-not $tool_input) {
    exit 0
}

# Get the file path and content being written
$file_path = $tool_input.file_path
$content = $tool_input.content

# Skip if no file path or content
if (-not $file_path -or -not $content) {
    exit 0
}

# Only check HTML files in src/public that look like carrier/staffing landing pages
if (-not ($file_path -match '\.html$')) {
    exit 0
}

if (-not ($file_path -match 'src[/\]public')) {
    exit 0
}

# Skip the template file itself
if ($file_path -match '_TEMPLATE_') {
    exit 0
}

# Detect if this is a carrier staffing form page
$isCarrierPage = $false
$carrierIndicators = @(
    'staffing',
    'carrier',
    'cdl',
    'driver',
    'fleet',
    'trucking',
    'logistics',
    'transport'
)

foreach ($indicator in $carrierIndicators) {
    if ($file_path -match $indicator -or $content -match "(?i)carrier.*form|staffing.*request|cdl.*staff") {
        $isCarrierPage = $true
        break
    }
}

# Also check if it has form elements that suggest staffing
if ($content -match 'id="carrierStaffingForm"' -or $content -match 'submitCarrierStaffingRequest') {
    $isCarrierPage = $true
}

if (-not $isCarrierPage) {
    exit 0
}

# Required elements for carrier staffing forms
$requiredElements = @{
    'form#carrierStaffingForm' = 'id="carrierStaffingForm"'
    'input#companyName' = 'id="companyName"'
    'input#contactName' = 'id="contactName"'
    'input#email' = 'id="email"'
    'input#phone' = 'id="phone"'
    'input#dotNumber' = 'id="dotNumber"'
    'staffingType radio' = 'name="staffingType"'
    'driversNeeded select' = 'id="driversNeeded"'
    'driverTypes checkboxes' = 'name="driverTypes"'
    'additionalNotes textarea' = 'id="additionalNotes"'
    'submitBtn button' = 'id="submitBtn"'
    'formSuccess message' = 'id="formSuccess"'
    'formError message' = 'id="formError"'
}

$missingElements = @()

foreach ($element in $requiredElements.GetEnumerator()) {
    if (-not ($content -match $element.Value)) {
        $missingElements += $element.Key
    }
}

# Required JavaScript patterns
$requiredJS = @{
    'PostMessage listener' = "window\.addEventListener\s*\(\s*['\"]message['\"]"
    'sendToVelo function' = "window\.parent\.postMessage"
    'staffingFormReady notification' = 'staffingFormReady'
    'submitCarrierStaffingRequest handler' = 'submitCarrierStaffingRequest'
    'staffingRequestResult handler' = 'staffingRequestResult'
}

$missingJS = @()

foreach ($pattern in $requiredJS.GetEnumerator()) {
    if (-not ($content -match $pattern.Value)) {
        $missingJS += $pattern.Key
    }
}

# LMDR Brand Guide validation (from docs/LMDR_Brand_skill.toon)
$brandRequirements = @{
    'Inter font import' = "fonts\.googleapis\.com.*Inter"
    'LMDR Dark (#0f172a)' = "#0f172a|slate-900"
    'LMDR Blue (#2563eb)' = "#2563eb|blue-600"
    'LMDR Yellow (#fbbf24)' = "#fbbf24|amber-400|yellow-400"
    'Font Awesome icons' = "font-awesome|fontawesome"
    'Rounded cards (rounded-xl or rounded-3xl)' = "rounded-xl|rounded-2xl|rounded-3xl"
}

$missingBrand = @()

foreach ($requirement in $brandRequirements.GetEnumerator()) {
    if (-not ($content -match $requirement.Value)) {
        $missingBrand += $requirement.Key
    }
}

# Build warning message if issues found
$warnings = @()

if ($missingElements.Count -gt 0) {
    $warnings += "MISSING FORM ELEMENTS:`n  - " + ($missingElements -join "`n  - ")
}

if ($missingJS.Count -gt 0) {
    $warnings += "MISSING POSTMESSAGE BRIDGE:`n  - " + ($missingJS -join "`n  - ")
}

if ($missingBrand.Count -gt 0) {
    $warnings += "MISSING BRAND ELEMENTS (see docs/LMDR_Brand_skill.toon):`n  - " + ($missingBrand -join "`n  - ")
}

if ($warnings.Count -gt 0) {
    $output = @{
        decision = "block"
        reason = @"
CARRIERSTAFFING FORM VALIDATION FAILED

This appears to be a carrier staffing landing page but is missing required elements.

$($warnings -join "`n`n")

WIX COLLECTIONS (all forms use these same tables):
- carrierStaffingRequests: Stores all lead submissions
- Carriers: Used for DOT lookup and linked_carrier_id reference

BRAND GUIDE: docs/LMDR_Brand_skill.toon
- Inter font (300-900 weights)
- LMDR Dark: #0f172a | LMDR Blue: #2563eb | LMDR Yellow: #fbbf24
- Drivers = LEFT/Yellow | Carriers = RIGHT/Blue
- Font Awesome 6.4 for icons
- Rounded cards (rounded-xl minimum)

SOLUTION:
Copy the standard template from:
  src/public/_TEMPLATE_Carrier_Staffing_Form.html

Required Wix page code integration:
  import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';

Backend service: src/backend/carrierLeadsService.jsw
"@
    }
    $output | ConvertTo-Json -Compress
    exit 0
}

# All checks passed
exit 0
