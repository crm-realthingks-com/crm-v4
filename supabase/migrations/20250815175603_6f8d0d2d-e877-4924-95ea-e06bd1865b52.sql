
-- Create user roles enum and table for server-controlled roles
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'user');

-- Create user_roles table with server-controlled role management
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id;
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(get_user_role(user_id) = 'admin', false);
$$;

-- Update the existing is_current_user_admin function to use server-controlled roles
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_user_admin(auth.uid());
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR is_user_admin());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

-- Update deals RLS policies to remove NULL owner access
DROP POLICY IF EXISTS "Users can view deals they created" ON public.deals;
CREATE POLICY "Users can view deals they created"
  ON public.deals
  FOR SELECT
  USING (is_user_admin() OR auth.uid() = created_by);

-- Update contacts RLS policies to remove NULL owner access  
DROP POLICY IF EXISTS "Users can view contacts they created or own" ON public.contacts;
CREATE POLICY "Users can view contacts they created or own"
  ON public.contacts
  FOR SELECT
  USING (is_user_admin() OR auth.uid() = created_by OR auth.uid() = contact_owner);

-- Update leads RLS policies to remove NULL owner access
DROP POLICY IF EXISTS "Users can view leads they created or own" ON public.leads;
CREATE POLICY "Users can view leads they created or own"
  ON public.leads
  FOR SELECT
  USING (is_user_admin() OR auth.uid() = created_by OR auth.uid() = contact_owner);

-- Create function to initialize user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Restrict security_audit_log inserts to authenticated users only
DROP POLICY IF EXISTS "System can insert security audit logs" ON public.security_audit_log;
CREATE POLICY "Authenticated users can insert security audit logs"
  ON public.security_audit_log
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
