-- 🔄 MIGRATION RADICALE : Déplacer les images marketplace vers le bon bucket
-- Date: 2026-08-20
-- Objectif: Séparer marketplace-images (public) de agrofield-media/receipts (privé)

-- Étape 1: Vérifier les offres avec des images dans l'ancien bucket
SELECT 
  id,
  title,
  images,
  CASE 
    WHEN images IS NULL OR images = '[]'::jsonb THEN 'EMPTY'
    ELSE 'HAS_IMAGES'
  END as status
FROM marketplace_listings
WHERE images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%agrofield-media%'
ORDER BY created_at DESC;

-- Étape 2: Mettre à jour les URLs pour utiliser le nouveau bucket
-- Remplace "agrofield-media/marketplace/" par "marketplace-images/offers/"
UPDATE marketplace_listings
SET images = (
  SELECT jsonb_agg(
    REPLACE(img_url, 'agrofield-media/marketplace/', 'marketplace-images/offers/')
  )
  FROM jsonb_array_elements_text(images) AS img_url
)
WHERE images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%agrofield-media%';

-- Étape 3: Vérifier le résultat
SELECT 
  id,
  title,
  images,
  jsonb_array_length(images) as image_count
FROM marketplace_listings
WHERE images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%marketplace-images%'
ORDER BY created_at DESC
LIMIT 10;

-- Étape 4: Script pour déplacer physiquement les fichiers (à exécuter manuellement ou via Edge Function)
-- Note: Supabase ne permet pas de déplacer des fichiers via SQL pur
-- Il faut utiliser l'API Storage ou le Dashboard

/*
-- Option A: Via Dashboard (manuel pour quelques fichiers)
-- 1. Aller dans Storage → marketplace-images
-- 2. Créer un dossier "offers"
-- 3. Copier les fichiers depuis agrofield-media/marketplace/

-- Option B: Via API (script Node.js/Python)
-- Voir script migrate-images.js ci-dessous
*/
