// 🔄 Script de Migration des Images Marketplace (avec URL en dur)
// Usage: node migrate-images-direct.mjs

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://vtnduxtrnahhbgvlhqjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bmR1eHRybmFoYmJndmxocWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTEyMzQsImV4cCI6MjA2OTAyNzIzNH0.XqXf7vT9Qk8gJxHnKqPqKqJqKqJqKqJqKqJqKqJqKqI'; // Remplace par ta vraie clé anon

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImages() {
  console.log('🚀 Starting marketplace images migration...\n');
  console.log(`   From: agrofield-media/marketplace/`);
  console.log(`   To:   marketplace-images/offers/\n`);

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

  for (const file of oldFiles) {
    try {
      const oldPath = `marketplace/${file.name}`;
      const newPath = `offers/${file.name}`;

      console.log(`   📤 Copying: ${file.name}...`);

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('agrofield-media')
        .download(oldPath);

      if (downloadError) {
        console.error(`      ❌ Download failed: ${downloadError.message}`);
        errorCount++;
        continue;
      }

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
  }
}

migrateImages().catch(console.error);
