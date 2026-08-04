-- ============================================
-- MIGRATION: Hash-chain SHA-256 pour user_finances
-- Date: 2026-08-03
-- Projet: AgroField2
-- Objectif: Ajouter registre infalsifiable à user_finances
-- ============================================

BEGIN;

-- ============================================
-- 1. AJOUTER COLONNES HASH À user_finances
-- ============================================

ALTER TABLE public.user_finances
  ADD COLUMN IF NOT EXISTS locked_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS record_hash text;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_finances_record_hash ON public.user_finances(record_hash);
CREATE INDEX IF NOT EXISTS idx_user_finances_prev_hash ON public.user_finances(prev_hash);

-- ============================================
-- 2. CRÉER EXTENSION pgcrypto (si pas déjà fait)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================
-- 3. TRIGGER: Calcul hash avant INSERT
-- ============================================

CREATE OR REPLACE FUNCTION public.user_finances_compute_hash()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  last_hash text;
BEGIN
  -- Récupérer le dernier hash de l'utilisateur (trié par date + id)
  SELECT record_hash INTO last_hash
  FROM public.user_finances
  WHERE user_id = NEW.user_id 
    AND id <> NEW.id
  ORDER BY transaction_date DESC, created_at DESC, id DESC
  LIMIT 1;

  -- Définir prev_hash (GENESIS pour premier enregistrement)
  NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
  
  -- Verrouiller timestamp
  NEW.locked_at := now();
  
  -- Calculer record_hash avec SHA-256
  NEW.record_hash := encode(
    extensions.digest(
      convert_to(
        NEW.prev_hash || '|' ||
        NEW.id::text || '|' ||
        NEW.user_id::text || '|' ||
        COALESCE(NEW.parcel_id::text, 'NULL') || '|' ||
        NEW.kind || '|' ||
        COALESCE(NEW.category, 'NULL') || '|' ||
        NEW.amount_fcfa::text || '|' ||
        COALESCE(NEW.quantity_kg::text, 'NULL') || '|' ||
        COALESCE(NEW.unit_price_fcfa::text, 'NULL') || '|' ||
        COALESCE(NEW.crop_type, 'NULL') || '|' ||
        NEW.transaction_date::text || '|' ||
        NEW.locked_at::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  
  RETURN NEW;
END;
$$;

-- Drop trigger s'il existe déjà
DROP TRIGGER IF EXISTS user_finances_hash_trigger ON public.user_finances;

-- Créer trigger
CREATE TRIGGER user_finances_hash_trigger
  BEFORE INSERT ON public.user_finances
  FOR EACH ROW
  EXECUTE FUNCTION public.user_finances_compute_hash();

-- ============================================
-- 4. FONCTION: Vérifier intégrité hash-chain
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_user_finances_integrity(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  expected_hash text,
  actual_hash text,
  is_valid boolean,
  error_message text
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  prev_record_hash text := 'GENESIS';
  current_record RECORD;
  computed_hash text;
BEGIN
  -- Parcourir tous les enregistrements dans l'ordre chronologique
  FOR current_record IN 
    SELECT * FROM public.user_finances
    WHERE user_id = user_uuid
    ORDER BY transaction_date ASC, created_at ASC, id ASC
  LOOP
    -- Calculer le hash attendu
    computed_hash := encode(
      extensions.digest(
        convert_to(
          prev_record_hash || '|' ||
          current_record.id::text || '|' ||
          current_record.user_id::text || '|' ||
          COALESCE(current_record.parcel_id::text, 'NULL') || '|' ||
          current_record.kind || '|' ||
          COALESCE(current_record.category, 'NULL') || '|' ||
          current_record.amount_fcfa::text || '|' ||
          COALESCE(current_record.quantity_kg::text, 'NULL') || '|' ||
          COALESCE(current_record.unit_price_fcfa::text, 'NULL') || '|' ||
          COALESCE(current_record.crop_type, 'NULL') || '|' ||
          current_record.transaction_date::text || '|' ||
          current_record.locked_at::text,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );
    
    -- Vérifier correspondance
    IF computed_hash = current_record.record_hash THEN
      RETURN QUERY SELECT 
        current_record.id,
        computed_hash,
        current_record.record_hash,
        true,
        NULL::text;
    ELSE
      RETURN QUERY SELECT 
        current_record.id,
        computed_hash,
        current_record.record_hash,
        false,
        'Hash mismatch detected'::text;
    END IF;
    
    -- Mettre à jour prev_hash pour prochaine itération
    prev_record_hash := current_record.record_hash;
  END LOOP;
END;
$$;

-- Grant sur fonction
GRANT EXECUTE ON FUNCTION public.verify_user_finances_integrity(uuid) TO authenticated;

-- ============================================
-- 5. VUE: Résumé d'intégrité par utilisateur
-- ============================================

CREATE OR REPLACE VIEW public.user_finances_integrity_summary AS
SELECT 
  user_id,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE record_hash IS NOT NULL) as hashed_records,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE record_hash IS NOT NULL) THEN true
    ELSE false
  END as all_hashed
FROM public.user_finances
GROUP BY user_id;

-- Grant sur vue
GRANT SELECT ON public.user_finances_integrity_summary TO authenticated;

-- ============================================
-- 6. VUES: Résumés financiers pour lib/finances.ts
-- ============================================

-- Vue: Résumé global des finances par utilisateur
CREATE OR REPLACE VIEW public.user_finances_summary AS
SELECT 
  user_id,
  COUNT(*) as "totalTransactions",
  SUM(amount_fcfa) FILTER (WHERE kind = 'sale') as "totalIncome",
  SUM(amount_fcfa) FILTER (WHERE kind = 'expense') as "totalExpense",
  COALESCE(SUM(amount_fcfa) FILTER (WHERE kind = 'sale'), 0) - 
  COALESCE(SUM(amount_fcfa) FILTER (WHERE kind = 'expense'), 0) as "netBalance",
  COUNT(*) FILTER (WHERE kind = 'sale') as "incomeCount",
  COUNT(*) FILTER (WHERE kind = 'expense') as "expenseCount",
  MIN(transaction_date)::text as "firstTransaction",
  MAX(transaction_date)::text as "lastTransaction"
FROM public.user_finances
GROUP BY user_id;

GRANT SELECT ON public.user_finances_summary TO authenticated;

-- Vue: Dépenses par catégorie
CREATE OR REPLACE VIEW public.expenses_by_category AS
SELECT 
  user_id,
  category,
  COUNT(*) as "transactionCount",
  SUM(amount_fcfa) as "totalAmount",
  AVG(amount_fcfa) as "avgAmount"
FROM public.user_finances
WHERE kind = 'expense'
GROUP BY user_id, category;

GRANT SELECT ON public.expenses_by_category TO authenticated;

-- Vue: Revenus par catégorie (crop_type pour les ventes)
CREATE OR REPLACE VIEW public.incomes_by_category AS
SELECT 
  user_id,
  COALESCE(crop_type, 'autre') as category,
  COUNT(*) as "transactionCount",
  SUM(amount_fcfa) as "totalAmount",
  AVG(amount_fcfa) as "avgAmount"
FROM public.user_finances
WHERE kind = 'sale'
GROUP BY user_id, crop_type;

GRANT SELECT ON public.incomes_by_category TO authenticated;

-- Vue: Résumé mensuel
CREATE OR REPLACE VIEW public.monthly_finances_summary AS
SELECT 
  user_id,
  to_char(transaction_date, 'YYYY-MM') as month,
  COUNT(*) as "totalTransactions",
  SUM(amount_fcfa) FILTER (WHERE kind = 'sale') as "totalIncome",
  SUM(amount_fcfa) FILTER (WHERE kind = 'expense') as "totalExpense",
  COALESCE(SUM(amount_fcfa) FILTER (WHERE kind = 'sale'), 0) - 
  COALESCE(SUM(amount_fcfa) FILTER (WHERE kind = 'expense'), 0) as "netBalance"
FROM public.user_finances
GROUP BY user_id, to_char(transaction_date, 'YYYY-MM')
ORDER BY month DESC;

GRANT SELECT ON public.monthly_finances_summary TO authenticated;

-- ============================================
-- ✅ Migration terminée !
-- ============================================

COMMIT;

-- ============================================
-- 📝 NOTES
-- ============================================
-- Cette migration ajoute:
-- - Colonnes: locked_at, prev_hash, record_hash
-- - Trigger: user_finances_compute_hash (avant INSERT)
-- - Fonction: verify_user_finances_integrity (audit)
-- - Vues: user_finances_summary, expenses_by_category, 
--         incomes_by_category, monthly_finances_summary,
--         user_finances_integrity_summary
--
-- Utilisation:
-- 1. Nouvelles dépenses/ventes → hash automatique
-- 2. Audit: SELECT * FROM verify_user_finances_integrity('user-uuid')
-- 3. Résumé finances: SELECT * FROM user_finances_summary WHERE user_id = '...'
-- 4. Stats par catégorie: SELECT * FROM expenses_by_category WHERE user_id = '...'
--
-- Prochaine étape: Appliquer migration + tests RLS
-- ============================================
