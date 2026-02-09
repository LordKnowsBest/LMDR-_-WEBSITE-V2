
# Enhanced Bridge Mapper
# Matches HTML files to Velo pages using fuzzy logic and checks for bridge existence.

$htmlDir = "c:\Users\Reputationist\Desktop\LMDR V2\LMDR-_-WEBSITE-V2\src\public"
$pagesDir = "c:\Users\Reputationist\Desktop\LMDR V2\LMDR-_-WEBSITE-V2\src\pages"
$outFile = "c:\Users\Reputationist\Desktop\LMDR V2\LMDR-_-WEBSITE-V2\bridge_map_report.txt"

# Helper to normalize names for comparison
function Normalize-Name ($name) {
    # Remove extension
    $n = $name -replace "\.(js|html|rof4w|zriuj|wix|com|net|org)$", ""
    # Remove Velo ID suffix (e.g. .abc12) if present
    $n = $n -replace "\.[a-z0-9]{5}$", ""
    # Replace underscores/hyphens with space
    $n = $n -replace "[_\-]", " "
    # Remove common prefixes/suffixes
    $n = $n -replace "admin", ""
    $n = $n -replace "dashboard", ""
    $n = $n -replace "page", ""
    # Remove spaces and lowercase
    return ($n -replace "\s", "").ToLower()
}

# 1. Get all Page files that treat messages
Write-Host "Scanning Pages..."
$pageFiles = Get-ChildItem -Path $pagesDir -Filter "*.js"
$pagesWithOnMessage = @{}
$pageMap = @{}

foreach ($page in $pageFiles) {
    $content = Get-Content $page.FullName -Raw
    if ($content -match "\.onMessage\s*\(") {
        $norm = Normalize-Name $page.Name
        $pagesWithOnMessage[$page.Name] = $true
        
        # Store mapping: normalized -> actual filename
        if (-not $pageMap.ContainsKey($norm)) {
            $pageMap[$norm] = @()
        }
        $pageMap[$norm] += $page.Name
    }
}

# 2. Get all HTML files that send messages
Write-Host "Scanning HTML..."
$htmlFiles = Get-ChildItem -Path $htmlDir -Recurse -Filter "*.html"
$missingBridges = @()

foreach ($html in $htmlFiles) {
    $content = Get-Content $html.FullName -Raw
    
    # Check if HTML sends messages
    if ($content -match "window\.parent\.postMessage") {
        $norm = Normalize-Name $html.Name
        
        # Fuzzy match attempt
        $foundMatch = $false
        $matchName = ""

        # Exact normalized match
        if ($pageMap.ContainsKey($norm)) {
            $foundMatch = $true
            $matchName = $pageMap[$norm] -join ", "
        } 
        # Partial match (contains)
        else {
            foreach ($key in $pageMap.Keys) {
                if ($key -match $norm -or $norm -match $key) {
                    $foundMatch = $true
                    $matchName = $pageMap[$key] -join ", "
                    break
                }
            }
        }

        if (-not $foundMatch) {
            $missingBridges += @{
                HTML       = $html.Name
                Normalized = $norm
            }
        }
    }
}

# Output Results
if (Test-Path $outFile) { Remove-Item $outFile }
Add-Content -Path $outFile -Value "MISSING BRIDGES REPORT (Fuzzy Match)"
Add-Content -Path $outFile -Value "===================================="

foreach ($item in $missingBridges) {
    Add-Content -Path $outFile -Value "MISSING: $($item.HTML) (Normalized: $($item.Normalized))"
}

Write-Host "Report generated at $outFile"
