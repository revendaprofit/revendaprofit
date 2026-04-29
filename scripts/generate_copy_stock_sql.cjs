const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const SRC = '8e14d996-dae6-4ed6-9253-e853edbf45e6'; // Team WOD Brasil
const DST = 'd6a4d4e9-09a8-46f0-ba46-5168dcd8ef84'; // NaBell's

function esc(str) {
  if (str === null || str === undefined) return null;
  return String(str).replace(/'/g, "''");
}

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + esc(val) + "'";
}

async function run() {
  console.log('Fetching products...');
  const { data: prods, error: pe } = await supabase.from('products').select('*').eq('owner_id', SRC);
  if (pe) { console.error('Error fetching products:', pe.message); return; }

  console.log('Fetching variants...');
  const { data: vars, error: ve } = await supabase.from('product_variants').select('*').eq('owner_id', SRC);
  if (ve) { console.error('Error fetching variants:', ve.message); return; }

  console.log(`Found ${prods.length} products and ${vars.length} variants.`);

  // Get unique references
  const catIds = [...new Set(prods.map(p => p.category_id).filter(Boolean))];
  const subIds = [...new Set(prods.map(p => p.subcategory_id).filter(Boolean))];

  // Fetch subcategory data to know parent category
  const subcatParents = {};
  if (subIds.length > 0) {
    const { data: srcSubs } = await supabase.from('subcategories').select('id, category_id').in('id', subIds);
    if (srcSubs) {
      srcSubs.forEach(s => { subcatParents[s.id] = s.category_id; });
    }
  }

  // Build SQL
  const lines = [];
  lines.push('-- ============================================');
  lines.push("-- COPIA DE ESTOQUE: Team WOD Brasil -> NaBell's");
  lines.push('-- Source owner_id: ' + SRC);
  lines.push('-- Dest owner_id: ' + DST);
  lines.push('-- Gerado em: ' + new Date().toISOString());
  lines.push('-- ============================================');
  lines.push('');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push("  dest_owner uuid := '" + DST + "'::uuid;");

  // Category variables
  const catVarMap = {};
  catIds.forEach((id, i) => {
    const varName = 'new_cat_' + i;
    catVarMap[id] = varName;
    lines.push('  ' + varName + ' uuid;');
  });

  // Subcategory variables
  const subcatVarMap = {};
  subIds.forEach((id, i) => {
    const varName = 'new_subcat_' + i;
    subcatVarMap[id] = varName;
    lines.push('  ' + varName + ' uuid;');
  });

  // Product variables
  prods.forEach((p, i) => {
    lines.push('  new_prod_' + i + ' uuid;');
  });

  lines.push('BEGIN');
  lines.push('');

  // Step 1: Copy categories
  lines.push('  -- STEP 1: Copiar Categorias');
  catIds.forEach((id, i) => {
    lines.push("  INSERT INTO public.categories (owner_id, name) SELECT dest_owner, name FROM public.categories WHERE id = '" + id + "' RETURNING id INTO " + catVarMap[id] + ';');
  });
  lines.push('');

  // Step 2: Copy subcategories
  lines.push('  -- STEP 2: Copiar Subcategorias');
  subIds.forEach((id, i) => {
    const parentCatId = subcatParents[id];
    const parentCatVar = parentCatId ? catVarMap[parentCatId] : null;
    if (parentCatVar) {
      lines.push("  INSERT INTO public.subcategories (owner_id, category_id, name) SELECT dest_owner, " + parentCatVar + ", name FROM public.subcategories WHERE id = '" + id + "' RETURNING id INTO " + subcatVarMap[id] + ';');
    }
  });
  lines.push('');

  // Step 3: Copy products
  lines.push('  -- STEP 3: Copiar Produtos (' + prods.length + ' total)');
  prods.forEach((p, i) => {
    const catRef = p.category_id && catVarMap[p.category_id] ? catVarMap[p.category_id] : 'NULL';
    const subcatRef = p.subcategory_id && subcatVarMap[p.subcategory_id] ? subcatVarMap[p.subcategory_id] : 'NULL';

    lines.push('  INSERT INTO public.products (owner_id, name, cost_price, sale_price, image_url, image_url_2, image_url_3, video_url, category_id, subcategory_id, supplier_id, marketing_status, total_stock, description, subcategory, min_stock, filter_model, filter_color, filter_detail, ncm, cest, ean, origin_code, is_new_arrival) VALUES (' +
      'dest_owner, ' +
      sqlStr(p.name) + ', ' +
      (p.cost_price || 0) + ', ' +
      (p.sale_price || 0) + ', ' +
      sqlStr(p.image_url) + ', ' +
      sqlStr(p.image_url_2) + ', ' +
      sqlStr(p.image_url_3) + ', ' +
      sqlStr(p.video_url) + ', ' +
      catRef + ', ' +
      subcatRef + ', ' +
      'NULL, ' +
      sqlStr(p.marketing_status || 'active') + ', ' +
      (p.total_stock || 0) + ', ' +
      sqlStr(p.description) + ', ' +
      sqlStr(p.subcategory) + ', ' +
      (p.min_stock || 0) + ', ' +
      sqlStr(p.filter_model) + ', ' +
      sqlStr(p.filter_color) + ', ' +
      sqlStr(p.filter_detail) + ', ' +
      sqlStr(p.ncm) + ', ' +
      sqlStr(p.cest) + ', ' +
      sqlStr(p.ean) + ', ' +
      sqlStr(p.origin_code || '0') + ', ' +
      (p.is_new_arrival ? 'true' : 'false') +
      ') RETURNING id INTO new_prod_' + i + ';');
  });
  lines.push('');

  // Step 4: Copy variants
  lines.push('  -- STEP 4: Copiar Variantes (' + vars.length + ' total)');
  vars.forEach(v => {
    const prodIdx = prods.findIndex(p => p.id === v.product_id);
    if (prodIdx === -1) return;

    lines.push('  INSERT INTO public.product_variants (product_id, owner_id, size, color, sku, stock) VALUES (' +
      'new_prod_' + prodIdx + ', ' +
      'dest_owner, ' +
      sqlStr(v.size) + ', ' +
      sqlStr(v.color) + ', ' +
      sqlStr(v.sku) + ', ' +
      (v.stock || 0) +
      ');');
  });
  lines.push('');

  lines.push("  RAISE NOTICE 'Copia concluida! " + prods.length + " produtos e " + vars.length + " variantes copiados para NaBells.';");
  lines.push('END $$;');

  const sqlContent = lines.join('\n');
  const outPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260424_phase45_copy_stock_nabells.sql');
  fs.writeFileSync(outPath, sqlContent, 'utf8');
  console.log('SQL written to:', outPath);
  console.log('Lines:', lines.length);
}

run().catch(console.error);
