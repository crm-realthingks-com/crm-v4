-- Drop existing tables and recreate with correct schema
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create deals table with all required fields matching the Deal interface
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  
  -- Basic deal info
  deal_name TEXT,
  stage TEXT NOT NULL DEFAULT 'Lead',
  
  -- Lead stage fields
  project_name TEXT,
  customer_name TEXT,
  lead_name TEXT,
  lead_owner TEXT,
  region TEXT,
  priority INTEGER,
  probability INTEGER,
  internal_comment TEXT,
  
  -- Discussions stage fields
  expected_closing_date DATE,
  customer_need TEXT,
  customer_challenges TEXT,
  relationship_strength TEXT,
  
  -- Qualified stage fields
  budget TEXT,
  business_value TEXT,
  decision_maker_level TEXT,
  
  -- RFQ stage fields
  is_recurring BOOLEAN DEFAULT false,
  project_type TEXT,
  duration INTEGER,
  revenue NUMERIC,
  start_date DATE,
  end_date DATE,
  
  -- Offered stage fields
  total_contract_value NUMERIC,
  currency_type TEXT DEFAULT 'USD',
  action_items TEXT,
  current_status TEXT,
  closing_notes TEXT,
  
  -- Final stage fields
  won_reason TEXT,
  lost_reason TEXT,
  need_improvement TEXT,
  drop_reason TEXT,
  
  -- Additional fields from existing schema
  related_lead_id UUID,
  related_meeting_id UUID,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  closing_date DATE,
  description TEXT,
  discussion_notes TEXT,
  budget_holder TEXT,
  decision_makers TEXT,
  timeline TEXT,
  nda_signed BOOLEAN,
  supplier_portal_required BOOLEAN,
  rfq_document_link TEXT,
  rfq_confirmation_note TEXT,
  offer_sent_date DATE,
  revised_offer_notes TEXT,
  negotiation_notes TEXT,
  execution_started BOOLEAN,
  lost_to TEXT,
  lost_reason_detail TEXT,
  learning_summary TEXT,
  drop_summary TEXT,
  internal_notes TEXT,
  confirmation_note TEXT,
  begin_execution_date DATE,
  customer_need_identified BOOLEAN,
  need_summary TEXT,
  decision_maker_present BOOLEAN,
  customer_agreed_on_need TEXT,
  budget_confirmed TEXT,
  supplier_portal_access TEXT,
  expected_deal_timeline_start DATE,
  expected_deal_timeline_end DATE,
  rfq_value NUMERIC,
  rfq_document_url TEXT,
  product_service_scope TEXT,
  proposal_sent_date DATE,
  negotiation_status TEXT,
  decision_expected_date DATE,
  win_reason TEXT,
  monthly_revenue NUMERIC,
  duration_months INTEGER,
  rfq_comment TEXT,
  revenue_q1 NUMERIC,
  revenue_q2 NUMERIC,
  revenue_q3 NUMERIC,
  revenue_q4 NUMERIC,
  offered_comment TEXT,
  final_status TEXT,
  final_comment TEXT,
  contact_person TEXT,
  challenges TEXT,
  discussions_comment TEXT,
  budget_status TEXT,
  qualified_comment TEXT
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deals
CREATE POLICY "Users can view their own deals" 
ON public.deals 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own deals" 
ON public.deals 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own deals" 
ON public.deals 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deals_modified_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  modified_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  lead_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone_no TEXT,
  mobile_no TEXT,
  position TEXT,
  city TEXT,
  country TEXT,
  industry TEXT,
  no_of_employees INTEGER,
  website TEXT,
  linkedin TEXT,
  contact_source TEXT,
  lead_status TEXT DEFAULT 'New',
  interest TEXT,
  description TEXT
);

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  contact_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone_no TEXT,
  mobile_no TEXT,
  position TEXT,
  city TEXT,
  country TEXT,
  industry TEXT,
  website TEXT,
  linkedin TEXT,
  contact_source TEXT,
  description TEXT
);

-- Enable RLS for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  module_type TEXT,
  module_id TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger to automatically update modified_at for deals
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to deals table
CREATE TRIGGER update_deals_modified_at_trigger
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION update_modified_at_column();