-- Function to safely register a customer AND an order from the public partner catalog
CREATE OR REPLACE FUNCTION register_partner_order(
    p_store_id uuid,
    p_partner_point_id uuid,
    p_name text,
    p_whatsapp text,
    p_total_amount numeric,
    p_items jsonb
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    v_customer_id uuid;
    v_order_code text;
    v_random_str text;
BEGIN
    -- 1. Try to find existing customer by phone and owner_id
    SELECT id INTO v_customer_id FROM customers WHERE owner_id = p_store_id AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_whatsapp, '\D', '', 'g') LIMIT 1;

    -- 2. If not found, create new customer
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (owner_id, name, phone)
        VALUES (p_store_id, p_name, p_whatsapp)
        RETURNING id INTO v_customer_id;
    END IF;

    -- 3. Generate a random 4-character alpha order code
    v_random_str := upper(substr(md5(random()::text), 1, 4));
    v_order_code := 'PT-' || v_random_str;

    -- 4. Create the store_order
    INSERT INTO store_orders (owner_id, customer_id, order_code, status, total_amount, items, partner_point_id)
    VALUES (p_store_id, v_customer_id, v_order_code, 'pending', p_total_amount, p_items, p_partner_point_id);
    
    RETURN v_order_code;
END;
$$;
