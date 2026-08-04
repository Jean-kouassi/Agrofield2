#!/usr/bin/env node
/**
 * Simulateur de capteur AgroField2
 * 
 * Usage:
 *   node scripts/test-sensor-simulator.mjs --device-key VOTRE_CLE
 * 
 * Options:
 *   --device-key, -k    Clé du device (obligatoire)
 *   --interval, -i      Intervalle en secondes (défaut: 10 pour test)
 *   --count, -c         Nombre d'envois (défaut: 5)
 *   --url, -u           URL de l'API (défaut: http://localhost:8080/api/public/sensors/ingest)
 */

import { argv } from 'node:process';
import { setTimeout } from 'node:timers/promises';

// Parse arguments
const args = argv.slice(2);
const parseArg = (short, long) => {
  const idx = args.findIndex(a => a === `-${short}` || a === `--${long}`);
  if (idx === -1) return null;
  return args[idx + 1];
};

const DEVICE_KEY = parseArg('k', 'device-key');
const INTERVAL_SEC = parseInt(parseArg('i', 'interval') || '10', 10);
const COUNT = parseInt(parseArg('c', 'count') || '5', 10);
const BASE_URL = parseArg('u', 'url') || 'http://localhost:8080';

if (!DEVICE_KEY) {
  console.error('❌ Erreur: --device-key est obligatoire');
  console.error('\nUsage:');
  console.error('  node scripts/test-sensor-simulator.mjs --device-key VOTRE_CLE');
  console.error('\nOptions:');
  console.error('  --device-key, -k    Clé du device (obligatoire)');
  console.error('  --interval, -i      Intervalle en secondes (défaut: 10)');
  console.error('  --count, -c         Nombre d\'envois (défaut: 5)');
  console.error('  --url, -u           URL de l\'API (défaut: http://localhost:8080)');
  process.exit(1);
}

// Générateur de valeurs réalistes
function generateReading() {
  const baseTemp = 28 + Math.sin(Date.now() / 3600000) * 5; // Variation diurne
  const baseMoisture = 45 + Math.random() * 20 - 10; // 35-55%
  
  return {
    recorded_at: new Date().toISOString(),
    ph: +(6.2 + Math.random() * 0.6).toFixed(2), // 6.2-6.8
    humidity_pct: +(55 + Math.random() * 20 - 10).toFixed(1), // 45-65%
    soil_moisture_pct: +baseMoisture.toFixed(1),
    temperature_c: +baseTemp.toFixed(1),
    conductivity: +(1.0 + Math.random() * 0.5).toFixed(2), // 1.0-1.5 mS/cm
    battery_pct: +(85 + Math.random() * 15).toFixed(1), // 85-100%
    light_lux: Math.floor(5000 + Math.random() * 30000), // 5000-35000 lux
  };
}

async function sendReading() {
  const reading = generateReading();
  const payload = {
    device_key: DEVICE_KEY,
    source: 'auto',
    firmware_version: 'sim-1.0.0',
    hardware_model: 'AgroNode-Simulator',
    readings: [reading]
  };

  try {
    const response = await fetch(`${BASE_URL}/api/public/sensors/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ [${new Date().toLocaleTimeString('fr-FR')}] Envoyé: Humidité=${reading.soil_moisture_pct}%, Temp=${reading.temperature_c}°C, pH=${reading.ph}`);
      return true;
    } else {
      console.error(`❌ [${new Date().toLocaleTimeString('fr-FR')}] Erreur HTTP ${response.status}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [${new Date().toLocaleTimeString('fr-FR')}] Erreur réseau: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🌾 Simulateur de capteur AgroField2');
  console.log('─────────────────────────────────────');
  console.log(`Device Key: ${DEVICE_KEY.slice(0, 8)}...${DEVICE_KEY.slice(-8)}`);
  console.log(`Intervalle: ${INTERVAL_SEC}s`);
  console.log(`Nombre d'envois: ${COUNT}`);
  console.log(`URL: ${BASE_URL}/api/public/sensors/ingest`);
  console.log('─────────────────────────────────────\n');

  let successCount = 0;
  
  for (let i = 0; i < COUNT; i++) {
    console.log(`📊 Envoi ${i + 1}/${COUNT}...`);
    const success = await sendReading();
    if (success) successCount++;
    
    if (i < COUNT - 1) {
      console.log(`⏱️ Prochain envoi dans ${INTERVAL_SEC}s...\n`);
      await setTimeout(INTERVAL_SEC * 1000);
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Terminé: ${successCount}/${COUNT} envois réussis`);
  console.log('📊 Va voir le dashboard pour vérifier les données!');
  console.log(`🔗 URL: ${BASE_URL}/sensors`);
}

main().catch(console.error);
