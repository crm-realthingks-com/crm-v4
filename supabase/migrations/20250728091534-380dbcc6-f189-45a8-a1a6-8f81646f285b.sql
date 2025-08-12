
-- Clean up unused fields from deals table
-- Remove outdated fields that are no longer used in the current stage-wise workflow

-- Drop unused boolean fields
ALTER TABLE deals DROP COLUMN IF EXISTS customer_need_identified;
ALTER TABLE deals DROP COLUMN IF EXISTS decision_maker_present;
ALTER TABLE deals DROP COLUMN IF EXISTS nda_signed;
ALTER TABLE deals DROP COLUMN IF EXISTS execution_started;
ALTER TABLE deals DROP COLUMN IF EXISTS supplier_portal_required;

-- Drop unused date fields that are replaced by start_date/end_date
ALTER TABLE deals DROP COLUMN IF EXISTS closing_date;
ALTER TABLE deals DROP COLUMN IF EXISTS expected_deal_timeline_start;
ALTER TABLE deals DROP COLUMN IF EXISTS expected_deal_timeline_end;
ALTER TABLE deals DROP COLUMN IF EXISTS proposal_sent_date;
ALTER TABLE deals DROP COLUMN IF EXISTS decision_expected_date;
ALTER TABLE deals DROP COLUMN IF EXISTS begin_execution_date;

-- Drop unused numeric fields
ALTER TABLE deals DROP COLUMN IF EXISTS amount;
ALTER TABLE deals DROP COLUMN IF EXISTS rfq_value;

-- Drop unused text fields that are replaced by stage-specific fields
ALTER TABLE deals DROP COLUMN IF EXISTS customer_agreed_on_need;
ALTER TABLE deals DROP COLUMN IF EXISTS budget_confirmed;
ALTER TABLE deals DROP COLUMN IF EXISTS supplier_portal_access;
ALTER TABLE deals DROP COLUMN IF EXISTS rfq_document_url;
ALTER TABLE deals DROP COLUMN IF EXISTS product_service_scope;
ALTER TABLE deals DROP COLUMN IF EXISTS negotiation_status;
ALTER TABLE deals DROP COLUMN IF EXISTS win_reason;
ALTER TABLE deals DROP COLUMN IF EXISTS loss_reason;
ALTER TABLE deals DROP COLUMN IF EXISTS internal_notes;
ALTER TABLE deals DROP COLUMN IF EXISTS budget_holder;
ALTER TABLE deals DROP COLUMN IF EXISTS decision_makers;
ALTER TABLE deals DROP COLUMN IF EXISTS timeline;
ALTER TABLE deals DROP COLUMN IF EXISTS rfq_confirmation_note;
ALTER TABLE deals DROP COLUMN IF EXISTS negotiation_notes;
ALTER TABLE deals DROP COLUMN IF EXISTS currency;
ALTER TABLE deals DROP COLUMN IF EXISTS need_summary;

-- Add constraints to ensure data integrity
ALTER TABLE deals ADD CONSTRAINT deals_priority_check CHECK (priority >= 1 AND priority <= 5);
ALTER TABLE deals ADD CONSTRAINT deals_probability_check CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));
ALTER TABLE deals ADD CONSTRAINT deals_currency_type_check CHECK (currency_type IN ('EUR', 'USD', 'INR'));
ALTER TABLE deals ADD CONSTRAINT deals_customer_challenges_check CHECK (customer_challenges IN ('Open', 'Ongoing', 'Done'));
ALTER TABLE deals ADD CONSTRAINT deals_relationship_strength_check CHECK (relationship_strength IN ('Low', 'Medium', 'High'));
ALTER TABLE deals ADD CONSTRAINT deals_business_value_check CHECK (business_value IN ('Open', 'Ongoing', 'Done'));
ALTER TABLE deals ADD CONSTRAINT deals_decision_maker_level_check CHECK (decision_maker_level IN ('Open', 'Ongoing', 'Done'));
ALTER TABLE deals ADD CONSTRAINT deals_is_recurring_check CHECK (is_recurring IN ('Yes', 'No', 'Unclear'));
