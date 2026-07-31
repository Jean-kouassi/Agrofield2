-- ============================================
-- AGROFIELD MARKETPLACE - SETUP MANUEL
-- Exécute ce script dans le SQL Editor Supabase
-- ============================================

-- 1. Table marketplace_listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  available_from TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  views INTEGER DEFAULT 0,
  contacts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_region ON marketplace_listings(region);

-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_listings" ON marketplace_listings;
CREATE POLICY "view_listings" ON marketplace_listings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_listings" ON marketplace_listings;
CREATE POLICY "insert_listings" ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "update_listings" ON marketplace_listings;
CREATE POLICY "update_listings" ON marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "delete_listings" ON marketplace_listings;
CREATE POLICY "delete_listings" ON marketplace_listings FOR DELETE
  USING (auth.uid() = seller_id);

-- 5. Confirmation
SELECT '✅ Marketplace table created successfully!' AS status;
