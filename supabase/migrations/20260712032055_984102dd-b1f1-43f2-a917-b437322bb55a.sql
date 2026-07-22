
ALTER TABLE public.sensor_devices
  ADD COLUMN IF NOT EXISTS connectivity_mode text NOT NULL DEFAULT 'gsm'
    CHECK (connectivity_mode IN ('gsm','lora','bluetooth','wifi')),
  ADD COLUMN IF NOT EXISTS sim_iccid text;

ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'auto'
    CHECK (source IN ('auto','bluetooth_sync','manual'));
