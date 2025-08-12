
-- Create a table for yearly revenue targets
CREATE TABLE public.yearly_revenue_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  total_target NUMERIC NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.yearly_revenue_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for yearly revenue targets
CREATE POLICY "Users can view yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR DELETE 
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_yearly_revenue_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_yearly_revenue_targets_updated_at
  BEFORE UPDATE ON public.yearly_revenue_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_yearly_revenue_targets_updated_at();
