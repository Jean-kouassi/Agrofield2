-- 🔄 Update image URLs from old bucket to new bucket
-- Run this in Supabase SQL Editor

-- Check current state
SELECT 
  id,
  title,
  images,
  created_at
FROM marketplace_listings
WHERE seller_id = '9fa6d35d-8299-4350-9073-284f3de4d366'
ORDER BY created_at DESC;

-- Update URLs: replace agrofield-media/marketplace/ with marketplace-images/offers/
UPDATE marketplace_listings
SET images = (
  SELECT jsonb_agg(
    REPLACE(
      img_url::text, 
      'agrofield-media/marketplace/', 
      'marketplace-images/offers/'
    )
  )
  FROM jsonb_array_elements_text(images) AS img_url
)
WHERE seller_id = '9fa6d35d-8299-4350-9073-284f3de4d366'
  AND images IS NOT NULL 
  AND images != '[]'::jsonb
  AND images::text LIKE '%agrofield-media%';

-- Verify the update
SELECT 
  id,
  title,
  images,
  jsonb_array_length(images) as image_count
FROM marketplace_listings
WHERE seller_id = '9fa6d35d-8299-4350-9073-284f3de4d366'
ORDER BY created_at DESC;
