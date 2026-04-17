import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: shared } = await supabase.from('partnership_shared_products').select('*');
  console.log("Shared products:", shared?.length || 0);
  if (shared?.length) console.log(shared);

  const { data: partnerships } = await supabase.from('partnerships').select('*');
  console.log("Partnerships:", partnerships?.length || 0);
  if (partnerships?.length) console.log(partnerships);
}

test();
