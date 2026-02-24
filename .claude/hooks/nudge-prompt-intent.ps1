# nudge-prompt-intent.ps1
# Claude Code PostToolUse hook
# Detects when a systemPrompt variable is written to a backend .jsw file
# and nudges the developer to run /intent-audit before committing.
#
# This is a SOFT nudge (exit 0) — it does not block the write.
# Intent evaluation requires LLM judgment; a hook enforces structure.
# This hook bridges the two: it triggers awareness, the skill does the work.

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputJson
)

$ErrorActionPreference = "Continue"

$inputData = $null
try {
    if ($InputJson) {
        $inputData = $InputJson | ConvertFrom-Json
    } else {
        $raw = [Console]::In.ReadToEnd()
        if ($raw) { $inputData = $raw | ConvertFrom-Json }
    }
} catch {
    exit 0
}

if (-not $inputData) { exit 0 }

# Only check Write and Edit tools
if ($inputData.tool_name -notin @("Write", "Edit")) {
    exit 0
}

$filePath = $inputData.tool_input.file_path

# Only check backend .jsw files
if (-not $filePath) { exit 0 }
$normalizedPath = $filePath -replace '\\', '/'
if ($normalizedPath -notmatch "src/backend/.*\.jsw$") {
    exit 0
}

# Determine content to scan
$contentToCheck = ""
if ($inputData.tool_name -eq "Edit") {
    $contentToCheck = $inputData.tool_input.new_string
} elseif ($inputData.tool_name -eq "Write") {
    $contentToCheck = $inputData.tool_input.content
}

if (-not $contentToCheck) { exit 0 }

# Detect system prompt patterns
$hasSystemPrompt = $false
$promptPatterns = @(
    'systemPrompt\s*=\s*[`''"]',
    'system_prompt\s*=\s*[`''"]',
    'SYSTEM_PROMPT\s*=\s*[`''"]',
    'systemPrompt\s*:\s*[`''"]',
    'system_prompt\s*:\s*[`''"]'
)

foreach ($pattern in $promptPatterns) {
    if ($contentToCheck -match $pattern) {
        $hasSystemPrompt = $true
        break
    }
}

if (-not $hasSystemPrompt) { exit 0 }

# Determine surface from filename
$fileName = Split-Path $normalizedPath -Leaf
$surface = "unknown"

if ($fileName -match "^b2b") { $surface = "B2B / Account Executive" }
elseif ($fileName -match "agent") { $surface = "multi-surface (check role parameter)" }
elseif ($fileName -match "matchExplanation|driverMatching") { $surface = "Driver" }
elseif ($fileName -match "recruiter|recruitment") { $surface = "Recruiter" }
elseif ($fileName -match "carrier") { $surface = "Carrier" }
elseif ($fileName -match "admin|observability|aiRouter") { $surface = "Admin" }
elseif ($fileName -match "voice") { $surface = "Voice / B2B Recruiter Outbound" }

# Output the nudge
Write-Output ""
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output "  PROMPT INTENT NUDGE"
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output ""
Write-Output "  System prompt detected in: $fileName"
Write-Output "  Surface: $surface"
Write-Output ""
Write-Output "  Before committing, run the intent audit:"
Write-Output ""
Write-Output "    /intent-audit $fileName"
Write-Output ""
Write-Output "  The audit scores your prompt against 5 criteria:"
Write-Output "    1. Consumer defined (who reads this output?)"
Write-Output "    2. Decision anchored (what decision do they face?)"
Write-Output "    3. Conditional reasoning (does context change behavior?)"
Write-Output "    4. Surface vs. deep (request vs. actual need)"
Write-Output "    5. Listening instructions (gather before delivering?)"
Write-Output ""
Write-Output "  Prompts scoring < 7/10 get a generated rewrite."
Write-Output "  Standard: .claude/docs/prompt-standards.md"
Write-Output ""
Write-Output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Output ""

# Soft nudge — do not block
exit 0
