-- First update existing invalid data for customer_need
UPDATE deals SET customer_need = 'Open' WHERE customer_need = 'q';
UPDATE deals SET customer_need = 'Open' WHERE customer_need = 'Medium';

-- Now add the constraint for customer_need
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_customer_need_check;
ALTER TABLE deals ADD CONSTRAINT deals_customer_need_check 
CHECK (customer_need IN ('Open', 'Ongoing', 'Done') OR customer_need IS NULL);