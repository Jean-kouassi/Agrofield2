-- ============================================
-- MIGRATION PHASE 5: Finances Améliorées
-- Date: 2026-07-30
-- Projet: AgroField2
-- Objectif: Ajouter preuves, liens parcelles, références de prix
-- ============================================

BEGIN;

-- ============================================
-- 1. TABLE user_finances (NOUVELLE)
-- Regroupe expenses et sales avec preuves
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES public.parcels(id) ON DELETE SET NULL,
  
  -- Type de transaction
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'sale', 'transfer')),
  
  -- Catégorie (pour expenses) - valeurs larges pour accepter toutes les variations
  category TEXT,
  
  -- Montants
  amount_fcfa NUMERIC NOT NULL DEFAULT 0,
  quantity_kg NUMERIC,
  unit_price_fcfa NUMERIC,
  
  -- Informations culturelles
  crop_type TEXT,
  
  -- Preuves (essentiel pour confiance)
  proof_type TEXT NOT NULL DEFAULT 'none' 
    CHECK (proof_type IN ('receipt', 'mobile_money', 'coop_slip', 'witness', 'none')),
  proof_image_path TEXT,
  proof_reference TEXT, -- Réf. transaction Mobile Money
  
  -- Contrepartie
  buyer TEXT,
  seller TEXT,
  
  -- Dates
  transaction_date DATE NOT NULL DEFAULT (now()::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index critiques pour performances
CREATE INDEX IF NOT EXISTS idx_user_finances_user_id ON public.user_finances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_finances_parcel_id ON public.user_finances(parcel_id);
CREATE INDEX IF NOT EXISTS idx_user_finances_kind ON public.user_finances(kind);
CREATE INDEX IF NOT EXISTS idx_user_finances_category ON public.user_finances(category);
CREATE INDEX IF NOT EXISTS idx_user_finances_crop_type ON public.user_finances(crop_type);
CREATE INDEX IF NOT EXISTS idx_user_finances_transaction_date ON public.user_finances(transaction_date);

-- Trigger updated_at
DROP TRIGGER IF EXISTS user_finances_updated_at ON public.user_finances;
CREATE TRIGGER user_finances_updated_at
  BEFORE UPDATE ON public.user_finances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.user_finances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own finances" ON public.user_finances;
CREATE POLICY "Users can view their own finances"
  ON public.user_finances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own finances" ON public.user_finances;
CREATE POLICY "Users can insert their own finances"
  ON public.user_finances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own finances" ON public.user_finances;
CREATE POLICY "Users can update their own finances"
  ON public.user_finances FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own finances" ON public.user_finances;
CREATE POLICY "Users can delete their own finances"
  ON public.user_finances FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. MIGRATION DES DONNÉES EXISTANTES
-- ============================================

-- Migrer expenses vers user_finances
INSERT INTO public.user_finances (
  user_id, parcel_id, kind, category, amount_fcfa, 
  transaction_date, created_at, updated_at
)
SELECT 
  e.user_id,
  e.parcel_id,
  'expense' as kind,
  e.category,
  e.amount_fcfa,
  e.spent_at as transaction_date,
  e.created_at,
  e.created_at as updated_at
FROM public.expenses e
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_finances uf 
  WHERE uf.user_id = e.user_id 
  AND uf.kind = 'expense'
  AND uf.amount_fcfa = e.amount_fcfa
  AND uf.transaction_date = e.spent_at
);

-- Migrer sales vers user_finances
INSERT INTO public.user_finances (
  user_id, parcel_id, kind, crop_type, quantity_kg, 
  unit_price_fcfa, buyer, transaction_date, created_at, updated_at
)
SELECT 
  s.user_id,
  s.parcel_id,
  'sale' as kind,
  s.crop_type,
  s.quantity_kg,
  s.unit_price_fcfa,
  s.buyer,
  s.sold_at as transaction_date,
  s.created_at,
  s.created_at as updated_at
FROM public.sales s
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_finances uf 
  WHERE uf.user_id = s.user_id 
  AND uf.kind = 'sale'
  AND uf.quantity_kg = s.quantity_kg
  AND uf.transaction_date = s.sold_at
);

-- ============================================
-- 3. TABLE price_references (MISE À JOUR)
-- La table existe déjà, on ajoute juste les colonnes manquantes
-- Voir migration 20260730100002_fix_price_references.sql
-- ============================================

-- Cette section a été déplacée vers une migration séparée
-- pour éviter les conflits avec la structure existante

-- ============================================
-- 4. VUE: Vue consolidée des finances
-- ============================================

CREATE OR REPLACE VIEW public.finances_summary AS
SELECT 
  user_id,
  kind,
  COUNT(*) as transaction_count,
  SUM(amount_fcfa) as total_amount,
  SUM(quantity_kg) as total_quantity,
  AVG(unit_price_fcfa) as avg_unit_price,
  MIN(transaction_date) as first_transaction,
  MAX(transaction_date) as last_transaction
FROM public.user_finances
GROUP BY user_id, kind;

-- Grant sur la vue
GRANT SELECT ON public.finances_summary TO authenticated;

-- ============================================
-- 5. FONCTION: Calcul du solde net par parcelle
-- ============================================

CREATE OR REPLACE FUNCTION public.get_parcel_balance(parcel_uuid UUID)
RETURNS TABLE (
  parcel_id UUID,
  total_expenses NUMERIC,
  total_sales NUMERIC,
  net_balance NUMERIC,
  profit_margin NUMERIC
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT 
    parcel_uuid as parcel_id,
    COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount_fcfa ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN kind = 'sale' THEN amount_fcfa ELSE 0 END), 0) as total_sales,
    COALESCE(SUM(CASE WHEN kind = 'sale' THEN amount_fcfa ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount_fcfa ELSE 0 END), 0) as net_balance,
    CASE 
      WHEN SUM(CASE WHEN kind = 'expense' THEN amount_fcfa ELSE 0 END) = 0 THEN 0
      ELSE ((SUM(CASE WHEN kind = 'sale' THEN amount_fcfa ELSE 0 END) - 
             SUM(CASE WHEN kind = 'expense' THEN amount_fcfa ELSE 0 END)) / 
            SUM(CASE WHEN kind = 'expense' THEN amount_fcfa ELSE 0 END)) * 100
    END as profit_margin
  FROM public.user_finances
  WHERE parcel_id = parcel_uuid;
END;
$$;

-- Grant sur la fonction
GRANT EXECUTE ON FUNCTION public.get_parcel_balance(UUID) TO authenticated;

-- ============================================
-- 6. STORAGE BUCKET: Preuves financières
-- ============================================

-- Le bucket sera créé via le dashboard ou migration séparée
-- Instructions:
-- 1. Dashboard → Storage → Create bucket
-- 2. Nom: `finance-proofs`
-- 3. Public: false (privé)
-- 4. File size: 10MB
-- 5. MIME types: image/*

-- RLS Policies pour le bucket (à exécuter après création):
/*
CREATE POLICY "Users can view their own finance proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'finance-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own finance proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'finance-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own finance proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'finance-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- ============================================
-- ✅ Migration terminée !
-- ============================================

COMMIT;

-- ============================================
-- 📝 NOTES
-- ============================================
-- Tables créées/mises à jour:
-- - user_finances (nouvelle, remplace expenses/sales)
-- - price_references (mise à jour avec + de données)
-- - finances_summary (vue)
-- - get_parcel_balance (fonction)
--
-- Données migrées:
-- - expenses → user_finances (kind='expense')
-- - sales → user_finances (kind='sale')
--
-- Prochaines étapes:
-- 1. Créer storage bucket `finance-proofs`
-- 2. Copier formulaires UI depuis Desktop
-- 3. Intégrer dropdown proof_type
-- 4. Tests utilisateurs
-- ============================================
