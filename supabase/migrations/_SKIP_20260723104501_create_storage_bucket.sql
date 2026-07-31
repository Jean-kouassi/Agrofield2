-- Migration: Création du bucket de storage agrofield-media
-- Date: 2026-07-23 10:45 GMT
-- Problème: "Échec upload photo : Bucket not found"

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agrofield-media',
  'agrofield-media',
  false, -- Privé (pas d'accès public direct)
  10485760, -- 10MB max par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp'] -- Types d'images autorisés
)
ON CONFLICT (id) DO NOTHING;

-- 2. Activer RLS sur le bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Les utilisateurs peuvent voir leurs propres fichiers
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Les utilisateurs peuvent uploader leurs propres fichiers
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Les utilisateurs peuvent supprimer leurs propres fichiers
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Les utilisateurs peuvent mettre à jour leurs propres fichiers (metadata)
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agrofield-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Commentaire
COMMENT ON TABLE storage.buckets IS 'Storage buckets pour les médias utilisateurs';
COMMENT ON POLICY "Users can view their own media" ON storage.objects IS 'Permet aux utilisateurs de voir uniquement leurs propres fichiers dans agrofield-media';
