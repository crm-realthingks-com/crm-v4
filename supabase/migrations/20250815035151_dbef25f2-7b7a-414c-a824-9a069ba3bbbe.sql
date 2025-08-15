-- Enable real-time for deals table
ALTER TABLE public.deals REPLICA IDENTITY FULL;

-- Add deals table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;