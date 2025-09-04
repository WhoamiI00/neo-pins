-- Add NSFW field to pins table
ALTER TABLE public.pins ADD COLUMN is_nsfw BOOLEAN NOT NULL DEFAULT true;