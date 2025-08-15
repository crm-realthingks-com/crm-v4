
-- Disable RLS on all tables
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_revenue_targets DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on contacts table
DROP POLICY IF EXISTS "Admins can delete any contact, users can delete their own" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts they created or own" ON public.contacts;
DROP POLICY IF EXISTS "Users can view contacts they created or own" ON public.contacts;

-- Drop all existing RLS policies on dashboard_preferences table
DROP POLICY IF EXISTS "Users can create their own dashboard preferences" ON public.dashboard_preferences;
DROP POLICY IF EXISTS "Users can delete their own dashboard preferences" ON public.dashboard_preferences;
DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON public.dashboard_preferences;
DROP POLICY IF EXISTS "Users can view their own dashboard preferences" ON public.dashboard_preferences;

-- Drop all existing RLS policies on deals table
DROP POLICY IF EXISTS "Admins can delete any deal, users can delete their own" ON public.deals;
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update deals they created" ON public.deals;
DROP POLICY IF EXISTS "Users can view deals they created" ON public.deals;

-- Drop all existing RLS policies on leads table
DROP POLICY IF EXISTS "Admins can delete any lead, users can delete their own" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads they created or own" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads they created or own" ON public.leads;

-- Drop all existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;

-- Drop all existing RLS policies on security_audit_log table
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert security audit logs" ON public.security_audit_log;

-- Drop all existing RLS policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Drop all existing RLS policies on yearly_revenue_targets table
DROP POLICY IF EXISTS "Admins can create yearly revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Admins can delete yearly revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Admins can update yearly revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Admins can view all yearly revenue targets" ON public.yearly_revenue_targets;

-- Grant full access to authenticated users on all tables
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.dashboard_preferences TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.security_audit_log TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.yearly_revenue_targets TO authenticated;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
