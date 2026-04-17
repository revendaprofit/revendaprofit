import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: stores } = await supabase.from('store_settings').select('store_name, owner_id');
  if (!stores?.length) return;
  const ownerId = stores[stores.length - 1].owner_id; // Leo Berg

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_p2p_shared_products', { p_tenant_id: ownerId });
  console.log("leo berg RPC Data:", JSON.stringify(rpcData, null, 2));

  // Simulating POS.tsx filter
  const products = rpcData.map((p: any) => ({
                id: p.id,
                name: `🤝 ${p.name}`,
                variants: p.variants
  }));

  const search = 'shorts';
  const filteredProducts = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  console.log("Filtered Products in POS:", filteredProducts);
}

test();
