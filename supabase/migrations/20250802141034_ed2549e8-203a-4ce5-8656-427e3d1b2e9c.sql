-- Drop existing problematic policies on group_members
DROP POLICY IF EXISTS "Users can join groups via invite" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;

-- Create a security definer function to check if user is member of a group
CREATE OR REPLACE FUNCTION public.user_is_group_member(user_uuid uuid, group_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members 
    WHERE user_id = user_uuid AND group_id = group_uuid
  );
$$;

-- Create a security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.user_is_group_admin(user_uuid uuid, group_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members 
    WHERE user_id = user_uuid AND group_id = group_uuid AND role = 'admin'
  );
$$;

-- Create new non-recursive policies for group_members
CREATE POLICY "Users can view group members where they are members"
ON public.group_members
FOR SELECT
USING (public.user_is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can manage all members"
ON public.group_members
FOR ALL
USING (public.user_is_group_admin(auth.uid(), group_id));

-- Update group_messages policies to use the new functions
DROP POLICY IF EXISTS "Users can view messages in their groups" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.group_messages;
DROP POLICY IF EXISTS "Admins and message owners can delete messages" ON public.group_messages;

CREATE POLICY "Users can view messages in their groups"
ON public.group_messages
FOR SELECT
USING (public.user_is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can send messages"
ON public.group_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  public.user_is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Users can update their own messages"
ON public.group_messages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins and message owners can delete messages"
ON public.group_messages
FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.user_is_group_admin(auth.uid(), group_id)
);