
CREATE TABLE public.sensor_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES public.parcels(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  device_key TEXT NOT NULL UNIQUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_devices TO authenticated;
GRANT ALL ON public.sensor_devices TO service_role;
ALTER TABLE public.sensor_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON public.sensor_devices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_sensor_devices_updated_at BEFORE UPDATE ON public.sensor_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.sensor_devices(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES public.parcels(id) ON DELETE SET NULL,
  ph NUMERIC,
  humidity_pct NUMERIC,
  soil_moisture_pct NUMERIC,
  temperature_c NUMERIC,
  conductivity NUMERIC,
  battery_pct NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_readings TO authenticated;
GRANT ALL ON public.sensor_readings TO service_role;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own readings" ON public.sensor_readings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own readings" ON public.sensor_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own readings" ON public.sensor_readings
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX sensor_readings_device_recorded_idx ON public.sensor_readings(device_id, recorded_at DESC);
CREATE INDEX sensor_devices_key_idx ON public.sensor_devices(device_key);
