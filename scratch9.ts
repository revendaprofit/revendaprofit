import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data } = await supabase.rpc('get_my_p2p_shared_products', { p_requester_id: 'ca633433-85f0-4821-8d3c-364dcceeb373' });
  console.log("P2P Products for Léo Berg:");
  console.log(data);
}

test();
