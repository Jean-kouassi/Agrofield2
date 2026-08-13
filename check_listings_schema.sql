-- Vérifier la structure de marketplace_listings
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'marketplace_listings'
ORDER BY ordinal_position;
