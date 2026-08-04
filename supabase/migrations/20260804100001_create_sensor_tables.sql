-- =====================================================
-- AgroField2 - Capteurs IoT
-- Migration: 2026-08-04 10:00
-- Tables: sensor_devices, sensor_readings, irrigation_commands, sensor_alerts
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. Table: sensor_devices
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  device_key TEXT UNIQUE NOT NULL, -- Clé d'authentification (64 chars hex)
  
  -- Connectivité
  connectivity_mode TEXT NOT NULL CHECK (connectivity_mode IN ('gsm', 'lora', 'bluetooth', 'wifi')),
  sim_iccid TEXT, -- ICCID de la carte SIM (mode GSM)
  
  -- Configuration
  sample_interval_seconds INTEGER DEFAULT 300, -- 5 minutes par défaut
  moisture_alert_threshold_pct INTEGER DEFAULT 20, -- Seuil d'alerte humidité
  
  -- Info hardware
  hardware_model TEXT,
  firmware_version TEXT,
  last_seen_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_sensor_devices_user ON sensor_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_devices_key ON sensor_devices(device_key);
CREATE INDEX IF NOT EXISTS idx_sensor_devices_parcel ON sensor_devices(parcel_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sensor_devices_updated_at ON sensor_devices;
CREATE TRIGGER update_sensor_devices_updated_at
  BEFORE UPDATE ON sensor_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE sensor_devices ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient seulement leurs propres appareils
DROP POLICY IF EXISTS "Users can view own devices" ON sensor_devices;
CREATE POLICY "Users can view own devices"
  ON sensor_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs appareils
DROP POLICY IF EXISTS "Users can insert own devices" ON sensor_devices;
CREATE POLICY "Users can insert own devices"
  ON sensor_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs appareils
DROP POLICY IF EXISTS "Users can update own devices" ON sensor_devices;
CREATE POLICY "Users can update own devices"
  ON sensor_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs appareils
DROP POLICY IF EXISTS "Users can delete own devices" ON sensor_devices;
CREATE POLICY "Users can delete own devices"
  ON sensor_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Service role peut tout faire (pour l'API d'ingestion)
DROP POLICY IF EXISTS "Service role full access" ON sensor_devices;
CREATE POLICY "Service role full access"
  ON sensor_devices FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ─────────────────────────────────────────────────────
-- 2. Table: sensor_readings
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES sensor_devices(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
  
  -- Mesures sol
  ph NUMERIC(4,2),              -- 0-14
  soil_moisture_pct NUMERIC(5,2), -- 0-100%
  soil_moisture_surface_pct NUMERIC(5,2), -- Optionnel
  soil_moisture_root_pct NUMERIC(5,2),    -- Optionnel
  conductivity NUMERIC(6,2),    -- mS/cm
  
  -- Météo
  temperature_c NUMERIC(5,2),   -- °C
  soil_temperature_c NUMERIC(5,2), -- °C (optionnel)
  humidity_pct NUMERIC(5,2),    -- Humidité air %
  light_lux INTEGER,            -- Lux
  rain_mm NUMERIC(5,2),         -- Pluie mm
  weather_summary TEXT,         -- "clear", "rainy", etc.
  
  -- Système
  battery_pct NUMERIC(5,2),     -- 0-100%
  
  -- Metadata
  recorded_at TIMESTAMPTZ NOT NULL,
  source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'bluetooth_sync', 'manual')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_readings_device_time ON sensor_readings(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_user_time ON sensor_readings(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_parcel ON sensor_readings(parcel_id);

-- RLS
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient seulement leurs propres lectures
DROP POLICY IF EXISTS "Users can view own readings" ON sensor_readings;
CREATE POLICY "Users can view own readings"
  ON sensor_readings FOR SELECT
  USING (auth.uid() = user_id);

-- Devices peuvent insérer leurs propres lectures (via service role)
DROP POLICY IF EXISTS "Devices can insert own readings" ON sensor_readings;
CREATE POLICY "Devices can insert own readings"
  ON sensor_readings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sensor_devices
      WHERE sensor_devices.id = sensor_readings.device_id
      AND sensor_devices.user_id = sensor_readings.user_id
    )
  );

-- Service role peut tout faire
DROP POLICY IF EXISTS "Service role full access" ON sensor_readings;
CREATE POLICY "Service role full access"
  ON sensor_readings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ─────────────────────────────────────────────────────
-- 3. Table: irrigation_commands
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS irrigation_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES sensor_devices(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL CHECK (action IN ('start_irrigation', 'stop_irrigation')),
  duration_seconds INTEGER, -- Optionnel pour stop
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ack', 'done', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_irrigation_commands_device ON irrigation_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_commands_status ON irrigation_commands(status);

-- RLS
ALTER TABLE irrigation_commands ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs commandes
DROP POLICY IF EXISTS "Users can view own commands" ON irrigation_commands;
CREATE POLICY "Users can view own commands"
  ON irrigation_commands FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des commandes
DROP POLICY IF EXISTS "Users can create commands" ON irrigation_commands;
CREATE POLICY "Users can create commands"
  ON irrigation_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role peut mettre à jour le statut
DROP POLICY IF EXISTS "Service role update status" ON irrigation_commands;
CREATE POLICY "Service role update status"
  ON irrigation_commands FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');


-- ─────────────────────────────────────────────────────
-- 4. Table: sensor_alerts
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES sensor_devices(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
  
  kind TEXT NOT NULL, -- "low_moisture", "low_battery", etc.
  message TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ -- NULL = non résolue
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_device ON sensor_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_unresolved ON sensor_alerts(device_id, resolved_at) WHERE resolved_at IS NULL;

-- RLS
ALTER TABLE sensor_alerts ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs alertes
DROP POLICY IF EXISTS "Users can view own alerts" ON sensor_alerts;
CREATE POLICY "Users can view own alerts"
  ON sensor_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sensor_devices
      WHERE sensor_devices.id = sensor_alerts.device_id
      AND sensor_devices.user_id = auth.uid()
    )
  );

-- Service role peut créer des alertes
DROP POLICY IF EXISTS "Service role create alerts" ON sensor_alerts;
CREATE POLICY "Service role create alerts"
  ON sensor_alerts FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Les utilisateurs peuvent résoudre leurs alertes
DROP POLICY IF EXISTS "Users can resolve alerts" ON sensor_alerts;
CREATE POLICY "Users can resolve alerts"
  ON sensor_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sensor_devices
      WHERE sensor_devices.id = sensor_alerts.device_id
      AND sensor_devices.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────
-- 5. Fonction: Vérifier les seuils et créer des alertes
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_moisture_threshold()
RETURNS TRIGGER AS $$
DECLARE
  device_record RECORD;
  alert_message TEXT;
BEGIN
  -- Récupérer le seuil du device
  SELECT moisture_alert_threshold_pct, name INTO device_record
  FROM sensor_devices
  WHERE id = NEW.device_id;
  
  -- Vérifier si humidité < seuil
  IF NEW.soil_moisture_pct IS NOT NULL 
     AND device_record.moisture_alert_threshold_pct IS NOT NULL
     AND NEW.soil_moisture_pct < device_record.moisture_alert_threshold_pct THEN
    
    alert_message := format('Humidité sol critique: %.1f%% (seuil: %d%%) sur %s', 
                            NEW.soil_moisture_pct, 
                            device_record.moisture_alert_threshold_pct,
                            device_record.name);
    
    -- Créer une alerte seulement s'il n'y en a pas déjà une non résolue
    IF NOT EXISTS (
      SELECT 1 FROM sensor_alerts
      WHERE device_id = NEW.device_id
      AND kind = 'low_moisture'
      AND resolved_at IS NULL
    ) THEN
      INSERT INTO sensor_alerts (device_id, parcel_id, kind, message)
      VALUES (NEW.device_id, NEW.parcel_id, 'low_moisture', alert_message);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier automatiquement les seuils
DROP TRIGGER IF EXISTS trigger_check_moisture ON sensor_readings;
CREATE TRIGGER trigger_check_moisture
  AFTER INSERT ON sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION check_moisture_threshold();


-- ─────────────────────────────────────────────────────
-- 6. Comments
-- ─────────────────────────────────────────────────────
COMMENT ON TABLE sensor_devices IS 'Appareils IoT connectés (capteurs)';
COMMENT ON TABLE sensor_readings IS 'Mesures des capteurs (sol, météo, batterie)';
COMMENT ON TABLE irrigation_commands IS 'Commandes d''irrigation envoyées aux capteurs';
COMMENT ON TABLE sensor_alerts IS 'Alertes automatiques (humidité basse, batterie faible)';

COMMENT ON COLUMN sensor_devices.connectivity_mode IS 'Mode de connexion: gsm, lora, bluetooth, wifi';
COMMENT ON COLUMN sensor_devices.device_key IS 'Clé d''authentification unique (64 caractères hex)';
COMMENT ON COLUMN sensor_readings.source IS 'Source: auto (GSM/WiFi), bluetooth_sync, manual';
