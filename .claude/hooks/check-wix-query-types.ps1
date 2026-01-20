# check-wix-query-types.ps1
# Claude Code PreToolUse hook to detect potential type mismatches in Wix queries
#
# This hook warns when code contains wixData.query().eq() patterns that may
# compare string form data against NUMBER fields without type conversion.

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

# Only check .jsw (Wix backend) files
if (-not $file_path -or -not ($file_path -match '\.jsw$')) {
    exit 0
}

# Skip if no content
if (-not $content) {
    exit 0
}

# Known NUMBER fields in Wix collections that are commonly queried with string form data
$number_fields = @(
    'dot_number',
    'mc_number',
    'fleet_size',
    'truck_count',
    'driver_count',
    'years_in_business'
)

# Build regex pattern to detect .eq('field_name', variable) without parseInt
$warnings = @()

foreach ($field in $number_fields) {
    # Pattern: .eq('field_name', someVar) where someVar is not wrapped in parseInt
    # This is a heuristic - looks for .eq with the field followed by a variable that's not a number literal
    $pattern = "\.eq\s*\(\s*['""]$field['""]"

    if ($content -match $pattern) {
        # Check if there's a parseInt nearby for this field
        $parseIntPattern = "parseInt\s*\([^)]*$field"
        $numberConversionPattern = "Number\s*\([^)]*$field"

        # Look for the actual .eq() call and check what's being passed
        $eqPattern = "\.eq\s*\(\s*['""]$field['""]\s*,\s*([^)]+)\)"
        $matches_found = [regex]::Matches($content, $eqPattern)

        foreach ($match in $matches_found) {
            $value_arg = $match.Groups[1].Value.Trim()

            # Skip if it's already a number literal
            if ($value_arg -match '^\d+$') {
                continue
            }

            # Skip if parseInt or Number() is used
            if ($value_arg -match '^parseInt\s*\(' -or $value_arg -match '^Number\s*\(') {
                continue
            }

            # Skip if variable name suggests it's already converted
            if ($value_arg -match 'AsNumber$|AsInt$|_num$|_number$') {
                continue
            }

            # This looks like a potential type mismatch
            $warnings += "⚠️  Field '$field' is NUMBER type but queried with '$value_arg' (likely a string)"
        }
    }
}

if ($warnings.Count -gt 0) {
    $output = @{
        decision = "block"
        reason = @"
POTENTIAL TYPE MISMATCH DETECTED in Wix query!

$($warnings -join "`n")

Wix wixData.query().eq() does STRICT type comparison.
Form data is always strings, but these fields are NUMBER type.
Queries will silently return empty results without type conversion.

FIX: Convert to number before querying:
  const dotNumberAsNumber = parseInt(formData.dotNumber.trim(), 10);
  .eq('dot_number', dotNumberAsNumber)

See CLAUDE.md section 'Wix Collection Record Linking' for the full pattern.
"@
    }
    $output | ConvertTo-Json -Compress
    exit 0
}

# No issues found
exit 0
