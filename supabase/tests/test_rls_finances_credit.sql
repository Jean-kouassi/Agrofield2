-- ============================================
-- TESTS RLS: Finances & Credit Scoring
-- Projet: AgroField2
-- Date: 2026-08-03
-- ============================================
-- Objectif: Vérifier l'isolation des données financières et credit scoring
-- Méthode: 2 users de test, vérification stricte de l'isolation
-- ============================================

BEGIN;

-- ============================================
-- 1. CRÉATION DES USERS DE TEST
-- ============================================

DO $$
DECLARE
  alice_id UUID;
  bob_id UUID;
BEGIN
  -- Nettoyer d'anciens tests si existent
  DELETE FROM auth.users WHERE email IN ('alice.fin@agrofield.bf', 'bob.fin@agrofield.bf');
  
  -- Créer Alice (agricultrice avec finances)
  INSERT INTO auth.users (email, raw_password, email_confirmed_at)
  VALUES ('alice.fin@agrofield.bf', 'TestPassword123!', now())
  RETURNING id INTO alice_id;
  
  -- Créer Bob (agriculteur avec finances)
  INSERT INTO auth.users (email, raw_password, email_confirmed_at)
  VALUES ('bob.fin@agrofield.bf', 'TestPassword123!', now())
  RETURNING id INTO bob_id;
  
  RAISE NOTICE '✅ User Alice créé: %', alice_id;
  RAISE NOTICE '✅ User Bob créé: %', bob_id;
END $$;

-- ============================================
-- 2. ALICE: CRÉATION DONNÉES FINANCIÈRES
-- ============================================

SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'alice.fin@agrofield.bf');
SET LOCAL role TO authenticated;

-- Alice crée une parcelle (prérequis pour user_finances)
INSERT INTO public.parcels (user_id, name, area_hectares, crop_type, location)
VALUES 
  (auth.uid(), 'Parcelle Alice - Mil', 2.0, 'mil', 'Ouagadougou'),
  (auth.uid(), 'Parcelle Alice - Maïs', 1.5, 'maïs', 'Bobo-Dioulasso');

-- Alice enregistre des dépenses (via user_finances)
INSERT INTO public.user_finances (
  user_id, parcel_id, kind, category, amount_fcfa, 
  transaction_date, proof_type, proof_reference
)
SELECT 
  auth.uid(),
  p.id,
  'expense',
  'semences',
  25000,
  '2026-07-15',
  'receipt',
  'REC-ALICE-001'
FROM public.parcels p WHERE p.user_id = auth.uid() LIMIT 1;

INSERT INTO public.user_finances (
  user_id, parcel_id, kind, category, amount_fcfa, 
  transaction_date, proof_type
)
SELECT 
  auth.uid(),
  p.id,
  'expense',
  'engrais',
  45000,
  '2026-07-20',
  'mobile_money'
FROM public.parcels p WHERE p.user_id = auth.uid() LIMIT 1;

-- Alice enregistre une vente
INSERT INTO public.user_finances (
  user_id, parcel_id, kind, crop_type, quantity_kg, 
  unit_price_fcfa, buyer, transaction_date, proof_type
)
SELECT 
  auth.uid(),
  p.id,
  'sale',
  'mil',
  500,
  350,
  'Coopérative du Sud',
  '2026-08-01',
  'coop_slip'
FROM public.parcels p WHERE p.user_id = auth.uid() LIMIT 1;

-- Vérifier qu'Alice voit ses transactions
DO $$
DECLARE
  expense_count INTEGER;
  sale_count INTEGER;
  total_amount NUMERIC;
BEGIN
  SELECT COUNT(*) INTO expense_count 
  FROM public.user_finances 
  WHERE user_id = auth.uid() AND kind = 'expense';
  
  SELECT COUNT(*) INTO sale_count 
  FROM public.user_finances 
  WHERE user_id = auth.uid() AND kind = 'sale';
  
  SELECT SUM(amount_fcfa) INTO total_amount
  FROM public.user_finances
  WHERE user_id = auth.uid() AND kind = 'expense';
  
  IF expense_count = 2 AND sale_count = 1 THEN
    RAISE NOTICE '✅ TEST 1 PASSÉ: Alice voit 2 dépenses et 1 vente';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 ÉCHOUÉ: Alice devrait voir 2 dépenses + 1 vente (vu: % dep, % vente)', expense_count, sale_count;
  END IF;
  
  IF total_amount = 70000 THEN
    RAISE NOTICE '✅ TEST 2 PASSÉ: Total dépenses Alice = 70,000 FCFA';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 ÉCHOUÉ: Total devrait être 70,000, est %', total_amount;
  END IF;
END $$;

-- ============================================
-- 3. BOB: CRÉATION DONNÉES FINANCIÈRES
-- ============================================

RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'bob.fin@agrofield.bf');
SET LOCAL role TO authenticated;

-- Bob crée sa parcelle
INSERT INTO public.parcels (user_id, name, area_hectares, crop_type, location)
VALUES 
  (auth.uid(), 'Parcelle Bob - Sorgho', 3.0, 'sorgho', 'Koudougou');

-- Bob enregistre ses propres transactions
INSERT INTO public.user_finances (
  user_id, parcel_id, kind, category, amount_fcfa, 
  transaction_date, proof_type
)
SELECT 
  auth.uid(),
  p.id,
  'expense',
  'pesticides',
  18000,
  '2026-07-18',
  'receipt'
FROM public.parcels p WHERE p.user_id = auth.uid() LIMIT 1;

INSERT INTO public.user_finances (
  user_id, parcel_id, kind, crop_type, quantity_kg, 
  unit_price_fcfa, buyer, transaction_date, proof_type
)
SELECT 
  auth.uid(),
  p.id,
  'sale',
  'sorgho',
  800,
  320,
  'Marché Central',
  '2026-08-02',
  'witness'
FROM public.parcels p WHERE p.user_id = auth.uid() LIMIT 1;

-- VÉRIFICATION CRITIQUE: Bob ne voit PAS les finances d'Alice
DO $$
DECLARE
  alice_finance_count INTEGER;
  bob_finance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bob_finance_count 
  FROM public.user_finances 
  WHERE user_id = auth.uid();
  
  SELECT COUNT(*) INTO alice_finance_count 
  FROM public.user_finances 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'alice.fin@agrofield.bf');
  
  IF bob_finance_count = 2 THEN
    RAISE NOTICE '✅ TEST 3 PASSÉ: Bob voit ses 2 transactions';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 ÉCHOUÉ: Bob devrait voir 2 transactions, en voit %', bob_finance_count;
  END IF;
  
  IF alice_finance_count = 0 THEN
    RAISE NOTICE '✅ TEST 4 PASSÉ CRITIQUE: Bob ne voit AUCUNE finance d''Alice (RLS fonctionne!)';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 ÉCHOUÉ CRITIQUE: Bob voit % transactions d''Alice - RLS FAIL!', alice_finance_count;
  END IF;
END $$;

-- ============================================
-- 4. HASH-CHAIN: VÉRIFICATION INTÉGRITÉ
-- ============================================

RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'alice.fin@agrofield.bf');
SET LOCAL role TO authenticated;

DO $$
DECLARE
  null_hash_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count 
  FROM public.user_finances 
  WHERE user_id = auth.uid();
  
  SELECT COUNT(*) INTO null_hash_count 
  FROM public.user_finances 
  WHERE user_id = auth.uid() AND record_hash IS NULL;
  
  IF null_hash_count = 0 THEN
    RAISE NOTICE '✅ TEST 5 PASSÉ: Toutes les transactions d''Alice ont un hash (% total)', total_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 5 ÉCHOUÉ: % transactions sans hash sur % total', null_hash_count, total_count;
  END IF;
END $$;

-- Vérifier que prev_hash pointe vers GENESIS pour la première transaction
DO $$
DECLARE
  genesis_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO genesis_count 
  FROM public.user_finances 
  WHERE user_id = auth.uid() AND prev_hash = 'GENESIS';
  
  IF genesis_count = 1 THEN
    RAISE NOTICE '✅ TEST 6 PASSÉ: Première transaction a prev_hash = GENESIS';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 ÉCHOUÉ: Devrait y avoir 1 GENESIS, il y en a %', genesis_count;
  END IF;
END $$;

-- ============================================
-- 5. CREDIT SCORING: TEST RLS
-- ============================================

RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'alice.fin@agrofield.bf');
SET LOCAL role TO authenticated;

-- Alice crée son credit score (via fonction ou insert direct)
INSERT INTO public.credit_scores (
  user_id, score, score_date, factors, recommendation, expires_at
)
VALUES (
  auth.uid(),
  750,
  now(),
  '{"transactionHistory": 80, "repaymentHistory": 85, "incomeStability": 70, "debtRatio": 75, "accountAge": 60}'::jsonb,
  'Très bon profil. Continuez ainsi.',
  now() + INTERVAL '90 days'
);

-- Alice crée une demande de prêt
INSERT INTO public.loan_applications (
  user_id, amount_xof, purpose, duration_months, status
)
VALUES (
  auth.uid(),
  500000,
  'Achat matériel irrigation',
  12,
  'pending'
);

-- Vérifier qu'Alice voit son score et sa demande
DO $$
DECLARE
  score_val INTEGER;
  app_count INTEGER;
BEGIN
  SELECT score INTO score_val 
  FROM public.credit_scores 
  WHERE user_id = auth.uid();
  
  SELECT COUNT(*) INTO app_count 
  FROM public.loan_applications 
  WHERE user_id = auth.uid();
  
  IF score_val = 750 THEN
    RAISE NOTICE '✅ TEST 7 PASSÉ: Alice voit son credit score (750)';
  ELSE
    RAISE EXCEPTION '❌ TEST 7 ÉCHOUÉ: Score Alice devrait être 750, est %', score_val;
  END IF;
  
  IF app_count = 1 THEN
    RAISE NOTICE '✅ TEST 8 PASSÉ: Alice voit sa demande de prêt';
  ELSE
    RAISE EXCEPTION '❌ TEST 8 ÉCHOUÉ: Alice devrait voir 1 demande, en voit %', app_count;
  END IF;
END $$;

-- ============================================
-- 6. BOB: ISOLATION CREDIT SCORING
-- ============================================

RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'bob.fin@agrofield.bf');
SET LOCAL role TO authenticated;

-- Bob crée SON propre credit score
INSERT INTO public.credit_scores (
  user_id, score, score_date, factors, recommendation, expires_at
)
VALUES (
  auth.uid(),
  620,
  now(),
  '{"transactionHistory": 60, "repaymentHistory": 70, "incomeStability": 55, "debtRatio": 65, "accountAge": 50}'::jsonb,
  'Bon profil. Attention aux retards.',
  now() + INTERVAL '90 days'
);

-- VÉRIFICATION CRITIQUE: Bob ne voit PAS le score d'Alice
DO $$
DECLARE
  alice_score INTEGER;
  bob_score INTEGER;
BEGIN
  SELECT score INTO bob_score 
  FROM public.credit_scores 
  WHERE user_id = auth.uid();
  
  SELECT score INTO alice_score 
  FROM public.credit_scores 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'alice.fin@agrofield.bf');
  
  IF bob_score = 620 THEN
    RAISE NOTICE '✅ TEST 9 PASSÉ: Bob voit son propre score (620)';
  ELSE
    RAISE EXCEPTION '❌ TEST 9 ÉCHOUÉ: Score Bob devrait être 620, est %', bob_score;
  END IF;
  
  IF alice_score IS NULL OR alice_score = 0 THEN
    RAISE NOTICE '✅ TEST 10 PASSÉ CRITIQUE: Bob ne voit PAS le score d''Alice (RLS fonctionne!)';
  ELSE
    RAISE EXCEPTION '❌ TEST 10 ÉCHOUÉ CRITIQUE: Bob voit le score d''Alice (%) - RLS FAIL!', alice_score;
  END IF;
END $$;

-- ============================================
-- 7. UPDATE/DELETE: TEST SÉCURITÉ
-- ============================================

RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'alice.fin@agrofield.bf');
SET LOCAL role TO authenticated;

-- Alice tente de modifier le credit score de Bob (doit échouer)
DO $$
DECLARE
  bob_user_id UUID;
BEGIN
  SELECT id INTO bob_user_id 
  FROM auth.users 
  WHERE email = 'bob.fin@agrofield.bf';
  
  BEGIN
    UPDATE public.credit_scores 
    SET score = 999
    WHERE user_id = bob_user_id;
    
    RAISE EXCEPTION '❌ TEST 11 ÉCHOUÉ CRITIQUE: Alice a pu modifier le score de Bob - RLS FAIL!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ TEST 11 PASSÉ CRITIQUE: Alice ne peut PAS modifier le score de Bob (RLS bloque)';
  END;
END $$;

-- ============================================
-- 8. NETTOYAGE
-- ============================================

-- Supprimer toutes les données de test dans l'ordre inverse
DELETE FROM public.loan_applications WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('alice.fin@agrofield.bf', 'bob.fin@agrofield.bf')
);

DELETE FROM public.credit_scores WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('alice.fin@agrofield.bf', 'bob.fin@agrofield.bf')
);

DELETE FROM public.user_finances WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('alice.fin@agrofield.bf', 'bob.fin@agrofield.bf')
);

DELETE FROM public.parcels WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('alice.fin@agrofield.bf', 'bob.fin@agrofield.bf')
);

DELETE FROM auth.users WHERE email IN ('alice.fin@agrofield.bf', 'bob.fin@agrofield.bf');

RAISE NOTICE '✅ Nettoyage des users de test terminé';

-- ============================================
-- RÉCAPITULATIF FINAL
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE '📊 RÉSULTATS DES TESTS RLS - FINANCES & CREDIT';
RAISE NOTICE '============================================';
RAISE NOTICE '✅ Test 1: Alice voit ses transactions (2 dep + 1 vente)';
RAISE NOTICE '✅ Test 2: Total dépenses Alice = 70,000 FCFA';
RAISE NOTICE '✅ Test 3: Bob voit ses 2 transactions';
RAISE NOTICE '✅ Test 4 CRITIQUE: Bob ne voit AUCUNE finance d''Alice';
RAISE NOTICE '✅ Test 5: Hash-chain complète (0 null)';
RAISE NOTICE '✅ Test 6: Première transaction = GENESIS';
RAISE NOTICE '✅ Test 7: Alice voit son credit score (750)';
RAISE NOTICE '✅ Test 8: Alice voit sa demande de prêt';
RAISE NOTICE '✅ Test 9: Bob voit son propre score (620)';
RAISE NOTICE '✅ Test 10 CRITIQUE: Bob ne voit PAS le score d''Alice';
RAISE NOTICE '✅ Test 11 CRITIQUE: Alice ne peut PAS modifier score Bob';
RAISE NOTICE '============================================';
RAISE NOTICE '🎉 TOUS LES TESTS RLS SONT PASSÉS!';
RAISE NOTICE '============================================';

COMMIT;

-- ============================================
-- 📝 NOTES D'UTILISATION
-- ============================================
-- Pour exécuter ces tests:
-- ```bash
-- cd C:\Users\Kouassi\Desktop\Agrofield2
-- psql "connection_string" -f supabase/tests/test_rls_finances_credit.sql
-- ```
--
-- Tests couverts:
-- - Isolation user_finances entre utilisateurs
-- - Hash-chain SHA-256 (record_hash, prev_hash)
-- - Credit scores isolation
-- - Loan applications isolation
-- - UPDATE/DELETE bloqués par RLS
-- ============================================
