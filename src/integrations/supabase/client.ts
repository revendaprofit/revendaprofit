import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vvvuqmhozcsnvwntjfcr.supabase.co'

// For now, let's keep it empty or use process.env mapping in Vite
// We need the VITE_SUPABASE_ANON_KEY from the real auth. Let me provide a dummy key and tell user.

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL || 'fake-url',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'fake-key'
)
