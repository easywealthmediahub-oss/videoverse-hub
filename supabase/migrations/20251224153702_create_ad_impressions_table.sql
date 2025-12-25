-- Create ad_impressions table
CREATE TABLE public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_unit_id UUID REFERENCES public.ad_units(id) ON DELETE CASCADE NOT NULL,
  video_id UUID, -- For video-specific ads
  user_id UUID, -- Anonymous tracking
  page_url TEXT,
  impression_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revenue DECIMAL(10, 4), -- Revenue generated
  ad_size VARCHAR(50),
  is_filled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Create policy for ad impressions
CREATE POLICY "Admins can view ad impressions" ON public.ad_impressions
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "Admins can insert ad impressions" ON public.ad_impressions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX idx_ad_impressions_ad_unit_id ON public.ad_impressions(ad_unit_id);
CREATE INDEX idx_ad_impressions_video_id ON public.ad_impressions(video_id);
CREATE INDEX idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_impression_time ON public.ad_impressions(impression_time);
CREATE INDEX idx_ad_impressions_created_at ON public.ad_impressions(created_at);

-- Create function and trigger for ad performance aggregation
CREATE OR REPLACE FUNCTION public.aggregate_ad_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert or update daily performance record
  INSERT INTO public.ad_performance (ad_unit_id, date, impressions, clicks, revenue)
  VALUES (
    NEW.ad_unit_id,
    NEW.impression_time::date,
    CASE WHEN NEW.is_filled THEN 1 ELSE 0 END,
    0, -- Default to 0 clicks, update separately when clicks happen
    COALESCE(NEW.revenue, 0)
  )
  ON CONFLICT (ad_unit_id, date)
  DO UPDATE SET
    impressions = ad_performance.impressions + CASE WHEN NEW.is_filled THEN 1 ELSE 0 END,
    revenue = ad_performance.revenue + COALESCE(NEW.revenue, 0);

  RETURN NEW;
END;
$$;

-- Create trigger for ad performance aggregation
CREATE TRIGGER on_ad_impression_insert
  AFTER INSERT ON public.ad_impressions
  FOR EACH ROW EXECUTE FUNCTION public.aggregate_ad_performance();