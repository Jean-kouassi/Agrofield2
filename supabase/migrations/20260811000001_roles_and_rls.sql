-- ============================================================
-- Migration: Rôles & Types d'Utilisateurs AgroField2
-- Date: 2026-08-11
-- Risk: 🟡 MEDIUM (modification enum + table profiles + RLS)
-- Description: Phase 1 — Étendre enum app_role, ajouter colonnes
--              profiles, créer RLS policies par rôle
-- Référence: docs/ROLES_SPECIFICATION.md
-- ============================================================

-- ============================================================
-- 1. Étendre l'enum app_role
-- ============================================================

-- Ajouter les nouveaux rôles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wholesaler';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'retailer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cooperative_manager';

-- ============================================================
-- 2. Aligner la colonne role de profiles sur l'enum
-- ============================================================

-- L'ancienne colonne role est TEXT avec buyer/seller/both
-- On la migre vers l'enum app_role

-- Étape 1: Renommer l'ancienne colonne
ALTER TABLE public.profiles RENAME COLUMN role TO old_role;

-- Étape 2: Ajouter la nouvelle colonne avec l'enum
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'producer';

-- Étape 3: Migrer les valeurs existantes
-- 'seller' → 'producer' (les vendeurs sont des producteurs)
-- 'buyer'  → 'wholesaler' (les acheteurs existants sont des grossistes par défaut)
-- 'both'   → 'producer' (ceux qui font les deux sont des producteurs)
-- 'super_admin' → 'admin'
-- 'user'   → 'producer'
UPDATE public.profiles SET role = 'producer' WHERE old_role IN ('seller', 'both', 'user') OR old_role IS NULL;
UPDATE public.profiles SET role = 'wholesaler' WHERE old_role = 'buyer';
UPDATE public.profiles SET role = 'admin' WHERE old_role = 'super_admin';

-- Étape 4: Supprimer l'ancienne colonne
ALTER TABLE public.profiles DROP COLUMN IF EXISTS old_role;

-- ============================================================
-- 3. Ajouter colonnes manquantes à profiles
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_type text 
  CHECK (business_type IN ('individual', 'cooperative', 'company'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Index pour filtrer par rôle
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified) WHERE verified = true;

-- Commentaire
COMMENT ON COLUMN public.profiles.role IS 'Rôle: producer, wholesaler, retailer, admin, cooperative_manager';
COMMENT ON COLUMN public.profiles.business_name IS 'Nom entreprise/coopérative (pour grossistes et coopératives)';
COMMENT ON COLUMN public.profiles.business_type IS 'Type: individual, cooperative, company';
COMMENT ON COLUMN public.profiles.phone IS 'Numéro de téléphone';
COMMENT ON COLUMN public.profiles.region IS 'Région du Burkina Faso';
COMMENT ON COLUMN public.profiles.city IS 'Ville';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL avatar (Supabase Storage)';
COMMENT ON COLUMN public.profiles.bio IS 'Biographie courte';
COMMENT ON COLUMN public.profiles.verified IS 'Profil vérifié (identité confirmée)';

-- ============================================================
-- 4. Trigger: rôle par défaut à l'inscription
-- ============================================================

-- Fonction pour assigner le rôle par défaut et créer le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer le profil avec le rôle par défaut
  INSERT INTO public.profiles (id, role, business_type, verified)
  VALUES (
    NEW.id,
    'producer',  -- Rôle par défaut
    'individual',
    false
  );
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. RLS Policies par rôle
-- ============================================================

-- ============================================================
-- 5.1 Profiles: chacun voit son profil, admin voit tout
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 5.2 Parcelles: producteurs gèrent leurs parcelles
--     admin et coop_manager ont accès lecture
-- ============================================================

DROP POLICY IF EXISTS "parcels_select_owner" ON public.parcels;
DROP POLICY IF EXISTS "parcels_insert_producer" ON public.parcels;
DROP POLICY IF EXISTS "parcels_update_owner" ON public.parcels;
DROP POLICY IF EXISTS "parcels_delete_owner" ON public.parcels;

CREATE POLICY "parcels_select_owner"
  ON public.parcels FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'cooperative_manager')
    )
  );

CREATE POLICY "parcels_insert_producer"
  ON public.parcels FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

CREATE POLICY "parcels_update_owner"
  ON public.parcels FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

CREATE POLICY "parcels_delete_owner"
  ON public.parcels FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

-- ============================================================
-- 5.3 Capteurs: producteurs gèrent leurs devices
--     admin et coop_manager ont accès lecture
-- ============================================================

ALTER TABLE IF EXISTS public.sensor_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sensor_devices_select_owner" ON public.sensor_devices;
DROP POLICY IF EXISTS "sensor_devices_insert_producer" ON public.sensor_devices;
DROP POLICY IF EXISTS "sensor_devices_update_owner" ON public.sensor_devices;
DROP POLICY IF EXISTS "sensor_devices_delete_owner" ON public.sensor_devices;

CREATE POLICY "sensor_devices_select_owner"
  ON public.sensor_devices FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'cooperative_manager')
    )
  );

CREATE POLICY "sensor_devices_insert_producer"
  ON public.sensor_devices FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

CREATE POLICY "sensor_devices_update_owner"
  ON public.sensor_devices FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

CREATE POLICY "sensor_devices_delete_owner"
  ON public.sensor_devices FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

-- ============================================================
-- 5.4 Lectures capteurs: owner du device + admin + coop_mgr
-- ============================================================

ALTER TABLE IF EXISTS public.sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sensor_readings_select_owner" ON public.sensor_readings;

CREATE POLICY "sensor_readings_select_owner"
  ON public.sensor_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sensor_devices d
      WHERE d.id = sensor_readings.device_id
      AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'cooperative_manager')
    )
  );

-- ============================================================
-- 5.5 Diagnostic IA: producteurs uniquement
-- ============================================================

ALTER TABLE IF EXISTS public.disease_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disease_analyses_select_owner" ON public.disease_analyses;
DROP POLICY IF EXISTS "disease_analyses_insert_producer" ON public.disease_analyses;
DROP POLICY IF EXISTS "disease_analyses_delete_owner" ON public.disease_analyses;

CREATE POLICY "disease_analyses_select_owner"
  ON public.disease_analyses FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "disease_analyses_insert_producer"
  ON public.disease_analyses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'admin')
    )
  );

CREATE POLICY "disease_analyses_delete_owner"
  ON public.disease_analyses FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 5.6 Marketplace listings: public lecture, producteurs écriture
-- ============================================================

ALTER TABLE IF EXISTS public.marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_listings_select_public" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_insert_producer" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_update_owner" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_delete_owner" ON public.marketplace_listings;

CREATE POLICY "marketplace_listings_select_public"
  ON public.marketplace_listings FOR SELECT
  USING (
    status = 'available'
    OR seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "marketplace_listings_insert_producer"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('producer', 'cooperative_manager')
    )
  );

CREATE POLICY "marketplace_listings_update_owner"
  ON public.marketplace_listings FOR UPDATE
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "marketplace_listings_delete_owner"
  ON public.marketplace_listings FOR DELETE
  USING (
    seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- 5.7 Orders: acheteur ET vendeur voient, acheteurs créent
-- ============================================================

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_participants" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_buyers" ON public.orders;
DROP POLICY IF EXISTS "orders_update_participants" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_participants" ON public.orders;

CREATE POLICY "orders_select_participants"
  ON public.orders FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "orders_insert_buyers"
  ON public.orders FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('wholesaler', 'retailer', 'producer', 'cooperative_manager')
    )
  );

CREATE POLICY "orders_update_participants"
  ON public.orders FOR UPDATE
  USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  )
  WITH CHECK (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

CREATE POLICY "orders_delete_participants"
  ON public.orders FOR DELETE
  USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

-- ============================================================
-- 5.8 Finances: propriétaire uniquement + admin vue globale
-- ============================================================

ALTER TABLE IF EXISTS public.user_finances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_finances_select_owner" ON public.user_finances;
DROP POLICY IF EXISTS "user_finances_insert_owner" ON public.user_finances;
DROP POLICY IF EXISTS "user_finances_update_owner" ON public.user_finances;
DROP POLICY IF EXISTS "user_finances_delete_owner" ON public.user_finances;

CREATE POLICY "user_finances_select_owner"
  ON public.user_finances FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "user_finances_insert_owner"
  ON public.user_finances FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_finances_update_owner"
  ON public.user_finances FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "user_finances_delete_owner"
  ON public.user_finances FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 5.9 Credit scores & loan applications: owner + admin
-- ============================================================

ALTER TABLE IF EXISTS public.credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loan_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_scores_select_owner" ON public.credit_scores;
DROP POLICY IF EXISTS "credit_scores_insert_owner" ON public.credit_scores;
DROP POLICY IF EXISTS "loan_applications_select_owner" ON public.loan_applications;
DROP POLICY IF EXISTS "loan_applications_insert_owner" ON public.loan_applications;
DROP POLICY IF EXISTS "loan_applications_update_owner" ON public.loan_applications;

CREATE POLICY "credit_scores_select_owner"
  ON public.credit_scores FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "credit_scores_insert_owner"
  ON public.credit_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "loan_applications_select_owner" ON public.loan_applications;
CREATE POLICY "loan_applications_select_owner"
  ON public.loan_applications FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "loan_applications_insert_owner"
  ON public.loan_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "loan_applications_update_owner"
  ON public.loan_applications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- 5.10 Messages: participants uniquement
-- ============================================================

ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;

CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  USING (
    participant_1_id = auth.uid()
    OR participant_2_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "conversations_insert_participant"
  ON public.conversations FOR INSERT
  WITH CHECK (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

CREATE POLICY "conversations_update_participant"
  ON public.conversations FOR UPDATE
  USING (
    participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  );

DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_update_participant" ON public.messages;

CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "messages_insert_participant"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "messages_update_participant"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ============================================================
-- 6. Vues pour les agrégations (admin)
-- ============================================================

-- Vue: profils avec rôle (pour admin)
CREATE OR REPLACE VIEW public.admin_profiles_summary AS
SELECT
  id,
  full_name,
  email,
  role,
  business_name,
  business_type,
  region,
  city,
  verified,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

GRANT SELECT ON public.admin_profiles_summary TO authenticated;

-- Vue: statistiques marketplace par rôle
CREATE OR REPLACE VIEW public.admin_marketplace_stats AS
SELECT
  (SELECT COUNT(*) FROM public.marketplace_listings WHERE status = 'available') AS active_listings,
  (SELECT COUNT(*) FROM public.orders) AS total_orders,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'producer') AS producers,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'wholesaler') AS wholesalers,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'retailer') AS retailers;

GRANT SELECT ON public.admin_marketplace_stats TO authenticated;

-- ============================================================
-- FIN Migration
-- ============================================================