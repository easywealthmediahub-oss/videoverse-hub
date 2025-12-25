-- Create ad_performance table
CREATE TABLE public.ad_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_unit_id UUID REFERENCES public.ad_units(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  revenue DECIMAL(10, 4) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ad_unit_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.ad_performance ENABLE ROW LEVEL SECURITY;

-- Create policy for ad performance
CREATE POLICY "Admins can view ad performance" ON public.ad_performance
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can insert ad performance" ON public.ad_performance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can update ad performance" ON public.ad_performance
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX idx_ad_performance_ad_unit_id ON public.ad_performance(ad_unit_id);
CREATE INDEX idx_ad_performance_date ON public.ad_performance(date);
CREATE INDEX idx_ad_performance_created_at ON public.ad_performance(created_at);

-- Create updated_at trigger
CREATE TRIGGER handle_ad_performance_updated_at
  BEFORE UPDATE ON public.ad_performance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();