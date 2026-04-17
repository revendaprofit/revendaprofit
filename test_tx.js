import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(1)

  console.log(data ? Object.keys(data[0] || {}) : "No records")
  console.log("Error:", error)
}
check()
