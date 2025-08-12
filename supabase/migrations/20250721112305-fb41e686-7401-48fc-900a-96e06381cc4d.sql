-- Change default currency from USD to EUR
ALTER TABLE public.deals ALTER COLUMN currency_type SET DEFAULT 'EUR';