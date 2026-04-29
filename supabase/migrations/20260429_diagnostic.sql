CREATE OR REPLACE FUNCTION admin_diagnose_p2p(email1 TEXT, email2 TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  u1 UUID;
  u2 UUID;
  p_id UUID;
  u1_total INT;
  u1_shared INT;
  u1_shared_stock INT;
  res JSON;
BEGIN
  SELECT id INTO u1 FROM public.profiles WHERE email = email1 LIMIT 1;
  SELECT id INTO u2 FROM public.profiles WHERE email = email2 LIMIT 1;
  
  SELECT id INTO p_id FROM public.partnerships 
  WHERE (requester_id = u1 AND receiver_id = u2) OR (requester_id = u2 AND receiver_id = u1)
  LIMIT 1;
  
  SELECT count(*) INTO u1_total FROM public.products WHERE owner_id = u1 AND total_stock > 0;
  
  SELECT count(*) INTO u1_shared FROM public.partnership_shared_products WHERE owner_id = u1 AND partnership_id = p_id;
  
  SELECT count(*) INTO u1_shared_stock 
  FROM public.partnership_shared_products sp
  JOIN public.products p ON p.id = sp.product_id
  WHERE sp.owner_id = u1 AND sp.partnership_id = p_id AND p.total_stock > 0;
  
  res := json_build_object(
    'partnership_id', p_id,
    'user1_total_in_stock', u1_total,
    'user1_shared_total', u1_shared,
    'user1_shared_with_stock', u1_shared_stock
  );
  
  RETURN res;
END;
$$;
