#!/usr/bin/env node
/**
 * Script de création du bucket storage agrofield-media
 * Utilise l'API Supabase avec la service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lire les variables d'environnement depuis .env
const envPath = join(__dirname, '..', '.env');
let supabaseUrl, supabaseServiceKey;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('Erreur lors de la lecture de .env.local:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes dans .env:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Création du bucket agrofield-media...');
console.log(`   URL: ${supabaseUrl}`);

// Créer le client Supabase avec la service role key (admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    // 1. Créer le bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('agrofield-media', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Le bucket existe déjà');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Bucket créé avec succès');
    }

    // 2. Configurer les policies RLS
    console.log('\n📋 Configuration des policies RLS...');
    
    const policies = [
      {
        name: 'Users can view their own media',
        type: 'SELECT',
        sql: `bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text`
      },
      {
        name: 'Users can upload their own media',
        type: 'INSERT',
        sql: `bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text`
      },
      {
        name: 'Users can delete their own media',
        type: 'DELETE',
        sql: `bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text`
      },
      {
        name: 'Users can update their own media',
        type: 'UPDATE',
        sql: `bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text`
      }
    ];

    for (const policy of policies) {
      console.log(`   → Policy: ${policy.name}`);
      
      // Note: L'API JS ne permet pas de créer des policies directement
      // Il faut passer par le Dashboard Supabase ou SQL Editor
      console.log(`      ⚠️  À créer manuellement dans le Dashboard Supabase`);
    }

    console.log('\n✅ Configuration terminée !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Aller dans Supabase Dashboard → Storage');
    console.log('   2. Vérifier que le bucket "agrofield-media" existe');
    console.log('   3. Ajouter les policies RLS dans SQL Editor (voir ci-dessous)');
    
    console.log('\n--- SQL à exécuter dans Dashboard ---');
    console.log(`
-- Policies RLS pour agrofield-media
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agrofield-media' AND (storage.foldername(name))[1] = auth.uid()::text);
`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createBucket();
