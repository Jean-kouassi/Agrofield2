# 🔧 Fix - Classes CSS Custom Non Définies

**Date:** 2026-08-12 14:40 GMT  
**Problème:** Classes `af-card`, `af-display`, `af-text-10`, `af-progress-*` utilisées mais jamais définies  
**Impact:** Boutons d'onglets invisibles, styles manquants

---

## 🐛 Problèmes Identifiés

### 1. Onglets "Mes achats" / "Mes ventes" (orders-view.tsx)
- Utilise `af-card` → non défini
- Style inactif invisible

### 2. Modal de création d'offre (publish-modal.tsx)
- Utilise `af-display`, `af-text-10`, `af-progress-line`, `af-progress-fill`
- Étapes de progression invisibles

### 3. Autres fichiers affectés
- `buyer-dashboard.tsx`
- `filter-drawer.tsx`
- Potentiellement d'autres composants marketplace

---

## ✅ Solution

### Option 1: Remplacer par Classes Tailwind (Recommandé)

Remplacer toutes les occurrences `af-*` par des équivalents Tailwind :

| Classe custom | Équivalent Tailwind | Usage |
|---------------|---------------------|-------|
| `af-card` | `bg-card border border-border rounded-xl shadow-sm` | Cartes, containers |
| `af-display` | `text-base font-semibold text-foreground` | Titres, labels |
| `af-text-10` | `text-[10px] text-muted-foreground` | Petit texte |
| `af-progress-line` | `h-1 bg-muted rounded-full overflow-hidden` | Barre de progression |
| `af-progress-fill` | `h-full bg-primary transition-all duration-300` | Remplissage progression |
| `af-input` | `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50` | Inputs |

---

## 📝 Fichiers à Corriger

### 1. orders-view.tsx ✅ (DÉJÀ FAIT)

**Avant:**
```tsx
className={cn(
  'flex-1 rounded-xl p-3 ...',
  role === 'buyer' ? 'text-white shadow-md' : 'af-card text-muted-foreground'
)}
```

**Après:**
```tsx
className={cn(
  'flex-1 rounded-xl p-3 ... border',
  role === 'buyer'
    ? 'bg-[var(--agro-primary)] text-white shadow-md'
    : 'bg-card text-muted-foreground hover:bg-[var(--agro-pale)] hover:text-[var(--agro-primary)]'
)}
```

---

### 2. publish-modal.tsx

**Occurrences à corriger:**

#### Ligne ~145 (Step indicators)
```tsx
// AVANT
<div className="af-display w-7 h-7 rounded-full ...">

// APRÈS
<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200">
```

#### Ligne ~155 (Step labels)
```tsx
// AVANT
<span className="af-text-10 hidden sm:block" style={{ color: ... }}>

// APRÈS
<span className="hidden sm:block text-[10px] font-medium transition-colors" style={{ 
  color: i + 1 === step ? 'var(--agro-primary)' : i + 1 < step ? 'var(--foreground)' : 'var(--muted-foreground)',
}}>
```

#### Ligne ~167 (Progress bar)
```tsx
// AVANT
<div className="flex-1 h-1 af-progress-line rounded-full mx-1">
  <div className="af-progress-fill h-1 rounded-full" style={{ width: ... }} />

// APRÈS
<div className="flex-1 h-1 bg-muted/50 rounded-full mx-1 overflow-hidden">
  <div className="h-full bg-[var(--agro-primary)] transition-all duration-300 rounded-full" style={{ width: i + 1 < step ? '100%' : '0%' }} />
```

#### Ligne ~215 (Category buttons)
```tsx
// AVANT
<Button variant="outline" className={cn('af-card', selected && 'border-[var(--agro-primary)]')}>

// APRÈS
<Button variant="outline" className={cn('bg-card hover:bg-[var(--agro-pale)]', selected && 'border-[var(--agro-primary)] text-[var(--agro-primary)]')}>
```

---

### 3. buyer-dashboard.tsx

**Rechercher et remplacer:**
```bash
# Dans VSCode ou autre editor
af-display → text-base font-semibold text-foreground
af-card → bg-card border border-border rounded-xl shadow-sm
```

---

### 4. filter-drawer.tsx

Même approche : remplacer `af-display` par classes Tailwind équivalentes.

---

## 🛠️ Script de Correction Automatique

Crée un fichier PowerShell pour automatiser :

**Fichier:** `scripts/fix-af-classes.ps1`

```powershell
# Fix-af-classes.ps1
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Select-Object -ExpandProperty FullName

$replacements = @{
    'af-display' = 'text-base font-semibold text-foreground'
    'af-card' = 'bg-card border border-border rounded-xl shadow-sm'
    'af-text-10' = 'text-[10px] text-muted-foreground'
    'af-progress-line' = 'h-1 bg-muted/50 rounded-full overflow-hidden'
    'af-progress-fill' = 'h-full bg-[var(--agro-primary)] transition-all duration-300'
    'af-input' = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
}

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "✅ Fixed: $file"
    }
}

Write-Host "`n🎉 Correction terminée !"
```

**Exécution:**
```powershell
cd C:\Users\Kouassi\Desktop\AgroSphere2
.\scripts\fix-af-classes.ps1
```

---

## ✅ Checklist Finale

Après corrections :

- [ ] ✅ `orders-view.tsx` — Onglets visibles et fonctionnels
- [ ] ✅ `publish-modal.tsx` — Étapes de progression visibles
- [ ] ✅ `buyer-dashboard.tsx` — Titres et cartes stylisés
- [ ] ✅ `filter-drawer.tsx` — Titres corrects
- [ ] ✅ Build TypeScript passe sans erreur
- [ ] ✅ Test visuel dans l'app

---

## 🎨 Design System Rappels

**Toujours utiliser ces tokens :**
```css
--agro-primary: #166534     /* Vert forêt */
--agro-pale: #f0fdf4        /* Vert très pâle (hover) */
--agro-accent: #d97706      /* Ocre */
```

**Classes Tailwind recommandées :**
```tsx
// Cartes
className="bg-card border border-border rounded-xl shadow-sm"

// Titres
className="text-base font-semibold text-foreground"

// Boutons actifs
className="bg-[var(--agro-primary)] text-white"

// Boutons inactifs (hover)
className="bg-card hover:bg-[var(--agro-pale)] hover:text-[var(--agro-primary)]"

// Progress bars
className="h-1 bg-muted/50 rounded-full overflow-hidden"
className="h-full bg-[var(--agro-primary)] transition-all duration-300"
```

---

**Prochaine action:** Appliquer les corrections sur `publish-modal.tsx` et tester !
