
$files = Get-ChildItem "src/public/carrier/*.html"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    $content = Get-Content $file.FullName -Raw

    # 1. Remove Inline Tailwind Config
    # Regex to capture the whole script block containing tailwind.config
    $content = $content -replace '(?s)<script[^>]*>\s*tailwind\.config\s*=.*?</script>', ''

    # 2. Add lmdr-config.js import
    # Look for the tailwind CDN script and append lmdr-config.js after it
    if ($content -notmatch 'lmdr-config\.js') {
        # Check if Tailwind CDN exists
        if ($content -match 'cdn.tailwindcss.com') {
             $replacement = '$1' + "`n    <script src=`"../lmdr-config.js`"></script>"
             $content = $content -replace '(<script src="https://cdn.tailwindcss.com.*?></script>)', $replacement
        }
    }

    # 3. Replace Hardcoded Colors with Tokens (Safe Replacements)
    $replacements = @{
        'bg-slate-900' = 'bg-lmdr-dark'
        'text-slate-900' = 'text-lmdr-dark'
        'bg-blue-600' = 'bg-lmdr-blue'
        'text-blue-600' = 'text-lmdr-blue'
        'bg-yellow-400' = 'bg-lmdr-yellow'
        'text-yellow-400' = 'text-lmdr-yellow'
        'bg-amber-400' = 'bg-lmdr-yellow'
        'text-amber-400' = 'text-lmdr-yellow'
        'bg-gray-50' = 'bg-lmdr-canvas' 
    }

    foreach ($key in $replacements.Keys) {
        $content = $content.Replace($key, $replacements[$key])
    }

    $content | Set-Content $file.FullName -NoNewline
}

Write-Host "Migration Complete."
