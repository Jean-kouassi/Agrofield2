ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS soil_moisture_surface_pct numeric,
  ADD COLUMN IF NOT EXISTS soil_moisture_root_pct numeric,
  ADD COLUMN IF NOT EXISTS soil_temperature_c numeric,
  ADD COLUMN IF NOT EXISTS light_lux numeric;