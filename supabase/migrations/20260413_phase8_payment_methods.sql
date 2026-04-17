CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    fee_percentage numeric(5,2) DEFAULT 0,
    is_installment boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment methods" 
    ON public.payment_methods FOR ALL 
    USING (auth.uid() = owner_id);

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date date;
