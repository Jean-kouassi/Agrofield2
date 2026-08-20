// 🔄 Script de Migration des Images Marketplace (ES Module)
// Usage: node migrate-images.mjs
// Nécessite: SUPABASE_URL et SUPABASE_ANON_KEY dans .env ou variables d'env

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'https://vtnduxtrnahhbgvlhqjw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
  console.log('🚀 Starting marketplace images migration...\n');
  console.log(`   From: agrofield-media/marketplace/`);
  console.log(`   To:   marketplace-images/offers/\n`);

  // Étape 1: Lister tous les fichiers dans l'ancien bucket
  console.log('📦 Listing files in agrofield-media/marketplace/...');
  const { data: oldFiles, error: listError } = await supabase.storage
    .from('agrofield-media')
    .list('marketplace', { limit: 1000 });

  if (listError) {
    console.error('❌ Error listing files:', listError.message);
    return;
  }

  console.log(`   Found ${oldFiles?.length || 0} files\n`);

  if (!oldFiles || oldFiles.length === 0) {
    console.log('✅ No files to migrate');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Étape 2: Copier chaque fichier vers le nouveau bucket
  for (const file of oldFiles) {
    try {
      const oldPath = `marketplace/${file.name}`;
      const newPath = `offers/${file.name}`;

      console.log(`   📤 Copying: ${file.name}...`);

      // Télécharger depuis l'ancien bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('agrofield-media')
        .download(oldPath);

      if (downloadError) {
        console.error(`      ❌ Download failed: ${downloadError.message}`);
        errorCount++;
        continue;
      }

      // Uploader vers le nouveau bucket
      const { error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(newPath, fileData, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error(`      ❌ Upload failed: ${uploadError.message}`);
        errorCount++;
        continue;
      }

      console.log(`      ✅ Success`);
      successCount++;

    } catch (err) {
      console.error(`   ❌ Error processing ${file.name}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors:  ${errorCount}`);
  console.log(`   📁 Total:   ${oldFiles.length}`);
  console.log('='.repeat(50));

  if (errorCount === 0 && successCount > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n⚠️  Next step: Run SQL to update URLs in database');
  } else if (successCount === 0) {
    console.log('\n⚠️  No files were migrated.');
  } else {
    console.log('\n⚠️  Migration completed with errors. Check logs above.');
  }
}

migrateImages().catch(console.error);
