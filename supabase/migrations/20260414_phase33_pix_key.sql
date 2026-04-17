-- Adicionar campo de chave PIX no cadastro do fornecedor
ALTER TABLE public.hub_trade_rules ADD COLUMN IF NOT EXISTS pix_key text;
ALTER TABLE public.hub_trade_rules ADD COLUMN IF NOT EXISTS pix_key_type text; -- cpf, cnpj, email, telefone, aleatoria
