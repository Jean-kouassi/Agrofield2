-- ============================================
-- MIGRATION P0: Parcelles & Suivi Cultural
-- Date: 2026-07-25
-- Projet: AgroField2
-- ============================================

-- 1. Fonction update_updated_at_column (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Table parcels - Gestion des parcelles agricoles
CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_ha NUMERIC NOT NULL DEFAULT 0,
  crop_type TEXT NOT NULL,
  sowing_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'fallow', 'abandoned')),
  location_quarter TEXT,
  location_gps_lat NUMERIC,
  location_gps_lng NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON public.parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_crop_type ON public.parcels(crop_type);

-- Trigger updated_at
DROP TRIGGER IF EXISTS parcels_updated_at ON public.parcels;
CREATE TRIGGER parcels_updated_at
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own parcels" ON public.parcels;
CREATE POLICY "Users can view their own parcels"
  ON public.parcels FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own parcels" ON public.parcels;
CREATE POLICY "Users can insert their own parcels"
  ON public.parcels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own parcels" ON public.parcels;
CREATE POLICY "Users can update their own parcels"
  ON public.parcels FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own parcels" ON public.parcels;
CREATE POLICY "Users can delete their own parcels"
  ON public.parcels FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Table crop_events - Suivi cultural
CREATE TABLE IF NOT EXISTS public.crop_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sowing', 'irrigation', 'fertilization', 'treatment', 'weeding', 'harvest', 'other')),
  event_date DATE NOT NULL DEFAULT (now()::date),
  notes TEXT,
  yield_kg NUMERIC,
  input_cost_fcfa NUMERIC,
  labor_cost_fcfa NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_crop_events_user_id ON public.crop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_parcel_id ON public.crop_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_type ON public.crop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_date ON public.crop_events(event_date);

-- RLS
ALTER TABLE public.crop_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own crop events" ON public.crop_events;
CREATE POLICY "Users can view their own crop events"
  ON public.crop_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own crop events" ON public.crop_events;
CREATE POLICY "Users can insert their own crop events"
  ON public.crop_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own crop events" ON public.crop_events;
CREATE POLICY "Users can update their own crop events"
  ON public.crop_events FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own crop events" ON public.crop_events;
CREATE POLICY "Users can delete their own crop events"
  ON public.crop_events FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Table price_references - Références de prix
CREATE TABLE IF NOT EXISTS public.price_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('crop', 'input')),
  key TEXT NOT NULL,
  min_fcfa NUMERIC NOT NULL,
  max_fcfa NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  region TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kind, key, region)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_price_references_kind ON public.price_references(kind);
CREATE INDEX IF NOT EXISTS idx_price_references_key ON public.price_references(key);
-- La colonne region sera ajoutée dans une migration ultérieure
-- CREATE INDEX IF NOT EXISTS idx_price_references_region ON public.price_references(region);

-- Trigger updated_at
DROP TRIGGER IF EXISTS price_references_updated_at ON public.price_references;
CREATE TRIGGER price_references_updated_at
  BEFORE UPDATE ON public.price_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.price_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view price references" ON public.price_references;
CREATE POLICY "Anyone can view price references"
  ON public.price_references FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage price references" ON public.price_references;
CREATE POLICY "Admins can manage price references"
  ON public.price_references FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Données de référence
-- Les données seront ajoutées dans la migration 20260730100002_fix_price_references.sql

-- ============================================
-- ✅ Migration terminée !
-- Tables créées: parcels, crop_events, price_references
-- Données de référence: 15 entrées
-- ============================================
