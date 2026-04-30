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
       
       // Build a map of the 'other' variants by normalized key
       const otherVariantsByKey = new Map<string, any>();
       for (const v of other.product_variants || []) {
           const vKey = `${(v.size || '').toLowerCase()}-${(v.color || '').toLowerCase()}`;
           otherVariantsByKey.set(vKey, {
               ...v,
               // Inject parent tracking info
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
       
       // If the OTHER source is P2P, replace matching base (local) variants with the P2P version
       // This ensures partnership products always go through the P2P checkout flow
       if (other._is_p2p) {
           base.product_variants = base.product_variants.map((bv: any) => {
               const bKey = `${(bv.size || '').toLowerCase()}-${(bv.color || '').toLowerCase()}`;
               const p2pVariant = otherVariantsByKey.get(bKey);
               if (p2pVariant) {
                   // Replace local variant with P2P variant (preserves stock from P2P source)
                   otherVariantsByKey.delete(bKey); // consumed
                   return p2pVariant;
               }
               return bv; // no P2P match, keep local
           });
       }
       // If the BASE is P2P and other is local, replace base P2P variants that match local
       else if (base._is_p2p && !other._is_p2p) {
           // Actually in this case, base has higher priority (local), so we check if other (P2P) 
           // has variants that match. We already swapped base/other above so base is always higher priority.
           // This branch won't normally trigger since local > p2p, but just in case:
       }
       
       // Add remaining other variants that didn't overlap (unique sizes/colors from the other source)
       for (const [, v] of otherVariantsByKey) {
           base.product_variants.push(v);
       }
    }
  }
  
  return Array.from(map.values());
}
