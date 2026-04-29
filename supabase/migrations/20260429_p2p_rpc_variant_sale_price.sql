CREATE OR REPLACE FUNCTION get_my_p2p_shared_products(p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    sale_price NUMERIC,
    cost_price NUMERIC,
    image_url TEXT,
    image_url_2 TEXT,
    image_url_3 TEXT,
    video_url TEXT,
    category_id UUID,
    subcategory_id UUID,
    category_name TEXT,
    subcategory_name TEXT,
    variants JSON,
    p2p_partnership_id UUID,
    p2p_owner_id UUID
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH active_partnerships AS (
        SELECT p.id 
        FROM public.partnerships p
        WHERE (p.requester_id = p_tenant_id OR p.receiver_id = p_tenant_id)
          AND p.status = 'active'
    ),
    shared_items AS (
        SELECT sp.product_id, sp.partnership_id, sp.owner_id
        FROM public.partnership_shared_products sp
        JOIN active_partnerships ap ON ap.id = sp.partnership_id
        WHERE sp.owner_id != p_tenant_id
    )
    SELECT 
        pr.id,
        pr.name,
        pr.description,
        pr.sale_price,
        pr.cost_price,
        pr.image_url,
        pr.image_url_2,
        pr.image_url_3,
        pr.video_url,
        pr.category_id,
        pr.subcategory_id,
        c.name AS category_name,
        sc.name AS subcategory_name,
        COALESCE(
            (SELECT json_agg(json_build_object(
                'id', v.id,
                'size', v.size,
                'color', v.color,
                'stock', v.stock,
                'sale_price', v.sale_price
            ))
            FROM public.product_variants v
            WHERE v.product_id = pr.id AND v.stock > 0),
            '[]'::json
        ) AS variants,
        si.partnership_id AS p2p_partnership_id,
        si.owner_id AS p2p_owner_id
    FROM public.products pr
    JOIN shared_items si ON si.product_id = pr.id
    LEFT JOIN public.categories c ON c.id = pr.category_id
    LEFT JOIN public.subcategories sc ON sc.id = pr.subcategory_id
    WHERE EXISTS (
        SELECT 1 
        FROM public.product_variants v 
        WHERE v.product_id = pr.id AND v.stock > 0
    );
END;
$$;
