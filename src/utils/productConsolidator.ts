export function consolidateProducts(products: any[]) {
  const map = new Map<string, any>();

  // Helper to normalize names for comparison
  const normalize = (name: string) => name.toLowerCase().trim().replace(/^(🏪|🤝)\s*/, '');

  for (const p of products) {
    const normName = normalize(p.name);
    
    if (!map.has(normName)) {
       // Clone the product and its variants so we don't mutate the original
       map.set(normName, { ...p, product_variants: [...(p.product_variants || [])] });
    } else {
       const existing = map.get(normName);
       
       // Determine priority: Local (3) > Hub (2) > P2P (1)
       const getScore = (prod: any) => {
          if (!prod._is_hub && !prod._is_p2p) return 3; // Local
          if (prod._is_hub) return 2; // Hub
          return 1; // P2P
       };
       
       let base = existing;
       let other = p;
       
       if (getScore(p) > getScore(existing)) {
          // p has higher priority, it becomes the base
          base = { ...p, product_variants: [...(p.product_variants || [])] };
          other = existing;
          map.set(normName, base);
       }
       
       // Merge variants from 'other' into 'base'
       const baseVariantsNorm = new Set(base.product_variants.map((v: any) => `${(v.size || '').toLowerCase()}-${(v.color || '').toLowerCase()}`));
       
       for (const v of other.product_variants || []) {
           const vNorm = `${(v.size || '').toLowerCase()}-${(v.color || '').toLowerCase()}`;
           
           // Always add variants from other sources (they will render with icons like Hub or P2P if they overlap)
           base.product_variants.push({
               ...v,
               // Inject parent tracking info into the variant so addToCart knows its true origin
               _is_p2p: other._is_p2p,
               _is_hub: other._is_hub,
               _parent_id: other.id, 
               _p2p_partnership_id: other._p2p_partnership_id,
               _p2p_owner_id: other._p2p_owner_id,
               _p2p_creditor_id: other._p2p_creditor_id,
               _p2p_original_owner_id: other._p2p_original_owner_id,
               _hub_product_id: other._hub_product_id,
               _supplier_id: other._supplier_id,
           });
       }
    }
  }
  
  return Array.from(map.values());
}
