-- Enable realtime for group_messages table
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;