// 🔄 Migration Script - v2 (avec sous-dossiers)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtnduxtrnahhbgvlhqjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bmR1eHRybmFoaGJndmxocWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1NDA0NCwiZXhwIjoyMTAwMzMwMDQ0fQ.R6rlZjYAmT6bgdrVdVOhK5tP_6qUKqG_yk7-wKR6ZI4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('📦 Step 1: Listing user folders in agrofield-media/marketplace/...\n');
  
  const { data: folders, error: listErr } = await supabase.storage
    .from('agrofield-media')
    .list('marketplace', { limit: 100 });

  if (listErr) {
    console.error('❌ List error:', listErr.message);
    return;
  }

  console.log(`Found ${folders?.length || 0} user folders`);
  if (!folders || folders.length === 0) {
    console.log('✅ Nothing to migrate');
    return;
  }

  let totalMigrated = 0;
  let totalErrors = 0;

  // Process each user folder
  for (const folder of folders) {
    console.log(`\n📂 Processing folder: ${folder.name}`);
    
    const { data: files, error: filesErr } = await supabase.storage
      .from('agrofield-media')
      .list(`marketplace/${folder.name}`, { limit: 100 });

    if (filesErr) {
      console.error(`   ❌ Cannot list files: ${filesErr.message}`);
      totalErrors++;
      continue;
    }

    console.log(`   Found ${files?.length || 0} files`);

    if (!files || files.length === 0) {
      continue;
    }

    // Migrate each file
    for (const file of files) {
      try {
        const oldPath = `marketplace/${folder.name}/${file.name}`;
        const newPath = `offers/${folder.name}/${file.name}`;

        // Download
        const { data: blob, error: dlErr } = await supabase.storage
          .from('agrofield-media')
          .download(oldPath);

        if (dlErr) {
          console.log(`   ❌ ${file.name}: ${dlErr.message}`);
          totalErrors++;
          continue;
        }

        // Upload
        const { error: upErr } = await supabase.storage
          .from('marketplace-images')
          .upload(newPath, blob, { cacheControl: '3600', upsert: true });

        if (upErr) {
          console.log(`   ❌ ${file.name}: ${upErr.message}`);
          totalErrors++;
        } else {
          console.log(`   ✅ ${file.name}`);
          totalMigrated++;
        }
      } catch (err) {
        console.log(`   ❌ ${file.name}: ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Migration complete!`);
  console.log(`   ✅ Success: ${totalMigrated}`);
  console.log(`   ❌ Errors:  ${totalErrors}`);
  console.log('='.repeat(50));
}

run().catch(console.error);
