# Script pour générer les icônes PWA 192x192 et 512x512
$outputDir = "C:\Users\Kouassi\Desktop\Agrofield2\public"
Write-Host "Génération des icônes PWA..." -ForegroundColor Cyan

$systemDrawingAvailable = $false
try {
    Add-Type -AssemblyName System.Drawing -ErrorAction Stop
    $systemDrawingAvailable = $true
} catch {
    Write-Host "System.Drawing non disponible" -ForegroundColor Yellow
}

if ($systemDrawingAvailable) {
    $bitmap512 = New-Object System.Drawing.Bitmap(512, 512)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap512)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillRectangle($whiteBrush, 0, 0, 512, 512)
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 163, 74))
    $graphics.FillEllipse($greenBrush, 176, 140, 160, 240)
    $graphics.DrawLine([System.Drawing.Pens]::Green, 256, 380, 256, 280)
    $bitmap512.Save("$outputDir\pwa-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap512.Dispose()
    
    $bitmap192 = New-Object System.Drawing.Bitmap(192, 192)
    $graphics192 = [System.Drawing.Graphics]::FromImage($bitmap192)
    $graphics192.FillRectangle($whiteBrush, 0, 0, 192, 192)
    $graphics192.FillEllipse($greenBrush, 66, 52, 60, 90)
    $graphics192.DrawLine([System.Drawing.Pens]::Green, 96, 142, 96, 105)
    $bitmap192.Save("$outputDir\pwa-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap192.Dispose()
    
    $graphics.Dispose()
    $whiteBrush.Dispose()
    $greenBrush.Dispose()
    
    Write-Host "Icones generees avec succes !" -ForegroundColor Green
} else {
    Write-Host "Utilise Paint.NET ou GIMP pour creer les icones PNG" -ForegroundColor Yellow
}
Write-Host "Termine !" -ForegroundColor Cyan
