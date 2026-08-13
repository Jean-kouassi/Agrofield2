-- Migration: Create Marketplace Images Storage Bucket
-- Date: 2026-08-13
-- Description: Crée le bucket pour les images du marketplace

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true, -- public
  5242880, -- 5MB par fichier
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket
-- Tout le monde peut lire les images
CREATE POLICY "Anyone can read marketplace images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'marketplace-images');

-- Les utilisateurs authentifiés peuvent uploader dans leur dossier
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = ('offers/' || auth.uid()::text)
);

-- Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = ('offers/' || auth.uid()::text)
);
