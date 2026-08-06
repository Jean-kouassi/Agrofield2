# 📡 Guide Complet : Connexion des Capteurs AgroField

## 🎯 Vue d'ensemble du système

AgroField utilise une architecture IoT multi-connectivité pour s'adapter aux zones rurales africaines :

```
┌─────────────────────────────────────────────────────────────┐
│                    AgroField Platform                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │   API REST   │  │  Supabase    │      │
│  │   (React)    │◄─┤   /api/...   │◄─┤  Database    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         ▲                       ▲
         │                       │
         │ HTTP/HTTPS            │ Realtime
         │                       │
    ┌────┴─────┐           ┌────┴─────┐
    │          │           │          │
┌───▼────┐ ┌──▼──────┐ ┌──▼────┐ ┌──▼──────┐
│  GSM   │ │ LoRa    │ │ WiFi  │ │Bluetooth│
│  SIM   │ │ Gateway │ │Routeur│ │  Sync   │
└───┬────┘ └──┬──────┘ └──┬────┘ └──┬──────┘
    │          │           │          │
    └──────────┴───────────┴──────────┘
                  │
         ┌────────▼────────┐
         │ AgroField Node  │
         │   (ESP32-S3)    │
         │ + Capteurs      │
         └─────────────────┘
```

---

## 🗂️ Structure des routes API

### Routes existantes dans `src/routes/api/public/sensors/`

#### 1. **POST `/api/public/sensors/ingest`**
**Purpose:** Recevoir les données des capteurs

**Body (lecture unique):**
```json
{
  "device_key": "a1b2c3d4e5f6...",
  "ph": 6.5,
  "humidity_pct": 75,
  "soil_moisture_pct": 45,
  "temperature_c": 28.5,
  "conductivity": 1.2,
  "battery_pct": 87,
  "recorded_at": "2026-07-23T10:30:00Z"
}
```

**Body (batch - recommandé):**
```json
{
  "device_key": "a1b2c3d4e5f6...",
  "source": "auto",
  "firmware_version": "1.2.3",
  "hardware_model": "AgroNode-v2",
  "readings": [
    {
      "recorded_at": "2026-07-23T10:00:00Z",
      "ph": 6.5,
      "humidity_pct": 75,
      "soil_moisture_pct": 45,
      "temperature_c": 28.5
    },
    {
      "recorded_at": "2026-07-23T10:05:00Z",
      "ph": 6.4,
      "humidity_pct": 74,
      "soil_moisture_pct": 44,
      "temperature_c": 29.1
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "inserted": 2
}
```

**Codes d'erreur:**
- `400` - JSON invalide ou `device_key` manquant
- `401` - `device_key` inconnu
- `500` - Erreur base de données

---

#### 2. **GET `/api/public/sensors/commands?device_key=xxx`**
**Purpose:** Récupérer les commandes d'irrigation en attente

**Response:**
```json
{
  "commands": [
    {
      "id": "cmd_123",
      "action": "start_irrigation",
      "duration_seconds": 300,
      "created_at": "2026-07-23T10:30:00Z"
    }
  ]
}
```

---

#### 3. **POST `/api/public/sensors/commands`**
**Purpose:** Accuser réception d'une commande exécutée

**Body:**
```json
{
  "device_key": "a1b2c3d4e5f6...",
  "command_id": "cmd_123",
  "status": "done"
}
```

**Status possibles:**
- `"done"` - Commande exécutée avec succès
- `"failed"` - Échec de l'exécution

---

## 🏗️ Structure de la base de données

### Tables principales (Supabase)

#### `sensor_devices`
```sql
CREATE TABLE sensor_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  parcel_id UUID REFERENCES parcels(id),
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
```

#### `sensor_readings`
```sql
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  device_id UUID NOT NULL REFERENCES sensor_devices(id),
  parcel_id UUID REFERENCES parcels(id),
  
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
CREATE INDEX idx_readings_device_time ON sensor_readings(device_id, recorded_at DESC);
CREATE INDEX idx_readings_user_time ON sensor_readings(user_id, recorded_at DESC);
```

#### `irrigation_commands`
```sql
CREATE TABLE irrigation_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  device_id UUID NOT NULL REFERENCES sensor_devices(id),
  
  action TEXT NOT NULL CHECK (action IN ('start_irrigation', 'stop_irrigation')),
  duration_seconds INTEGER, -- Optionnel pour stop
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ack', 'done', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### `sensor_alerts`
```sql
CREATE TABLE sensor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES sensor_devices(id),
  parcel_id UUID REFERENCES parcels(id),
  
  kind TEXT NOT NULL, -- "low_moisture", "low_battery", etc.
  message TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ -- NULL = non résolue
);
```

---

## 🔧 Comment connecter un VRAI capteur

### Option 1 : **ESP32-S3 avec module GSM (Recommandé)**

#### Matériel requis :
- ESP32-S3 (Deep Sleep support)
- Module GSM A7670X ou SIM800L (2G/4G)
- Capteur d'humidité du sol capacitive (évitez les résistifs qui corrodent)
- Panneau solaire 5V + batterie LiPo 18650
- Boîtier étanche IP65

#### Schéma de câblage :
```
ESP32-S3          A7670X (GSM)
────────          ────────────
GPIO 17 (TX)  →   RX
GPIO 18 (RX)  →   TX
5V            →   VIN
GND           →   GND

ESP32-S3          Capteur Humidité Sol
────────          ────────────────────
GPIO 4 (ADC1) ←   Signal (AOUT)
3.3V          →   VCC
GND           →   GND
```

#### Code Arduino/PlatformIO :

**Fichier : `src/main.cpp`**
```cpp
#include <Arduino.h>
#include <TinyGsmClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_sleep.h>

// --- Configuration ---
#define DEVICE_KEY "VOTRE_CLE_DEVICE_ICI" // 64 caractères hex
#define API_URL "https://votre-domaine.com/api/public/sensors/ingest"
#define SAMPLE_INTERVAL_SECONDS 300 // 5 minutes

// Pins
#define SOIL_MOISTURE_PIN 4
#define BATTERY_PIN 35

// GSM
#define SERIAL_GSM Serial1
#define GSM_DTR 5
#define GSM_PWR 2

TinyGsm modem(SERIAL_GSM);
TinyGsmClient client(modem);

// --- Fonctions ---
float readSoilMoisture() {
  int val = analogRead(SOIL_MOISTURE_PIN);
  // Calibration: sec=4095, humide=1500 (à ajuster)
  float pct = 100.0 - ((val - 1500.0) / (4095.0 - 1500.0) * 100.0);
  return constrain(pct, 0, 100);
}

float readBattery() {
  int val = analogRead(BATTERY_PIN);
  float voltage = val * (3.3 / 4095.0) * 2.0; // Voltage divider x2
  // LiPo: 3.0V=0%, 4.2V=100%
  float pct = (voltage - 3.0) / (4.2 - 3.0) * 100.0;
  return constrain(pct, 0, 100);
}

bool sendReading(float moisture, float battery) {
  HTTPClient http;
  http.begin(client, API_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["device_key"] = DEVICE_KEY;
  doc["source"] = "auto";
  doc["firmware_version"] = "1.0.0";
  doc["hardware_model"] = "AgroNode-GSM-v1";

  JsonArray readings = doc.createNestedArray("readings");
  JsonObject r = readings.createNestedObject();
  r["recorded_at"] = String(time(nullptr) * 1000);
  r["soil_moisture_pct"] = moisture;
  r["battery_pct"] = battery;

  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  bool ok = (code == 200);
  
  http.end();
  return ok;
}

void setup() {
  Serial.begin(115200);
  
  // Init GSM
  pinMode(GSM_PWR, OUTPUT);
  digitalWrite(GSM_PWR, HIGH);
  SERIAL_GSM.begin(9600, SERIAL_8N1, 16, 17);
  
  delay(5000); // Attendre que le modem démarre
  
  // Connect to cellular
  Serial.println("Connexion réseau...");
  modem.restart();
  String pin = "0000"; // Votre PIN SIM si nécessaire
  if (!modem.simEnterPIN(pin)) {
    Serial.println("Erreur PIN SIM");
    deepSleep(60);
  }
  
  if (!modem.waitForNetwork(600000L)) {
    Serial.println("Pas de réseau");
    deepSleep(60);
  }
  
  if (!modem.isGprsConnected()) {
    if (!modem.gprsConnect("orange", "orange", "orange")) {
      Serial.println("Erreur GPRS");
      deepSleep(60);
    }
  }
  
  // Lecture capteurs
  float moisture = readSoilMoisture();
  float battery = readBattery();
  
  Serial.printf("Humidité: %.1f%%, Batterie: %.1f%%\n", moisture, battery);
  
  // Envoi
  if (sendReading(moisture, battery)) {
    Serial.println("Données envoyées avec succès");
  } else {
    Serial.println("Échec envoi données");
  }
  
  // Deep sleep
  deepSleep(SAMPLE_INTERVAL_SECONDS);
}

void deepSleep(int seconds) {
  Serial.printf("Deep sleep pour %d secondes\n", seconds);
  esp_sleep_enable_timer_wakeup(seconds * 1000000LL);
  esp_deep_sleep_start();
}

void loop() {
  // Ne s'exécute jamais (deep sleep)
}
```

---

### Option 2 : **Sync Bluetooth (Hors ligne)**

Pour les zones sans couverture GSM, utilisez la synchronisation Bluetooth :

#### Matériel :
- ESP32-S3 avec Bluetooth BLE activé
- Même capteurs que ci-dessus

#### Fonctionnement :
1. Le capteur stocke les mesures dans sa mémoire flash (SPIFFS/LittleFS)
2. Quand l'utilisateur approche son téléphone, il clique sur **"Synchroniser via Bluetooth"** dans l'app
3. Les données sont transférées via Web Bluetooth API
4. L'application web les envoie au serveur dès qu'elle retrouve Internet

#### Code ESP32 pour BLE :
```cpp
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLECharacteristic* pCharacteristic;
bool deviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    }
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      BLEDevice::startAdvertising();
    }
};

void setup() {
  // Créer service BLE
  BLEDevice::init("AgroNode-XXXX");
  BLEServer* pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService* pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  pService->start();
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();
  
  Serial.println("BLE prêt à recevoir des commandes");
}

void loop() {
  if (deviceConnected) {
    // Envoyer les lectures accumulées
    String json = "{\"device_key\":\"XXX\",\"readings\":[...]}";
    pCharacteristic->setValue(json.c_str());
    pCharacteristic->notify();
    delay(1000);
  }
  delay(100);
}
```

---

### Option 3 : **LoRa (Couverture villageoise)**

Pour couvrir plusieurs parcelles avec une seule connexion Internet :

#### Architecture :
```
[Capteur 1] ──┐
[Capteur 2] ──┼── LoRa ──► [Passerelle Village] ── GSM/WiFi ──► Internet
[Capteur 3] ──┘
```

#### Matériel :
- ESP32 + Module LoRa SX1276 (868 MHz Europe ou 915 MHz Afrique)
- Passerelle : Raspberry Pi + Concentrateur LoRa (ex: Dragino LG302)

#### Protocole :
Utilisez **LoRaWAN** avec The Things Network ou un serveur ChirpStack local.

---

## 📊 Tableau de bord : Comment ça marche

### Dans `src/routes/_authenticated/sensors.tsx`

#### 1. **Création d'un appareil**
Quand vous créez un capteur dans l'interface :
- Une `device_key` unique est générée (64 caractères hex)
- Vous choisissez le mode de connectivité (GSM/LoRa/Bluetooth/WiFi)
- Vous liez optionnellement à une parcelle

#### 2. **Réception des données**
Les données arrivent via `/api/public/sensors/ingest` :
- Authentification par `device_key`
- Insertion dans `sensor_readings`
- Mise à jour de `last_seen_at` dans `sensor_devices`

#### 3. **Affichage en temps réel**
La page sensors :
- Poll toutes les 15 secondes (`refetchInterval: 15000`)
- Affiche les dernières mesures par appareil
- Montre des graphiques (Recharts) sur 12 mois
- Alerte si humidité < seuil configuré

#### 4. **Commandes d'irrigation**
Quand vous cliquez sur "60s", "5min", etc. :
- Une ligne est créée dans `irrigation_commands` avec status `pending`
- Le capteur poll `/api/public/sensors/commands` périodiquement
- Il exécute la commande et met à jour le status à `done`

---

## 🔒 Sécurité

### Bonnes pratiques :

1. **Device Key :**
   - Gardez-la secrète dans le firmware (ne jamais committer dans Git)
   - Utilisez `secretKey` dans PlatformIO : `board_build.embed_txtfiles = "src/secrets/device_key.txt"`

2. **RLS Supabase :**
   ```sql
   -- Les devices ne peuvent INSERT que leurs propres readings
   CREATE POLICY "Devices can insert own readings"
   ON sensor_readings FOR INSERT
   WITH CHECK (
     EXISTS (
       SELECT 1 FROM sensor_devices
       WHERE sensor_devices.id = sensor_readings.device_id
     )
   );
   ```

3. **Rate Limiting :**
   - Limitez à 1 requête/minute par device_key
   - Implémentez avec pg_cron ou Cloudflare Workers

---

## 🚀 Déploiement

### 1. **Configurer Supabase**
```bash
cd C:\Users\Kouassi\Desktop\Agrofield2
supabase db push
```

### 2. **Obtenir l'URL d'ingestion**
Dans la page Capteurs, copiez l'endpoint affiché :
```
https://votre-app.lovable.app/api/public/sensors/ingest
```

### 3. **Flasher le firmware**
```bash
# Compiler et uploader avec PlatformIO
pio run --target upload

# Ou avec esptool
esptool.py --port COM3 write_flash 0x1000 .pio/build/esp32-s3/firmware.bin
```

### 4. **Tester**
Vérifiez dans le dashboard que :
- ✅ `last_seen_at` se met à jour
- ✅ Les mesures apparaissent dans "Historique récent"
- ✅ Les graphiques se dessinent

---

## 🛠️ Dépannage

### "Unknown device" (401)
→ Vérifiez que `device_key` correspond exactement (copier-coller depuis le dashboard)

### Pas de données après 1h
→ Vérifiez :
- Alimentation (batterie/solaire)
- Signal GSM (antenne bien connectée)
- Logs série (`Serial.begin(115200)`)

### Données mais pas de graphiques
→ Attendez 2-3 mesures (il faut un historique)

### Bluetooth ne sync pas
→ Utilisez Chrome sur Android (Web Bluetooth requis)
→ Approchez le téléphone (< 5m)

---

## 📞 Support

Email : support@agrofield.bf

Documentation complète : https://docs.agrofield.bf/capteurs
