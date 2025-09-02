-- Allow viewing groups when a valid active invite exists (fixes Join Group flow for non-members)
CREATE POLICY "Anyone can view groups with a valid active invite"
ON public.groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.group_invites gi
    WHERE gi.group_id = id
      AND gi.is_active = true
      AND (gi.expires_at IS NULL OR gi.expires_at > now())
      AND (gi.max_uses IS NULL OR gi.usage_count < gi.max_uses)
  )
);
