export function consolidateProducts(products: any[]) {
  const map = new Map<string, any>();

  // Helper to normalize names for comparison
  const normalize = (name: string) => name.toLowerCase().trim().replace(/^(🏪|🤝)\s*/, '');

  // Helper to determine source type
  const getSourceType = (prod: any): string => {
    if (prod._is_p2p) return 'p2p';
    if (prod._is_hub) return 'hub';
    return 'local';
  };

  for (const p of products) {
    const normName = normalize(p.name);
    const sourceType = getSourceType(p);
    
    // Use a composite key: name + source type
    // This prevents P2P products from being merged with local products
    // (they have different owners and need separate cart handling)
    const key = `${normName}__${sourceType}`;
    
    if (!map.has(key)) {
       // Clone the product and its variants so we don't mutate the original
       map.set(key, { ...p, product_variants: [...(p.product_variants || [])] });
    } else {
       const existing = map.get(key);
       
       // Only merge variants within the same source type
       // (e.g. two hub imports of same product, or two local entries)
       for (const v of p.product_variants || []) {
           existing.product_variants.push({
               ...v,
               // Inject parent tracking info into the variant so addToCart knows its true origin
               _is_p2p: p._is_p2p,
               _is_hub: p._is_hub,
               _parent_id: p.id, 
               _p2p_partnership_id: p._p2p_partnership_id,
               _p2p_owner_id: p._p2p_owner_id,
               _p2p_creditor_id: p._p2p_creditor_id,
               _p2p_original_owner_id: p._p2p_original_owner_id,
               _hub_product_id: p._hub_product_id,
               _supplier_id: p._supplier_id,
           });
       }
    }
  }
  
  return Array.from(map.values());
}
