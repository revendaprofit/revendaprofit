import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY'

// We will read env from .env file
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const bag_id = 'fd5fc1ae-182b-4a97-b39d-dccf9e73ef55'; //from screenshot
  const { data, error } = await supabase
    .from('consignment_bags')
    .select(`
      *,
      owner:profiles!owner_id(name, store_name, logo_url),
      items:consignment_bag_items(
        id, quantity, customer_decision,
        product:products(name, sale_price, image_url)
      )
    `)
    .eq('id', bag_id)
    .single()

  console.log("DATA:", JSON.stringify(data, null, 2))
  console.log("ERROR:", error)
}
test()
