
-- First, let's create the secure user roles system if it doesn't exist
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles securely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create improved admin check function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Update deals table RLS policies with proper admin access and logging
DROP POLICY IF EXISTS "Users can view deals they created" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update deals they created" ON public.deals;
DROP POLICY IF EXISTS "Admins can delete any deal, users can delete their own" ON public.deals;

-- SELECT policy: Admins see all, users see their own
CREATE POLICY "Users can view deals they created, admins see all"
ON public.deals
FOR SELECT
USING (
  public.is_current_user_admin() 
  OR (auth.uid() = created_by)
);

-- INSERT policy: Users can create deals with proper ownership
CREATE POLICY "Users can create deals"
ON public.deals
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND created_by IS NOT NULL
);

-- UPDATE policy: Admins can update all, users can update their own
CREATE POLICY "Users can update deals they created, admins update all"
ON public.deals
FOR UPDATE
USING (
  public.is_current_user_admin()
  OR (auth.uid() = created_by)
);

-- DELETE policy: Admins can delete all, users can delete their own
CREATE POLICY "Users can delete deals they created, admins delete all"
ON public.deals
FOR DELETE
USING (
  public.is_current_user_admin()
  OR (auth.uid() = created_by)
);

-- Add constraint to ensure deals always have an owner
ALTER TABLE public.deals 
ADD CONSTRAINT IF NOT EXISTS deals_ownership_check 
CHECK (created_by IS NOT NULL);

-- Create RLS policies for user_roles table
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to log permission denials
CREATE OR REPLACE FUNCTION public.log_permission_denial(
  p_table_name TEXT,
  p_operation TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    details
  ) VALUES (
    p_user_id,
    'PERMISSION_DENIED',
    p_table_name,
    jsonb_build_object(
      'operation', p_operation,
      'timestamp', NOW(),
      'additional_details', p_details
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    NULL;
END;
$$;
