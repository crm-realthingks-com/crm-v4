-- Update constraint for customer_need to allow Open, Ongoing, Done values
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_customer_need_check;
ALTER TABLE deals ADD CONSTRAINT deals_customer_need_check 
CHECK (customer_need IN ('Open', 'Ongoing', 'Done') OR customer_need IS NULL);