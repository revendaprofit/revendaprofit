export function consolidateProducts(products: any[]) {
  const map = new Map<string, any>();

  const normalize = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/^(🏪)\s*/, '')           // remove emoji prefix
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

      // Priority: Local (2) > Hub (1)
      const getScore = (prod: any) => {
        if (!prod._is_hub) return 2;
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
        (base.product_variants || []).map(variantKey)
      );

      // Add variants from the other source, skipping duplicates
      for (const v of other.product_variants || []) {
        const vKey = variantKey(v);
        if (baseVariantKeys.has(vKey)) continue;

        base.product_variants.push({
          ...v,
          _is_hub: other._is_hub,
          _parent_id: other.id,
          _hub_product_id: other._hub_product_id,
          _supplier_id: other._supplier_id,
        });
      }
    }
  }

  return Array.from(map.values());
}
