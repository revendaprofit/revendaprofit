import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sql = fs.readFileSync('supabase/migrations/20260415_phase35_consignment_bags.sql', 'utf-8');
  
  const { error } = await supabase.rpc('execute_sql', { query: sql });
  console.log("Migration result:", error || "Success");
}

runMigration();
