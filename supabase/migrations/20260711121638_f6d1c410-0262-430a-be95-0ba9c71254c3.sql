
-- 1) Activer pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2) Ajouter colonnes preuve
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS proof_type text,
  ADD COLUMN IF NOT EXISTS proof_ref text,
  ADD COLUMN IF NOT EXISTS witness_name text,
  ADD COLUMN IF NOT EXISTS witness_village text,
  ADD COLUMN IF NOT EXISTS flagged_outlier boolean NOT NULL DEFAULT false;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS proof_type text,
  ADD COLUMN IF NOT EXISTS proof_ref text,
  ADD COLUMN IF NOT EXISTS witness_name text,
  ADD COLUMN IF NOT EXISTS witness_village text,
  ADD COLUMN IF NOT EXISTS flagged_outlier boolean NOT NULL DEFAULT false;

-- 3) Recréer les fonctions de hash en utilisant extensions.digest et en incluant receipt_path/proof_type
CREATE OR REPLACE FUNCTION public.compute_expense_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  last_hash text;
BEGIN
  SELECT record_hash INTO last_hash
  FROM public.expenses
  WHERE user_id = NEW.user_id AND id <> NEW.id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
  NEW.locked_at := now();
  NEW.record_hash := encode(
    extensions.digest(
      convert_to(
        NEW.prev_hash || '|' ||
        NEW.id::text || '|' ||
        NEW.user_id::text || '|' ||
        COALESCE(NEW.parcel_id::text, '') || '|' ||
        NEW.category || '|' ||
        NEW.amount_fcfa::text || '|' ||
        COALESCE(NEW.description, '') || '|' ||
        NEW.spent_at::text || '|' ||
        COALESCE(NEW.receipt_path, '') || '|' ||
        COALESCE(NEW.proof_type, '') || '|' ||
        COALESCE(NEW.proof_ref, '') || '|' ||
        COALESCE(NEW.witness_name, '') || '|' ||
        COALESCE(NEW.witness_village, '') || '|' ||
        NEW.flagged_outlier::text || '|' ||
        NEW.locked_at::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.compute_sale_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  last_hash text;
BEGIN
  SELECT record_hash INTO last_hash
  FROM public.sales
  WHERE user_id = NEW.user_id AND id <> NEW.id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
  NEW.locked_at := now();
  NEW.record_hash := encode(
    extensions.digest(
      convert_to(
        NEW.prev_hash || '|' ||
        NEW.id::text || '|' ||
        NEW.user_id::text || '|' ||
        COALESCE(NEW.parcel_id::text, '') || '|' ||
        NEW.crop_type || '|' ||
        NEW.quantity_kg::text || '|' ||
        NEW.unit_price_fcfa::text || '|' ||
        COALESCE(NEW.buyer, '') || '|' ||
        NEW.sold_at::text || '|' ||
        COALESCE(NEW.receipt_path, '') || '|' ||
        COALESCE(NEW.proof_type, '') || '|' ||
        COALESCE(NEW.proof_ref, '') || '|' ||
        COALESCE(NEW.witness_name, '') || '|' ||
        COALESCE(NEW.witness_village, '') || '|' ||
        NEW.flagged_outlier::text || '|' ||
        NEW.locked_at::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$function$;

-- 4) Table de prix de référence
CREATE TABLE IF NOT EXISTS public.price_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('sale','expense')),
  key text NOT NULL,
  unit text NOT NULL,
  min_fcfa integer NOT NULL,
  max_fcfa integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, key)
);

GRANT SELECT ON public.price_references TO authenticated;
GRANT ALL ON public.price_references TO service_role;

ALTER TABLE public.price_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read price references"
ON public.price_references FOR SELECT
TO authenticated
USING (true);

-- Seed prix indicatifs Afrique de l'Ouest (FCFA)
INSERT INTO public.price_references (kind, key, unit, min_fcfa, max_fcfa, note) VALUES
  ('sale','Mil','FCFA/kg',150,350,'Prix bord champ / marché local'),
  ('sale','Sorgho','FCFA/kg',125,300,NULL),
  ('sale','Maïs','FCFA/kg',125,275,NULL),
  ('sale','Riz','FCFA/kg',250,500,'Riz paddy'),
  ('sale','Coton','FCFA/kg',275,350,'Prix plancher SOFITEX'),
  ('sale','Arachide','FCFA/kg',300,600,'En coques'),
  ('sale','Niébé','FCFA/kg',350,700,NULL),
  ('sale','Sésame','FCFA/kg',600,1200,NULL),
  ('sale','Tomate','FCFA/kg',150,500,'Variable selon saison'),
  ('sale','Oignon','FCFA/kg',200,600,NULL),
  ('sale','Chou','FCFA/kg',150,400,NULL),
  ('sale','Autre maraîchage','FCFA/kg',100,800,NULL),
  ('expense','Semences','FCFA (total)',2000,150000,'Selon surface'),
  ('expense','Engrais','FCFA (total)',12000,30000,'Sac 50 kg NPK/Urée'),
  ('expense','Pesticides','FCFA (total)',3000,50000,NULL),
  ('expense','Main d''œuvre','FCFA (total)',1500,5000,'Journée par personne'),
  ('expense','Transport','FCFA (total)',1000,50000,NULL),
  ('expense','Outillage','FCFA (total)',2000,100000,NULL),
  ('expense','Eau / irrigation','FCFA (total)',1000,50000,NULL),
  ('expense','Autre','FCFA (total)',500,200000,NULL)
ON CONFLICT (kind, key) DO NOTHING;

-- 5) Storage policies pour receipts/{uid}/...
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own receipts') THEN
    CREATE POLICY "Users manage own receipts"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
      bucket_id = 'agrofield-media'
      AND (storage.foldername(name))[1] = 'receipts'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'agrofield-media'
      AND (storage.foldername(name))[1] = 'receipts'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END $$;
