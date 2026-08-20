# 🎯 Solution Finale - Images Marketplace

## État Actuel

### ✅ Bucket `marketplace-images` (PUBLIC)
- **Usage** : Photos de produits marketplace
- **Chemin** : `offers/{userId}/{filename}`
- **Migration** : 4 fichiers migrés avec succès depuis `agrofield-media/marketplace/`

### ✅ Bucket `agrofield-media` (PRIVÉ)
- **Usage** : Preuves financières (reçus, SMS Mobile Money)
- **Chemin** : `receipts/{userId}/{filename}`
- **Doit rester privé** : OUI ✅

## Problème Restant

Les **URLs dans la base de données** pointent encore vers l'ancien bucket :
```
https://vtnduxtrnahhbgvlhqjw.supabase.co/storage/v1/object/public/agrofield-media/marketplace/...
```

Mais les fichiers sont maintenant dans :
```
https://vtnduxtrnahhbgvlhqjw.supabase.co/storage/v1/object/public/marketplace-images/offers/...
```

## Solution : Mettre à jour la DB

Exécute ce SQL dans **Supabase Dashboard → SQL Editor** :

```sql
-- 🔧 Update ALL marketplace image URLs to use the correct bucket
UPDATE marketplace_listings
SET images = (
  SELECT jsonb_agg(
    REPLACE(
      REPLACE(img_url::text, 
        'agrofield-media/marketplace/', 
        'marketplace-images/offers/'
      ),
      'agrofield-media/receipts/',
      'agrofield-media/receipts/'  -- Keep receipts unchanged
    )
  )
  FROM jsonb_array_elements_text(images) AS img_url
)
WHERE images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%agrofield-media/marketplace%';

-- ✅ Verify the update
SELECT 
  id,
  title,
  images,
  jsonb_array_length(images) as image_count,
  CASE 
    WHEN images::text LIKE '%marketplace-images%' THEN '✅ FIXED'
    WHEN images::text LIKE '%agrofield-media%' THEN '⚠️ STILL OLD'
    ELSE '🆕 NEW'
  END as status
FROM marketplace_listings
ORDER BY created_at DESC
LIMIT 10;
```

## Après l'exécution

1. **Vérifie le résultat** du SELECT → toutes les URLs doivent être en `marketplace-images/offers/`
2. **Rafraîchis** ta page Marketplace dans l'app
3. **Ouvre la console** (F12) et vérifie les logs :
   - `[mapSupabaseListing] Raw row images:` → doit montrer les nouvelles URLs
   - `[ProductCard] Using imageUrl:` → doit afficher l'URL `marketplace-images`

## Si ça ne marche toujours pas

Le problème sera que **le frontend ne récupère pas le champ `images`**. Dans ce cas :

1. Ouvre la console (F12)
2. Va sur Marketplace
3. Copie-colle les logs `[mapSupabaseListing]` ici

Je verrai exactement ce qui est récupéré de la DB !
