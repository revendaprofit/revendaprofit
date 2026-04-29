-- ============================================
-- ZERAR ESTOQUE: NaBell's (isabellegalx1@gmail.com)
-- owner_id: d6a4d4e9-09a8-46f0-ba46-5168dcd8ef84
-- Todos os produtos ficarão como "esgotado"
-- ============================================

-- 1. Zerar estoque de todas as variantes
UPDATE public.product_variants
SET stock = 0
WHERE owner_id = 'd6a4d4e9-09a8-46f0-ba46-5168dcd8ef84';

-- 2. Zerar total_stock de todos os produtos
UPDATE public.products
SET total_stock = 0
WHERE owner_id = 'd6a4d4e9-09a8-46f0-ba46-5168dcd8ef84';
