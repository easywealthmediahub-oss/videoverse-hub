-- Create or update the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the ad_units table has the trigger
DROP TRIGGER IF EXISTS handle_ad_units_updated_at ON public.ad_units;
CREATE TRIGGER handle_ad_units_updated_at
  BEFORE UPDATE ON public.ad_units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Make sure the ad_performance table has the trigger
DROP TRIGGER IF EXISTS handle_ad_performance_updated_at ON public.ad_performance;
CREATE TRIGGER handle_ad_performance_updated_at
  BEFORE UPDATE ON public.ad_performance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();