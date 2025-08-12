-- Fix the business_value check constraint to allow Open/Ongoing/Done values
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_business_value_check;

-- Add the correct check constraint for business_value
ALTER TABLE deals ADD CONSTRAINT deals_business_value_check 
CHECK (business_value IS NULL OR business_value IN ('Open', 'Ongoing', 'Done'));

-- Also check if decision_maker_level has the correct constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_decision_maker_level_check;

-- Add the correct check constraint for decision_maker_level  
ALTER TABLE deals ADD CONSTRAINT deals_decision_maker_level_check 
CHECK (decision_maker_level IS NULL OR decision_maker_level IN ('Open', 'Ongoing', 'Done'));

-- Add the closing field if it doesn't exist
ALTER TABLE deals ADD COLUMN IF NOT EXISTS closing TEXT;