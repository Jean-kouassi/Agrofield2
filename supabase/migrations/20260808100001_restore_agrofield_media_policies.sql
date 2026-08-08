-- =====================================================
-- AgroField - Restore Storage Policies pour agrofield-media
-- Date: 2026-08-08
-- Correction: foldername(name)[2] au lieu de [1]
-- =====================================================

DROP POLICY IF EXISTS "users_view_own_agrofield_media" ON storage.objects;
DROP POLICY IF EXISTS "users_upload_own_agrofield_media" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own_agrofield_media" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_agrofield_media" ON storage.objects;

CREATE POLICY "users_view_own_agrofield_media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agrofield-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "users_upload_own_agrofield_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agrofield-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "users_update_own_agrofield_media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agrofield-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "users_delete_own_agrofield_media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agrofield-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

SELECT
  policyname AS "Policy Name",
  cmd AS "Command",
  roles AS "Roles"
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%agrofield%'
ORDER BY policyname;