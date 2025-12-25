-- Create monetization settings table
CREATE TABLE public.monetization_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  is_monetized boolean DEFAULT false,
  status text DEFAULT 'pending',
  revenue_share_percentage integer DEFAULT 55,
  total_earnings numeric(10,2) DEFAULT 0,
  pending_earnings numeric(10,2) DEFAULT 0,
  paid_earnings numeric(10,2) DEFAULT 0,
  payment_method text,
  payment_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(channel_id)
);

-- Create earnings table
CREATE TABLE public.earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  amount numeric(10,4) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'ad_revenue',
  views_counted integer DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  payment_method text,
  transaction_id text,
  notes text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Create site settings table for admin
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.monetization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Monetization settings policies
CREATE POLICY "Users can view their own monetization settings" ON public.monetization_settings
FOR SELECT USING (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = monetization_settings.channel_id AND channels.user_id = auth.uid())
);

CREATE POLICY "Admins can view all monetization settings" ON public.monetization_settings
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own monetization settings" ON public.monetization_settings
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = monetization_settings.channel_id AND channels.user_id = auth.uid())
);

CREATE POLICY "Users can update their own monetization settings" ON public.monetization_settings
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = monetization_settings.channel_id AND channels.user_id = auth.uid())
);

CREATE POLICY "Admins can update all monetization settings" ON public.monetization_settings
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Earnings policies
CREATE POLICY "Users can view their own earnings" ON public.earnings
FOR SELECT USING (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = earnings.channel_id AND channels.user_id = auth.uid())
);

CREATE POLICY "Admins can manage all earnings" ON public.earnings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Payouts policies
CREATE POLICY "Users can view their own payouts" ON public.payouts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = payouts.channel_id AND channels.user_id = auth.uid())
);

CREATE POLICY "Users can request payouts" ON public.payouts
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = payouts.channel_id AND channels.user_id = auth.uid())
);

CREATE POLICY "Admins can manage all payouts" ON public.payouts
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Site settings policies (admin only)
CREATE POLICY "Anyone can view site settings" ON public.site_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('monetization', '{"enabled": true, "min_payout": 50, "revenue_share": 55, "cpm_rate": 2.50}'::jsonb),
  ('platform', '{"name": "VideoTube", "maintenance_mode": false, "allow_signups": true}'::jsonb);

-- Create trigger for updated_at on monetization_settings
CREATE TRIGGER update_monetization_settings_updated_at
BEFORE UPDATE ON public.monetization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();