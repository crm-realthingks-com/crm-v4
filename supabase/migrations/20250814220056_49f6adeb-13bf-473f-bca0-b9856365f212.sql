
-- Remove meeting-related tables and their dependencies
DROP TABLE IF EXISTS public.meeting_outcomes CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;

-- Remove any triggers related to meetings (if any exist)
-- Note: Based on the schema, there don't appear to be any meeting-specific triggers to remove
