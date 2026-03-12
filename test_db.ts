import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './services/supabaseConfig';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, { db: { schema: supabaseConfig.schema || "public" } });

async function test() {
  const { data, error } = await supabase.from('criancas').select('*').limit(1);
  console.log(JSON.stringify(data, null, 2));
  console.log(error);
}
test();
