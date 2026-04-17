import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: stores } = await supabase.from('store_settings').select('store_name, owner_id');
  if (!stores?.length) return;
  const ownerId = stores[0].owner_id; // Revenda Profit

  const { data: products } = await supabase.from('products').select('id, name, total_stock').eq('owner_id', ownerId).ilike('name', '%Shorts Empina%').limit(5);
  console.log("Products:", products);

  if (products && products.length > 0) {
      const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', products[0].id);
      console.log("Variants:", variants);
  }
}

test();
