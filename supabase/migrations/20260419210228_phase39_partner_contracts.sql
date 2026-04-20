-- Add contract acceptance fields
ALTER TABLE public.partner_points
ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_accepted_ip TEXT;

-- Create RPC for partners to accept their contract publicly
CREATE OR REPLACE FUNCTION accept_partner_contract(
  p_point_id UUID,
  p_ip TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.partner_points
  SET 
    contract_accepted_at = now(),
    contract_accepted_ip = p_ip
  WHERE id = p_point_id;
END;
$$;
