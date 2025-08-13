
-- Remove unused fields from leads table
ALTER TABLE public.leads DROP COLUMN IF EXISTS mobile_no;
ALTER TABLE public.leads DROP COLUMN IF EXISTS city;

-- Update lead_status column to have proper enum values and default
-- First, update any existing NULL values to 'New'
UPDATE public.leads SET lead_status = 'New' WHERE lead_status IS NULL;

-- Now alter the column to set default and add constraint
ALTER TABLE public.leads 
ALTER COLUMN lead_status SET DEFAULT 'New';

-- Add check constraint for valid lead_status values
ALTER TABLE public.leads 
ADD CONSTRAINT lead_status_check 
CHECK (lead_status IN ('New', 'Contacted', 'Converted'));
