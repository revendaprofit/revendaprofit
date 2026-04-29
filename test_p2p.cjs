const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vvvuqmhozcsnvwntjfcr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbnZ3bnRqZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU4NjgsImV4cCI6MjA5MTQyMTg2OH0.Y1TfVpBICxptqvtnK-9vT4UBgJKsh4zo8TCAtwcDPTc');

async function test() {
  const { data: users } = await supabase.from('profiles').select('id, email').in('email', ['isabellegalx1@gmail.com', 'teamwodbrasil@gmail.com']);
  console.log("Users:", users);

  if (!users || users.length < 2) return;
  const id1 = users[0].id;
  const id2 = users[1].id;

  const { data: parts } = await supabase.from('partnerships')
    .select('*')
    .or(`and(requester_id.eq.${id1},receiver_id.eq.${id2}),and(requester_id.eq.${id2},receiver_id.eq.${id1})`);
  console.log("Partnerships:", parts);

  if (parts && parts.length > 0) {
    const partId = parts[0].id;
    const { count: sharedCount } = await supabase.from('partnership_shared_products').select('*', { count: 'exact', head: true }).eq('partnership_id', partId);
    console.log("Total products shared in table:", sharedCount);
    
    // Check stock of shared products
    const { data: shared } = await supabase.from('partnership_shared_products').select('product_id').eq('partnership_id', partId);
    if (!shared) return;
    const pIds = shared.map(s => s.product_id);
    
    const { data: prods } = await supabase.from('products').select('id, total_stock, marketing_status').in('id', pIds);
    let outOfStock = 0;
    let inStock = 0;
    let archived = 0;
    prods.forEach(p => {
       if (p.total_stock <= 0) outOfStock++;
       else inStock++;
       if (p.marketing_status === 'archived') archived++;
    });
    console.log(`Of those shared: ${inStock} have stock > 0, ${outOfStock} have stock <= 0, ${archived} are archived.`);
  }
}
test();
