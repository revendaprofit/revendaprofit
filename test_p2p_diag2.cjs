const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vvvuqmhozcsnvwntjfcr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnVxbWhvemNzbnZ3bnRqZmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU4NjgsImV4cCI6MjA5MTQyMTg2OH0.Y1TfVpBICxptqvtnK-9vT4UBgJKsh4zo8TCAtwcDPTc');

async function test() {
  const { data: parts } = await supabase.from('partnerships').select('id, requester_id, receiver_id, status');
  if (parts.length === 0) return console.log("No partnerships in db at all");
  
  const ids = new Set();
  parts.forEach(p => { ids.add(p.requester_id); ids.add(p.receiver_id); });
  
  const { data: users } = await supabase.from('profiles').select('id, email').in('id', Array.from(ids));
  
  parts.forEach(p => {
     const req = users.find(u => u.id === p.requester_id)?.email;
     const rec = users.find(u => u.id === p.receiver_id)?.email;
     console.log(`${req} <-> ${rec} | status: ${p.status} | id: ${p.id}`);
  });
}
test();
