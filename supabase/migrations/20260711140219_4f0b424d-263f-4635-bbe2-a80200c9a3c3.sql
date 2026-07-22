
-- 1. ROLES: enum + user_roles table + has_role function
CREATE TYPE public.app_role AS ENUM ('super_admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Attribution super_admin à jeankouasst@gmail.com
CREATE OR REPLACE FUNCTION public.grant_super_admin_if_target()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) = 'jeankouasst@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_super_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_if_target();

CREATE TRIGGER on_auth_user_confirmed_grant_super_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_super_admin_if_target();

-- Attribue le rôle si le compte existe déjà
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'jeankouasst@gmail.com' AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. POLICIES ADMIN LECTURE (additives) sur tables métier
CREATE POLICY "super_admin reads all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin reads all parcels"
  ON public.parcels FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin reads all expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin reads all sales"
  ON public.sales FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin reads all sensor_devices"
  ON public.sensor_devices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin reads all sensor_readings"
  ON public.sensor_readings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin reads all disease_analyses"
  ON public.disease_analyses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 3. STORAGE POLICIES sur bucket agrofield-media
-- Chaque user peut lire/écrire uniquement dans receipts/{uid}/…
CREATE POLICY "users upload own receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agrofield-media'
    AND (storage.foldername(name))[1] = 'receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "users read own receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agrofield-media'
    AND (
      (storage.foldername(name))[1] = 'receipts'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  );

CREATE POLICY "super_admin reads all receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agrofield-media'
    AND public.has_role(auth.uid(), 'super_admin')
  );

-- 4. CAPTEURS: nouvelles colonnes et tables
ALTER TABLE public.sensor_devices
  ADD COLUMN IF NOT EXISTS firmware_version text,
  ADD COLUMN IF NOT EXISTS hardware_model text,
  ADD COLUMN IF NOT EXISTS moisture_alert_threshold_pct numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS last_alert_sent_at timestamptz;

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS rain_mm numeric,
  ADD COLUMN IF NOT EXISTS weather_summary text;

-- Commandes d'irrigation
CREATE TABLE public.irrigation_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.sensor_devices(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('start','stop')),
  duration_seconds integer NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ack','done','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acked_at timestamptz,
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.irrigation_commands TO authenticated;
GRANT ALL ON public.irrigation_commands TO service_role;

ALTER TABLE public.irrigation_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own irrigation commands"
  ON public.irrigation_commands FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "super_admin reads all irrigation commands"
  ON public.irrigation_commands FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX irrigation_commands_device_status_idx
  ON public.irrigation_commands(device_id, status);

-- Alertes capteurs
CREATE TABLE public.sensor_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.sensor_devices(id) ON DELETE CASCADE,
  parcel_id uuid REFERENCES public.parcels(id) ON DELETE SET NULL,
  kind text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_alerts TO authenticated;
GRANT ALL ON public.sensor_alerts TO service_role;

ALTER TABLE public.sensor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sensor alerts"
  ON public.sensor_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "super_admin reads all sensor alerts"
  ON public.sensor_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX sensor_alerts_user_unresolved_idx
  ON public.sensor_alerts(user_id) WHERE resolved_at IS NULL;

-- 5. Détection humidité basse (appelée par cron)
CREATE OR REPLACE FUNCTION public.sensor_low_moisture_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT ON (sr.device_id)
      sr.device_id, sr.user_id, sr.parcel_id, sr.soil_moisture_pct, sr.recorded_at,
      sd.name AS device_name, sd.moisture_alert_threshold_pct, sd.last_alert_sent_at
    FROM public.sensor_readings sr
    JOIN public.sensor_devices sd ON sd.id = sr.device_id
    WHERE sr.recorded_at > now() - interval '2 hours'
      AND sr.soil_moisture_pct IS NOT NULL
    ORDER BY sr.device_id, sr.recorded_at DESC
  LOOP
    IF rec.soil_moisture_pct < rec.moisture_alert_threshold_pct
       AND (rec.last_alert_sent_at IS NULL OR rec.last_alert_sent_at < now() - interval '6 hours') THEN
      INSERT INTO public.sensor_alerts (user_id, device_id, parcel_id, kind, message)
      VALUES (
        rec.user_id, rec.device_id, rec.parcel_id, 'low_moisture',
        'Humidité du sol basse (' || rec.soil_moisture_pct || '%) sur ' || rec.device_name || ' — arrosage recommandé dans les 6 h.'
      );
      UPDATE public.sensor_devices SET last_alert_sent_at = now() WHERE id = rec.device_id;
    END IF;
  END LOOP;

  -- Purge mesures > 12 mois
  DELETE FROM public.sensor_readings WHERE recorded_at < now() - interval '12 months';
END;
$$;

-- Cron toutes les 15 min
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'sensor-low-moisture-check',
  '*/15 * * * *',
  $$SELECT public.sensor_low_moisture_check()$$
);
