-- Fix group_invites RLS policies to allow public access to active invites
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Group members can view invites" ON public.group_invites;

-- Create new policy that allows anyone to view active invites (needed for joining)
CREATE POLICY "Anyone can view active invites" 
ON public.group_invites 
FOR SELECT 
USING (is_active = true);

-- Keep the admin management policy
-- (the existing "Group admins can manage invites" policy should remain)