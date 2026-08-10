-- Migration: Add role column to profiles
-- Date: 2026-08-10
-- Risk: 🟡 MEDIUM (modification de table existante)
-- Description: Ajoute un champ role pour distinguer acheteurs, vendeurs, ou les deux

-- Ajouter la colonne role avec valeur par défaut 'both'
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'both' 
  CHECK (role IN ('buyer', 'seller', 'both'));

-- Mettre à jour les profils existants avec 'both'
UPDATE public.profiles SET role = 'both' WHERE role IS NULL;

-- Commentaire
COMMENT ON COLUMN public.profiles.role IS 'Rôle marketplace: buyer (acheteur), seller (vendeur), both (les deux)';

-- Index pour filtrer par rôle si nécessaire
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);