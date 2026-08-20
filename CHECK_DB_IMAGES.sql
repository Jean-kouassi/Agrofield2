-- 📋 VÉRIFICATION RADICALE - Exécuter dans Supabase SQL Editor

-- 1. Structure de la table marketplace_listings
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'marketplace_listings' 
ORDER BY ordinal_position;

-- 2. Dernières offres créées avec leurs images
SELECT 
  id,
  title,
  seller_id,
  images,
  pg_typeof(images) as images_type,
  jsonb_array_length(images) as image_count,
  created_at
FROM marketplace_listings 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Vérifier spécifiquement les offres de ton user
SELECT 
  id,
  title,
  images,
  created_at
FROM marketplace_listings 
WHERE seller_id = '9fa6d35d-8299-4350-9073-284f3de4d366'
ORDER BY created_at DESC;

-- 4. Si images est NULL ou vide, mettre à jour manuellement une offre test
-- (Remplacer 'TON_OFFRE_ID' par un ID réel)
/*
UPDATE marketplace_listings 
SET images = '["https://vtnduxtrnahhbgvlhqjw.supabase.co/storage/v1/object/public/agrofield-media/marketplace/9fa6d35d-8299-4350-9073-284f3de4d366/1787223699259-z5u5gde.jpg"]'::jsonb
WHERE id = 'TON_OFFRE_ID'
RETURNING id, title, images;
*/
