const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vvvuqmhozcsnvwntjfcr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbnZ3bnRqZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU4NjgsImV4cCI6MjA5MTQyMTg2OH0.Y1TfVpBICxptqvtnK-9vT4UBgJKsh4zo8TCAtwcDPTc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
}
test();
