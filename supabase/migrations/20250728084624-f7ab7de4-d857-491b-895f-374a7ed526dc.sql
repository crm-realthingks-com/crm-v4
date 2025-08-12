
-- Clean up deals table by removing unused/duplicate fields
-- Keep only the fields that are actually used across the pipeline stages

-- Remove duplicate and unused fields
ALTER TABLE deals DROP COLUMN IF EXISTS amount;
ALTER TABLE deals DROP COLUMN IF EXISTS currency;
ALTER TABLE deals DROP COLUMN IF EXISTS closing_date;
ALTER TABLE deals DROP COLUMN IF EXISTS description;
ALTER TABLE deals DROP COLUMN IF EXISTS customer_need_identified;
ALTER TABLE deals DROP COLUMN IF EXISTS decision_maker_present;
ALTER TABLE deals DROP COLUMN IF EXISTS customer_agreed_on_need;
ALTER TABLE deals DROP COLUMN IF EXISTS budget_confirmed;
ALTER TABLE deals DROP COLUMN IF EXISTS supplier_portal_access;
ALTER TABLE deals DROP COLUMN IF EXISTS expected_deal_timeline_start;
ALTER TABLE deals DROP COLUMN IF EXISTS expected_deal_timeline_end;
ALTER TABLE deals DROP COLUMN IF EXISTS nda_signed;
ALTER TABLE deals DROP COLUMN IF EXISTS rfq_value;
ALTER TABLE deals DROP COLUMN IF EXISTS rfq_document_url;
ALTER TABLE deals DROP COLUMN IF EXISTS product_service_scope;
ALTER TABLE deals DROP COLUMN IF EXISTS proposal_sent_date;
ALTER TABLE deals DROP COLUMN IF EXISTS negotiation_status;
ALTER TABLE deals DROP COLUMN IF EXISTS decision_expected_date;
ALTER TABLE deals DROP COLUMN IF EXISTS win_reason;
ALTER TABLE deals DROP COLUMN IF EXISTS loss_reason;
ALTER TABLE deals DROP COLUMN IF EXISTS internal_notes;
ALTER TABLE deals DROP COLUMN IF EXISTS budget_holder;
ALTER TABLE deals DROP COLUMN IF EXISTS decision_makers;
ALTER TABLE deals DROP COLUMN IF EXISTS timeline;
ALTER TABLE deals DROP COLUMN IF EXISTS rfq_confirmation_note;
ALTER TABLE deals DROP COLUMN IF EXISTS negotiation_notes;
ALTER TABLE deals DROP COLUMN IF EXISTS execution_started;
ALTER TABLE deals DROP COLUMN IF EXISTS begin_execution_date;
ALTER TABLE deals DROP COLUMN IF EXISTS supplier_portal_required;
ALTER TABLE deals DROP COLUMN IF EXISTS need_summary;

-- Remove duplicate lost_reason column (there are two)
ALTER TABLE deals DROP COLUMN IF EXISTS lost_reason;

-- Add constraints for valid values
ALTER TABLE deals ADD CONSTRAINT deals_stage_check 
CHECK (stage IN ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));

ALTER TABLE deals ADD CONSTRAINT deals_currency_type_check 
CHECK (currency_type IN ('EUR', 'USD', 'INR'));

ALTER TABLE deals ADD CONSTRAINT deals_priority_check 
CHECK (priority >= 1 AND priority <= 5);

ALTER TABLE deals ADD CONSTRAINT deals_probability_check 
CHECK (probability >= 0 AND probability <= 100);

ALTER TABLE deals ADD CONSTRAINT deals_customer_need_check 
CHECK (customer_need IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE deals ADD CONSTRAINT deals_customer_challenges_check 
CHECK (customer_challenges IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE deals ADD CONSTRAINT deals_relationship_strength_check 
CHECK (relationship_strength IN ('Low', 'Medium', 'High'));

ALTER TABLE deals ADD CONSTRAINT deals_business_value_check 
CHECK (business_value IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE deals ADD CONSTRAINT deals_decision_maker_level_check 
CHECK (decision_maker_level IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE deals ADD CONSTRAINT deals_is_recurring_check 
CHECK (is_recurring IN ('Yes', 'No', 'Unclear'));

-- Ensure numeric fields are non-negative
ALTER TABLE deals ADD CONSTRAINT deals_total_contract_value_check 
CHECK (total_contract_value >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_quarterly_revenue_q1_check 
CHECK (quarterly_revenue_q1 >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_quarterly_revenue_q2_check 
CHECK (quarterly_revenue_q2 >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_quarterly_revenue_q3_check 
CHECK (quarterly_revenue_q3 >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_quarterly_revenue_q4_check 
CHECK (quarterly_revenue_q4 >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_total_revenue_check 
CHECK (total_revenue >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_project_duration_check 
CHECK (project_duration >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_duration_check 
CHECK (duration >= 0);

ALTER TABLE deals ADD CONSTRAINT deals_revenue_check 
CHECK (revenue >= 0);
