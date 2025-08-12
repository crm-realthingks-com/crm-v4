-- Fix the stage check constraint to allow all expected DealStage values

-- First, drop the existing constraint
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Add the correct constraint with all valid stage values
ALTER TABLE public.deals 
ADD CONSTRAINT deals_stage_check 
CHECK (stage IN ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));

-- Update the default value to match the application expectation
ALTER TABLE public.deals ALTER COLUMN stage SET DEFAULT 'Lead';