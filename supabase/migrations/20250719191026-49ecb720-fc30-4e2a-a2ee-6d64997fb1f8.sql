-- Fix the trigger function to use modified_at instead of updated_at for deals table
CREATE OR REPLACE FUNCTION public.update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop any existing triggers on deals table that might be causing issues
DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
DROP TRIGGER IF EXISTS update_deals_modified_at ON public.deals;

-- Create the correct trigger for the deals table
CREATE TRIGGER update_deals_modified_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_at_column();