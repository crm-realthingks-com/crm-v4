-- Fix RLS policies to allow proper data visibility

-- Update contacts RLS policies to show all data to admins and fix owner logic
DROP POLICY IF EXISTS "Users can view contacts they created or own" ON contacts;
CREATE POLICY "Users can view contacts they created or own"
ON contacts FOR SELECT
USING (
  is_current_user_admin() OR
  auth.uid() = created_by OR 
  auth.uid() = contact_owner OR
  (created_by IS NULL AND contact_owner IS NULL) -- Show unowned records to all users
);

-- Update leads RLS policies similarly  
DROP POLICY IF EXISTS "Users can view leads they created or own" ON leads;
CREATE POLICY "Users can view leads they created or own"
ON leads FOR SELECT  
USING (
  is_current_user_admin() OR
  auth.uid() = created_by OR 
  auth.uid() = contact_owner OR
  (created_by IS NULL AND contact_owner IS NULL) -- Show unowned records to all users
);

-- Update deals RLS policies
DROP POLICY IF EXISTS "Users can view deals they created" ON deals;
CREATE POLICY "Users can view deals they created"
ON deals FOR SELECT
USING (
  is_current_user_admin() OR
  auth.uid() = created_by OR
  (created_by IS NULL) -- Show unowned records to all users  
);