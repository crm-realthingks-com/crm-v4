-- Create a more robust admin check function that works with the user metadata
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the current user has admin role in their user_metadata
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

-- Temporarily disable RLS to allow admin users to see all data regardless of ownership
-- Update contacts RLS policies for better admin access
DROP POLICY IF EXISTS "Users can view contacts they created or own" ON contacts;
CREATE POLICY "Users can view contacts they created or own"
ON contacts FOR SELECT
USING (
  -- Allow admins to see everything
  COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false) OR
  -- Allow users to see their own records
  auth.uid() = created_by OR 
  auth.uid() = contact_owner OR
  -- Allow access to unowned records
  (created_by IS NULL AND contact_owner IS NULL)
);

-- Update leads RLS policies for better admin access  
DROP POLICY IF EXISTS "Users can view leads they created or own" ON leads;
CREATE POLICY "Users can view leads they created or own"
ON leads FOR SELECT  
USING (
  -- Allow admins to see everything
  COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false) OR
  -- Allow users to see their own records
  auth.uid() = created_by OR 
  auth.uid() = contact_owner OR
  -- Allow access to unowned records
  (created_by IS NULL AND contact_owner IS NULL)
);

-- Update deals RLS policies for better admin access
DROP POLICY IF EXISTS "Users can view deals they created" ON deals;
CREATE POLICY "Users can view deals they created"
ON deals FOR SELECT
USING (
  -- Allow admins to see everything
  COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false) OR
  -- Allow users to see their own records
  auth.uid() = created_by OR
  -- Allow access to unowned records
  (created_by IS NULL)
);