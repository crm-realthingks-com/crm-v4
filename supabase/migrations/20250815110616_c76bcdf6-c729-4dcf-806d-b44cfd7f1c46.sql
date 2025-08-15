-- Fix critical security vulnerability in contacts table RLS policy
-- Remove dangerous NULL condition that could expose sensitive customer data

DROP POLICY IF EXISTS "Users can view contacts they created or own" ON public.contacts;

CREATE POLICY "Users can view contacts they created or own" 
ON public.contacts 
FOR SELECT 
USING (
  COALESCE((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text), false) 
  OR (auth.uid() = created_by) 
  OR (auth.uid() = contact_owner)
);

-- Add constraint to prevent future NULL ownership scenarios
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_ownership_check 
CHECK (created_by IS NOT NULL OR contact_owner IS NOT NULL);