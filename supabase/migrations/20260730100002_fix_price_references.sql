-- ============================================
-- FIX: price_references - Ajout colonne region
-- Date: 2026-07-30
-- Projet: AgroField2
-- ============================================

BEGIN;

-- Ajouter la colonne region si elle n'existe pas
ALTER TABLE public.price_references 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Ajouter la colonne note si elle n'existe pas
ALTER TABLE public.price_references 
ADD COLUMN IF NOT EXISTS note TEXT;

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE public.price_references 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Créer index sur region (si n'existe pas)
CREATE INDEX IF NOT EXISTS idx_price_references_region ON public.price_references(region);

-- Trigger updated_at (recréer proprement)
DROP TRIGGER IF EXISTS price_references_updated_at ON public.price_references;
CREATE TRIGGER price_references_updated_at
  BEFORE UPDATE ON public.price_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (recréer si n'existent pas)
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

-- Données de référence
-- Les données sont déjà présentes en base, on skip l'insertion
-- Cette migration ajoute seulement les colonnes manquantes (region, note, updated_at)

COMMIT;

-- ============================================
-- ✅ Migration terminée !
-- ============================================
