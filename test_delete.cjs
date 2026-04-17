const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vvvuqmhozcsnvwntjfcr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbnZ3bnRqZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU4NjgsImV4cCI6MjA5MTQyMTg2OH0.Y1TfVpBICxptqvtnK-9vT4UBgJKsh4zo8TCAtwcDPTc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: products } = await supabase.from('products').select('*').limit(2);
  console.log("Products:", products.length);
  if (products.length > 0) {
    const ids = products.map(p => p.id);
    const { error } = await supabase.from('products').delete().in('id', ids);
    console.log("Delete error:", error);
  }
}
run();
