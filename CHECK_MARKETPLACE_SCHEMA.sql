-- Vérifier la structure de la table marketplace_listings
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketplace_listings'
ORDER BY ordinal_position;

-- Vérifier les contraintes CHECK
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.marketplace_listings'::regclass
  AND contype = 'c';

-- Vérifier les indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'marketplace_listings';

-- Tester un insert manuel (remplacer les valeurs)
-- NOTE: Ne pas exécuter, juste pour référence
/*
INSERT INTO public.marketplace_listings (
  seller_id,
  seller_name,
  title,
  description,
  category,
  quantity,
  unit,
  price,
  location,
  region,
  images,
  available_from,
  expires_at,
  status
) VALUES (
  'TON_USER_ID_ICI',
  'Test User',
  'Test Offer',
  'Description test',
  'tomates',
  100,
  'kg',
  500,
  'Ouagadougou',
  'Centre',
  '[]'::jsonb,
  now(),
  now() + interval '30 days',
  'available'
);
*/
