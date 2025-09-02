-- Fix incorrect RLS policy for viewing groups via active invite
-- Drop the broken policy first (name must match exactly)
DROP POLICY IF EXISTS "Anyone can view groups with a valid active invite" ON public.groups;

-- Recreate with correct condition referencing the groups row (id)
CREATE POLICY "Anyone can view groups with a valid active invite"
ON public.groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.group_invites gi
    WHERE gi.group_id = public.groups.id
      AND gi.is_active = true
      AND (gi.expires_at IS NULL OR gi.expires_at > now())
      AND (gi.max_uses IS NULL OR gi.usage_count < gi.max_uses)
  )
);
