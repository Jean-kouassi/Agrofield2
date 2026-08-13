# ✅ Vérification Post-Fix RLS

**Date:** 2026-08-12 14:35 GMT  
**Migration appliquée:** `20260812000000_fix_infinite_recursion.sql`  
**Statut:** Migration exécutée avec succès

---

## 🧪 Tests à Effectuer

### Test 1: Requête SQL Directe

Ouvre **Supabase SQL Editor** et exécute:

```sql
-- Test marketplace_listings
SELECT 
  id,
  title,
  price,
  status,
  created_at
FROM marketplace_listings
WHERE status = 'available'
ORDER BY created_at DESC
LIMIT 10;
```

✅ **Attendu:** Retourne les listings disponibles sans erreur

---

### Test 2: Navigation dans l'App

1. **Ouvre l'application:** http://localhost:5173 (ou prod)
2. **Connecte-toi** avec ton compte
3. **Va sur /marketplace**
4. **Vérifie:**
   - ✅ La page charge sans erreur 500
   - ✅ Les offres s'affichent
   - ✅ Pas d'erreur "infinite recursion" dans la console

---

### Test 3: Console DevTools

Ouvre la console (F12) et teste:

```javascript
const { data, error } = await supabase
  .from('marketplace_listings')
  .select('*')
  .eq('status', 'available')
  .limit(5);

console.log('✅ Error:', error); // Doit être null
console.log('✅ Data count:', data?.length); // Doit afficher un nombre
```

---

### Test 4: Création d'Offre

1. **Clique sur "Publier une offre"** (bouton + ou FAB)
2. **Remplis le formulaire:**
   - Titre: "Tomates fraîches"
   - Description: "Récolte récente de mes parcelles (20+ chars)"
   - Catégorie: Légumes
   - Prix: 5000 FCFA
   - Quantité: 100 kg
   - Région: Hauts-Bassins
   - Ville: Bobo-Dioulasso
3. **Soumets**
4. **Vérifie:**
   - ✅ Toast de succès
   - ✅ Offre apparaît dans "Mes offres"
   - ✅ Offre visible sur marketplace (status: available)

---

### Test 5: RLS Policies

**Test avec user normal:**

```sql
-- Dans SQL Editor, remplace <USER_ID> par ton user UUID
SET request.jwt.claims.sub = '<USER_ID>';

-- Doit voir SES listings
SELECT * FROM marketplace_listings WHERE seller_id = auth.uid();

-- Doit voir listings disponibles (public)
SELECT * FROM marketplace_listings WHERE status = 'available';

-- NE DOIT PAS voir listings autres users (sauf available)
SELECT * FROM marketplace_listings 
WHERE status != 'available' 
AND seller_id != auth.uid();
-- → Doit retourner 0 ligne
```

**Test avec user admin:**

```sql
-- Si tu as un compte admin
SET request.jwt.claims.sub = '<ADMIN_USER_ID>';

-- Doit TOUT voir
SELECT COUNT(*) FROM marketplace_listings;
-- → Doit retourner le nombre total
```

---

## 🎨 Amélioration Formulaire Création

### Structure Actuelle

**Fichier:** `src/components/marketplace/publish-modal.tsx`

**Points forts:**
- ✅ Multi-étapes (5 steps visuelles)
- ✅ Upload images (max 5)
- ✅ Catégories prédéfinies
- ✅ Régions BF intégrées
- ✅ Unités agricoles (kg, sac, panier...)
- ✅ Résumé avant publication
- ✅ Validation progressive

**Couleurs appliquées:**
```tsx
// Étape active
background: 'var(--agro-primary)'  // #166534
boxShadow: '0 0 0 3px rgba(22,101,52,0.18)'

// Bouton publier
className="bg-[var(--agro-primary)] hover:opacity-90"
```

---

### Option: Page Dédiée `/marketplace/create`

Si tu veux remplacer le modal par une page complète:

#### Étape 1: Créer la route

**Fichier:** `src/routes/_authenticated/marketplace.create.tsx`

```tsx
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PublishModal } from "@/components/marketplace/publish-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketplace/create")({
  head: () => ({
    meta: [
      { title: "Créer une offre — AgroSphere" },
      { name: "description", content: "Publiez votre produit agricole sur le marketplace." },
      { property: "og:url", content: import.meta.env.VITE_APP_URL || "https://AgroSphere2.vercel.app/marketplace/create" },
    ],
  }),
  component: CreateOfferPage,
});

function CreateOfferPage() {
  const router = useRouter();
  
  function handleClose() {
    router.navigate({ to: "/marketplace", replace: true });
  }
  
  function handlePublish(data: any) {
    toast.success("✅ Offre publiée avec succès !");
    router.navigate({ to: "/marketplace/my-offers", replace: true });
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Publier une nouvelle offre
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Remplissez les étapes ci-dessous pour mettre en vente votre produit
          </p>
        </div>
        
        {/* Formulaire */}
        <PublishModal 
          onClose={handleClose}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
}
```

#### Étape 2: Modifier le Modal pour Supporter Page/Modal

Dans `publish-modal.tsx`, ajoute un prop optionnel:

```tsx
interface PublishModalProps {
  onClose: () => void
  onPublish: (data: Partial<MarketplaceListing>) => void
  asPage?: boolean  // Nouveau prop
}

export function PublishModal({ onClose, onPublish, asPage = false }: PublishModalProps) {
  // ...
  
  return (
    <div className={cn(
      asPage ? "" : "max-w-xl p-0 overflow-hidden"
    )}>
      {/* Contenu actuel */}
    </div>
  );
}
```

---

### Option 2: Formulaire Simplifié (Quick Sell)

Pour une création ultra-rapide (style Facebook Marketplace):

**Fichier:** `src/components/marketplace/quick-sell-form.tsx` (à créer)

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, ImagePlus, X } from 'lucide-react';
import { createListing } from '@/lib/marketplace.service';
import { toast } from 'sonner';
import { CATEGORIES, REGIONS, UNITS } from '@/lib/marketplace-data';

export function QuickSellForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'legumes',
    price: '',
    quantity: '',
    unit: 'kg',
    region: 'Hauts-Bassins',
    city: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createListing({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        region: formData.region,
        city: formData.city,
        images: images.length > 0 ? images : undefined,
      });

      toast.success('✅ Offre publiée !');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erreur: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const previews = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...previews].slice(0, 5));
  }

  return (
    <Card className="border-agro-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-agro-primary">
          <Leaf className="h-5 w-5" />
          Vente rapide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Tomates fraîches - Récolte du jour"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">Description *</Label>
            <textarea
              id="desc"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Décrivez votre produit (variété, qualité, etc.)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              minLength={20}
            />
          </div>

          {/* Catégorie + Prix */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select 
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prix (FCFA) *</Label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="1"
              />
            </div>
          </div>

          {/* Quantité + Unité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantité *</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Unité</Label>
              <Select 
                value={formData.unit}
                onValueChange={(val) => setFormData({ ...formData, unit: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Région *</Label>
              <Select 
                value={formData.region}
                onValueChange={(val) => setFormData({ ...formData, region: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ville *</Label>
              <Input
                placeholder="Bobo-Dioulasso"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (optionnel)</Label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 hover:bg-destructive/90"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-agro-primary/50 transition-colors">
                <ImagePlus size={20} className="text-muted-foreground" />
                <span className="text-xs mt-1 text-muted-foreground">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={images.length >= 5}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Max 5 photos</p>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-agro-primary hover:opacity-90"
            disabled={loading}
          >
            {loading ? 'Publication...' : 'Publier mon offre'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Checklist Finale

Après avoir testé la migration:

- [ ] ✅ Requête SQL directe fonctionne
- [ ] ✅ Page `/marketplace` charge sans erreur 500
- [ ] ✅ Console DevTools: pas d'erreur RLS
- [ ] ✅ Création d'offre fonctionne
- [ ] ✅ Offre apparaît dans "Mes offres"
- [ ] ✅ Offre visible sur marketplace (status: available)
- [ ] ✅ RLS user normal: voit seulement ses données
- [ ] ✅ RLS admin: voit toutes les données

---

## 📊 État Après Fix

| Module | Statut Avant | Statut Après |
|--------|--------------|--------------|
| Build TypeScript | ✅ 0 erreur | ✅ 0 erreur |
| Marketplace (lecture) | 🔴 HS (500) | ✅ À tester |
| Marketplace (création) | ⚠️ Bloqué | ✅ À tester |
| RLS profiles | 🔴 Boucle infinie | ✅ Fix appliqué |
| Formulaire create | ✅ Fonctionnel | ✅ Fonctionnel |

---

**Prochaine action:** Tester l'application et confirmer que tout fonctionne !
