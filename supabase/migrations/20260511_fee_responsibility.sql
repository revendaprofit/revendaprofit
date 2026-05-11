-- Responsabilidade pelas taxas de pagamento nas parcerias P2P
ALTER TABLE partnerships
  ADD COLUMN IF NOT EXISTS fee_responsibility_type TEXT NOT NULL DEFAULT 'seller_100'
    CHECK (fee_responsibility_type IN ('seller_100', 'shared_50_50', 'custom')),
  ADD COLUMN IF NOT EXISTS fee_responsibility_seller_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00;

-- Fatia de taxa absorvida pela credora (reduz o amount_owed)
ALTER TABLE partnership_settlements
  ADD COLUMN IF NOT EXISTS fee_slice NUMERIC(10,2) NOT NULL DEFAULT 0.00;
