-- Update the is_recurring field to accept text values instead of boolean
-- to support Yes, No, Unclear dropdown options as specified in requirements

ALTER TABLE public.deals 
ALTER COLUMN is_recurring TYPE text;