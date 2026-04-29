const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vvvuqmhozcsnvwntjfcr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbnZ3bnRqZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU4NjgsImV4cCI6MjA5MTQyMTg2OH0.Y1TfVpBICxptqvtnK-9vT4UBgJKsh4zo8TCAtwcDPTc');

async function test() {
  const { data: users } = await supabase.from('profiles').select('id, email').in('email', ['isabellegalx1@gmail.com', 'teamwodbrasil@gmail.com']);
  if (!users || users.length < 2) return console.log("Missing users");
  
  let idIso = users.find(u => u.email === 'isabellegalx1@gmail.com').id;
  let idWod = users.find(u => u.email === 'teamwodbrasil@gmail.com').id;

  // Check partnership
  const { data: parts } = await supabase.from('partnerships')
    .select('*')
    .or(`requester_id.eq.${idIso},receiver_id.eq.${idIso}`);
    
  const thePart = parts.find(p => p.requester_id === idWod || p.receiver_id === idWod);
  if (!thePart) return console.log("No partnership found");

  console.log("Partnership ID:", thePart.id);

  // Check shared products owned by Iso
  const { data: shared } = await supabase.from('partnership_shared_products')
    .select('product_id')
    .eq('partnership_id', thePart.id)
    .eq('owner_id', idIso);
    
  console.log("Products shared by Iso:", shared.length);

  if (shared.length > 0) {
    const pIds = shared.map(s => s.product_id);
    const { data: prods } = await supabase.from('products').select('id, name, total_stock, marketing_status').in('id', pIds);
    
    // Check variants
    const { data: vars } = await supabase.from('product_variants').select('id, product_id, stock').in('product_id', pIds);
    
    let hasStockProds = 0;
    let missingVariants = 0;
    
    prods.forEach(p => {
       const pVars = vars.filter(v => v.product_id === p.id);
       const varStock = pVars.reduce((sum, v) => sum + (v.stock || 0), 0);
       
       if (varStock > 0) hasStockProds++;
       else if (p.total_stock > 0) {
          missingVariants++;
          console.log(`Product ${p.name} has total_stock=${p.total_stock} but sum of variant stock=${varStock}`);
       }
    });
    
    console.log(`Total prods: ${prods.length}. With variant stock > 0: ${hasStockProds}. Prods with fake total_stock: ${missingVariants}`);
  }
}
test();
