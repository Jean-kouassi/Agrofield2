-- Migration: Ajouter colonnes coûts à crop_events
-- Projet: vtnduxtrnahhbgvlhqjw
-- Date: 2026-07-27

ALTER TABLE public.crop_events 
ADD COLUMN IF NOT EXISTS input_cost_fcfa NUMERIC DEFAULT 0;

ALTER TABLE public.crop_events 
ADD COLUMN IF NOT EXISTS labor_cost_fcfa NUMERIC DEFAULT 0;

-- Puis créer la fonction RPC
CREATE OR REPLACE FUNCTION public.insert_crop_event(
  p_user_id UUID,
  p_parcel_id UUID,
  p_event_type TEXT,
  p_event_date DATE,
  p_notes TEXT DEFAULT NULL,
  p_yield_kg NUMERIC DEFAULT NULL,
  p_input_cost NUMERIC DEFAULT 0,
  p_labor_cost NUMERIC DEFAULT 0
) RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.crop_events (user_id, parcel_id, event_type, event_date, notes, yield_kg, input_cost_fcfa, labor_cost_fcfa)
  VALUES (p_user_id, p_parcel_id, p_event_type, p_event_date, p_notes, p_yield_kg, p_input_cost, p_labor_cost)
  RETURNING id;
$$;

GRANT EXECUTE ON FUNCTION public.insert_crop_event TO authenticated;

NOTIFY pgrst, 'reload schema cache';