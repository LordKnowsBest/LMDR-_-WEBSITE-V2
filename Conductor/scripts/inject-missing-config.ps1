
$files = @(
    "src/public/landing/About_page.html",
    "src/public/landing/AI vs Traditional Recruiting Methods.html",
    "src/public/landing/DOT Compliance in Driver Hiring.html",
    "src/public/landing/Rapid Response - Job Description.html"
)

$injectBlock = @"
    <!-- Tailwind CSS (Injected for Standardization) -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script src="../lmdr-config.js"></script>
"@

foreach ($relPath in $files) {
    if (Test-Path $relPath) {
        Write-Host "Injecting config into $relPath..."
        $content = Get-Content $relPath -Raw
        
        if ($content -notmatch 'lmdr-config\.js') {
            # Inject before </head>
            $content = $content -replace '</head>', ($injectBlock + "`n</head>")
            $content | Set-Content $relPath -NoNewline
        } else {
            Write-Host "Config already present in $relPath."
        }
    } else {
        Write-Host "File not found: $relPath" -ForegroundColor Red
    }
}
