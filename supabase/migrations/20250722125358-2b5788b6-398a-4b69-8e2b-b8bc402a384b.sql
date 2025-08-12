-- Add missing columns to deals table to match the Deal interface

-- Lead stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS priority INTEGER;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS internal_comment TEXT;

-- Discussions stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expected_closing_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS customer_need TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS customer_challenges TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS relationship_strength TEXT CHECK (relationship_strength IN ('Low', 'Medium', 'High'));

-- Qualified stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS budget TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS business_value TEXT CHECK (business_value IN ('Low', 'Medium', 'High'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS decision_maker_level TEXT CHECK (decision_maker_level IN ('Not Identified', 'Identified', 'Done'));

-- RFQ stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS revenue NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS end_date DATE;

-- Offered stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency_type TEXT CHECK (currency_type IN ('EUR', 'USD', 'INR'));
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS action_items TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS current_status TEXT;

-- Lost stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS need_improvement TEXT;

-- Update existing columns to match expected names/constraints
-- Convert win_reason to won_reason for consistency
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS won_reason TEXT;
UPDATE public.deals SET won_reason = win_reason WHERE won_reason IS NULL AND win_reason IS NOT NULL;

-- Convert loss_reason to lost_reason for consistency  
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;
UPDATE public.deals SET lost_reason = loss_reason WHERE lost_reason IS NULL AND loss_reason IS NOT NULL;