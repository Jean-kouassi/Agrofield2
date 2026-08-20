-- ⚡ EXÉCUTER CELA DANS SUPABASE DASHBOARD → SQL EDITOR
-- Remplace les anciennes URLs agrofield-media/marketplace par marketplace-images/offers

UPDATE marketplace_listings
SET images = (
  SELECT jsonb_agg(
    REPLACE(img_url::text, 
      'agrofield-media/marketplace/', 
      'marketplace-images/offers/'
    )
  )
  FROM jsonb_array_elements_text(images) AS img_url
)
WHERE images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%agrofield-media/marketplace%';

-- ✅ VÉRIFIER LE RÉSULTAT
SELECT 
  id,
  title,
  images,
  CASE 
    WHEN images::text LIKE '%marketplace-images%' THEN '✅ CORRECT'
    ELSE '⚠️ ENCORE ANCIEN'
  END as status
FROM marketplace_listings
WHERE seller_id = '9fa6d35d-8299-4350-9073-284f3de4d366'
ORDER BY created_at DESC;
