import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './services/supabaseConfig';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, { db: { schema: supabaseConfig.schema || "public" } });

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE criancas ADD COLUMN responsaveis JSONB;' });
  console.log(error);
}
test();
