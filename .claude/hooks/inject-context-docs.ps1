# inject-context-docs.ps1
# Auto-injects relevant context documentation based on the file being accessed.
# Runs on PreToolUse for Read|Edit|Write tools.
# Uses session markers to avoid re-injecting the same doc within 2 hours.

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

# Normalize path separators
$normalizedPath = $filePath -replace '\\', '/'

# Skip if we're reading the context docs themselves (avoid recursion)
if ($normalizedPath -match "\.claude/docs/") {
    exit 0
}

# Determine which docs to inject based on file path
$docsToInject = @()

# Rule 1: Backend .jsw files -> airtable-routing.md
if ($normalizedPath -match "src/backend/.*\.jsw$") {
    $fileName = Split-Path $normalizedPath -Leaf
    # Skip airtableClient.jsw and config.jsw content checks (they ARE the routing infra)
    # But still inject for reference when editing them
    $docsToInject += "airtable-routing"
}

# Rule 2: Carrier HTML or staffing-related files -> carrier-staffing-forms.md
if ($normalizedPath -match "src/public/carrier/" -or $normalizedPath -imatch "staffing") {
    $docsToInject += "carrier-staffing-forms"
}

# Rule 3: Gamification service files -> gamification-integration.md
if ($normalizedPath -match "src/backend/(gamification|streak|achievement|challenge|seasonal).*\.(jsw|js)$") {
    $docsToInject += "gamification-integration"
}

# Rule 4: Stripe/subscription files -> pricing-and-tiers.md
if ($normalizedPath -match "src/backend/(stripe|subscription|abandonment).*\.jsw$") {
    $docsToInject += "pricing-and-tiers"
}

# Rule 5: Services that commonly link records -> wix-record-linking.md
if ($normalizedPath -match "src/backend/(carrierLeads|application|driverProfiles|carrierMatching|driverMatching|memberService|fmcsa).*\.jsw$") {
    $docsToInject += "wix-record-linking"
}

# Rule 6: LLM-calling services -> prompt-standards.md
# Targets any service whose name signals it contains system prompts or AI calls:
# b2bContentAI, b2bResearchAgent, agentService, aiRouter, matchExplanation,
# voiceService, voiceCampaign, healthService (community tips moderation)
if ($normalizedPath -match "src/backend/(b2bContent|b2bResearch|b2bAgent|b2bAI|agentService|agentConversation|aiRouter|matchExplanation|voiceService|voiceCampaign|voice).*\.jsw$") {
    $docsToInject += "prompt-standards"
}

if ($docsToInject.Count -eq 0) {
    exit 0
}

# Session dedup: use temp markers to avoid re-injecting within 2 hours
$markerDir = Join-Path $env:TEMP "claude-context-markers"
if (-not (Test-Path $markerDir)) {
    New-Item -ItemType Directory -Path $markerDir -Force | Out-Null
}

# Resolve repo root from script location (.claude/hooks/ -> repo root)
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$injectedAny = $false

foreach ($doc in $docsToInject) {
    $markerFile = Join-Path $markerDir "$doc.marker"

    # Check if already injected recently (within 2 hours)
    if (Test-Path $markerFile) {
        $age = (Get-Date) - (Get-Item $markerFile).LastWriteTime
        if ($age.TotalHours -lt 2) {
            continue
        }
    }

    $docPath = Join-Path $repoRoot ".claude\docs\$doc.md"
    if (Test-Path $docPath) {
        if (-not $injectedAny) {
            Write-Host ""
            Write-Host "=== AUTO-INJECTED CONTEXT ==="
            $injectedAny = $true
        }
        Write-Host ""
        $content = Get-Content $docPath -Raw
        Write-Host $content
        Write-Host ""

        # Mark as injected
        Set-Content -Path $markerFile -Value (Get-Date).ToString()
    }
}

if ($injectedAny) {
    Write-Host "=== END AUTO-INJECTED CONTEXT ==="
    Write-Host ""
}

exit 0
