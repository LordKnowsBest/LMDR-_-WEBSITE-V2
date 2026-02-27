# enforce-neumorphic-design.ps1
# PostToolUse hook: blocks Write/Edit on non-driver HTML/JS/CSS surfaces that violate
# the Solarized Neumorphic Design System rules.
#
# Surfaces covered: admin/, recruiter/, carrier/, landing/
# Exempt:           driver/ (uses LMDR branding, different design system)

param()

$ErrorActionPreference = "Continue"

$inputJson = $null
try {
    $inputJson = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
    exit 0
}

# Only act on Write and Edit tool calls
$toolName = $inputJson.tool_name
if ($toolName -notin @("Write", "Edit")) {
    exit 0
}

# Get the file path from tool input
$filePath = $inputJson.tool_input.file_path
if (-not $filePath) {
    exit 0
}

$normalizedPath = $filePath -replace '\\', '/'

# Only apply to non-driver surfaces
if ($normalizedPath -notmatch "src/public/(admin|recruiter|carrier)/.*\.(html|HTML|js|css)$") {
    exit 0
}

# Get the content being written/edited
$content = ""
if ($toolName -eq "Write") {
    $content = $inputJson.tool_input.content
} elseif ($toolName -eq "Edit") {
    $content = $inputJson.tool_input.new_string
}

if (-not $content) {
    exit 0
}

# ─── Design System Violation Checks ──────────────────────────────────────────

$violations = @()

# 1. Wrong background classes — use bg-beige / var(--ros-surface) instead
if ($content -match '\bbg-white\b|\bbg-gray-\d|\bbg-slate-\d|\bbg-neutral-\d|\bbg-zinc-\d') {
    $violations += "WRONG BACKGROUND: Found 'bg-white' or 'bg-gray-*' — use 'bg-beige' or 'var(--ros-surface)' instead."
}

# 2. Wrong text color classes — use text-lmdr-dark / text-tan instead
if ($content -match '\btext-gray-\d|\btext-slate-\d|\btext-neutral-\d|\btext-zinc-\d') {
    $violations += "WRONG TEXT COLOR: Found 'text-gray-*' or 'text-slate-*' — use 'text-lmdr-dark' (primary) or 'text-tan' (muted) instead."
}

# 3. Hardcoded dark text colors
if ($content -match 'color:\s*#333|color:\s*#444|color:\s*#555|color:\s*black\b|color:\s*#000\b') {
    $violations += "HARDCODED TEXT COLOR: Found 'color: #333' or similar — use CSS var '--ros-text' or Tailwind class 'text-lmdr-dark'."
}

# 4. Hardcoded white backgrounds
if ($content -match 'background(-color)?:\s*(white|#fff\b|#ffffff\b)' -or $content -match "background(-color)?:\s*'(white|#fff|#ffffff)'") {
    $violations += "HARDCODED WHITE BACKGROUND: Use 'var(--ros-surface)' or 'bg-beige' instead of white."
}

# 5. Font Awesome icons — only Material Symbols Outlined is allowed
if ($content -match '\bfa-solid\b|\bfa-regular\b|\bfa-brands\b|\bfas\b|\bfar\b|\bfab\b|font-awesome') {
    $violations += "WRONG ICON LIBRARY: Font Awesome detected — use Material Symbols Outlined exclusively (class='material-symbols-outlined')."
}

# 6. Arbitrary box-shadow values (not using neu-* classes or CSS vars)
# Allow: neu, neu-s, neu-x, neu-in, neu-ins, neu-lg, neu-ind, var(--ros-*), var(--rds-*)
if ($content -match 'box-shadow:\s*\d') {
    # Check if it's using a CSS var — that's OK
    if ($content -notmatch 'box-shadow:\s*var\(--r') {
        $violations += "ARBITRARY BOX-SHADOW: Found raw 'box-shadow: Npx...' value — use neumorphic elevation classes (neu, neu-s, neu-x, neu-in, neu-ins, neu-lg) or var(--ros-elev-*) instead."
    }
}

# 7. Inline styles using opacity on custom colors — known Tailwind CDN limitation
# Catch: text-tan/50, text-lmdr-blue/30, bg-beige/80, etc. in innerHTML contexts
if ($content -match '\.(innerHTML|insertAdjacentHTML|innerText)\s*[+=]' -and $content -match '\btext-(tan|lmdr-\w+|sg|ivory|beige)[/\\]\d|\bbg-(beige|tan|ivory)[/\\]\d') {
    $violations += "TAILWIND OPACITY MODIFIER IN INNERHTML: Classes like 'text-tan/50' won't render in dynamically-injected HTML (Tailwind CDN play mode). Use inline styles: 'style=\"color:rgba(200,184,150,0.5)\"' instead."
}

# ─── Report Violations ────────────────────────────────────────────────────────

if ($violations.Count -eq 0) {
    exit 0
}

$surface = if ($normalizedPath -match "src/public/(\w+)/") { $Matches[1] } else { "non-driver" }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗"
Write-Host "║  DESIGN SYSTEM VIOLATION — Solarized Neumorphic ($surface)  ║"
Write-Host "╚══════════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "File: $filePath"
Write-Host ""
Write-Host "Violations found:"
foreach ($v in $violations) {
    Write-Host "  ✗ $v"
}
Write-Host ""
Write-Host "Quick Reference:"
Write-Host "  Backgrounds : bg-beige | var(--ros-surface)"
Write-Host "  Text primary: text-lmdr-dark | var(--ros-text)"
Write-Host "  Text muted  : text-tan | var(--ros-text-muted)"
Write-Host "  Elevation   : neu-x | neu-s | neu | neu-lg | neu-in | neu-ins | neu-ind"
Write-Host "  Icons       : <span class='material-symbols-outlined'>icon_name</span>"
Write-Host ""
Write-Host "Full guide: .claude/docs/neumorphic-design-system.md"
Write-Host "Skill     : .agents/skills/recruiter-os-design-system/SKILL.md"
Write-Host ""

# Exit 2 = blocking error (Claude Code will see this as a hook failure)
exit 2
