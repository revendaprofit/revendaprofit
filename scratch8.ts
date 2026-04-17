import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const user_id = 'ec0ed930-ea01-447a-bd9b-cce77d206fde'; // I need the actual user ID of leo berg
  // wait, I don't know the user id.
  const { data: users } = await supabase.from('profiles').select('*').limit(5);
  console.log("Users:", users);
  
  // Let's just query get_my_p2p_shared_products
}

test();
