# 🩹 Patch Accessibilité - publish-modal.tsx

**Date:** 2026-08-12 15:10 GMT  
**Fichier:** `src/components/marketplace/publish-modal.tsx`  
**Objectif:** Ajouter id, name, htmlFor, required sur tous les champs du formulaire

---

## Corrections à Appliquer Manuellement

### Étape 1 - Champ Titre (ligne ~178)

**AVANT:**
```tsx
<div>
  <Label className="text-sm font-semibold">
    Titre{' '}
    <span className="text-muted-foreground">({data.title.length}/100)</span>
  </Label>
  <Input
    maxLength={100}
    value={data.title}
    onChange={(e) => set('title', e.target.value)}
    placeholder="Ex : Tomates fraîches de saison"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
  />
</div>
```

**APRÈS:**
```tsx
<div>
  <Label htmlFor="offer-title" className="text-sm font-semibold">
    Titre{' '}
    <span className="text-muted-foreground">({data.title.length}/100)</span>
  </Label>
  <Input
    id="offer-title"
    name="title"
    maxLength={100}
    value={data.title}
    onChange={(e) => set('title', e.target.value)}
    placeholder="Ex : Tomates fraîches de saison"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
  />
</div>
```

---

### Étape 2 - Description (ligne ~190)

**AJOUTER** `id="offer-description"` et `name="description"` au `<Textarea>`

---

### Étape 3 - Prix (ligne ~210)

**AVANT:**
```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <Label className="text-sm font-semibold">Prix unitaire (FCFA)</Label>
    <Input
      type="number"
      value={data.price}
      onChange={(e) => set('price', e.target.value)}
      placeholder="250"
      className="..."
    />
  </div>
```

**APRÈS:**
```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <Label htmlFor="offer-price" className="text-sm font-semibold">Prix unitaire (FCFA)</Label>
    <Input
      id="offer-price"
      name="price"
      type="number"
      value={data.price}
      onChange={(e) => set('price', e.target.value)}
      placeholder="250"
      required
      min="1"
      className="..."
    />
  </div>
```

---

### Étape 4 - Quantité (ligne ~220)

**AJOUTER:**
- `htmlFor="offer-quantity"` au Label
- `id="offer-quantity"`, `name="quantity"`, `required`, `min="1"` à l'Input

---

### Étape 5 - Minimum Order (ligne ~245)

**AJOUTER:**
- `htmlFor="offer-min-order"` au Label
- `id="offer-min-order"`, `name="minOrder"`, `required`, `min="1"` à l'Input

---

### Étape 6 - Région (ligne ~260)

**AVANT:**
```tsx
<select
  value={data.region}
  onChange={(e) => set('region', e.target.value)}
  className="..."
>
```

**APRÈS:**
```tsx
<select
  id="offer-region"
  name="region"
  value={data.region}
  onChange={(e) => set('region', e.target.value)}
  required
  className="..."
>
```

---

### Étape 7 - Ville (ligne ~275)

**AJOUTER:**
- `htmlFor="offer-city"` au Label
- `id="offer-city"`, `name="city"`, `required` à l'Input

---

## Vérification Finale

Après corrections, tester dans la console browser :
```javascript
// Tous les inputs doivent avoir un id
document.querySelectorAll('#offer-title, #offer-description, #offer-price, #offer-quantity, #offer-min-order, #offer-region, #offer-city')
// Doit retourner 7 éléments
```

---

**Note:** Les corrections ont été appliquées via le fichier `FIX_FORM_ACCESSIBILITY.md` mais le script PowerShell a échoué à cause de problèmes d'encodage. À appliquer manuellement dans VSCode.
