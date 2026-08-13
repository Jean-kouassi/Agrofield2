# apply-all-fixes.ps1
# Applique toutes les corrections avant déploiement

Write-Host "🔧 Application des correctifs..." -ForegroundColor Cyan

# 1. Correction des classes af-*
Write-Host "`n1️⃣  Correction des classes custom af-*..." -ForegroundColor Yellow
& .\scripts\fix-af-classes.ps1

# 2. Correction accessibilité formulaire
Write-Host "`n2️⃣  Correction accessibilité formulaire..." -ForegroundColor Yellow

$filePath = "src\components\marketplace\publish-modal.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Titre
$content = $content -replace '(<Label\s+className="text-sm font-semibold">\s*Titre)', '<Label htmlFor="offer-title" $1'
$content = $content -replace '(<Input\s+maxLength=\{100\})', '<Input`n                    id="offer-title"`n                    name="title"`n                    maxLength={100}'

# Description
$content = $content -replace '(<Textarea\s+rows=\{4\})', '<Textarea`n                  id="offer-description"`n                  name="description"`n                  rows={4}'

# Prix
$content = $content -replace '(<Label\s+className="text-sm font-semibold">Prix unitaire \(FCFA\)</Label>)', '<Label htmlFor="offer-price" className="text-sm font-semibold">Prix unitaire (FCFA)</Label>'
$content = $content -replace '(<Input\s+type="number"\s+value=\{data\.price\})', '<Input`n                      id="offer-price"`n                      name="price"`n                      type="number"`n                      value={data.price}`n                      required`n                      min="1"'

# Quantité
$content = $content -replace '(<Label\s+className="text-sm font-semibold">\s*Quantité disponible)', '<Label htmlFor="offer-quantity" className="text-sm font-semibold">`n                  Quantité disponible'
$content = $content -replace '(placeholder="500"\s+className="flex h-10 w-full)', 'placeholder="500"`n                    required`n                    min="1"`n                    className="flex h-10 w-full'

# Minimum order
$content = $content -replace '(<Label\s+className="text-sm font-semibold">Quantité minimale de commande</Label>)', '<Label htmlFor="offer-min-order" className="text-sm font-semibold">Quantité minimale de commande</Label>'
$content = $content -replace '(<Input\s+type="number"\s+value=\{data\.minOrder\})', '<Input`n                  id="offer-min-order"`n                  name="minOrder"`n                  type="number"`n                  value={data.minOrder}`n                  required`n                  min="1"'

Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "   ✅ Formulaire corrigé (id, name, htmlFor, required)" -ForegroundColor Green

# 3. Build
Write-Host "`n3️⃣  Build TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build réussi !" -ForegroundColor Green
    
    # 4. Déploiement
    Write-Host "`n4️⃣  Déploiement Cloudflare Pages..." -ForegroundColor Yellow
    npx wrangler pages deploy dist --project-name agrofield2 --branch main --commit-dirty=true
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 DÉPLOIEMENT RÉUSSI !" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Échec du déploiement" -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ Échec du build" -ForegroundColor Red
}
