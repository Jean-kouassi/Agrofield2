import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Read migration SQL
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260730000001_create_marketplace_tables.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('📝 Applying marketplace migration...');

// Split by semicolons and execute each statement
const statements = sql.split(';').filter(s => s.trim().length > 0);

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i].trim();
  if (!statement || statement.startsWith('--')) continue;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
    if (error) {
      console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
    } else {
      console.log(`✅ Statement ${i + 1} executed`);
    }
  } catch (err) {
    console.log(`❌ Statement ${i + 1} failed: ${err.message}`);
  }
}

console.log('\n✨ Migration complete!');
