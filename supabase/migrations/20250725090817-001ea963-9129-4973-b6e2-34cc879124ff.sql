
-- Add missing fields to the deals table for RFQ stage
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS total_contract_value numeric,
ADD COLUMN IF NOT EXISTS project_duration integer,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q1 numeric,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q2 numeric,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q3 numeric,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q4 numeric,
ADD COLUMN IF NOT EXISTS total_revenue numeric;

-- Set default value for currency_type to EUR if not already set
UPDATE public.deals 
SET currency_type = 'EUR' 
WHERE currency_type IS NULL;
