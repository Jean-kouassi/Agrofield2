-- Migration: Fix seller_statistics trigger RLS violation
-- Date: 2026-08-19 13:15
-- Issue: Trigger tries to INSERT into seller_statistics but RLS policy blocks it
-- Solution: Make trigger function SECURITY DEFINER so it bypasses RLS

-- Drop existing trigger function
DROP TRIGGER IF EXISTS update_seller_stats_on_listing ON public.marketplace_listings;
DROP FUNCTION IF EXISTS update_seller_stats();

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_seller_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER  -- This bypasses RLS policies
AS $$
DECLARE
  seller_uuid UUID;
BEGIN
  -- Get the seller_id from the listing
  seller_uuid := NEW.seller_id;
  
  -- Insert or update seller statistics
  INSERT INTO public.seller_statistics (user_id, total_listings, active_listings)
  VALUES (seller_uuid, 1, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_listings = seller_statistics.total_listings + 1,
    active_listings = seller_statistics.active_listings + 
      CASE 
        WHEN NEW.status = 'available' THEN 1 
        ELSE 0 
      END,
    last_listing_date = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_seller_stats_on_listing
  AFTER INSERT ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_seller_stats() TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_seller_stats() IS 'Trigger function to update seller statistics when a new listing is created. Uses SECURITY DEFINER to bypass RLS.';
