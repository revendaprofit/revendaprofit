import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createRpc() {
  const { error } = await supabase.rpc('execute_sql', { 
     query: `
        CREATE OR REPLACE FUNCTION mark_p2p_sale_rejected(p_sale_id UUID)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          UPDATE public.sales
          SET status = 'rejected_p2p'
          WHERE id = p_sale_id;
        END;
        $$;
     `
  });
  console.log("Creation Error:", error);
}

createRpc();
