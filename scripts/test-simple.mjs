#!/usr/bin/env node

/**
 * Test simple d'injection Supabase - SANS dépendances
 * Usage: 
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_KEY="***"
 *   node scripts/test-simple.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// REMPLACEZ CECI PAR VOTRE VRAIE CLÉ DE CAPTEUR
const DEVICE_KEY = "a49da42f637d32a72ee12f096ea8db4db0a398d61ca8b60c";

console.log('🧪 Test Capteur AgroField');
console.log('==========================\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables manquantes !');
  console.error('');
  console.error('Exécutez d\'abord :');
  console.error('$env:SUPABASE_URL="https://votre-projet.supabase.co"');
  console.error('$env:SUPABASE_KEY="eyJhbG..."');
  console.error('');
  console.error('Où trouver : https://supabase.com/dashboard → Settings → API');
  process.exit(1);
}

console.log('✓ SUPABASE_URL:', SUPABASE_URL);
console.log('✓ DEVICE_KEY:', DEVICE_KEY.slice(0, 16) + '...\n');

async function test() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Trouver le device
  console.log('1. Recherche du capteur...');
  const { data: device, error } = await supabase
    .from('sensor_devices')
    .select('id, user_id, parcel_id, name')
    .eq('device_key', DEVICE_KEY)
    .maybeSingle();

  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  if (!device) {
    console.error('❌ Capteur non trouvé !');
    console.error('');
    console.error('Allez sur http://localhost:8081/sensors');
    console.error('Créez un appareil et copiez sa clé.');
    process.exit(1);
  }

  console.log(`✓ Capteur trouvé: "${device.name}"\n`);

  // 2. Insérer une mesure
  console.log('2. Envoi d\'une mesure de test...');
  
  const reading = {
    user_id: device.user_id,
    device_id: device.id,
    parcel_id: device.parcel_id,
    soil_moisture_pct: parseFloat((35 + Math.random() * 20).toFixed(1)),
    temperature_c: parseFloat((25 + Math.random() * 10).toFixed(1)),
    humidity_pct: parseFloat((60 + Math.random() * 30).toFixed(1)),
    ph: parseFloat((6 + Math.random()).toFixed(2)),
    battery_pct: parseFloat((80 + Math.random() * 20).toFixed(1)),
    recorded_at: new Date().toISOString(),
    source: 'test_script',
  };

  const { data: inserted, error: insError } = await supabase
    .from('sensor_readings')
    .insert([reading])
    .select()
    .single();

  if (insError) {
    console.error('❌ Échec insertion:', insError.message);
    process.exit(1);
  }

  console.log('✓ Mesure envoyée avec succès !');
  console.log(`  - Humidité sol: ${inserted.soil_moisture_pct}%`);
  console.log(`  - Température: ${inserted.temperature_c}°C`);
  console.log(`  - Humidité air: ${inserted.humidity_pct}%`);
  console.log(`  - pH: ${inserted.ph}`);
  console.log(`  - Batterie: ${inserted.battery_pct}%\n`);

  // 3. Mettre à jour last_seen
  await supabase
    .from('sensor_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', device.id);

  console.log('✅ TEST RÉUSSI !\n');
  console.log('Vérifiez le résultat sur :');
  console.log('http://localhost:8081/sensors\n');
  console.log('Le capteur devrait afficher "En ligne" avec les nouvelles mesures.');
}

test().catch(err => {
  console.error('💥 Erreur:', err.message);
  process.exit(1);
});
