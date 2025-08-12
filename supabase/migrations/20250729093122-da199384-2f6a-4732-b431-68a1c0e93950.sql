
-- Add the new fields to the deals table for the Won stage
ALTER TABLE public.deals 
ADD COLUMN signed_contract_date DATE,
ADD COLUMN implementation_start_date DATE,
ADD COLUMN handoff_status TEXT CHECK (handoff_status IN ('Not Started', 'In Progress', 'Complete'));

-- Create validation triggers to ensure dates are not in the future
CREATE OR REPLACE FUNCTION validate_deal_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate signed_contract_date is not in the future
  IF NEW.signed_contract_date IS NOT NULL AND NEW.signed_contract_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Signed contract date cannot be in the future';
  END IF;
  
  -- Validate implementation_start_date is not in the future
  IF NEW.implementation_start_date IS NOT NULL AND NEW.implementation_start_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Implementation start date cannot be in the future';
  END IF;
  
  -- Validate handoff_status is required if implementation_start_date is set
  IF NEW.implementation_start_date IS NOT NULL AND (NEW.handoff_status IS NULL OR NEW.handoff_status = '') THEN
    RAISE EXCEPTION 'Handoff status is required when implementation start date is set';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER validate_deal_dates_trigger
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION validate_deal_dates();

-- Add missing RFQ fields that might not exist (with IF NOT EXISTS checks)
DO $$
BEGIN
  -- Check and add rfq_received_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'deals' AND column_name = 'rfq_received_date') THEN
    ALTER TABLE public.deals ADD COLUMN rfq_received_date DATE;
  END IF;
  
  -- Check and add proposal_due_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'deals' AND column_name = 'proposal_due_date') THEN
    ALTER TABLE public.deals ADD COLUMN proposal_due_date DATE;
  END IF;
  
  -- Check and add rfq_status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'deals' AND column_name = 'rfq_status') THEN
    ALTER TABLE public.deals ADD COLUMN rfq_status TEXT;
  END IF;
END $$;
