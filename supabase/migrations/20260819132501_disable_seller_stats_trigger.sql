-- Migration: Disable seller_statistics trigger temporarily
-- Date: 2026-08-19 13:25
-- Issue: Trigger causes RLS violation even with SECURITY DEFINER
-- Solution: Drop the trigger until we fix the RLS policies properly

-- Drop the trigger that's causing the RLS violation
DROP TRIGGER IF EXISTS update_seller_stats_on_listing ON public.marketplace_listings;

-- Also drop the function to clean up
DROP FUNCTION IF EXISTS update_seller_stats();

-- Note: We'll re-enable this later after fixing the RLS policies on seller_statistics table
-- For now, sellers can publish listings without statistics being auto-updated
