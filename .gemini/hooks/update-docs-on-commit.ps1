# update-docs-on-commit.ps1
# Hook to update CLAUDE.md, GEMINI.md, and Conductor tracks when code is committed
# Triggered on: pre-commit or post-file-edit

param(
    [string]$ChangedFiles = "",
    [string]$CommitMessage = ""
)

$projectRoot = "C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2"
$claudeMd = Join-Path $projectRoot "CLAUDE.md"
$geminiMd = Join-Path $projectRoot "GEMINI.md"
$conductorTracks = Join-Path $projectRoot "Conductor\tracks"

# Categories of changes that trigger doc updates
$docTriggers = @{
    "backend_service" = @{
        pattern = "src/backend/*.jsw"
        docs = @("CLAUDE.md", "GEMINI.md")
        section = "Backend Services"
    }
    "html_component" = @{
        pattern = "src/public/*.html"
        docs = @("GEMINI.md")
        section = "HTML Component Inventory"
    }
    "scheduled_job" = @{
        pattern = "src/backend/jobs.config"
        docs = @("CLAUDE.md", "GEMINI.md")
        section = "Scheduled Jobs"
    }
    "collection_schema" = @{
        pattern = "src/backend/setupCollections.jsw"
        docs = @("CLAUDE.md")
        section = "Wix Collections"
    }
    "conductor_track" = @{
        pattern = "Conductor/tracks/*"
        docs = @("GEMINI.md")
        section = "Conductor Project Hub"
    }
}

# Function to detect which categories were affected
function Get-AffectedCategories {
    param([string[]]$files)

    $affected = @()

    foreach ($file in $files) {
        foreach ($category in $docTriggers.Keys) {
            $pattern = $docTriggers[$category].pattern
            if ($file -like $pattern) {
                if ($affected -notcontains $category) {
                    $affected += $category
                }
            }
        }
    }

    return $affected
}

# Function to find related Conductor track
function Find-RelatedTrack {
    param([string[]]$files)

    $trackKeywords = @{
        "admin" = "admin_portal"
        "driver" = "driver_cockpit"
        "recruiter" = "retention_dashboard"
        "stripe" = "stripe_subscriptions"
        "carrier" = "carrier_conversion"
        "matching" = "reverse_matching"
        "form" = "form_ux_refactor"
        "observability" = "observability_gaps"
    }

    $relatedTracks = @()

    foreach ($file in $files) {
        $fileName = Split-Path $file -Leaf
        foreach ($keyword in $trackKeywords.Keys) {
            if ($fileName -match $keyword -or $file -match $keyword) {
                $trackPattern = $trackKeywords[$keyword]
                $matchingTracks = Get-ChildItem -Path $conductorTracks -Directory | Where-Object { $_.Name -match $trackPattern }
                foreach ($track in $matchingTracks) {
                    if ($relatedTracks -notcontains $track.FullName) {
                        $relatedTracks += $track.FullName
                    }
                }
            }
        }
    }

    return $relatedTracks
}

# Function to generate documentation reminder
function Get-DocUpdateReminder {
    param(
        [string[]]$affectedCategories,
        [string[]]$relatedTracks
    )

    $reminder = @"
================================================================================
DOCUMENTATION UPDATE REQUIRED
================================================================================

The following documentation sections may need updates based on your changes:

"@

    foreach ($category in $affectedCategories) {
        $trigger = $docTriggers[$category]
        $docs = $trigger.docs -join ", "
        $section = $trigger.section
        $reminder += "`n- [$docs] Section: '$section'"
    }

    if ($relatedTracks.Count -gt 0) {
        $reminder += "`n`nRelated Conductor Tracks to review/update:"
        foreach ($track in $relatedTracks) {
            $trackName = Split-Path $track -Leaf
            $reminder += "`n- Conductor/tracks/$trackName/"
        }
    }

    $reminder += @"

================================================================================
ACTION ITEMS:
1. Review the sections above in CLAUDE.md and GEMINI.md
2. Update any outdated information
3. If adding new backend service: Add to Backend Services section
4. If adding new HTML file: Add to HTML Component Inventory
5. If modifying scheduled jobs: Update Scheduled Jobs section
6. If work relates to a track: Update the track's plan.md or spec.md
================================================================================
"@

    return $reminder
}

# Main execution
if ($ChangedFiles) {
    $files = $ChangedFiles -split ","
} else {
    # Get staged files if no files provided
    $files = git diff --cached --name-only 2>$null
    if (-not $files) {
        $files = git diff --name-only HEAD~1 2>$null
    }
}

if ($files) {
    $affectedCategories = Get-AffectedCategories -files $files
    $relatedTracks = Find-RelatedTrack -files $files

    if ($affectedCategories.Count -gt 0 -or $relatedTracks.Count -gt 0) {
        $reminder = Get-DocUpdateReminder -affectedCategories $affectedCategories -relatedTracks $relatedTracks
        Write-Host $reminder -ForegroundColor Yellow

        # Output structured data for Gemini to process
        $output = @{
            affected_categories = $affectedCategories
            related_tracks = $relatedTracks
            docs_to_update = @()
        }

        foreach ($category in $affectedCategories) {
            $output.docs_to_update += $docTriggers[$category].docs
        }

        $output.docs_to_update = $output.docs_to_update | Select-Object -Unique

        # Return as JSON for Gemini to parse
        return $output | ConvertTo-Json -Compress
    }
}

Write-Host "No documentation updates required for these changes." -ForegroundColor Green
return $null
