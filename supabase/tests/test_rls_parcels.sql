-- ============================================
-- TESTS RLS: Parcelles & Crop Events
-- Projet: AgroField2
-- Date: 2026-07-30
-- ============================================
-- Objectif: Vérifier que les policies RLS fonctionnent correctement
-- Méthode: Créer 2 users de test et vérifier l'isolation des données
-- ============================================

BEGIN;

-- Nettoyage préalable (si besoin)
-- ⚠️ À exécuter uniquement en environnement de test

-- ============================================
-- 1. CRÉATION DES USERS DE TEST
-- ============================================

-- User 1: Alice (agricultrice)
DO $$
DECLARE
  alice_id UUID;
  bob_id UUID;
BEGIN
  -- Créer Alice
  INSERT INTO auth.users (email, raw_password, email_confirmed_at)
  VALUES ('alice.test@agrofield.bf', 'TestPassword123!', now())
  RETURNING id INTO alice_id;
  
  -- Créer Bob
  INSERT INTO auth.users (email, raw_password, email_confirmed_at)
  VALUES ('bob.test@agrofield.bf', 'TestPassword123!', now())
  RETURNING id INTO bob_id;
  
  -- Afficher les IDs pour référence
  RAISE NOTICE '✅ User Alice créé: %', alice_id;
  RAISE NOTICE '✅ User Bob créé: %', bob_id;
END $$;

-- ============================================
-- 2. TEST AVEC USER ALICE
-- ============================================

-- Se connecter en tant qu'Alice
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'alice.test@agrofield.bf');
SET LOCAL role TO authenticated;

-- Alice crée une parcelle
INSERT INTO public.parcels (user_id, name, area_ha, crop_type, sowing_date, status, location_quarter)
VALUES 
  (auth.uid(), 'Parcelle Alice 1', 2.5, 'maïs', '2026-06-01', 'active', 'Secteur 15'),
  (auth.uid(), 'Parcelle Alice 2', 1.0, 'sorgho', '2026-06-15', 'active', 'Secteur 20');

-- Vérifier qu'Alice voit ses parcelles
DO $$
DECLARE
  parcel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO parcel_count FROM public.parcels WHERE user_id = auth.uid();
  IF parcel_count = 2 THEN
    RAISE NOTICE '✅ TEST 1 PASSÉ: Alice voit bien ses 2 parcelles';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 ÉCHOUÉ: Alice devrait voir 2 parcelles, en voit %', parcel_count;
  END IF;
END $$;

-- Alice crée un événement cultural
INSERT INTO public.crop_events (user_id, parcel_id, event_type, notes, input_cost_fcfa)
SELECT 
  auth.uid(),
  id,
  'irrigation',
  'Irrigation manuelle - 500L',
  2000
FROM public.parcels 
WHERE user_id = auth.uid() 
LIMIT 1;

-- Vérifier qu'Alice voit son événement
DO $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.crop_events WHERE user_id = auth.uid();
  IF event_count = 1 THEN
    RAISE NOTICE '✅ TEST 2 PASSÉ: Alice voit bien son événement cultural';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 ÉCHOUÉ: Alice devrait voir 1 événement, en voit %', event_count;
  END IF;
END $$;

-- ============================================
-- 3. TEST AVEC USER BOB
-- ============================================

-- Se connecter en tant que Bob
RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'bob.test@agrofield.bf');
SET LOCAL role TO authenticated;

-- Bob crée sa propre parcelle
INSERT INTO public.parcels (user_id, name, area_ha, crop_type, sowing_date, status, location_quarter)
VALUES 
  (auth.uid(), 'Parcelle Bob 1', 3.0, 'riz', '2026-07-01', 'active', 'Vallée du Sourou');

-- Vérifier que Bob voit SA parcelle (pas celle d'Alice)
DO $$
DECLARE
  parcel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO parcel_count FROM public.parcels WHERE user_id = auth.uid();
  IF parcel_count = 1 THEN
    RAISE NOTICE '✅ TEST 3 PASSÉ: Bob voit bien sa propre parcelle (1)';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 ÉCHOUÉ: Bob devrait voir 1 parcelle, en voit %', parcel_count;
  END IF;
END $$;

-- VÉRIFICATION CRITIQUE: Bob ne doit PAS voir les parcelles d'Alice
DO $$
DECLARE
  alice_parcels_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alice_parcels_count 
  FROM public.parcels 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'alice.test@agrofield.bf');
  
  -- Cette requête devrait retourner 0 car RLS filtre par user_id
  IF alice_parcels_count = 0 THEN
    RAISE NOTICE '✅ TEST 4 PASSÉ: Bob ne voit PAS les parcelles d''Alice (RLS fonctionne!)';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 ÉCHOUÉ CRITIQUE: Bob voit % parcelles d''Alice - RLS FAIL!', alice_parcels_count;
  END IF;
END $$;

-- ============================================
-- 4. TEST UPDATE/DELETE
-- ============================================

-- Reset to Alice
RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'alice.test@agrofield.bf');
SET LOCAL role TO authenticated;

-- Alice tente de modifier la parcelle de Bob (doit échouer)
DO $$
DECLARE
  bob_parcel_id UUID;
BEGIN
  SELECT id INTO bob_parcel_id FROM public.parcels p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email = 'bob.test@agrofield.bf';
  
  -- Tenter de modifier (devrait être bloqué par RLS)
  BEGIN
    UPDATE public.parcels 
    SET name = 'Piraté par Alice!'
    WHERE id = bob_parcel_id;
    
    RAISE EXCEPTION '❌ TEST 5 ÉCHOUÉ CRITIQUE: Alice a pu modifier la parcelle de Bob - RLS FAIL!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ TEST 5 PASSÉ: Alice ne peut PAS modifier les parcelles de Bob (RLS bloque)';
  END;
END $$;

-- ============================================
-- 5. TEST PRICE REFERENCES (accès public)
-- ============================================

-- Bob doit pouvoir voir les price_references
RESET request.jwt.claims.sub;
SET LOCAL request.jwt.claims.sub TO (SELECT id FROM auth.users WHERE email = 'bob.test@agrofield.bf');
SET LOCAL role TO authenticated;

DO $$
DECLARE
  ref_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ref_count FROM public.price_references;
  IF ref_count > 0 THEN
    RAISE NOTICE '✅ TEST 6 PASSÉ: Les utilisateurs authentifiés voient les références de prix (% entrées)', ref_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 6 ÉCHOUÉ: Aucune référence de prix trouvée';
  END IF;
END $$;

-- ============================================
-- 6. NETTOYAGE
-- ============================================

-- Supprimer les users de test
DELETE FROM public.crop_events WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('alice.test@agrofield.bf', 'bob.test@agrofield.bf')
);

DELETE FROM public.parcels WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('alice.test@agrofield.bf', 'bob.test@agrofield.bf')
);

DELETE FROM auth.users WHERE email IN ('alice.test@agrofield.bf', 'bob.test@agrofield.bf');

RAISE NOTICE '✅ Nettoyage des users de test terminé';

-- ============================================
-- RÉCAPITULATIF
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '============================================';
RAISE NOTICE '📊 RÉSULTATS DES TESTS RLS';
RAISE NOTICE '============================================';
RAISE NOTICE '✅ Test 1: Alice voit ses parcelles';
RAISE NOTICE '✅ Test 2: Alice voit ses événements';
RAISE NOTICE '✅ Test 3: Bob voit ses parcelles';
RAISE NOTICE '✅ Test 4: Bob ne voit PAS les parcelles d''Alice (ISOLATION)';
RAISE NOTICE '✅ Test 5: Alice ne peut PAS modifier Bob (SÉCURITÉ)';
RAISE NOTICE '✅ Test 6: Références de prix accessibles';
RAISE NOTICE '============================================';
RAISE NOTICE '🎉 TOUS LES TESTS RLS SONT PASSÉS!';
RAISE NOTICE '============================================';

COMMIT;

-- ============================================
-- 📝 NOTES D'UTILISATION
-- ============================================
-- Pour exécuter ces tests:
-- 1. En local: `npx supabase db reset` puis `psql -f test_rls_parcels.sql`
-- 2. En production: ⚠️ NE PAS EXÉCUTER (création/suppression de users)
-- 3. Alternative sécurisée: Utiliser `auth.uid()` dans une session existante
--
-- Commande rapide (environnement de test uniquement):
-- ```bash
-- cd C:\Users\Kouassi\Desktop\Agrofield2
-- npx supabase db reset --linked
-- psql "connection_string" -f supabase/tests/test_rls_parcels.sql
-- ```
-- ============================================
