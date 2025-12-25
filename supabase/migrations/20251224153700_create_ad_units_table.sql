-- Create ad_units table
CREATE TABLE public.ad_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  gam_ad_unit_id VARCHAR(255), -- GAM's ad unit ID
  ad_format VARCHAR(50) NOT NULL, -- banner, video, native, interstitial, video_pre_roll, video_mid_roll, video_post_roll, google_adsense, html, image, link
  sizes JSONB, -- Array of ad sizes, e.g., ["300x250", "728x90"]
  ad_placement JSONB, -- Placement configuration, e.g., {"page": "video", "position": "pre_roll", "time_seconds": 0}
  ad_code TEXT, -- Ad code (Google AdSense, HTML, etc)
  ad_type VARCHAR(50) DEFAULT 'display', -- display, video, native, etc
  video_position_seconds INTEGER DEFAULT 0, -- For video ads, position in seconds
  page_placement VARCHAR(100), -- Where to place on page: video_player, sidebar, feed, etc
  targeting JSONB, -- Targeting parameters
  status VARCHAR(20) DEFAULT 'active', -- active, paused, deleted, draft
  priority INTEGER DEFAULT 10, -- Priority for ad serving, lower number = higher priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;

-- Create policy for ad units
CREATE POLICY "Admins can manage ad units" ON public.ad_units
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX idx_ad_units_status ON public.ad_units(status);
CREATE INDEX idx_ad_units_format ON public.ad_units(ad_format);
CREATE INDEX idx_ad_units_created_at ON public.ad_units(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_ad_units_updated_at
  BEFORE UPDATE ON public.ad_units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();