-- Update RLS policies to make all data visible to all authenticated users

-- Drop existing restrictive policies for deals
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;

-- Create new permissive policies for deals
CREATE POLICY "Authenticated users can view all deals" 
ON public.deals 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create deals" 
ON public.deals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update all deals" 
ON public.deals 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete all deals" 
ON public.deals 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- Create new permissive policies for contacts
CREATE POLICY "Authenticated users can view all contacts" 
ON public.contacts 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create contacts" 
ON public.contacts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update all contacts" 
ON public.contacts 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete all contacts" 
ON public.contacts 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Create new permissive policies for leads
CREATE POLICY "Authenticated users can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update all leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete all leads" 
ON public.leads 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create new permissive policies for notifications
CREATE POLICY "Authenticated users can view all notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (true);