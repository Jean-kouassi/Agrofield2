-- =====================================================
-- AgroField - Storage Policies pour marketplace-images
-- Date: 2026-08-03
-- =====================================================

-- 1️⃣ SUPPRIMER toutes les policies existantes sur storage.objects
-- (pour repartir sur une base propre)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- =====================================================
-- 2️⃣ CRÉER les nouvelles policies optimisées
-- =====================================================

-- ✅ Policy 1: TOUT LE MONDE peut VOIR les images (lecture publique)
CREATE POLICY "public_view_marketplace_images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'marketplace-images'
);

-- ✅ Policy 2: Utilisateurs CONNECTÉS peuvent UPLOADER des images
CREATE POLICY "authenticated_upload_marketplace_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images'
  AND (storage.foldername(name))[1] = 'offers'
);

-- ✅ Policy 3: Chaque utilisateur peut MODIFIER ses PROPRES images
CREATE POLICY "users_update_own_marketplace_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketplace-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ✅ Policy 4: Chaque utilisateur peut SUPPRIMER ses PROPRES images
CREATE POLICY "users_delete_own_marketplace_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- =====================================================
-- 3️⃣ VÉRIFICATION : Afficher les policies créées
-- =====================================================
SELECT 
  policyname AS "Policy Name",
  cmd AS "Command",
  roles AS "Roles",
  qual IS NOT NULL AS "Has USING",
  with_check IS NOT NULL AS "Has WITH CHECK"
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 📝 NOTES :
-- =====================================================
-- - Les images sont stockées dans : offers/{user_id}/{filename}
-- - Exemple : offers/9fa6d35d-8299-4350-9073-284f3de4d366/tomates-123.jpg
-- - Public URL : https://vtnduxtrnahhbgvlhqjw.supabase.co/storage/v1/object/public/marketplace-images/offers/{user_id}/{filename}
-- 
-- 🔒 Sécurité :
-- - Lecture : Publique (n'importe qui peut voir les images du marketplace)
-- - Écriture : Authentifié uniquement
-- - Modification/Suppression : Propriétaire uniquement (vérifié par user_id dans le chemin)
-- =====================================================
