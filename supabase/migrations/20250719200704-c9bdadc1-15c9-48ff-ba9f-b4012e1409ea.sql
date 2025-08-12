-- Clean up unused fields from deals table, keeping only mapped stage fields
-- Remove fields that are not part of the current Deal type interface

-- First, let's see what columns we currently have that need to be removed
-- We'll keep only the fields that are mapped to deal stages plus core system fields

-- Remove unused legacy fields (these don't exist in our Deal type)
ALTER TABLE public.deals DROP COLUMN IF EXISTS related_lead_id;
ALTER TABLE public.deals DROP COLUMN IF EXISTS related_meeting_id;
ALTER TABLE public.deals DROP COLUMN IF EXISTS amount;
ALTER TABLE public.deals DROP COLUMN IF EXISTS begin_execution_date;
ALTER TABLE public.deals DROP COLUMN IF EXISTS customer_need_identified;
ALTER TABLE public.deals DROP COLUMN IF EXISTS decision_maker_present;
ALTER TABLE public.deals DROP COLUMN IF EXISTS closing_date;
ALTER TABLE public.deals DROP COLUMN IF EXISTS expected_deal_timeline_start;
ALTER TABLE public.deals DROP COLUMN IF EXISTS expected_deal_timeline_end;
ALTER TABLE public.deals DROP COLUMN IF EXISTS rfq_value;
ALTER TABLE public.deals DROP COLUMN IF EXISTS duration_months;
ALTER TABLE public.deals DROP COLUMN IF EXISTS supplier_portal_required;
ALTER TABLE public.deals DROP COLUMN IF EXISTS revenue_q1;
ALTER TABLE public.deals DROP COLUMN IF EXISTS revenue_q2;
ALTER TABLE public.deals DROP COLUMN IF EXISTS revenue_q3;
ALTER TABLE public.deals DROP COLUMN IF EXISTS revenue_q4;
ALTER TABLE public.deals DROP COLUMN IF EXISTS offer_sent_date;
ALTER TABLE public.deals DROP COLUMN IF EXISTS final_comment;
ALTER TABLE public.deals DROP COLUMN IF EXISTS contact_person;
ALTER TABLE public.deals DROP COLUMN IF EXISTS challenges;
ALTER TABLE public.deals DROP COLUMN IF EXISTS discussions_comment;
ALTER TABLE public.deals DROP COLUMN IF EXISTS budget_status;
ALTER TABLE public.deals DROP COLUMN IF EXISTS qualified_comment;
ALTER TABLE public.deals DROP COLUMN IF EXISTS nda_signed;
ALTER TABLE public.deals DROP COLUMN IF EXISTS execution_started;
ALTER TABLE public.deals DROP COLUMN IF EXISTS monthly_revenue;
ALTER TABLE public.deals DROP COLUMN IF EXISTS proposal_sent_date;
ALTER TABLE public.deals DROP COLUMN IF EXISTS decision_expected_date;
ALTER TABLE public.deals DROP COLUMN IF EXISTS description;
ALTER TABLE public.deals DROP COLUMN IF EXISTS discussion_notes;
ALTER TABLE public.deals DROP COLUMN IF EXISTS budget_holder;
ALTER TABLE public.deals DROP COLUMN IF EXISTS decision_makers;
ALTER TABLE public.deals DROP COLUMN IF EXISTS timeline;
ALTER TABLE public.deals DROP COLUMN IF EXISTS rfq_document_link;
ALTER TABLE public.deals DROP COLUMN IF EXISTS rfq_confirmation_note;
ALTER TABLE public.deals DROP COLUMN IF EXISTS revised_offer_notes;
ALTER TABLE public.deals DROP COLUMN IF EXISTS negotiation_notes;
ALTER TABLE public.deals DROP COLUMN IF EXISTS lost_to;
ALTER TABLE public.deals DROP COLUMN IF EXISTS lost_reason_detail;
ALTER TABLE public.deals DROP COLUMN IF EXISTS learning_summary;
ALTER TABLE public.deals DROP COLUMN IF EXISTS drop_summary;
ALTER TABLE public.deals DROP COLUMN IF EXISTS internal_notes;
ALTER TABLE public.deals DROP COLUMN IF EXISTS confirmation_note;
ALTER TABLE public.deals DROP COLUMN IF EXISTS need_summary;
ALTER TABLE public.deals DROP COLUMN IF EXISTS customer_agreed_on_need;
ALTER TABLE public.deals DROP COLUMN IF EXISTS budget_confirmed;
ALTER TABLE public.deals DROP COLUMN IF EXISTS supplier_portal_access;
ALTER TABLE public.deals DROP COLUMN IF EXISTS rfq_document_url;
ALTER TABLE public.deals DROP COLUMN IF EXISTS product_service_scope;
ALTER TABLE public.deals DROP COLUMN IF EXISTS negotiation_status;
ALTER TABLE public.deals DROP COLUMN IF EXISTS win_reason;
ALTER TABLE public.deals DROP COLUMN IF EXISTS rfq_comment;
ALTER TABLE public.deals DROP COLUMN IF EXISTS offered_comment;
ALTER TABLE public.deals DROP COLUMN IF EXISTS final_status;
ALTER TABLE public.deals DROP COLUMN IF EXISTS currency;
ALTER TABLE public.deals DROP COLUMN IF EXISTS closing_notes;

-- Comment for cleanup completion
COMMENT ON TABLE public.deals IS 'Deals table cleaned up to contain only mapped stage fields and core system fields';