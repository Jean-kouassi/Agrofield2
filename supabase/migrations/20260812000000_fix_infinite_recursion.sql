-- ============================================================
-- Migration: Fix Infinite Recursion RLS profiles
-- Date: 2026-08-12
-- Risk: 🟡 MEDIUM (modification policies RLS existantes)
-- Issue: "infinite recursion detected in policy for relation 'profiles'"
-- Cause: Policy profiles_select_own_or_admin appelle SELECT sur profiles
--        qui re-déclenche la policy → boucle infinie
-- Solution: Utiliser une fonction SQL stable qui ne déclenche pas RLS
-- ============================================================

-- ============================================================
-- 1. Créer une fonction helper pour vérifier le rôle admin
--    SECURITY DEFINER + search_path = public évite la récursion
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin_user() IS 'Vérifie si l''utilisateur actuel est admin sans déclencher RLS';

-- ============================================================
-- 2. Remplacer la policy problématique sur profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin_user()
  );

COMMENT ON POLICY "profiles_select_own_or_admin" ON public.profiles IS 'Permet la lecture de son propre profil ou par les admins';

-- ============================================================
-- 3. Mettre à jour toutes les autres policies qui utilisent
--    le pattern EXISTS (SELECT 1 FROM profiles ...)
--    pour utiliser is_admin_user() ou créer des fonctions similaires
-- ============================================================

-- 3.1 Parcelles - select
DROP POLICY IF EXISTS "parcels_select_owner" ON public.parcels;

CREATE POLICY "parcels_select_owner"
  ON public.parcels FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'cooperative_manager'
    )
  );

-- 3.2 Capteurs - select
DROP POLICY IF EXISTS "sensor_devices_select_owner" ON public.sensor_devices;

CREATE POLICY "sensor_devices_select_owner"
  ON public.sensor_devices FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'cooperative_manager'
    )
  );

-- 3.3 Marketplace listings - update/delete
DROP POLICY IF EXISTS "marketplace_listings_update_owner" ON public.marketplace_listings;

CREATE POLICY "marketplace_listings_update_owner"
  ON public.marketplace_listings FOR UPDATE
  USING (
    seller_id = auth.uid()
    OR public.is_admin_user()
  );

DROP POLICY IF EXISTS "marketplace_listings_delete_owner" ON public.marketplace_listings;

CREATE POLICY "marketplace_listings_delete_owner"
  ON public.marketplace_listings FOR DELETE
  USING (
    seller_id = auth.uid()
    OR public.is_admin_user()
  );

-- 3.4 Orders - select
DROP POLICY IF EXISTS "orders_select_participants" ON public.orders;

CREATE POLICY "orders_select_participants"
  ON public.orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin_user()
  );

-- 3.5 Finances - select
DROP POLICY IF EXISTS "user_finances_select_owner" ON public.user_finances;

CREATE POLICY "user_finances_select_owner"
  ON public.user_finances FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin_user()
  );

-- ============================================================
-- 4. Vérification finale
-- ============================================================

-- Tester que la fonction fonctionne
DO $$
BEGIN
  RAISE NOTICE 'Migration fix infinite recursion appliquée avec succès';
  RAISE NOTICE 'Fonction is_admin_user() créée';
  RAISE NOTICE 'Policies mises à jour pour éviter la récursion';
END $$;

-- Note: Après déploiement, tester avec:
-- SELECT * FROM marketplace_listings WHERE status = 'available';
-- Ne doit plus afficher "infinite recursion detected"
