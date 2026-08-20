-- Migration: Add proof fields to marketplace_listings table
-- Date: 2026-08-19 12:00
-- Purpose: Align marketplace listings with finance expense/sales form structure for credibility scoring

-- Add proof_type column (matches expenses and sales tables)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS proof_type TEXT DEFAULT 'none'
CHECK (proof_type IN ('receipt', 'mobile_money', 'coop_slip', 'witness', 'none'));

-- Add proof_ref column for transaction references
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS proof_ref TEXT;

-- Add witness_name column
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS witness_name TEXT;

-- Add witness_village column
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS witness_village TEXT;

-- Add receipt_path column for uploaded receipt images
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS receipt_path TEXT;

-- Create index on proof_type for filtering credible listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_proof_type 
ON public.marketplace_listings(proof_type);

-- Add comment for documentation
COMMENT ON COLUMN public.marketplace_listings.proof_type IS 'Type de justificatif: receipt (reçu papier), mobile_money (SMS Orange/Moov/Wave), coop_slip (bon coopérative), witness (témoin), none (aucun)';
COMMENT ON COLUMN public.marketplace_listings.proof_ref IS 'Référence de transaction (numéro SMS Mobile Money, référence bon coopérative)';
COMMENT ON COLUMN public.marketplace_listings.witness_name IS 'Nom du témoin pour les transactions avec témoignage';
COMMENT ON COLUMN public.marketplace_listings.witness_village IS 'Village du témoin';
COMMENT ON COLUMN public.marketplace_listings.receipt_path IS 'Chemin vers le fichier dans le storage bucket agrofield-media';
