-- Add username column to channels table
ALTER TABLE public.channels ADD COLUMN username TEXT UNIQUE;

-- Populate the username column with existing channel names
UPDATE public.channels SET username = name;

-- Make username required
ALTER TABLE public.channels ALTER COLUMN username SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_channels_username ON public.channels (username);

-- Down migration
DROP INDEX IF EXISTS idx_channels_username;
ALTER TABLE public.channels DROP COLUMN username;