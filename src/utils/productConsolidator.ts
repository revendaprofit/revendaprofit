export function consolidateProducts(products: any[]) {
  const map = new Map<string, any>();

  const normalize = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/^(🏪|🤝)\s*/, '')           // remove emoji prefix
      .replace(/[\s_-]*(parceria|parceiro|sócia|socia|p2p|sócia\s*&\s*parceira)[\s_-]*/gi, '') // remove P2P keywords anywhere
      .replace(/\(.*?\)/g, '')              // remove anything in parentheses
      .trim();

  const variantKey = (v: any) =>
    `${(v.size || '').toLowerCase().trim()}-${(v.color || '').toLowerCase().trim()}`;

  for (const p of products) {
    const normName = normalize(p.name);

    if (!map.has(normName)) {
      map.set(normName, { ...p, product_variants: [...(p.product_variants || [])] });
    } else {
      const existing = map.get(normName);

      // Priority: Local (3) > Hub (2) > P2P (1)
      const getScore = (prod: any) => {
        if (!prod._is_hub && !prod._is_p2p) return 3;
        if (prod._is_hub) return 2;
        return 1;
      };

      let base = existing;
      let other = p;

      if (getScore(p) > getScore(existing)) {
        base = { ...p, product_variants: [...(p.product_variants || [])] };
        other = existing;
        map.set(normName, base);
      }

      // Build set of size-color keys already present in base (local/hub variants)
      const baseVariantKeys = new Set<string>(
        (base.product_variants || [])
          .filter((v: any) => !v._is_p2p)
          .map(variantKey)
      );

      // Add variants from the other source, skipping P2P ones that duplicate a local/hub variant
      for (const v of other.product_variants || []) {
        const vKey = variantKey(v);
        const isP2P = other._is_p2p || v._is_p2p;

        // If this variant already exists in local/hub stock, don't show the P2P copy
        if (isP2P && baseVariantKeys.has(vKey)) continue;

        base.product_variants.push({
          ...v,
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
