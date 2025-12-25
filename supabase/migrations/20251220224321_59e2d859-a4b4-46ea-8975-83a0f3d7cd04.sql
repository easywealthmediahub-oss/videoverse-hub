-- Add links column to channels table (JSONB array for social links)
ALTER TABLE public.channels
ADD COLUMN links jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.channels.links IS 'Array of social links with title and url';