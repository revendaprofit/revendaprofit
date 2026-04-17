CREATE TABLE public.sale_installments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
    installment_number integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.sale_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sale installments" 
    ON public.sale_installments FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.sales WHERE id = sale_id AND owner_id = auth.uid()));

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_fee_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_fee_amount_2 numeric(10,2) DEFAULT 0;
