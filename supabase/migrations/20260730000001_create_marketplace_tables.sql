-- Migration: Create Marketplace Tables
-- Date: 2026-07-30
-- Description: Tables pour le marketplace agricole

-- Table: marketplace_listings (offres de produits)
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tomates', 'oignons', 'mil', 'sorgho', 'mais', 'niebe', 'arachide', 'coton', 'mangue', 'autre')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'sac', 'panier', 'caisse', 'unite')),
  price NUMERIC NOT NULL DEFAULT 0, -- Prix par unité en FCFA
  location TEXT NOT NULL, -- Ville/Village
  region TEXT NOT NULL, -- Région
  images JSONB DEFAULT '[]'::jsonb, -- URLs des photos
  available_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'expired')),
  views INTEGER NOT NULL DEFAULT 0,
  contacts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_marketplace_seller_id ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_region ON public.marketplace_listings(region);
CREATE INDEX IF NOT EXISTS idx_marketplace_available_from ON public.marketplace_listings(available_from);
CREATE INDEX IF NOT EXISTS idx_marketplace_expires_at ON public.marketplace_listings(expires_at);

-- Trigger updated_at (créer seulement si n'existe pas)
DROP TRIGGER IF EXISTS marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les offres disponibles
CREATE POLICY "Anyone can view available listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (status = 'available' OR seller_id = auth.uid());

-- Seuls les propriétaires peuvent créer/modifier/supprimer leurs offres
CREATE POLICY "Users can insert their own listings"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own listings"
  ON public.marketplace_listings FOR DELETE
  USING (auth.uid() = seller_id);

-- Table: orders (commandes)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL, -- quantity * unit_price
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'virement')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Index pour orders
CREATE INDEX idx_orders_offer_id ON public.orders(offer_id);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- RLS Policies pour orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Acheteur et vendeur peuvent voir la commande
CREATE POLICY "Buyers and sellers can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Seul l'acheteur peut créer une commande
CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Acheteur et vendeur peuvent mettre à jour (pour changer le statut)
CREATE POLICY "Buyers and sellers can update orders"
  ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

COMMENT ON TABLE public.marketplace_listings IS 'Offres de produits agricoles sur le marketplace';
COMMENT ON TABLE public.orders IS 'Commandes passées sur le marketplace';
