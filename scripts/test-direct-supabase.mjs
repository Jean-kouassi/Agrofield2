#!/usr/bin/env node

/**
 * Test d'injection directe dans Supabase (contourne l'API HTTP)
 * Utile pour tester sans avoir configuré les endpoints serveur
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charger .env depuis la racine du projet
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  Object.assign(process.env, envVars);
} catch (err) {
  // .env non trouvé, on continue avec les vars d'env
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const DEVICE_KEY = "a49da42f637d32a72ee12f096ea8db4db0a398d61ca8b60c";

console.log('🧪 Test injection directe Supabase');
console.log('==================================');
console.log('URL:', SUPABASE_URL);
console.log('Device Key:', DEVICE_KEY.slice(0, 16) + '...');
console.log();

async function main() {
  if (!SUPABASE_KEY || SUPABASE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('❌ Configurez vos variables Supabase :');
    console.error('   export SUPABASE_URL="https://xxx.supabase.co"');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Trouver le device
  console.log('1. Recherche du device...');
  const { data: device, error: deviceError } = await supabase
    .from('sensor_devices')
    .select('id, user_id, parcel_id, name')
    .eq('device_key', DEVICE_KEY)
    .maybeSingle();

  if (deviceError) {
    console.error('❌ Erreur:', deviceError.message);
    process.exit(1);
  }

  if (!device) {
    console.error('❌ Device non trouvé !');
    console.error('   Créez-le d\'abord dans le dashboard : http://localhost:8081/sensors');
    process.exit(1);
  }

  console.log(`   ✅ Device trouvé : "${device.name}" (ID: ${device.id.slice(0, 8)}...)`);
  console.log();

  // 2. Insérer une lecture
  console.log('2. Insertion d\'une mesure de test...');
  
  const reading = {
    user_id: device.user_id,
    device_id: device.id,
    parcel_id: device.parcel_id,
    soil_moisture_pct: 45.5 + Math.random() * 10,
    temperature_c: 28 + Math.random() * 5,
    humidity_pct: 70 + Math.random() * 20,
    ph: 6.0 + Math.random(),
    battery_pct: 80 + Math.random() * 20,
    recorded_at: new Date().toISOString(),
    source: 'test_script',
  };

  const { data: inserted, error: insertError } = await supabase
    .from('sensor_readings')
    .insert([reading])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erreur insertion:', insertError.message);
    process.exit(1);
  }

  console.log('   ✅ Mesure insérée avec succès !');
  console.log(`      ID: ${inserted.id.slice(0, 8)}...`);
  console.log(`      Humidité: ${inserted.soil_moisture_pct}%`);
  console.log(`      Temp: ${inserted.temperature_c}°C`);
  console.log(`      Heure: ${new Date(inserted.recorded_at).toLocaleString('fr-FR')}`);
  console.log();

  // 3. Mettre à jour last_seen_at
  console.log('3. Mise à jour last_seen_at...');
  await supabase
    .from('sensor_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', device.id);

  console.log('   ✅ Device mis à jour');
  console.log();

  console.log('🎉 TEST RÉUSSI !');
  console.log();
  console.log('Vérifiez dans le dashboard :');
  console.log('http://localhost:8081/sensors');
  console.log();
  console.log('Les mesures devraient apparaître dans :');
  console.log('- "Mes appareils" → dernière mesure');
  console.log('- "Historique récent"');
  console.log('- Graphiques (après plusieurs mesures)');
}

main().catch(err => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
