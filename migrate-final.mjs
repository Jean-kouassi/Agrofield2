// 🔄 Migration Script - marketplace-images
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtnduxtrnahhbgvlhqjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bmR1eHRybmFoaGJndmxocWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1NDA0NCwiZXhwIjoyMTAwMzMwMDQ0fQ.R6rlZjYAmT6bgdrVdVOhK5tP_6qUKqG_yk7-wKR6ZI4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('📦 Listing files in agrofield-media/marketplace/...\n');
  
  const { data: files, error } = await supabase.storage
    .from('agrofield-media')
    .list('marketplace', { limit: 100 });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${files?.length || 0} files\n`);

  if (!files || files.length === 0) {
    console.log('✅ Nothing to migrate');
    return;
  }

  let migrated = 0;
  for (const file of files) {
    try {
      // Download from old bucket
      const { data: blob } = await supabase.storage
        .from('agrofield-media')
        .download(`marketplace/${file.name}`);

      if (!blob) continue;

      // Upload to new bucket
      const { error: uploadErr } = await supabase.storage
        .from('marketplace-images')
        .upload(`offers/${file.name}`, blob, { upsert: true });

      if (uploadErr) {
        console.log(`❌ ${file.name}: ${uploadErr.message}`);
      } else {
        console.log(`✅ ${file.name}`);
        migrated++;
      }
    } catch (err) {
      console.log(`❌ ${file.name}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Migrated ${migrated}/${files.length} files`);
}

run().catch(console.error);
