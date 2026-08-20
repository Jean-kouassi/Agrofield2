# Configuration des Images Marketplace

## 📦 Buckets Supabase

### `marketplace-images` (NOUVEAU - Produits Marketplace)
- **Usage** : Photos des produits agricoles vendus sur le marketplace
- **Visibilité** : Public (pour affichage sur le site)
- **Limite** : 10MB par image
- **Formats** : JPEG, PNG, WebP
- **Path** : `offers/{user_id}/{filename}` ou `{listing_id}/{filename}`

### `agrofield-media` (EXISTANT - Preuves Financières)
- **Usage** : Reçus, SMS Mobile Money, preuves de dépenses/ventes
- **Visibilité** : Privé (seul le propriétaire peut voir)
- **Limite** : 5MB par image
- **Formats** : JPEG, PNG, WebP
- **Path** : `receipts/{user_id}/{filename}`

---

## 🗄️ Migration à Appliquer

Fichier : `supabase/migrations/20260820105300_create_marketplace_images_bucket.sql`

Cette migration :
1. Crée le bucket `marketplace-images` s'il n'existe pas
2. Configure les policies RLS pour :
   - Upload par utilisateurs authentifiés
   - Lecture publique (nécessaire pour afficher les produits)
   - Suppression par le propriétaire uniquement

### Commande d'application

```bash
cd C:\Users\Kouassi\Desktop\Agrofield2
npx supabase db push
```

Ou via le Dashboard Supabase :
1. Aller dans SQL Editor
2. Copier le contenu de la migration
3. Exécuter

---

## 🔧 Code Frontend

### Service d'upload (`src/lib/marketplace.service.ts`)

```typescript
async function uploadImage(file: File, userId: string, listingId?: string): Promise<string> {
  const filePath = listingId 
    ? `${listingId}/${fileName}` 
    : `${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('marketplace-images')  // ✅ Bon bucket
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  const { data: { publicUrl } } = supabase.storage
    .from('marketplace-images')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### Affichage (`src/components/marketplace/product-card.tsx`)

```typescript
const images = (listing as any).images || [];
const imageUrl = images.length > 0 
  ? images[0]  // ✅ Utilise vraie image depuis DB
  : `https://picsum.photos/seed/AgroSphere-${listing.id}/640/480`  // Fallback
```

### Mapping DB → Frontend (`src/lib/marketplace-data.ts`)

```typescript
export function mapSupabaseListing(row: any): MarketplaceListing {
  return {
    id: row.id,
    title: row.title,
    // ... autres champs
    images: row.images || [],  // ✅ Inclut le tableau d'images
  } as MarketplaceListing
}
```

---

## ✅ Checklist de Validation

- [ ] Migration appliquée dans Supabase
- [ ] Bucket `marketplace-images` créé et public
- [ ] Policies RLS configurées correctement
- [ ] Tester l'upload d'une nouvelle offre avec photos
- [ ] Vérifier que les images s'affichent sur :
  - [ ] Card produit (liste marketplace)
  - [ ] Modal détail produit
  - [ ] Page détail complète (`marketplace.$id.tsx`)
  - [ ] Dashboard vendeur (mes offres)
- [ ] Vérifier que les images financières utilisent toujours `agrofield-media`

---

## 🐛 Dépannage

### Erreur "Unauthorized" lors de l'upload
→ Vérifier que les policies RLS sont bien appliquées :
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'marketplace-images';
```

### Images ne s'affichent pas
→ Vérifier les URLs dans la console navigateur
→ Tester l'URL directe dans un nouvel onglet
→ Vérifier que le bucket est public :
```sql
SELECT public FROM storage.buckets WHERE id = 'marketplace-images';
```

### Images mélangées avec preuves financières
→ Vérifier le code : `marketplace.service.ts` doit utiliser `marketplace-images`
→ Vérifier la migration : deux buckets distincts doivent exister

---

**Date de création** : 2026-08-20  
**Dernière mise à jour** : 2026-08-20  
**Statut** : ✅ Configuré (en attente d'application migration)
