-- 🔧 FIX COMPLET - Mettre à jour TOUTES les images avec URLs invalides
-- Exécuter dans Supabase Dashboard → SQL Editor

-- 1. Voir l'état actuel
SELECT 
  id,
  title,
  images,
  CASE 
    WHEN images::text LIKE '%marketplace-images%' THEN '✅ OK'
    WHEN images::text LIKE '%blob:%' THEN '❌ BLOB (temporaire)'
    WHEN images::text LIKE '%agrofield-media%' THEN '⚠️ ANCIEN BUCKET'
    WHEN images::text LIKE '%picsum%' THEN '️ PLACEHOLDER'
    ELSE '❓ INCONNU'
  END as status
FROM marketplace_listings
WHERE images IS NOT NULL AND images != '[]'::jsonb
ORDER BY created_at DESC;

-- 2. Nettoyer les URLs blob: (les rendre vides car expirées)
-- Ces offres afficheront le placeholder Picsum jusqu'à ce qu'on re-upload les images
UPDATE marketplace_listings
SET images = '[]'::jsonb
WHERE images::text LIKE '%blob:%';

-- 3. Convertir les anciennes URLs agrofield-media/marketplace vers marketplace-images/offers
UPDATE marketplace_listings
SET images = (
  SELECT jsonb_agg(
    REPLACE(img_url::text, 
      'agrofield-media/marketplace/', 
      'marketplace-images/offers/'
    )
  )
  FROM jsonb_array_elements_text(images) AS img_url
)
WHERE images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%agrofield-media/marketplace%';

-- 4. VÉRIFIER LE RÉSULTAT FINAL
SELECT 
  id,
  title,
  images,
  jsonb_array_length(images) as image_count,
  CASE 
    WHEN images = '[]'::jsonb THEN '🈳 VIDE (placeholder Picsum)'
    WHEN images::text LIKE '%marketplace-images%' THEN '✅ CORRECT'
    WHEN images::text LIKE '%agrofield-media%' THEN '⚠️ ENCORE ANCIEN'
    ELSE '❓ AUTRE'
  END as status
FROM marketplace_listings
ORDER BY created_at DESC
LIMIT 20;
