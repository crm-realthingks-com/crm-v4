
-- Add any missing columns that might be needed for complete stage support
-- These are fields that are used in the UI but might not be in the database

-- Check if fax column exists, if not add it (legacy field that might be referenced)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'fax') THEN
        ALTER TABLE deals ADD COLUMN fax text;
    END IF;
END $$;

-- Ensure all quarterly revenue fields are properly typed as numeric
ALTER TABLE deals ALTER COLUMN quarterly_revenue_q1 TYPE numeric USING quarterly_revenue_q1::numeric;
ALTER TABLE deals ALTER COLUMN quarterly_revenue_q2 TYPE numeric USING quarterly_revenue_q2::numeric;
ALTER TABLE deals ALTER COLUMN quarterly_revenue_q3 TYPE numeric USING quarterly_revenue_q3::numeric;
ALTER TABLE deals ALTER COLUMN quarterly_revenue_q4 TYPE numeric USING quarterly_revenue_q4::numeric;

-- Add missing phone_no field that's referenced in some components
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'phone_no') THEN
        ALTER TABLE deals ADD COLUMN phone_no text;
    END IF;
END $$;

-- Add company_name field if missing (used in lead selection)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'deals' AND column_name = 'company_name') THEN
        ALTER TABLE deals ADD COLUMN company_name text;
    END IF;
END $$;

-- Ensure all stage-specific fields have proper defaults
UPDATE deals SET quarterly_revenue_q1 = 0 WHERE quarterly_revenue_q1 IS NULL;
UPDATE deals SET quarterly_revenue_q2 = 0 WHERE quarterly_revenue_q2 IS NULL;
UPDATE deals SET quarterly_revenue_q3 = 0 WHERE quarterly_revenue_q3 IS NULL;
UPDATE deals SET quarterly_revenue_q4 = 0 WHERE quarterly_revenue_q4 IS NULL;

-- Add constraints for stage values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'deals' AND constraint_name = 'deals_stage_check') THEN
        ALTER TABLE deals ADD CONSTRAINT deals_stage_check 
        CHECK (stage IN ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));
    END IF;
END $$;

-- Add constraint for currency types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'deals' AND constraint_name = 'deals_currency_type_check') THEN
        ALTER TABLE deals ADD CONSTRAINT deals_currency_type_check 
        CHECK (currency_type IN ('EUR', 'USD', 'INR') OR currency_type IS NULL);
    END IF;
END $$;

-- Add constraint for priority values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'deals' AND constraint_name = 'deals_priority_check') THEN
        ALTER TABLE deals ADD CONSTRAINT deals_priority_check 
        CHECK (priority >= 1 AND priority <= 5 OR priority IS NULL);
    END IF;
END $$;

-- Add constraint for probability values
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'deals' AND constraint_name = 'deals_probability_check') THEN
        ALTER TABLE deals ADD CONSTRAINT deals_probability_check 
        CHECK (probability >= 0 AND probability <= 100 OR probability IS NULL);
    END IF;
END $$;
