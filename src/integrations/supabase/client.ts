import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vvvuqmhozcsnvwntjfcr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbndudGpmY3IiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTg5Mjg1OCwiZXhwIjoxOTMxMjUyODU4fQ.not_real_key_wait_i_should_use_env'

// For now, let's keep it empty or use process.env mapping in Vite
// We need the VITE_SUPABASE_ANON_KEY from the real auth. Let me provide a dummy key and tell user.

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'fake-key'
)
