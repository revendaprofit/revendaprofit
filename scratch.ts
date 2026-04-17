import { createClient } from '@supabase/supabase-js';

// Get these from .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: stores } = await supabase.from('store_settings').select('store_name, owner_id');

  if (stores && stores.length > 0) {
    for (const store of stores) {
       const { data: rpc1, error } = await supabase.rpc('get_my_p2p_shared_products', { p_tenant_id: store.owner_id });
       console.log("RPC result for", store.store_name, ":", rpc1?.length || 0, "items.", error?.message || '');
       if (rpc1?.length > 0) {
           console.log(rpc1);
       }
    }
  }
}

test();
