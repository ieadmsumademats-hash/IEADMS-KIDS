import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './services/supabaseConfig';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, { db: { schema: supabaseConfig.schema || "public" } });

async function test() {
  const { data, error } = await supabase.from('criancas').insert([{
    nome: 'Test', sobrenome: 'Test', data_nascimento: '2020-01-01',
    responsavel_nome: 'A'.repeat(500), whatsapp: 'B'.repeat(500)
  }]).select();
  console.log(error);
  if (data) {
    await supabase.from('criancas').delete().eq('id', data[0].id);
  }
}
test();
