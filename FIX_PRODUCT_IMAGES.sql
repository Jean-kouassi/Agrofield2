-- =====================================================
-- FIX: Afficher les vraies images dans le marketplace
-- Exécuter dans Supabase → SQL Editor
-- =====================================================

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'marketplace_listings'
ORDER BY ordinal_position;

-- 2. Voir un exemple de données avec images
SELECT 
  id,
  title,
  seller_name,
  price,
  images,
  created_at
FROM marketplace_listings
ORDER BY created_at DESC
LIMIT 5;

-- 3. Si le champ 'images' est NULL ou [], mettre à jour avec une image par défaut
UPDATE marketplace_listings
SET images = '["https://picsum.photos/seed/agrosphere-default/640/480"]'::jsonb
WHERE images IS NULL OR images = '[]'::jsonb;

-- =====================================================
-- NOTE: Le composant ProductCard doit être modifié pour
-- utiliser listing.images[0] au lieu de productImage()
-- =====================================================
