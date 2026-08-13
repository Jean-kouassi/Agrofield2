# Fix-af-classes.ps1
# Remplace toutes les classes CSS custom "af-*" par des équivalents Tailwind

$replacements = @{
    'af-display' = 'text-base font-semibold text-foreground'
    'af-card' = 'bg-card border border-border rounded-xl shadow-sm'
    'af-text-10' = 'text-[10px] text-muted-foreground'
    'af-text-11' = 'text-xs'
    'af-text-13' = 'text-sm'
    'af-progress-line' = 'h-1 bg-muted/50 rounded-full overflow-hidden'
    'af-progress-fill' = 'h-full bg-[var(--agro-primary)] transition-all duration-300'
    'af-input' = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    'af-btn-ghost' = 'rounded-lg py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 w-full bg-muted/50 hover:bg-muted'
    'af-btn-primary' = 'rounded-lg bg-[var(--agro-primary)] text-white hover:opacity-90'
    'af-btn-accent' = 'rounded-lg bg-[var(--agro-accent)] text-white hover:opacity-90'
    'af-chip' = 'rounded-lg px-3.5 py-2.5 text-sm font-medium bg-card hover:bg-[var(--agro-pale)]'
    'af-chip-active' = 'border-[var(--agro-primary)] text-[var(--agro-primary)] bg-[var(--agro-pale)]'
    'af-bottom-sheet' = 'bg-background border-t'
    'af-msg-height' = 'min-h-[60vh] md:min-h-0'
    'af-bubble-me' = 'bg-[var(--agro-primary)] text-white'
    'af-bubble-them' = 'bg-muted'
    'af-scroll-x' = 'overflow-x-auto scrollbar-thin'
    'af-modal-overlay' = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50'
    'af-modal-content' = 'fixed inset-0 z-50 flex items-center justify-center p-4'
    'af-toast' = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--agro-primary)] text-white px-4 py-2 rounded-lg shadow-lg z-50'
    'af-modal-panel' = 'bg-background border border-border rounded-xl shadow-lg max-w-md w-full p-6'
    'af-scrollbar-hide' = 'scrollbar-none'
    'af-ticker-track' = 'animate-marquee whitespace-nowrap'
    'af-aspect-43' = 'aspect-[4/3]'
    'af-text-15' = 'text-sm'
    'af-clamp-2' = 'line-clamp-2 overflow-hidden text-ellipsis'
    'af-skeleton' = 'animate-pulse bg-muted'
    'af-badge-available' = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
    'af-badge-reserved' = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
    'af-badge-sold' = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
    'af-badge-draft' = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
}

$files = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $content
    
    foreach ($key in $replacements.Keys) {
        $modified = $modified -replace [regex]::Escape($key), $replacements[$key]
    }
    
    if ($modified -ne $content) {
        Set-Content -Path $file.FullName -Value $modified -Encoding UTF8
        Write-Host "✅ Fixed: $($file.Name)"
    }
}

Write-Host "`n🎉 Correction terminée !"
