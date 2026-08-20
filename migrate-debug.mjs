// 🔄 Migration Script - DEBUG
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtnduxtrnahhbgvlhqjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bmR1eHRybmFoaGJndmxocWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1NDA0NCwiZXhwIjoyMTAwMzMwMDQ0fQ.R6rlZjYAmT6bgdrVdVOhK5tP_6qUKqG_yk7-wKR6ZI4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('📦 Step 1: List files in agrofield-media/marketplace/...\n');
  
  const { data: files, error: listErr } = await supabase.storage
    .from('agrofield-media')
    .list('marketplace', { limit: 100 });

  if (listErr) {
    console.error('❌ List error:', listErr.message);
    return;
  }

  console.log(`Found ${files?.length || 0} files`);
  if (files && files.length > 0) {
    console.log('Files:', files.map(f => f.name));
  }
  console.log('');

  if (!files || files.length === 0) {
    console.log('✅ Nothing to migrate');
    return;
  }

  const file = files[0];
  console.log(`📥 Step 2: Downloading ${file.name}...`);
  
  const { data: blob, error: downloadErr } = await supabase.storage
    .from('agrofield-media')
    .download(`marketplace/${file.name}`);

  if (downloadErr) {
    console.error('❌ Download error:', downloadErr.message);
    console.log('Trying without marketplace/ prefix...');
    
    const retry = await supabase.storage
      .from('agrofield-media')
      .download(file.name);
    
    if (retry.error) {
      console.error('❌ Still failed:', retry.error.message);
      return;
    }
    console.log('✅ Downloaded (no prefix)');
  } else {
    console.log('✅ Downloaded successfully');
  }

  console.log(`\n📤 Step 3: Uploading to marketplace-images/offers/${file.name}...`);
  
  const { error: uploadErr } = await supabase.storage
    .from('marketplace-images')
    .upload(`offers/${file.name}`, blob, { 
      cacheControl: '3600',
      upsert: true 
    });

  if (uploadErr) {
    console.error('❌ Upload error:', uploadErr.message);
    console.error('Details:', JSON.stringify(uploadErr, null, 2));
  } else {
    console.log('✅ Upload successful!');
  }

  console.log('\n📊 Checking if file exists in new bucket...');
  const { data: checkList } = await supabase.storage
    .from('marketplace-images')
    .list('offers', { limit: 10 });
  
  if (checkList && checkList.length > 0) {
    console.log('Files in marketplace-images/offers/:', checkList.map(f => f.name));
  } else {
    console.log('Bucket is empty or does not exist');
  }
}

run().catch(console.error);
