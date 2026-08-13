-- Vérifier la structure de la table orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- Vérifier s'il y a des données
SELECT COUNT(*) as total_orders FROM public.orders;

-- Voir un exemple de donnée
SELECT * FROM public.orders LIMIT 1;
