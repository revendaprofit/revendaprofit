import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: cols } = await supabase.rpc('get_table_columns_info', { p_table_name: 'sales' }).catch(() => ({ data: null }));
  console.log("Cols:", cols);
  
  // Just try inserting a dummy sale to test constraint
  // We can't insert easily because of RLS if we're not logged in.
}

test();
