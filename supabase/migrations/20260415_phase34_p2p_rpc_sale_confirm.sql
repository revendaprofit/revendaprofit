-- Permite que uma parceira destrave a venda da dona marcando como confirmada
CREATE OR REPLACE FUNCTION mark_p2p_sale_completed(p_sale_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas atualiza a venda para concluída se as ordens vinculadas já constam como confirmadas
  UPDATE public.sales
  SET status = 'completed'
  WHERE id = p_sale_id AND status = 'open';
END;
$$;
