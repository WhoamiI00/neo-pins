-- Fix the infinite recursion in group_members RLS policy

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;

-- Create a security definer function to get user's groups
CREATE OR REPLACE FUNCTION public.get_user_groups(user_uuid UUID)
RETURNS TABLE(group_id UUID)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT gm.group_id 
  FROM public.group_members gm 
  WHERE gm.user_id = user_uuid;
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view group members for their groups" ON public.group_members
  FOR SELECT USING (
    group_id IN (
      SELECT public.get_user_groups(auth.uid())
    )
  );