-- Set NSFW default to false and update existing rows
ALTER TABLE public.pins ALTER COLUMN is_nsfw SET DEFAULT false;

-- Mark all existing pins as not NSFW by default
UPDATE public.pins SET is_nsfw = false WHERE is_nsfw IS DISTINCT FROM false;