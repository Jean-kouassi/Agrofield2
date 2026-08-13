# 🔧 Fix Accessibilité Formulaire - Création d'Offre

**Date:** 2026-08-12 15:10 GMT  
**Problème:** Inputs sans `id`/`name`, Labels sans `for`  
**Impact:** Création d'offre échoue + warnings accessibilité

---

## ✅ Correction Manuelle à Appliquer

Dans `src/components/marketplace/publish-modal.tsx`, ajoute les attributs suivants :

### Étape 1 - Titre
```tsx
// AVANT
<Label className="text-sm font-semibold">
  Titre{' '}
  <span className="text-muted-foreground">({data.title.length}/100)</span>
</Label>
<Input
  maxLength={100}
  value={data.title}
  onChange={(e) => set('title', e.target.value)}
  placeholder="Ex : Tomates fraîches de saison"
/>

// APRÈS
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
/>
```

### Étape 2 - Description
```tsx
// AJOUTER id et name au textarea
<Textarea
  id="offer-description"
  name="description"
  rows={4}
  value={data.desc}
  onChange={(e) => set('desc', e.target.value)}
  placeholder="Décrivez votre produit..."
/>
```

### Étape 3 - Prix
```tsx
// AJOUTER id, name, et required
<Input
  id="offer-price"
  name="price"
  type="number"
  value={data.price}
  onChange={(e) => set('price', e.target.value)}
  placeholder="250"
  required
  min="1"
/>
```

### Étape 4 - Quantité
```tsx
// AJOUTER id, name, et required
<Input
  id="offer-quantity"
  name="quantity"
  type="number"
  value={data.qty}
  onChange={(e) => set('qty', e.target.value)}
  placeholder="500"
  required
  min="1"
/>
```

### Étape 5 - Minimum Order
```tsx
// AJOUTER id, name, et required
<Input
  id="offer-min-order"
  name="minOrder"
  type="number"
  value={data.minOrder}
  onChange={(e) => set('minOrder', e.target.value)}
  placeholder="10"
  required
  min="1"
/>
```

### Étape 6 - Région et Ville
```tsx
// SÉLECTEUR RÉGION
<select
  id="offer-region"
  name="region"
  value={data.region}
  onChange={(e) => set('region', e.target.value)}
  required
>
  {REGIONS.map((r) => (
    <option key={r} value={r}>{r}</option>
  ))}
</select>

// INPUT VILLE
<Input
  id="offer-city"
  name="city"
  value={data.city}
  onChange={(e) => set('city', e.target.value)}
  placeholder="Ex: Bobo-Dioulasso"
  required
/>
```

---

## 🚀 Déploiement Cloudflare

Après corrections :

```bash
cd C:\Users\Kouassi\Desktop\AgroSphere2

# 1. Build
npm run build

# 2. Deploy sur Cloudflare Pages
npx wrangler pages deploy dist --project-name AgroSphere2 --branch main

# OU si tu as déjà un projet
npx wrangler deploy
```

---

## 📊 Checklist Déploiement

- [ ] ✅ Migration RLS appliquée (fix infinite recursion)
- [ ] ✅ Classes `af-*` remplacées par Tailwind
- [ ] ✅ Formulaire corrigé (id, name, for, required)
- [ ] ✅ Build TypeScript passe sans erreur
- [ ] ✅ Test local création d'offre fonctionne
- [ ] ⚪ Déploiement Cloudflare effectué
- [ ] ⚪ Test production création d'offre

---

## 🔍 Debug Si Ça Ne Marche Toujours Pas

### 1. Vérifier Console Browser
```javascript
// Dans DevTools Console (F12)
const { data, error } = await supabase
  .from('marketplace_listings')
  .insert({
    title: 'Test',
    category: 'legumes',
    description: 'Description de test (20+ chars)',
    price: 1000,
    quantity: 50,
    unit: 'kg',
    region: 'Hauts-Bassins',
    city: 'Bobo-Dioulasso',
  });

console.log('Error:', error);
console.log('Data:', data);
```

### 2. Vérifier RLS dans Supabase
```sql
-- Dans SQL Editor
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'marketplace_listings';
```

Doit afficher :
- `marketplace_listings_select_public` (SELECT)
- `marketplace_listings_insert_producer` (INSERT)
- `marketplace_listings_update_owner` (UPDATE)
- `marketplace_listings_delete_owner` (DELETE)

### 3. Vérifier Logs Cloudflare
1. Va sur https://dash.cloudflare.com
2. Ton compte → Pages → AgroSphere2
3. Onglet "Functions" → "Logs"
4. Crée une offre et regarde les erreurs

---

**Prochaine action:** Appliquer les corrections d'accessibilité puis déployer !
