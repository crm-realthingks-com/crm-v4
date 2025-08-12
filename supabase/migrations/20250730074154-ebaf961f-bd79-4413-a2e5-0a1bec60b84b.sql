
-- Update RLS policies to allow universal access for all users
-- This removes restrictions based on user ownership or roles

-- Contacts table - Universal access
DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;

CREATE POLICY "Universal access to contacts" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leads table - Universal access
DROP POLICY IF EXISTS "Users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads" ON public.leads;

CREATE POLICY "Universal access to leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Deals table - Universal access
DROP POLICY IF EXISTS "Users can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Users can insert deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete deals" ON public.deals;

CREATE POLICY "Universal access to deals" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meetings table - Universal access
DROP POLICY IF EXISTS "Users can view all meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete meetings" ON public.meetings;

CREATE POLICY "Universal access to meetings" ON public.meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting outcomes table - Universal access
DROP POLICY IF EXISTS "Users can view all meeting outcomes" ON public.meeting_outcomes;
DROP POLICY IF EXISTS "Users can create meeting outcomes" ON public.meeting_outcomes;
DROP POLICY IF EXISTS "Users can update meeting outcomes" ON public.meeting_outcomes;
DROP POLICY IF EXISTS "Users can delete meeting outcomes" ON public.meeting_outcomes;

CREATE POLICY "Universal access to meeting outcomes" ON public.meeting_outcomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Yearly revenue targets table - Universal access
DROP POLICY IF EXISTS "Users can view yearly revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Users can create yearly revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Users can update yearly revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Users can delete yearly revenue targets" ON public.yearly_revenue_targets;

CREATE POLICY "Universal access to yearly revenue targets" ON public.yearly_revenue_targets FOR ALL TO authenticated USING (true) WITH CHECK (true);
