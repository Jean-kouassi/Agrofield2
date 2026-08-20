# 🔍 Debug Images Marketplace - Solution Radicale

## Problème Identifié
Les images sont uploadées avec succès :
```
✅ Upload: agrofield-media/marketplace/{userId}/{file}
✅ URLs générées: https://vtnduxtrnahhbgvlhqjw.supabase.co/storage/v1/object/public/agrofield-media/...
❌ Mais ne s'affichent PAS sur le frontend (placeholder Picsum)
```

## Causes Possibles

### 1. ❌ Images non sauvegardées dans la DB
Le formulaire upload mais n'inclut pas `images` dans l'INSERT Supabase.

### 2. ❌ Champ `images` mal nommé dans la DB
La table utilise peut-être `image_urls`, `photos`, ou un autre nom.

### 3. ❌ RLS bloque la lecture
Policy empêche la lecture du champ `images`.

---

## 🔧 Solution Radicale Étape par Étape

### Étape 1 : Vérifier le Schema DB

Exécuter dans Supabase SQL Editor :
```sql
-- Vérifier la structure de la table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings' 
ORDER BY ordinal_position;

-- Vérifier une offre spécifique
SELECT id, title, images, created_at 
FROM marketplace_listings 
ORDER BY created_at DESC 
LIMIT 5;
```

### Étape 2 : Corriger le Formulaire si besoin

Si le champ s'appelle différemment, modifier `create-offer-form.tsx` :
```typescript
// Ligne ~186 dans create-offer-form.tsx
const offerData = {
  // ... autres champs
  images: imageUrls,  // ✅ Doit correspondre au nom de colonne DB
}
```

### Étape 3 : Forcer la Sauvegarde avec Logging

Ajouter ce log AVANT l'insert dans `create-offer-form.tsx` :
```typescript
console.log('📦 OFFER DATA TO INSERT:', JSON.stringify(offerData, null, 2));
```

### Étape 4 : Vérifier Après Création

Exécuter dans Supabase SQL Editor :
```sql
SELECT 
  id, 
  title, 
  images,
  pg_column_size(images) as image_bytes
FROM marketplace_listings 
WHERE seller_id = '9fa6d35d-8299-4350-9073-284f3de4d366'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🎯 Action Immédiate

1. **Ouvre Supabase Dashboard** → SQL Editor
2. **Exécute la requête de l'Étape 1**
3. **Copie le résultat ici**

Je saurai exactement quoi corriger !
