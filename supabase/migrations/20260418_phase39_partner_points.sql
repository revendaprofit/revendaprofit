-- Table: partner_points
CREATE TABLE IF NOT EXISTS public.partner_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    document TEXT,
    address TEXT,
    commission_arara DECIMAL(5,2) DEFAULT 10.00,
    commission_retirada DECIMAL(5,2) DEFAULT 5.00,
    payment_method TEXT DEFAULT 'partner', -- 'partner' or 'store'
    partner_machine_fee DECIMAL(5,2) DEFAULT 2.00,
    replenishment_cycle_days INTEGER DEFAULT 30,
    min_stock_alert INTEGER DEFAULT 5,
    loss_risk_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index and RLS for partner_points
CREATE INDEX IF NOT EXISTS idx_partner_points_owner ON public.partner_points(owner_id);
CREATE INDEX IF NOT EXISTS idx_partner_points_slug ON public.partner_points(slug);

ALTER TABLE public.partner_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own partner points"
    ON public.partner_points FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own partner points"
    ON public.partner_points FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own partner points"
    ON public.partner_points FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own partner points"
    ON public.partner_points FOR DELETE
    USING (auth.uid() = owner_id);

-- Add public read access to partner points based on slug (for the public catalog)
CREATE POLICY "Public can view partner points"
    ON public.partner_points FOR SELECT
    USING (status = 'active');


-- Table: partner_point_stock
CREATE TABLE IF NOT EXISTS public.partner_point_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_point_id UUID NOT NULL REFERENCES public.partner_points(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- We need a unique constraint to avoid duplicating rows for the same product/variant in a partner point
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_stock_unique_variant ON public.partner_point_stock(partner_point_id, product_id, variant_id) WHERE variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_stock_unique_novariant ON public.partner_point_stock(partner_point_id, product_id) WHERE variant_id IS NULL;

-- Index and RLS for partner_point_stock
CREATE INDEX IF NOT EXISTS idx_partner_stock_point ON public.partner_point_stock(partner_point_id);
CREATE INDEX IF NOT EXISTS idx_partner_stock_product ON public.partner_point_stock(product_id);

ALTER TABLE public.partner_point_stock ENABLE ROW LEVEL SECURITY;

-- Note: Policies need to check the owner_id of the partner point, using a subquery
CREATE POLICY "Users can view their partner point stock"
    ON public.partner_point_stock FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can insert their partner point stock"
    ON public.partner_point_stock FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can update their partner point stock"
    ON public.partner_point_stock FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can delete their partner point stock"
    ON public.partner_point_stock FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

-- Also visible to public via the public catalog
CREATE POLICY "Public can view partner point stock"
    ON public.partner_point_stock FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.status = 'active'));


-- Table: partner_point_settlements
CREATE TABLE IF NOT EXISTS public.partner_point_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_point_id UUID NOT NULL REFERENCES public.partner_points(id) ON DELETE CASCADE,
    period_start DATE,
    period_end DATE,
    total_sales DECIMAL(10,2) DEFAULT 0,
    partner_commission DECIMAL(10,2) DEFAULT 0,
    machine_fees DECIMAL(10,2) DEFAULT 0,
    net_partner DECIMAL(10,2) DEFAULT 0,
    net_store DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid'
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index and RLS for partner_point_settlements
CREATE INDEX IF NOT EXISTS idx_partner_settlements_point ON public.partner_point_settlements(partner_point_id);

ALTER TABLE public.partner_point_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their partner settlements"
    ON public.partner_point_settlements FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can insert their partner settlements"
    ON public.partner_point_settlements FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can update their partner settlements"
    ON public.partner_point_settlements FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can delete their partner settlements"
    ON public.partner_point_settlements FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.partner_points p WHERE p.id = partner_point_id AND p.owner_id = auth.uid()));


-- Modifying Sales table to attach them to partner points and settlements
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS partner_point_id UUID REFERENCES public.partner_points(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS partner_settlement_id UUID REFERENCES public.partner_point_settlements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_partner_point ON public.sales(partner_point_id);
CREATE INDEX IF NOT EXISTS idx_sales_partner_settlement ON public.sales(partner_settlement_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_partner_points_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXCLUDED.updated_at;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_partner_stock_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXCLUDED.updated_at;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_partner_points_modtime') THEN
    CREATE TRIGGER update_partner_points_modtime
    BEFORE UPDATE ON public.partner_points
    FOR EACH ROW EXECUTE FUNCTION update_partner_points_modtime();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_partner_stock_modtime') THEN
    CREATE TRIGGER update_partner_stock_modtime
    BEFORE UPDATE ON public.partner_point_stock
    FOR EACH ROW EXECUTE FUNCTION update_partner_stock_modtime();
  END IF;
END $$;
