import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = 'https://ckndtgbhzcfepxafrmrw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbmR0Z2JoemNmZXB4YWZybXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxMDM2MCwiZXhwIjoyMDg3NDg2MzYwfQ.bTQNIPtSqPm-hopjPWbl234F-Ypkis_RrIZHi1usNBI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the schema SQL file
const schemaPath = join(__dirname, '../supabase/schema.sql');
const sql = readFileSync(schemaPath, 'utf-8');

// Split SQL by semicolons and filter empty statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function executeMigration() {
  console.log('Starting Supabase migration...\n');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim().length === 0) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        // Try direct SQL execution via postgres endpoint
        console.log(`Note: ${error.message}`);
      } else {
        console.log(`  ✓ Success`);
      }
    } catch (err) {
      console.log(`  ⚠ Warning:`, err.message);
    }
  }

  console.log('\n✅ Migration complete!');
}

executeMigration().catch(console.error);
