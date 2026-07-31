-- Migration: Création fonction update_updated_at_column()
-- Date: 2026-07-23 10:45 GMT
-- Problème: function update_updated_at_column() does not exist

-- 1. Créer la fonction utilitaire update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Appliquer le trigger à la table sales
DROP TRIGGER IF EXISTS sales_updated_at ON public.sales;
CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Appliquer le trigger à la table expenses (si colonne updated_at existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses' 
    AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
    CREATE TRIGGER expenses_updated_at
      BEFORE UPDATE ON public.expenses
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4. Appliquer à d'autres tables si besoin
DROP TRIGGER IF EXISTS parcels_updated_at ON public.parcels;
CREATE TRIGGER parcels_updated_at
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS crop_events_updated_at ON public.crop_events;
CREATE TRIGGER crop_events_updated_at
  BEFORE UPDATE ON public.crop_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS disease_analyses_updated_at ON public.disease_analyses;
CREATE TRIGGER disease_analyses_updated_at
  BEFORE UPDATE ON public.disease_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS sensor_devices_updated_at ON public.sensor_devices;
CREATE TRIGGER sensor_devices_updated_at
  BEFORE UPDATE ON public.sensor_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS sensor_readings_updated_at ON public.sensor_readings;
CREATE TRIGGER sensor_readings_updated_at
  BEFORE UPDATE ON public.sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS credit_scores_updated_at ON public.credit_scores;
CREATE TRIGGER credit_scores_updated_at
  BEFORE UPDATE ON public.credit_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS loan_applications_updated_at ON public.loan_applications;
CREATE TRIGGER loan_applications_updated_at
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Commentaire
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger utility to set updated_at = now() on row update';
