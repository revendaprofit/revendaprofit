import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('ADMIN_SERVICE_ROLE_KEY') ?? '';

    // 1. Validar usuário autenticado (deve ser superadmin)
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { source_owner_id, dest_owner_id } = await req.json();

    if (!source_owner_id || !dest_owner_id) {
      return new Response(
        JSON.stringify({ success: false, error: "source_owner_id e dest_owner_id são obrigatórios." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ADMIN_SERVICE_ROLE_KEY não configurada!" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Cliente admin (bypassa RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 3. Buscar todos os produtos da origem
    const { data: sourceProducts, error: prodError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('owner_id', source_owner_id);

    if (prodError) {
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao buscar produtos: " + prodError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!sourceProducts || sourceProducts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum produto encontrado na origem." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 4. Buscar todas as variantes da origem
    const { data: sourceVariants, error: varError } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('owner_id', source_owner_id);

    if (varError) {
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao buscar variantes: " + varError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 5. Copiar categorias que pertencem a outra conta (criar duplicatas para o destino)
    const uniqueCatIds = [...new Set(sourceProducts.map(p => p.category_id).filter(Boolean))];
    const uniqueSubcatIds = [...new Set(sourceProducts.map(p => p.subcategory_id).filter(Boolean))];
    const uniqueSupplierIds = [...new Set(sourceProducts.map(p => p.supplier_id).filter(Boolean))];

    // Map: old_id -> new_id
    const catMap: Record<string, string> = {};
    const subcatMap: Record<string, string> = {};
    const supplierMap: Record<string, string> = {};

    // 5a. Copiar categorias
    if (uniqueCatIds.length > 0) {
      const { data: srcCats } = await supabaseAdmin.from('categories').select('*').in('id', uniqueCatIds);
      if (srcCats && srcCats.length > 0) {
        for (const cat of srcCats) {
          const { data: newCat, error: ncErr } = await supabaseAdmin.from('categories').insert({
            owner_id: dest_owner_id,
            name: cat.name,
          }).select('id').single();
          if (newCat) {
            catMap[cat.id] = newCat.id;
          }
        }
      }
    }

    // 5b. Copiar subcategorias
    if (uniqueSubcatIds.length > 0) {
      const { data: srcSubs } = await supabaseAdmin.from('subcategories').select('*').in('id', uniqueSubcatIds);
      if (srcSubs && srcSubs.length > 0) {
        for (const sub of srcSubs) {
          const newCatId = catMap[sub.category_id] || sub.category_id;
          const { data: newSub } = await supabaseAdmin.from('subcategories').insert({
            owner_id: dest_owner_id,
            category_id: newCatId,
            name: sub.name,
          }).select('id').single();
          if (newSub) {
            subcatMap[sub.id] = newSub.id;
          }
        }
      }
    }

    // 5c. Copiar fornecedores
    if (uniqueSupplierIds.length > 0) {
      const { data: srcSupps } = await supabaseAdmin.from('suppliers').select('*').in('id', uniqueSupplierIds);
      if (srcSupps && srcSupps.length > 0) {
        for (const sup of srcSupps) {
          const { data: newSup } = await supabaseAdmin.from('suppliers').insert({
            owner_id: dest_owner_id,
            name: sup.name,
            contact_info: sup.contact_info,
          }).select('id').single();
          if (newSup) {
            supplierMap[sup.id] = newSup.id;
          }
        }
      }
    }

    // 6. Inserir produtos com novo owner_id e mapeamento de IDs
    const productIdMap: Record<string, string> = {}; // old_product_id -> new_product_id
    let productsInserted = 0;
    let variantsInserted = 0;

    // Insert products in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < sourceProducts.length; i += BATCH_SIZE) {
      const batch = sourceProducts.slice(i, i + BATCH_SIZE);
      const newProducts = batch.map(p => ({
        owner_id: dest_owner_id,
        name: p.name,
        cost_price: p.cost_price,
        sale_price: p.sale_price,
        image_url: p.image_url,
        image_url_2: p.image_url_2,
        image_url_3: p.image_url_3,
        video_url: p.video_url,
        category_id: catMap[p.category_id] || null,
        subcategory_id: subcatMap[p.subcategory_id] || null,
        supplier_id: supplierMap[p.supplier_id] || null,
        marketing_status: p.marketing_status,
        total_stock: p.total_stock,
        description: p.description,
        subcategory: p.subcategory,
        min_stock: p.min_stock,
        filter_model: p.filter_model,
        filter_color: p.filter_color,
        filter_detail: p.filter_detail,
        ncm: p.ncm,
        cest: p.cest,
        ean: p.ean,
        origin_code: p.origin_code,
        is_new_arrival: p.is_new_arrival,
      }));

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('products')
        .insert(newProducts)
        .select('id');

      if (insertErr) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Erro ao inserir produtos (batch " + Math.floor(i/BATCH_SIZE) + "): " + insertErr.message,
            productsInserted,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Map old IDs to new IDs (same order)
      if (inserted) {
        for (let j = 0; j < batch.length; j++) {
          productIdMap[batch[j].id] = inserted[j].id;
        }
        productsInserted += inserted.length;
      }
    }

    // 7. Inserir variantes com novo owner_id e novo product_id
    if (sourceVariants && sourceVariants.length > 0) {
      for (let i = 0; i < sourceVariants.length; i += BATCH_SIZE) {
        const batch = sourceVariants.slice(i, i + BATCH_SIZE);
        const newVariants = batch
          .filter(v => productIdMap[v.product_id]) // só insere se o produto foi copiado
          .map(v => ({
            product_id: productIdMap[v.product_id],
            owner_id: dest_owner_id,
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          }));

        if (newVariants.length > 0) {
          const { data: insertedVars, error: varInsertErr } = await supabaseAdmin
            .from('product_variants')
            .insert(newVariants)
            .select('id');

          if (varInsertErr) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Erro ao inserir variantes (batch " + Math.floor(i/BATCH_SIZE) + "): " + varInsertErr.message,
                productsInserted,
                variantsInserted,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          if (insertedVars) {
            variantsInserted += insertedVars.length;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cópia concluída! ${productsInserted} produtos e ${variantsInserted} variantes copiados.`,
        details: {
          products: productsInserted,
          variants: variantsInserted,
          categories: Object.keys(catMap).length,
          subcategories: Object.keys(subcatMap).length,
          suppliers: Object.keys(supplierMap).length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
