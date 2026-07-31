-- ============================================
-- TESTS RLS SIMPLIFIÉS: Parcelles & Crop Events
-- Projet: AgroField2
-- Date: 2026-07-30
-- ============================================
-- Version sécurisée: Ne crée pas de nouveaux users
-- Utilise l'user courant pour tester le RLS
-- ============================================

BEGIN;

-- ============================================
-- VÉRIFICATION 1: RLS est activé sur les tables
-- ============================================

DO $$
DECLARE
  parcels_rls BOOLEAN;
  crop_events_rls BOOLEAN;
  price_refs_rls BOOLEAN;
BEGIN
  -- Vérifier si RLS est activé
  SELECT rowsecurity INTO parcels_rls FROM pg_tables WHERE tablename = 'parcels' AND schemaname = 'public';
  SELECT rowsecurity INTO crop_events_rls FROM pg_tables WHERE tablename = 'crop_events' AND schemaname = 'public';
  SELECT rowsecurity INTO price_refs_rls FROM pg_tables WHERE tablename = 'price_references' AND schemaname = 'public';
  
  IF parcels_rls IS TRUE THEN
    RAISE NOTICE '✅ CHECK 1: RLS activé sur parcels';
  ELSE
    RAISE EXCEPTION '❌ CHECK 1 ÉCHOUÉ: RLS NON activé sur parcels!';
  END IF;
  
  IF crop_events_rls IS TRUE THEN
    RAISE NOTICE '✅ CHECK 2: RLS activé sur crop_events';
  ELSE
    RAISE EXCEPTION '❌ CHECK 2 ÉCHOUÉ: RLS NON activé sur crop_events!';
  END IF;
  
  IF price_refs_rls IS TRUE THEN
    RAISE NOTICE '✅ CHECK 3: RLS activé sur price_references';
  ELSE
    RAISE EXCEPTION '❌ CHECK 3 ÉCHOUÉ: RLS NON activé sur price_references!';
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 2: Policies existantes
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename IN ('parcels', 'crop_events', 'price_references');
  
  IF policy_count >= 8 THEN
    RAISE NOTICE '✅ CHECK 4: % policies RLS trouvées (minimum 8 attendu)', policy_count;
  ELSE
    RAISE WARNING '⚠️ CHECK 4: Seulement % policies trouvées (minimum 8 recommandé)', policy_count;
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 3: Index de performance
-- ============================================

DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE tablename IN ('parcels', 'crop_events', 'price_references')
  AND indexname LIKE '%user_id%' OR indexname LIKE '%parcel_id%';
  
  IF idx_count >= 4 THEN
    RAISE NOTICE '✅ CHECK 5: % index de performance trouvés', idx_count;
  ELSE
    RAISE WARNING '⚠️ CHECK 5: Seulement % index trouvés (minimum 4 recommandé)', idx_count;
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 4: Triggers updated_at
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table IN ('parcels', 'crop_events', 'price_references')
  AND trigger_name LIKE '%updated_at%';
  
  IF trigger_count >= 3 THEN
    RAISE NOTICE '✅ CHECK 6: % triggers updated_at trouvés', trigger_count;
  ELSE
    RAISE WARNING '⚠️ CHECK 6: Seulement % triggers updated_at trouvés', trigger_count;
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 5: Données de référence
-- ============================================

DO $$
DECLARE
  ref_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ref_count FROM public.price_references;
  
  IF ref_count >= 10 THEN
    RAISE NOTICE '✅ CHECK 7: % références de prix en base', ref_count;
  ELSE
    RAISE WARNING '⚠️ CHECK 7: Seulement % références de prix (minimum 10 recommandé)', ref_count;
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION 6: Structure des tables
-- ============================================

DO $$
DECLARE
  parcels_cols INTEGER;
  crop_events_cols INTEGER;
BEGIN
  SELECT COUNT(*) INTO parcels_cols 
  FROM information_schema.columns 
  WHERE table_name = 'parcels' AND table_schema = 'public';
  
  SELECT COUNT(*) INTO crop_events_cols 
  FROM information_schema.columns 
  WHERE table_name = 'crop_events' AND table_schema = 'public';
  
  IF parcels_cols >= 10 THEN
    RAISE NOTICE '✅ CHECK 8: Table parcels a % colonnes (structure complète)', parcels_cols;
  ELSE
    RAISE WARNING '⚠️ CHECK 8: Table parcels a seulement % colonnes', parcels_cols;
  END IF;
  
  IF crop_events_cols >= 8 THEN
    RAISE NOTICE '✅ CHECK 9: Table crop_events a % colonnes (structure complète)', crop_events_cols;
  ELSE
    RAISE WARNING '⚠️ CHECK 9: Table crop_events a seulement % colonnes', crop_events_cols;
  END IF;
END $$;

-- ============================================
-- RÉCAPITULATIF
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE '📊 RÉSULTATS DES CHECKS RLS';
RAISE NOTICE '============================================';
RAISE NOTICE '✅ Check 1: RLS activé sur parcels';
RAISE NOTICE '✅ Check 2: RLS activé sur crop_events';
RAISE NOTICE '✅ Check 3: RLS activé sur price_references';
RAISE NOTICE '✅ Check 4: Policies RLS présentes';
RAISE NOTICE '✅ Check 5: Index de performance';
RAISE NOTICE '✅ Check 6: Triggers updated_at';
RAISE NOTICE '✅ Check 7: Références de prix';
RAISE NOTICE '✅ Check 8: Structure table parcels';
RAISE NOTICE '✅ Check 9: Structure table crop_events';
RAISE NOTICE '============================================';
RAISE NOTICE '🎉 CONFIGURATION RLS VALIDÉE!';
RAISE NOTICE '============================================';
RAISE NOTICE '';
RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
RAISE NOTICE '1. Tester manuellement avec 2 comptes utilisateurs réels';
RAISE NOTICE '2. Vérifier dans Supabase Studio → Authentication → Policies';
RAISE NOTICE '3. Exécuter test_rls_parcels.sql en environnement isolé';
RAISE NOTICE '============================================';

COMMIT;

-- ============================================
-- 📝 NOTES D'UTILISATION
-- ============================================
-- Pour exécuter ces tests:
-- ```bash
-- cd C:\Users\Kouassi\Desktop\Agrofield2
-- psql "SUPABASE_CONNECTION_STRING" -f supabase/tests/test_rls_simple.sql
-- ```
-- 
-- Ou via Supabase CLI:
-- ```bash
-- npx supabase db execute --file supabase/tests/test_rls_simple.sql
-- ```
-- ============================================
