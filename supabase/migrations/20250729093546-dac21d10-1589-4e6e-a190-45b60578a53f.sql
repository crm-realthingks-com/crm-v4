
-- Create or update the validation trigger for deal dates
CREATE OR REPLACE FUNCTION public.validate_deal_dates()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
$function$;

-- Create the trigger if it doesn't exist, or replace it if it does
DROP TRIGGER IF EXISTS validate_deal_dates_trigger ON public.deals;
CREATE TRIGGER validate_deal_dates_trigger
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_deal_dates();
