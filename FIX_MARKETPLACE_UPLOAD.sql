-- =====================================================
-- FIX: Marketplace Image Upload & Form Submission
-- Exécuter ce script dans le Dashboard Supabase → SQL Editor
-- =====================================================

-- 1. Créer le bucket marketplace-images s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques RLS pour le bucket
CREATE POLICY IF NOT EXISTS "Anyone can read marketplace images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'marketplace-images');

CREATE POLICY IF NOT EXISTS "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = ('offers/' || auth.uid()::text)
);

CREATE POLICY IF NOT EXISTS "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = ('offers/' || auth.uid()::text)
);

-- 3. Vérifier que la table marketplace_listings existe et a les bonnes colonnes
-- Si erreur ici, c'est que la table n'existe pas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings' 
ORDER BY ordinal_position;

-- 4. Vérifier les policies RLS sur marketplace_listings
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'marketplace_listings';

-- =====================================================
-- Après avoir exécuté ce script:
-- 1. Redémarre l'application (npx vite dev)
-- 2. Vide le cache du navigateur (Ctrl+Shift+R)
-- 3. Réessaie de créer une offre
-- =====================================================
