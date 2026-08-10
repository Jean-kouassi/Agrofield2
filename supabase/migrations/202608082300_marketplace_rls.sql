-- Migration: RLS policies for marketplace tables
-- Date: 2026-08-08
-- Risk: MEDIUM

-- Enable RLS on marketplace tables
ALTER TABLE IF EXISTS public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "marketplace_listings_select_public" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_insert_own" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_update_own" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_delete_own" ON public.marketplace_listings;

DROP POLICY IF EXISTS "orders_select_participants" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_buyer" ON public.orders;
DROP POLICY IF EXISTS "orders_update_participants" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_participants" ON public.orders;

-- Marketplace listings policies
CREATE POLICY "marketplace_listings_select_public"
  ON public.marketplace_listings
  FOR SELECT
  USING (status = 'available' OR seller_id = auth.uid());

CREATE POLICY "marketplace_listings_insert_own"
  ON public.marketplace_listings
  FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "marketplace_listings_update_own"
  ON public.marketplace_listings
  FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "marketplace_listings_delete_own"
  ON public.marketplace_listings
  FOR DELETE
  USING (seller_id = auth.uid());

-- Orders policies
CREATE POLICY "orders_select_participants"
  ON public.orders
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "orders_insert_buyer"
  ON public.orders
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "orders_update_participants"
  ON public.orders
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "orders_delete_participants"
  ON public.orders
  FOR DELETE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_region ON public.marketplace_listings(region);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
