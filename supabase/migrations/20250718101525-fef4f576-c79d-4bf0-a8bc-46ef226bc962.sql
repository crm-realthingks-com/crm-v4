-- Update deals table to match CRM requirements
-- Add missing columns for the pipeline stages

-- Lead stage fields
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS project_name TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS lead_name TEXT,
ADD COLUMN IF NOT EXISTS lead_owner TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority >= 1 AND priority <= 5),
ADD COLUMN IF NOT EXISTS internal_comment TEXT;

-- Discussions stage fields  
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS expected_closing_date DATE,
ADD COLUMN IF NOT EXISTS customer_need TEXT CHECK (customer_need IN ('Not Identified', 'In Discussion', 'Done')),
ADD COLUMN IF NOT EXISTS challenges TEXT CHECK (challenges IN ('Not Identified', 'In Discussion', 'Done')),
ADD COLUMN IF NOT EXISTS relationship_strength TEXT CHECK (relationship_strength IN ('Low', 'Medium', 'High')),
ADD COLUMN IF NOT EXISTS discussions_comment TEXT;

-- Qualified stage fields
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS budget_status TEXT CHECK (budget_status IN ('Unknown', 'Confirmed', 'Open', 'Closed')),
ADD COLUMN IF NOT EXISTS business_value TEXT CHECK (business_value IN ('Low', 'Medium', 'High')),
ADD COLUMN IF NOT EXISTS decision_maker_level TEXT CHECK (decision_maker_level IN ('Not Identified', 'Identified', 'Done')),
ADD COLUMN IF NOT EXISTS qualified_comment TEXT;

-- RFQ stage fields
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS duration_months INTEGER,
ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS rfq_comment TEXT;

-- Offered stage fields
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS total_contract_value NUMERIC,
ADD COLUMN IF NOT EXISTS currency_type TEXT DEFAULT 'USD' CHECK (currency_type IN ('EUR', 'USD', 'INR')),
ADD COLUMN IF NOT EXISTS revenue_q1 NUMERIC,
ADD COLUMN IF NOT EXISTS revenue_q2 NUMERIC,
ADD COLUMN IF NOT EXISTS revenue_q3 NUMERIC,
ADD COLUMN IF NOT EXISTS revenue_q4 NUMERIC,
ADD COLUMN IF NOT EXISTS action_items TEXT,
ADD COLUMN IF NOT EXISTS current_status TEXT,
ADD COLUMN IF NOT EXISTS closing_notes TEXT,
ADD COLUMN IF NOT EXISTS offered_comment TEXT;

-- Final stage fields
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS final_status TEXT,
ADD COLUMN IF NOT EXISTS final_comment TEXT;

-- Update stage field to use correct enum values
ALTER TABLE public.deals 
DROP CONSTRAINT IF EXISTS deals_stage_check;

ALTER TABLE public.deals
ADD CONSTRAINT deals_stage_check 
CHECK (stage IN ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));

-- Set default stage to Lead
ALTER TABLE public.deals 
ALTER COLUMN stage SET DEFAULT 'Lead';

-- Update deal_name to project_name mapping if needed
UPDATE public.deals 
SET project_name = deal_name 
WHERE project_name IS NULL AND deal_name IS NOT NULL;