#!/usr/bin/env node

/**
 * Simulateur de capteur AgroField
 * 
 * Usage:
 *   node test-sensor-simulator.mjs --device-key YOUR_KEY --url https://your-app.com/api/public/sensors/ingest
 * 
 * Options:
 *   --device-key  Clé du capteur (obligatoire)
 *   --url         URL d'ingestion (défaut: http://localhost:8081/api/public/sensors/ingest)
 *   --interval    Intervalle en secondes (défaut: 5 pour test rapide)
 *   --count       Nombre d'envois (défaut: 0 = infini)
 *   --batch       Envoyer par batch de N mesures (défaut: 1)
 */

import { argv } from 'node:process';
import { randomUUID } from 'node:crypto';

// --- Parse arguments ---
function parseArgs() {
  const args = {
    deviceKey: '',
    url: 'http://localhost:8081/api/public/sensors/ingest',
    interval: 5,
    count: 0,
    batch: 1,
  };
  
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--device-key':
        args.deviceKey = argv[++i];
        break;
      case '--url':
        args.url = argv[++i];
        break;
      case '--interval':
        args.interval = parseInt(argv[++i], 10);
        break;
      case '--count':
        args.count = parseInt(argv[++i], 10);
        break;
      case '--batch':
        args.batch = parseInt(argv[++i], 10);
        break;
      case '--help':
        console.log(`
Simulateur de capteur AgroField

Usage:
  node test-sensor-simulator.mjs --device-key YOUR_KEY [options]

Options:
  --device-key  Clé du capteur (obligatoire, 64 caractères hex)
  --url         URL d'ingestion (défaut: http://localhost:8081/api/public/sensors/ingest)
  --interval    Intervalle entre envois en secondes (défaut: 5)
  --count       Nombre d'envois (défaut: 0 = infini)
  --batch       Envoyer par batch de N mesures (défaut: 1)
  --help        Afficher cette aide

Exemples:
  # Test local avec une clé
  node test-sensor-simulator.mjs --device-key a1b2c3d4e5f6...

  # Production avec batch
  node test-sensor-simulator.mjs --device-key XXX --url https://agrofield.bf/api/public/sensors/ingest --batch 10 --interval 300

  # Test rapide 5 envois
  node test-sensor-simulator.mjs --device-key XXX --count 5 --interval 2
`);
        process.exit(0);
    }
  }
  
  if (!args.deviceKey) {
    console.error('❌ Erreur: --device-key est obligatoire');
    console.error('Utilisez --help pour voir l\'aide');
    process.exit(1);
  }
  
  return args;
}

// --- Générer des données réalistes ---
function generateReading(offsetMinutes = 0) {
  const now = new Date();
  now.setMinutes(now.getMinutes() - offsetMinutes);
  
  // Variation réaliste des mesures
  const baseMoisture = 35 + Math.random() * 20; // 35-55%
  const baseTemp = 25 + Math.random() * 10;     // 25-35°C
  const baseHumidity = 60 + Math.random() * 30; // 60-90%
  const basePh = 6.0 + Math.random() * 1.0;     // 6.0-7.0
  
  return {
    recorded_at: now.toISOString(),
    soil_moisture_pct: parseFloat(baseMoisture.toFixed(1)),
    temperature_c: parseFloat(baseTemp.toFixed(1)),
    humidity_pct: parseFloat(baseHumidity.toFixed(1)),
    ph: parseFloat(basePh.toFixed(2)),
    conductivity: parseFloat((1.0 + Math.random() * 0.5).toFixed(2)),
    battery_pct: parseFloat((80 + Math.random() * 20).toFixed(1)),
    light_lux: Math.floor(5000 + Math.random() * 50000),
  };
}

// --- Envoyer à l'API ---
async function sendReadings(deviceKey, url, readings) {
  const payload = {
    device_key: deviceKey,
    source: 'auto',
    firmware_version: 'sim-1.0.0',
    hardware_model: 'AgroNode-Simulator',
    readings: readings,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Succès: ${result.inserted || readings.length} mesure(s) envoyée(s)`);
      return true;
    } else {
      console.error(`❌ Erreur HTTP ${response.status}:`, result.error);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erreur réseau:`, err.message);
    return false;
  }
}

// --- Main loop ---
async function main() {
  const config = parseArgs();
  
  console.log('🌾 Simulateur de capteur AgroField');
  console.log('─────────────────────────────────────');
  console.log(`Device Key: ${config.deviceKey.slice(0, 8)}...`);
  console.log(`URL: ${config.url}`);
  console.log(`Intervalle: ${config.interval}s`);
  console.log(`Batch size: ${config.batch}`);
  console.log(`Max envois: ${config.count || '∞'}`);
  console.log('─────────────────────────────────────');
  console.log();
  
  let sentCount = 0;
  let batchAccumulator = [];
  
  while (true) {
    // Générer une lecture
    const reading = generateReading();
    batchAccumulator.push(reading);
    
    console.log(`📊 Mesure: Humidité=${reading.soil_moisture_pct}%, Temp=${reading.temperature_c}°C, Batt=${reading.battery_pct}%`);
    
    // Envoyer si batch plein ou intervalle atteint
    if (batchAccumulator.length >= config.batch) {
      const success = await sendReadings(config.deviceKey, config.url, batchAccumulator);
      
      if (success) {
        sentCount++;
        batchAccumulator = [];
      }
      
      // Vérifier si on arrête
      if (config.count > 0 && sentCount >= config.count) {
        console.log();
        console.log('✅ Terminé ! Total envoyé:', sentCount, 'batches');
        break;
      }
    }
    
    // Attendre prochain cycle
    if (config.interval > 0) {
      await new Promise(resolve => setTimeout(resolve, config.interval * 1000));
    }
  }
}

// Run
main().catch(err => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
