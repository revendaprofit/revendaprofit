const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vvvuqmhozcsnvwntjfcr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbnZ3bnRqZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU4NjgsImV4cCI6MjA5MTQyMTg2OH0.Y1TfVpBICxptqvtnK-9vT4UBgJKsh4zo8TCAtwcDPTc'
);

async function main() {
  // Profiles are publicly readable, but don't have email
  // We need to find user IDs another way. Let's check store_settings which has owner_id
  // Or check the products table directly - it has owner_id and RLS for SELECT using auth.uid() = owner_id
  
  // Since profiles are public, let's get all profiles and match by known info
  const { data: allProfiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .order('created_at');

  if (profErr) {
    console.log('Error:', profErr.message);
    return;
  }
  
  console.log('All profiles:');
  allProfiles.forEach(p => console.log(`  ${p.id} | ${p.full_name || '-'} | ${p.username || '-'}`));

  // Also check store_settings (publicly readable)
  const { data: stores } = await supabase
    .from('store_settings')
    .select('owner_id, store_name, slug');

  console.log('\nAll stores:');
  (stores || []).forEach(s => console.log(`  ${s.owner_id} | ${s.store_name} | ${s.slug}`));

  // List top-level folders in product-images bucket to see user IDs
  const { data: folders } = await supabase.storage.from('product-images').list('', { limit: 100 });
  console.log('\nStorage folders (user IDs):');
  (folders || []).forEach(f => {
    if (f.name && !f.name.includes('.')) console.log(`  ${f.name}`);
  });
}

main().catch(console.error);
