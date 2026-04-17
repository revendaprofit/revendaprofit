import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Database } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function LegacyMigrationDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const [step, setStep] = useState(1);
  const [oldData, setOldData] = useState<{ products: any[], variants: any[], categories: any[], suppliers: any[], customers: any[], sales: any[], saleItems: any[], paymentMethods: any[], storeSettings: any[] }>({ products: [], variants: [], categories: [], suppliers: [], customers: [], sales: [], saleItems: [], paymentMethods: [], storeSettings: [] });
  
  const [migrateProducts, setMigrateProducts] = useState(true);
  const [migrateCustomers, setMigrateCustomers] = useState(true);
  const [migrateSalesHistory, setMigrateSalesHistory] = useState(true);
  const [migrateVisualSettings, setMigrateVisualSettings] = useState(true);
  const [migratePaymentMethods, setMigratePaymentMethods] = useState(true);
  const [ignoreOldOutOfStock, setIgnoreOldOutOfStock] = useState(true);

  const [mapping, setMapping] = useState({
    name: '',
    cost_price: '',
    sale_price: '',
    description: '',
    category_text: '',
    supplier_text: '',
    subcategory: '',
    image_url: '',
    image_url_2: '',
    image_url_3: '',
    video_url: '',
    filter_model: '',
    filter_color: '',
    filter_detail: '',
    ncm: '',
    cest: '',
    ean: '',
    variant_size: '',
    variant_color: '',
    variant_stock: '',
    variant_sku: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_document: '',
    sale_total: '',
    sale_discount: '',
    sale_payment_method: '',
    sale_status: '',
    sale_created_at: '',
    sale_customer_id: '',
    saleItem_saleId: '',
    saleItem_productId: '',
    saleItem_variantId: '',
    saleItem_quantity: '',
    saleItem_unitPrice: '',
  });

  const queryClient = useQueryClient();

  // Helper inside component to keep access to oldSupabase
  const connectAndAnalyze = async () => {
    if (!url || !key || !email || !password) return toast.error('Preencha todos os campos');
    setLoading(true);
    setStatus('Conectando e analisando estrutura...');
    try {
      const oldSupabase = createClient(url, key);
      
      const { error: authErr } = await oldSupabase.auth.signInWithPassword({ email, password });
      if (authErr) throw new Error('Falha no login antigo: ' + authErr.message);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Você precisa estar logado na nova conta.');

      const fetchTableSafely = async (tableName: string) => {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        
        while (true) {
          const { data, error } = await oldSupabase.from(tableName).select('*').range(from, from + step - 1);
          if (error && error.message.includes('Could not find the table')) {
            console.warn(`Tabela ${tableName} não existe na conta antiga. Ignorando.`);
            return [];
          }
          if (error) throw new Error(`Erro na tabela ${tableName}: ` + error.message);
          
          if (!data || data.length === 0) break;
          allData = [...allData, ...data];
          if (data.length < step) break;
          from += step;
        }
        return allData;
      };

      setStatus('Analisando Categorias...');
      const oldCategories = await fetchTableSafely('categories');

      setStatus('Analisando Fornecedores...');
      const oldSuppliers = await fetchTableSafely('suppliers');

      setStatus('Analisando Produtos...');
      let oldProducts = await fetchTableSafely('products');
      if (oldProducts.length === 0) {
         oldProducts = await fetchTableSafely('produtos');
      }
      if (oldProducts.length === 0) throw new Error('Nenhum produto encontrado na tabela products ou produtos.');

      setStatus('Analisando Variantes...');
      let oldVariants = await fetchTableSafely('product_variants');
      if (oldVariants.length === 0) {
         oldVariants = await fetchTableSafely('variacoes_produto');
      }

      setStatus('Analisando Clientes...');
      let oldCustomers = await fetchTableSafely('customers');
      if (oldCustomers.length === 0) oldCustomers = await fetchTableSafely('clientes');

      setStatus('Analisando Vendas...');
      let oldSales = await fetchTableSafely('sales');
      if (oldSales.length === 0) oldSales = await fetchTableSafely('vendas');

      setStatus('Analisando Itens de Venda...');
      let oldSaleItems = await fetchTableSafely('sale_items');
      if (oldSaleItems.length === 0) oldSaleItems = await fetchTableSafely('itens_venda');

      setStatus('Analisando Métodos de Pagamento...');
      let oldPaymentMethods = await fetchTableSafely('payment_methods');
      if (oldPaymentMethods.length === 0) oldPaymentMethods = await fetchTableSafely('formas_pagamento');

      setStatus('Analisando Configurações da Loja...');
      let oldSettings = await fetchTableSafely('store_settings');
      if (oldSettings.length === 0) oldSettings = await fetchTableSafely('configuracoes');

      if (migrateProducts && ignoreOldOutOfStock) {
        setStatus('Limpando produtos antigos e inativos...');
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const productStockMap: Record<string, number> = {};
        oldVariants.forEach(v => {
           const pid = v.product_id || v.produto_id || v.id_produto || v.idProduto || Object.values(v).find(val => typeof val === 'string' && val.length > 20); // Fallback to uuid
           const s = v.stock ?? v.estoque ?? v.quantidade ?? 0;
           if (pid) productStockMap[pid as string] = (productStockMap[pid as string] || 0) + parseInt(s as string);
        });

        oldProducts = oldProducts.filter(p => {
           const totalStock = productStockMap[p.id] || 0;
           if (totalStock > 0) return true;
           const dateString = p.updated_at || p.created_at || p.data_atualizacao || p.data_cadastro || null;
           if (dateString) {
              return new Date(dateString) >= ninetyDaysAgo;
           }
           return false; // Aggressively clean up if we can't find a date and it has 0 stock
        });
        
        const keptIds = new Set(oldProducts.map(p => p.id));
        oldVariants = oldVariants.filter(v => keptIds.has(v.product_id || v.produto_id || v.id_produto || v.idProduto || Object.values(v).find(val => typeof val === 'string' && val.length > 20)));
      }

      setOldData({ products: oldProducts, variants: oldVariants, categories: oldCategories, suppliers: oldSuppliers, customers: oldCustomers, sales: oldSales, saleItems: oldSaleItems, paymentMethods: oldPaymentMethods, storeSettings: oldSettings });
      
      // Auto-detect columns
      const pKeys = oldProducts.length > 0 ? Object.keys(oldProducts[0]) : [];
      const vKeys = oldVariants.length > 0 ? Object.keys(oldVariants[0]) : [];
      const cKeys = oldCustomers.length > 0 ? Object.keys(oldCustomers[0]) : [];
      const sKeys = oldSales.length > 0 ? Object.keys(oldSales[0]) : [];
      const siKeys = oldSaleItems.length > 0 ? Object.keys(oldSaleItems[0]) : [];
      
      setMapping({
        name: pKeys.find(k => ['name', 'nome', 'titulo'].includes(k.toLowerCase())) || '',
        cost_price: pKeys.find(k => ['cost_price', 'preco_custo', 'custo', 'valor_compra'].includes(k.toLowerCase())) || '',
        sale_price: pKeys.find(k => ['sale_price', 'preco_venda', 'preco', 'venda', 'valor_venda'].includes(k.toLowerCase())) || '',
        description: pKeys.find(k => ['description', 'descricao', 'detalhes'].includes(k.toLowerCase())) || '',
        category_text: pKeys.find(k => ['category', 'categoria', 'marca'].includes(k.toLowerCase())) || '',
        supplier_text: pKeys.find(k => ['supplier', 'fornecedor', 'distribuidor'].includes(k.toLowerCase())) || '',
        subcategory: pKeys.find(k => ['subcategory', 'subcategoria'].includes(k.toLowerCase())) || '',
        image_url: pKeys.find(k => ['image_url', 'imagem', 'foto', 'imagem_principal'].includes(k.toLowerCase())) || '',
        image_url_2: pKeys.find(k => ['image_url_2', 'imagem_2', 'foto_2'].includes(k.toLowerCase())) || '',
        image_url_3: pKeys.find(k => ['image_url_3', 'imagem_3', 'foto_3'].includes(k.toLowerCase())) || '',
        video_url: pKeys.find(k => ['video_url', 'video', 'link_video'].includes(k.toLowerCase())) || '',
        filter_model: pKeys.find(k => ['filter_model', 'filtro_modelo', 'modelo'].includes(k.toLowerCase())) || '',
        filter_color: pKeys.find(k => ['filter_color', 'filtro_cor'].includes(k.toLowerCase())) || '',
        filter_detail: pKeys.find(k => ['filter_detail', 'filtro_detalhe', 'detalhe'].includes(k.toLowerCase())) || '',
        ncm: pKeys.find(k => ['ncm'].includes(k.toLowerCase())) || '',
        cest: pKeys.find(k => ['cest'].includes(k.toLowerCase())) || '',
        ean: pKeys.find(k => ['ean', 'codigo_barras'].includes(k.toLowerCase())) || '',
        variant_size: vKeys.find(k => ['size', 'tamanho'].includes(k.toLowerCase())) || '',
        variant_color: vKeys.find(k => ['color', 'cor'].includes(k.toLowerCase())) || '',
        variant_stock: vKeys.find(k => ['stock', 'estoque', 'quantidade', 'qtd'].includes(k.toLowerCase())) || '',
        variant_sku: vKeys.find(k => ['sku', 'referencia', 'codigo'].includes(k.toLowerCase())) || '',
        customer_name: cKeys.find(k => ['name', 'nome', 'fullname'].includes(k.toLowerCase())) || '',
        customer_phone: cKeys.find(k => ['phone', 'telefone', 'celular'].includes(k.toLowerCase())) || '',
        customer_email: cKeys.find(k => ['email', 'e-mail'].includes(k.toLowerCase())) || '',
        customer_document: cKeys.find(k => ['document', 'cpf', 'cnpj', 'documento'].includes(k.toLowerCase())) || '',
        sale_total: sKeys.find(k => ['total_amount', 'total', 'valor_total'].includes(k.toLowerCase())) || '',
        sale_discount: sKeys.find(k => ['discount', 'desconto'].includes(k.toLowerCase())) || '',
        sale_payment_method: sKeys.find(k => ['payment_method', 'metodo_pagamento', 'pagamento'].includes(k.toLowerCase())) || '',
        sale_status: sKeys.find(k => ['status', 'estado'].includes(k.toLowerCase())) || '',
        sale_created_at: sKeys.find(k => ['created_at', 'data', 'criado_em', 'date'].includes(k.toLowerCase())) || '',
        sale_customer_id: sKeys.find(k => ['customer_id', 'cliente_id'].includes(k.toLowerCase())) || '',
        saleItem_saleId: siKeys.find(k => ['sale_id', 'venda_id', 'pedido_id'].includes(k.toLowerCase())) || '',
        saleItem_productId: siKeys.find(k => ['product_id', 'produto_id'].includes(k.toLowerCase())) || '',
        saleItem_variantId: siKeys.find(k => ['variant_id', 'variacao_id'].includes(k.toLowerCase())) || '',
        saleItem_quantity: siKeys.find(k => ['quantity', 'quantidade', 'qtd'].includes(k.toLowerCase())) || '',
        saleItem_unitPrice: siKeys.find(k => ['unit_price', 'preco_unitario', 'valor_unitario', 'price'].includes(k.toLowerCase())) || '',
      });

      setStep(2);
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setStatus('Iniciando migração dos dados mapeados...');
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Falha de autenticação local.');

      if (migratePaymentMethods && oldData.paymentMethods && oldData.paymentMethods.length > 0) {
        setStatus(`Migrando ${oldData.paymentMethods.length} Formas de Pagamento...`);
        const pmToInsert = oldData.paymentMethods.map(pm => ({
          owner_id: user.id,
          name: pm.name || pm.nome || 'Pagamento',
          fee_percentage: parseFloat(pm.fee_percentage || pm.taxa || 0),
          is_installment: pm.is_installment || false,
          is_active: pm.is_active !== undefined ? pm.is_active : true,
        }));
        for (let i = 0; i < pmToInsert.length; i += 100) {
           await supabase.from('payment_methods').insert(pmToInsert.slice(i, i + 100));
        }
      }
      
      if (migrateVisualSettings && oldData.storeSettings && oldData.storeSettings.length > 0) {
        setStatus('Sincronizando Mídia e Configurações da Loja...');
        const oldSet = oldData.storeSettings[0];
        
        // Filtrando campos undefined para não sobrescrever com null acidentalmente
        const updates: any = {};
        if (oldSet.store_name || oldSet.nome_loja) updates.store_name = oldSet.store_name || oldSet.nome_loja;
        if (oldSet.logo_url) updates.logo_url = oldSet.logo_url;
        if (oldSet.banner_desktop_url) updates.banner_desktop_url = oldSet.banner_desktop_url;
        if (oldSet.banner_mobile_url) updates.banner_mobile_url = oldSet.banner_mobile_url;
        if (oldSet.primary_color) updates.primary_color = oldSet.primary_color;
        if (oldSet.bg_color) updates.bg_color = oldSet.bg_color;
        if (oldSet.card_bg_color) updates.card_bg_color = oldSet.card_bg_color;
        if (oldSet.page_title) updates.page_title = oldSet.page_title;
        if (oldSet.announcement_text) updates.announcement_text = oldSet.announcement_text;
        if (oldSet.instagram_url) updates.instagram_url = oldSet.instagram_url;
        if (oldSet.tiktok_url) updates.tiktok_url = oldSet.tiktok_url;
        if (oldSet.footer_text) updates.footer_text = oldSet.footer_text;
        
        if (Object.keys(updates).length > 0) {
            await supabase.from('store_settings').update(updates).eq('owner_id', user.id);
        }
      }

      const { data: existingCategories } = await supabase.from('categories').select('id, name');
      const { data: existingSubcategories } = await supabase.from('subcategories').select('id, name');

      const categoryMap: Record<string, string> = {};
      const supplierMap: Record<string, string> = {};
      const dynamicCategoryMap: Record<string, string> = {};
      const dynamicSupplierMap: Record<string, string> = {};
      const dynamicSubcategoryMap: Record<string, string> = {};
      const productMap: Record<string, string> = {};
      const variantMap: Record<string, string> = {};

      if (migrateProducts) {
        if (oldData.categories.length > 0) {
        setStatus('Mapeando Categorias...');
        for (const cat of oldData.categories) {
          if (!cat.name) continue;
          const matched = existingCategories?.find(c => c.name.toLowerCase().trim() === cat.name.toLowerCase().trim());
          if (matched) categoryMap[cat.id] = matched.id;
        }
        }
        
        if (oldData.suppliers.length > 0) {
        setStatus('Migrando Fornecedores...');
        for (const sup of oldData.suppliers) {
          const { data: newSup } = await supabase.from('suppliers').insert({ owner_id: user.id, name: sup.name, contact_info: sup.contact_info }).select('id').single();
          if (newSup) supplierMap[sup.id] = newSup.id;
        }
        }

        // Dynamic Creation of Text-based Categories & Suppliers if Mapped
        if (mapping.category_text) {
         setStatus('Mapeando categorias em texto...');
         const catSet = new Set<string>();
         oldData.products.forEach(p => { if(p[mapping.category_text]) catSet.add(p[mapping.category_text]) });
         for (const catName of Array.from(catSet)) {
           const matched = existingCategories?.find(c => c.name.toLowerCase().trim() === catName.toLowerCase().trim());
           if (matched) dynamicCategoryMap[catName] = matched.id;
         }
        }

        if (mapping.subcategory) {
         setStatus('Mapeando subcategorias...');
         const subSet = new Set<string>();
         oldData.products.forEach(p => { if(p[mapping.subcategory]) subSet.add(p[mapping.subcategory]) });
         for (const subName of Array.from(subSet)) {
           const matched = existingSubcategories?.find(s => s.name.toLowerCase().trim() === subName.toLowerCase().trim());
           if (matched) dynamicSubcategoryMap[subName] = matched.id;
         }
        }

        if (mapping.supplier_text) {
         setStatus('Extraindo fornecedores em texto...');
         const supSet = new Set<string>();
         oldData.products.forEach(p => { if(p[mapping.supplier_text]) supSet.add(p[mapping.supplier_text]) });
         for (const supName of Array.from(supSet)) {
           const { data: newSup } = await supabase.from('suppliers').insert({ owner_id: user.id, name: supName }).select('id').single();
           if (newSup) dynamicSupplierMap[supName] = newSup.id;
         }
        }

        if (oldData.products.length > 0) {
          setStatus(`Gerando IDs e Mapeando ${oldData.products.length} Produtos...`);
          const productsToInsert = [];
          for (const prod of oldData.products) {
            const costPrice = prod[mapping.cost_price] || prod.cost_price || 0;
            const salePrice = prod[mapping.sale_price] || prod.sale_price || 0;
            
            const generatedId = crypto.randomUUID();
            productMap[prod.id] = generatedId; // Mapeia o ID velho para o ID recém-gerado localmente
            
            productsToInsert.push({
              id: generatedId,
              owner_id: user.id,
              name: prod[mapping.name] || prod.name || prod.nome || 'Produto Sem Nome',
              description: mapping.description ? prod[mapping.description] : prod.description || null,
              subcategory_id: mapping.subcategory && prod[mapping.subcategory] ? dynamicSubcategoryMap[prod[mapping.subcategory]] : null,
              cost_price: parseFloat(costPrice),
              sale_price: parseFloat(salePrice),
              image_url: mapping.image_url ? prod[mapping.image_url] : prod.image_url || null,
              image_url_2: mapping.image_url_2 ? prod[mapping.image_url_2] : prod.image_url_2 || null,
              image_url_3: mapping.image_url_3 ? prod[mapping.image_url_3] : prod.image_url_3 || null,
              video_url: mapping.video_url ? prod[mapping.video_url] : prod.video_url || null,
              filter_model: mapping.filter_model ? prod[mapping.filter_model] : prod.filter_model || null,
              filter_color: mapping.filter_color ? prod[mapping.filter_color] : prod.filter_color || null,
              filter_detail: mapping.filter_detail ? prod[mapping.filter_detail] : prod.filter_detail || null,
              ncm: mapping.ncm ? prod[mapping.ncm] : prod.ncm || null,
              cest: mapping.cest ? prod[mapping.cest] : prod.cest || null,
              ean: mapping.ean ? prod[mapping.ean] : prod.ean || null,
              category_id: mapping.category_text && prod[mapping.category_text] ? dynamicCategoryMap[prod[mapping.category_text]] : (prod.category_id ? categoryMap[prod.category_id] : null),
              supplier_id: mapping.supplier_text && prod[mapping.supplier_text] ? dynamicSupplierMap[prod[mapping.supplier_text]] : (prod.supplier_id ? supplierMap[prod.supplier_id] : null),
              marketing_status: prod.marketing_status || 'active',
            });
          }
          
          for (let i = 0; i < productsToInsert.length; i += 1000) {
            setStatus(`Enviando Lote de Produtos (${i} de ${productsToInsert.length})...`);
            const chunk = productsToInsert.slice(i, i + 1000);
            await supabase.from('products').insert(chunk);
            await new Promise(r => setTimeout(r, 50)); // Yield the thread to let UI breathe
          }
        }

        if (oldData.variants.length > 0) {
          setStatus(`Gerando IDs e Mapeando ${oldData.variants.length} Variantes...`);
          const variantsToInsert = [];
          for (const v of oldData.variants) {
            if (!productMap[v.product_id]) continue;
            
            const generatedId = crypto.randomUUID();
            variantMap[v.id] = generatedId;
            
            variantsToInsert.push({
              id: generatedId,
              product_id: productMap[v.product_id],
              owner_id: user.id,
              size: v[mapping.variant_size] || v.size,
              color: v[mapping.variant_color] || v.color,
              sku: v[mapping.variant_sku] || v.sku || null,
              stock: parseInt(v[mapping.variant_stock] || v.stock || 0)
            });
          }
          
          for (let i = 0; i < variantsToInsert.length; i += 1000) {
            setStatus(`Enviando Lote de Variantes (${i} de ${variantsToInsert.length})...`);
            const chunk = variantsToInsert.slice(i, i + 1000);
            await supabase.from('product_variants').insert(chunk);
            await new Promise(r => setTimeout(r, 50));
          }
        }
      }

      const customerMap: Record<string, string> = {};
      if (migrateCustomers && oldData.customers.length > 0) {
        setStatus(`Mapeando Localmente ${oldData.customers.length} Clientes...`);
        const custToInsert = [];
        for (const c of oldData.customers) {
           const generatedId = crypto.randomUUID();
           customerMap[c.id] = generatedId;
           custToInsert.push({
              id: generatedId,
              owner_id: user.id,
              name: c[mapping.customer_name] || c.name || 'Cliente Desconhecido',
              email: c[mapping.customer_email] || c.email || null,
              phone: c[mapping.customer_phone] || c.phone || null,
              document: c[mapping.customer_document] || c.document || null,
              created_at: c.created_at || new Date().toISOString()
           });
        }
        for (let i = 0; i < custToInsert.length; i += 1000) {
            setStatus(`Enviando Lote de Clientes (${i} de ${custToInsert.length})...`);
            const chunk = custToInsert.slice(i, i + 1000);
            await supabase.from('customers').insert(chunk);
            await new Promise(r => setTimeout(r, 50));
        }
      }

      if (migrateSalesHistory && oldData.sales.length > 0) {
        const saleMap: Record<string, string> = {};
        setStatus(`Mapeando Localmente ${oldData.sales.length} Vendas (Transações)...`);
        const salesToInsert = [];
        for (const s of oldData.sales) {
          const cId = s[mapping.sale_customer_id] || s.customer_id;
          const generatedId = crypto.randomUUID();
          saleMap[s.id] = generatedId;
          
          salesToInsert.push({
            id: generatedId,
            owner_id: user.id,
            customer_id: customerMap[cId] || null,
            total_amount: parseFloat(s[mapping.sale_total] || s.total_amount || 0),
            discount: parseFloat(s[mapping.sale_discount] || s.discount || 0),
            payment_method: s[mapping.sale_payment_method] || s.payment_method || 'other',
            status: s[mapping.sale_status] || s.status || 'completed',
            created_at: s[mapping.sale_created_at] || s.created_at || new Date().toISOString()
          });
        }
        
        for (let i = 0; i < salesToInsert.length; i += 1000) {
            setStatus(`Enviando Lote de Vendas (${i} de ${salesToInsert.length})...`);
            const chunk = salesToInsert.slice(i, i + 1000);
            await supabase.from('sales').insert(chunk);
            await new Promise(r => setTimeout(r, 50));
        }

        if (oldData.saleItems.length > 0) {
          setStatus(`Processando array base de ${oldData.saleItems.length} Itens de Venda...`);
          const itemsToInsert = oldData.saleItems
            .filter(si => saleMap[si[mapping.saleItem_saleId] || si.sale_id] && productMap[si[mapping.saleItem_productId] || si.product_id])
            .map(si => ({
              owner_id: user.id,
              sale_id: saleMap[si[mapping.saleItem_saleId] || si.sale_id],
              product_id: productMap[si[mapping.saleItem_productId] || si.product_id],
              variant_id: variantMap[si[mapping.saleItem_variantId] || si.variant_id] || null,
              quantity: parseInt(si[mapping.saleItem_quantity] || si.quantity || 1),
              unit_price: parseFloat(si[mapping.saleItem_unitPrice] || si.unit_price || 0),
              total_price: parseInt(si[mapping.saleItem_quantity] || si.quantity || 1) * parseFloat(si[mapping.saleItem_unitPrice] || si.unit_price || 0)
            }));
          
          for (let i = 0; i < itemsToInsert.length; i += 1000) {
            setStatus(`Enviando Lote de Itens de Venda (${i} de ${itemsToInsert.length})...`);
            const chunk = itemsToInsert.slice(i, i + 1000);
            await supabase.from('sale_items').insert(chunk);
            await new Promise(r => setTimeout(r, 50));
          }
        }
      }

      toast.success('Migração Completa do Venda Profit executada com sucesso!');
      queryClient.invalidateQueries();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setStatus('');
      setStep(1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md">
          <Database className="mr-2 h-4 w-4" /> Migrar Conta Antiga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Migração Completa Venda Profit</DialogTitle>
          <DialogDescription>
            Traga todos os seus dados estruturados da sua plataforma antiga para a Revenda Profit (Categorias, Produtos, Variações e Estoque) de forma 100% automática.
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="py-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Dados do Banco Antigo</label>
              <Input placeholder="Supabase URL (Ex: https://xxxx.supabase.co)" value={url} onChange={e => setUrl(e.target.value)} disabled={loading} className="mb-2" />
              <Input placeholder="Supabase ANON KEY (Chave Pública)" value={key} onChange={e => setKey(e.target.value)} disabled={loading} type="password" />
            </div>
            <div className="space-y-1 mt-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Login da Loja</label>
              <p className="text-xs text-muted-foreground">E-mail e senha usados na conta antiga para podermos ler o estoque.</p>
              <Input placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className="mb-2 mt-2" />
              <Input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>

            <div className="flex items-center mt-4">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">O Que Migrar?</label>
            </div>
            <div className="flex flex-col space-y-2 pt-2 border-t mt-1">
              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input type="checkbox" checked={migrateProducts} onChange={e => setMigrateProducts(e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
                <span className="text-sm font-medium leading-none">Migrar Produtos + Estoque</span>
              </label>
              {migrateProducts && (
                <label className="flex items-start space-x-2 cursor-pointer pl-6 bg-slate-50 p-2 rounded-md border border-slate-100">
                  <input type="checkbox" checked={ignoreOldOutOfStock} onChange={e => setIgnoreOldOutOfStock(e.target.checked)} className="rounded border-gray-300 w-3.5 h-3.5 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold leading-none text-slate-700">Ignorar catálogo inativo</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Exclui produtos que estão com estoque ZERADO a mais de 90 dias.</span>
                  </div>
                </label>
              )}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={migrateCustomers} onChange={e => setMigrateCustomers(e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
                <span className="text-sm font-medium leading-none">Migrar Clientes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={migrateSalesHistory} onChange={e => setMigrateSalesHistory(e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
                <span className="text-sm font-medium leading-none">Migrar Histórico de Vendas</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={migrateVisualSettings} onChange={e => setMigrateVisualSettings(e.target.checked)} className="rounded border-gray-300 w-4 h-4" />
                <span className="text-sm font-medium leading-none">Migrar Configurações Visuais da Loja</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer px-1 py-1 bg-green-50 rounded border border-green-100 text-green-800">
                <input type="checkbox" checked={migratePaymentMethods} onChange={e => setMigratePaymentMethods(e.target.checked)} className="rounded border-green-300 w-4 h-4 accent-green-600 focus:ring-green-600" />
                <span className="text-sm font-medium leading-none">Migrar Formas de Pagamento</span>
              </label>
            </div>
            
            <Button onClick={connectAndAnalyze} disabled={loading} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {status || 'Conectando...'}</> : 'Conectar e Analisar Dados'}
            </Button>
          </div>
        ) : (
          <div className="py-2 space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm mb-4 border border-emerald-200 sticky top-0 z-10 shadow-sm">
              Conectado! 
              {migrateProducts && ` ${oldData.products.length} produtos, ${oldData.variants.length} variantes.`} 
              {migrateCustomers && ` ${oldData.customers.length} clientes.`}
              {migrateSalesHistory && ` ${oldData.sales.length} vendas.`}
              {(migratePaymentMethods || migrateVisualSettings) && ` Configurações e Pagamentos automáticos isolados.`}
              <br/>Mapeie ou revise as colunas abaixo:
            </div>
            
            <div className="space-y-4">
              {migrateProducts && oldData.products.length > 0 && (
                <>
                  <h4 className="text-sm font-bold border-b pb-1">Campos Principais do Produto</h4>
                  <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Nome do Produto</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.name} onChange={e => setMapping({...mapping, name: e.target.value})}><option value="">-- Automático --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Descrição</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.description} onChange={e => setMapping({...mapping, description: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-primary">Preço Custo</label><select className="flex h-8 w-full rounded-md border border-input bg-primary/5 px-2 text-xs" value={mapping.cost_price} onChange={e => setMapping({...mapping, cost_price: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-primary">Preço Venda</label><select className="flex h-8 w-full rounded-md border border-input bg-primary/5 px-2 text-xs" value={mapping.sale_price} onChange={e => setMapping({...mapping, sale_price: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Categoria (Texto Antigo)</label><select className="flex h-8 w-full rounded-md border border-input bg-emerald-50 px-2 text-xs text-emerald-700" value={mapping.category_text} onChange={e => setMapping({...mapping, category_text: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Subcategoria</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.subcategory} onChange={e => setMapping({...mapping, subcategory: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Fornecedor (Texto Antigo)</label><select className="flex h-8 w-full rounded-md border border-input bg-emerald-50 px-2 text-xs text-emerald-700" value={mapping.supplier_text} onChange={e => setMapping({...mapping, supplier_text: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>

              <h4 className="text-sm font-bold border-b pb-1 mt-6">Mídias e Fotos</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Foto Principal</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.image_url} onChange={e => setMapping({...mapping, image_url: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Foto Secundária</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.image_url_2} onChange={e => setMapping({...mapping, image_url_2: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Foto 3</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.image_url_3} onChange={e => setMapping({...mapping, image_url_3: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Link do Vídeo</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.video_url} onChange={e => setMapping({...mapping, video_url: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>

              <h4 className="text-sm font-bold border-b pb-1 mt-6">Filtros Opcionais e Fiscais</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Filtro Modelo</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.filter_model} onChange={e => setMapping({...mapping, filter_model: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Filtro Cor</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.filter_color} onChange={e => setMapping({...mapping, filter_color: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Filtro Detalhes</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.filter_detail} onChange={e => setMapping({...mapping, filter_detail: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">NCM</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.ncm} onChange={e => setMapping({...mapping, ncm: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">CEST</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.cest} onChange={e => setMapping({...mapping, cest: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">EAN / Cód. Barras</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.ean} onChange={e => setMapping({...mapping, ean: e.target.value})}><option value="">-- Ignorar --</option>{oldData.products.length > 0 && Object.keys(oldData.products[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>

              <h4 className="text-sm font-bold border-b pb-1 mt-6">Tabela: Variações e Estoque</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">SKU / Ref</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.variant_sku} onChange={e => setMapping({...mapping, variant_sku: e.target.value})}><option value="">-- Ignorar --</option>{oldData.variants.length > 0 && Object.keys(oldData.variants[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-primary">Quantidade em Estoque</label><select className="flex h-8 w-full rounded-md border border-input bg-primary/5 px-2 text-xs" value={mapping.variant_stock} onChange={e => setMapping({...mapping, variant_stock: e.target.value})}><option value="">-- Ignorar --</option>{oldData.variants.length > 0 && Object.keys(oldData.variants[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Tamanho</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.variant_size} onChange={e => setMapping({...mapping, variant_size: e.target.value})}><option value="">-- Ignorar --</option>{oldData.variants.length > 0 && Object.keys(oldData.variants[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-muted-foreground">Cor</label><select className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={mapping.variant_color} onChange={e => setMapping({...mapping, variant_color: e.target.value})}><option value="">-- Ignorar --</option>{oldData.variants.length > 0 && Object.keys(oldData.variants[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>
                </>
              )}

              {migrateCustomers && oldData.customers.length > 0 && (
                <>
                  <h4 className="text-sm font-bold border-b pb-1 mt-6 text-indigo-700">Tabela: Clientes</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-indigo-700">Nome do Cliente</label><select className="flex h-8 w-full rounded-md border border-input bg-indigo-50 px-2 text-xs" value={mapping.customer_name} onChange={e => setMapping({...mapping, customer_name: e.target.value})}><option value="">-- Ignorar --</option>{oldData.customers.length > 0 && Object.keys(oldData.customers[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-indigo-700">Telefone / Whats</label><select className="flex h-8 w-full rounded-md border border-input bg-indigo-50 px-2 text-xs" value={mapping.customer_phone} onChange={e => setMapping({...mapping, customer_phone: e.target.value})}><option value="">-- Ignorar --</option>{oldData.customers.length > 0 && Object.keys(oldData.customers[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-indigo-700">E-mail</label><select className="flex h-8 w-full rounded-md border border-input bg-indigo-50 px-2 text-xs" value={mapping.customer_email} onChange={e => setMapping({...mapping, customer_email: e.target.value})}><option value="">-- Ignorar --</option>{oldData.customers.length > 0 && Object.keys(oldData.customers[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-indigo-700">CPF / CNPJ</label><select className="flex h-8 w-full rounded-md border border-input bg-indigo-50 px-2 text-xs" value={mapping.customer_document} onChange={e => setMapping({...mapping, customer_document: e.target.value})}><option value="">-- Ignorar --</option>{oldData.customers.length > 0 && Object.keys(oldData.customers[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  </div>
                </>
              )}

              {migrateSalesHistory && oldData.sales.length > 0 && (
                <>
                  <h4 className="text-sm font-bold border-b pb-1 mt-6 text-fuchsia-700">Tabela: Vendas / Recibos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">ID do Cliente na Venda</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.sale_customer_id} onChange={e => setMapping({...mapping, sale_customer_id: e.target.value})}><option value="">-- Ignorar --</option>{oldData.sales.length > 0 && Object.keys(oldData.sales[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Valor Total Pago</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.sale_total} onChange={e => setMapping({...mapping, sale_total: e.target.value})}><option value="">-- Ignorar --</option>{oldData.sales.length > 0 && Object.keys(oldData.sales[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Data e Hora da Compra</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.sale_created_at} onChange={e => setMapping({...mapping, sale_created_at: e.target.value})}><option value="">-- Ignorar --</option>{oldData.sales.length > 0 && Object.keys(oldData.sales[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Método de Pgto</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.sale_payment_method} onChange={e => setMapping({...mapping, sale_payment_method: e.target.value})}><option value="">-- Ignorar --</option>{oldData.sales.length > 0 && Object.keys(oldData.sales[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  </div>

                  <h4 className="text-sm font-bold border-b pb-1 mt-6 text-fuchsia-700">Itens dentro das Vendas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Referência ID da Venda</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.saleItem_saleId} onChange={e => setMapping({...mapping, saleItem_saleId: e.target.value})}><option value="">-- Obrigatório --</option>{oldData.saleItems.length > 0 && Object.keys(oldData.saleItems[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Referência ID do Produto</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.saleItem_productId} onChange={e => setMapping({...mapping, saleItem_productId: e.target.value})}><option value="">-- Obrigatório --</option>{oldData.saleItems.length > 0 && Object.keys(oldData.saleItems[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Referência ID da Variante</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.saleItem_variantId} onChange={e => setMapping({...mapping, saleItem_variantId: e.target.value})}><option value="">-- Ignorar --</option>{oldData.saleItems.length > 0 && Object.keys(oldData.saleItems[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-fuchsia-700">Quantidade Comprada</label><select className="flex h-8 w-full rounded-md border border-input bg-fuchsia-50 px-2 text-xs" value={mapping.saleItem_quantity} onChange={e => setMapping({...mapping, saleItem_quantity: e.target.value})}><option value="">-- Ignorar --</option>{oldData.saleItems.length > 0 && Object.keys(oldData.saleItems[0]).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  </div>
                </>
              )}
            </div>

            <Button onClick={handleImport} disabled={loading} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20">
              {loading ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {status || 'Importando...'}</> : 'Iniciar Importação Final'}
            </Button>
            <Button onClick={() => setStep(1)} variant="ghost" className="w-full text-xs" disabled={loading}>Voltar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
