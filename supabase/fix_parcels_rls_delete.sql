-- Fix RLS: Ajouter policy DELETE sur parcels
-- À exécuter dans Supabase SQL Editor

-- Vérifier d'abord les policies existantes
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'parcels';

-- Ajouter policy DELETE si manquante
DO $$
BEGIN
  -- Vérifier si la policy DELETE existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'parcels' 
    AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Users can delete their own parcels"
      ON public.parcels FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Policy DELETE ajoutée sur parcels';
  ELSE
    RAISE NOTICE 'Policy DELETE existe déjà sur parcels';
  END IF;
END $$;

-- Vérifier que RLS est activé
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Vérifier le résultat
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'parcels'
ORDER BY cmd;