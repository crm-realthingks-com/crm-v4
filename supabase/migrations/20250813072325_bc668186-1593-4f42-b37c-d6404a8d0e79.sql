
-- Phase 1: Critical Data Protection - Fix RLS Policies

-- 1. Fix Contacts table RLS policies
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;

CREATE POLICY "Users can view contacts they created or own" 
ON public.contacts 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = contact_owner OR 
  is_current_user_admin()
);

-- 2. Fix Leads table RLS policies  
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;

CREATE POLICY "Users can view leads they created or own" 
ON public.leads 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = contact_owner OR 
  is_current_user_admin()
);

-- 3. Fix Deals table RLS policies
DROP POLICY IF EXISTS "Users can view all deals" ON public.deals;

CREATE POLICY "Users can view deals they created" 
ON public.deals 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  is_current_user_admin()
);

-- 4. Fix Profiles table RLS policies (limit sensitive profile data)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile and admins can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  is_current_user_admin()
);

-- Phase 2: Database Security Hardening - Fix Database Functions

-- 1. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, "Email ID")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- 2. Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if the current user has admin role in their user_metadata
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin',
    false
  );
END;
$function$;

-- 3. Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_action text, p_resource_type text, p_resource_id text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$function$;

-- 4. Fix update functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_dashboard_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_yearly_revenue_targets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. Fix validate_deal_dates function
CREATE OR REPLACE FUNCTION public.validate_deal_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Validate signed_contract_date is not in the future
  IF NEW.signed_contract_date IS NOT NULL AND NEW.signed_contract_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Signed contract date cannot be in the future';
  END IF;
  
  -- Validate implementation_start_date is not in the future
  IF NEW.implementation_start_date IS NOT NULL AND NEW.implementation_start_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Implementation start date cannot be in the future';
  END IF;
  
  -- Validate handoff_status is required if implementation_start_date is set
  IF NEW.implementation_start_date IS NOT NULL AND (NEW.handoff_status IS NULL OR NEW.handoff_status = '') THEN
    RAISE EXCEPTION 'Handoff status is required when implementation start date is set';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Phase 3: Enhanced Security Audit Logging

-- Create enhanced security audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_data_access(p_table_name text, p_operation text, p_record_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log data access events for auditing
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    p_operation,
    p_table_name,
    p_record_id,
    jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    inet_client_addr()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    NULL;
END;
$function$;
