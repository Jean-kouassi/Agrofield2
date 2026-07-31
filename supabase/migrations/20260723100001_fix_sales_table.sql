-- Migration corrective: Création table sales si manquante
-- Date: 2026-07-23 10:34 GMT
-- Problème: "Could not find the table 'public.sales' in the schema cache"

-- 1. Créer la table sales si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES public.parcels(id) ON DELETE SET NULL,
  crop_type TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL DEFAULT 0,
  unit_price_fcfa NUMERIC NOT NULL DEFAULT 0,
  total_fcfa NUMERIC GENERATED ALWAYS AS (quantity_kg * unit_price_fcfa) STORED,
  buyer TEXT,
  payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'virement')),
  proof_type TEXT DEFAULT 'none'
    CHECK (proof_type IN ('receipt', 'mobile_money', 'coop_slip', 'witness', 'none')),
  receipt_image TEXT,
  notes TEXT,
  sold_at DATE NOT NULL DEFAULT (now()::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;

-- 3. RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own sales" ON public.sales;
CREATE POLICY "own sales" ON public.sales FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 4. Index pour performances
DROP INDEX IF EXISTS sales_user_idx;
CREATE INDEX sales_user_idx ON public.sales(user_id);

DROP INDEX IF EXISTS sales_parcel_idx;
CREATE INDEX sales_parcel_idx ON public.sales(parcel_id);

DROP INDEX IF EXISTS sales_sold_at_idx;
CREATE INDEX sales_sold_at_idx ON public.sales(sold_at DESC);

DROP INDEX IF EXISTS sales_crop_type_idx;
CREATE INDEX sales_crop_type_idx ON public.sales(crop_type);

-- 5. Trigger updated_at (sera créé après la fonction dans migration suivante)
-- La fonction update_updated_at_column() sera créée dans 20260723100002

-- 6. Ajouter colonne missing dans expenses si nécessaire
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'
  CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'virement'));

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS proof_type TEXT DEFAULT 'none'
  CHECK (proof_type IN ('receipt', 'mobile_money', 'coop_slip', 'witness', 'none'));

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS receipt_image TEXT;

-- 7. Commentaire explicatif
COMMENT ON TABLE public.sales IS 'Ventes de récoltes - Registre inaltérable (hash chain)';
COMMENT ON TABLE public.expenses IS 'Dépenses agricoles - Registre inaltérable (hash chain)';
