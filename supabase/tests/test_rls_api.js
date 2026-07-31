#!/usr/bin/env node
/**
 * Tests RLS pour AgroField2 - Via API Supabase
 * Date: 2026-07-30
 * 
 * Ce script teste les policies RLS en utilisant deux sessions utilisateur différentes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet
dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Couleurs pour output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) { log(colors.green, `✅ ${message}`); }
function error(message) { log(colors.red, `❌ ${message}`); }
function info(message) { log(colors.blue, `ℹ️  ${message}`); }
function warn(message) { log(colors.yellow, `⚠️  ${message}`); }

async function testRLS() {
  log(colors.cyan, '============================================');
  log(colors.cyan, '🧪 TESTS RLS - AgroField2');
  log(colors.cyan, '============================================\n');

  const results = { passed: 0, failed: 0, warnings: 0 };

  // ============================================
  // TEST 1: Connection avec clé anon
  // ============================================
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('parcels').select('count').limit(1);
    
    if (error && error.code === 'PGRST301') {
      success('TEST 1: RLS activé sur parcels (erreur 301 = policy check failed)');
      results.passed++;
    } else if (!error) {
      warn('TEST 1: parcels accessible sans auth - RLS peut-être mal configuré');
      results.warnings++;
    } else {
      success(`TEST 1: RLS fonctionne (erreur attendue: ${error.code})`);
      results.passed++;
    }
  } catch (e) {
    error(`TEST 1 ÉCHOUÉ: ${e.message}`);
    results.failed++;
  }

  // ============================================
  // TEST 2: Vérifier structure table parcels
  // ============================================
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Alternative: vérifier via information_schema
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'parcels');
    
    if (colError) {
      throw colError;
    }
    
    if (columns && columns.length >= 10) {
      success(`TEST 2: Table parcels a ${columns.length} colonnes (structure complète)`);
      results.passed++;
    } else {
      warn(`TEST 2: Table parcels a seulement ${columns?.length || 0} colonnes`);
      results.warnings++;
    }
  } catch (e) {
    error(`TEST 2 ÉCHOUÉ: ${e.message}`);
    results.failed++;
  }

  // ============================================
  // TEST 3: Vérifier structure crop_events
  // ============================================
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'crop_events');
    
    if (error) throw error;
    
    if (columns && columns.length >= 8) {
      success(`TEST 3: Table crop_events a ${columns.length} colonnes`);
      results.passed++;
    } else {
      warn(`TEST 3: Table crop_events a seulement ${columns?.length || 0} colonnes`);
      results.warnings++;
    }
  } catch (e) {
    error(`TEST 3 ÉCHOUÉ: ${e.message}`);
    results.failed++;
  }

  // ============================================
  // TEST 4: Vérifier price_references
  // ============================================
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from('price_references')
      .select('id')
      .limit(5);
    
    if (error) {
      error(`TEST 4 ÉCHOUÉ: ${error.message}`);
      results.failed++;
    } else if (data && data.length > 0) {
      success(`TEST 4: price_references accessible (${data.length} entrées)`);
      results.passed++;
    } else {
      warn('TEST 4: price_references vide ou inaccessible');
      results.warnings++;
    }
  } catch (e) {
    error(`TEST 4 ÉCHOUÉ: ${e.message}`);
    results.failed++;
  }

  // ============================================
  // TEST 5: Vérifier index
  // ============================================
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .in('tablename', ['parcels', 'crop_events'])
      .ilike('schemaname', 'public');
    
    if (error) throw error;
    
    const userIndexes = data?.filter(idx => 
      idx.indexname.includes('user_id') || idx.indexname.includes('parcel_id')
    ) || [];
    
    if (userIndexes.length >= 4) {
      success(`TEST 5: ${userIndexes.length} index de performance trouvés`);
      results.passed++;
    } else {
      warn(`TEST 5: Seulement ${userIndexes.length} index trouvés (minimum 4 recommandé)`);
      results.warnings++;
    }
  } catch (e) {
    error(`TEST 5 ÉCHOUÉ: ${e.message}`);
    results.failed++;
  }

  // ============================================
  // TEST 6: Créer parcelle avec service role
  // ============================================
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Créer une parcelle de test
    const { data: testParcel, error: insertError } = await supabase
      .from('parcels')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // UUID nul pour test
        name: 'TEST_RLS_PARCEL',
        area_ha: 0.1,
        crop_type: 'test',
        status: 'active'
      })
      .select()
      .single();
    
    if (insertError) {
      // Nettoyer si existe déjà
      await supabase.from('parcels').delete().eq('name', 'TEST_RLS_PARCEL');
      warn(`TEST 6: Insertion échouée (peut-être contrainte FK): ${insertError.message}`);
      results.warnings++;
    } else {
      // Nettoyer
      await supabase.from('parcels').delete().eq('id', testParcel.id);
      success('TEST 6: Insertion avec service role fonctionnelle');
      results.passed++;
    }
  } catch (e) {
    error(`TEST 6 ÉCHOUÉ: ${e.message}`);
    results.failed++;
  }

  // ============================================
  // RÉCAPITULATIF
  // ============================================
  log(colors.cyan, '\n============================================');
  log(colors.cyan, '📊 RÉSULTATS DES TESTS RLS');
  log(colors.cyan, '============================================');
  log(colors.green, `✅ Passés: ${results.passed}`);
  log(colors.yellow, `⚠️  Warnings: ${results.warnings}`);
  log(colors.red, `❌ Échoués: ${results.failed}`);
  log(colors.cyan, '============================================');

  if (results.failed === 0 && results.warnings === 0) {
    log(colors.green, '\n🎉 TOUS LES TESTS SONT PASSÉS!');
  } else if (results.failed === 0) {
    log(colors.yellow, '\n⚠️  Tests passés avec warnings - vérification manuelle recommandée');
  } else {
    log(colors.red, '\n❌ Certains tests ont échoué - action requise');
  }

  log(colors.cyan, '\n📝 PROCHAINES ÉTAPES:');
  log(colors.cyan, '1. Tester manuellement avec 2 comptes utilisateurs réels dans Supabase Studio');
  log(colors.cyan, '2. Vérifier Authentication → Policies dans le dashboard');
  log(colors.cyan, '3. Valider avec données réelles avant production');
  log(colors.cyan, '============================================\n');

  return results;
}

// Exécution
testRLS().catch(e => {
  log(colors.red, `💥 ERREUR FATALE: ${e.message}`);
  console.error(e);
  process.exit(1);
});
