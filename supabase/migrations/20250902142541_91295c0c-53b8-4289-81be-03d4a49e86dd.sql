-- Create storage bucket for group images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-images', 'group-images', true);

-- Create RLS policies for group image uploads
CREATE POLICY "Users can upload group images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'group-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view group images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'group-images');

CREATE POLICY "Users can update their own group images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'group-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own group images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'group-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update group_messages table to support additional fields for different message types
ALTER TABLE group_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS link_title TEXT,
ADD COLUMN IF NOT EXISTS link_description TEXT,
ADD COLUMN IF NOT EXISTS link_image_url TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT;