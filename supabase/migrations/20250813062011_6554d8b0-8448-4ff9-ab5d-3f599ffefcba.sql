
-- Remove unwanted columns from contacts table
ALTER TABLE public.contacts 
DROP COLUMN IF EXISTS mobile_no,
DROP COLUMN IF EXISTS lead_status,
DROP COLUMN IF EXISTS no_of_employees,
DROP COLUMN IF EXISTS annual_revenue,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state;
