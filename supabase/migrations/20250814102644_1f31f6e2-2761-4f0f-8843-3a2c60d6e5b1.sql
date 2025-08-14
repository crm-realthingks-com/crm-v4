
-- Add back essential auditing columns that are needed for import/export and RLS
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS modified_by uuid;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now();

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable all access for deals" ON public.deals;

-- Recreate proper RLS policies with user tracking
CREATE POLICY "Users can view deals they created" ON public.deals
  FOR SELECT USING ((auth.uid() = created_by) OR is_current_user_admin());

CREATE POLICY "Users can create deals" ON public.deals
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update deals they created" ON public.deals
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any deal, users can delete their own" ON public.deals
  FOR DELETE USING (is_current_user_admin() OR (auth.uid() = created_by));
