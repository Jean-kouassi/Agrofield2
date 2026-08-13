# Fix-Form-Accessibility.ps1
# Corrige l'accessibilité du formulaire publish-modal.tsx

$filePath = "src\components\marketplace\publish-modal.tsx"
$content = Get-Content $filePath -Raw

# 1. Ajouter id, name, htmlFor sur le champ Titre
$content = $content -replace 
  '(<Label className="text-sm font-semibold">\s*Titre.*?</Label>\s*<Input)',
  '<Label htmlFor="offer-title" className="text-sm font-semibold">`n                  Titre `$1'

$content = $content -replace 
  '(<Input\s+maxLength=\{100\})',
  '<Input`n                  id="offer-title"`n                  name="title"`n                  maxLength={100}'

# 2. Ajouter id, name au Textarea Description
$content = $content -replace 
  '(<Textarea\s+rows=\{4\})',
  '<Textarea`n                  id="offer-description"`n                  name="description"`n                  rows={4}'

# 3. Ajouter id, name, required au champ Prix
$content = $content -replace 
  '(<Label className="text-sm font-semibold">Prix unitaire \(FCFA\)</Label>\s*<Input\s+type="number")',
  '<Label htmlFor="offer-price" className="text-sm font-semibold">Prix unitaire (FCFA)</Label>`n                  <Input`n                    id="offer-price"`n                    name="price"`n                    type="number"`n                    required`n                    min="1"'

# 4. Ajouter id, name, required au champ Quantité
$content = $content -replace 
  '(<Label className="text-sm font-semibold">\s*Quantité disponible)',
  '<Label htmlFor="offer-quantity" className="text-sm font-semibold">`n                  Quantité disponible'

$content = $content -replace 
  '(placeholder="500"\s+className="flex h-10 w-full)',
  'placeholder="500"`n                    required`n                    min="1"`n                    className="flex h-10 w-full'

# 5. Ajouter id, name, required au champ Minimum Order
$content = $content -replace 
  '(<Label className="text-sm font-semibold">Quantité minimale de commande</Label>\s*<Input\s+type="number")',
  '<Label htmlFor="offer-min-order" className="text-sm font-semibold">Quantité minimale de commande</Label>`n                  <Input`n                    id="offer-min-order"`n                    name="minOrder"`n                    type="number"`n                    required`n                    min="1"'

# Sauvegarder
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "✅ Accessibilité formulaire corrigée dans publish-modal.tsx"
Write-Host "   - Ajout id/name sur inputs"
Write-Host "   - Ajout htmlFor sur labels"
Write-Host "   - Ajout required/min sur champs obligatoires"
