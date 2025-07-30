-- Create likes table for pin likes
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pin_id)
);

-- Create comments table for pin comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pin_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_pins table for users to save pins to their boards
CREATE TABLE public.saved_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pin_id UUID NOT NULL,
  board_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pin_id, board_id)
);

-- Enable RLS on all tables
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_pins ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes table
CREATE POLICY "Users can view all likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for comments table
CREATE POLICY "Users can view all comments" 
ON public.comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for saved_pins table
CREATE POLICY "Users can view their own saved pins" 
ON public.saved_pins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved pins" 
ON public.saved_pins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved pins" 
ON public.saved_pins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_likes_pin_id ON public.likes(pin_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_comments_pin_id ON public.comments(pin_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_saved_pins_user_id ON public.saved_pins(user_id);
CREATE INDEX idx_saved_pins_pin_id ON public.saved_pins(pin_id);
CREATE INDEX idx_saved_pins_board_id ON public.saved_pins(board_id);

-- Add text search index for pins
CREATE INDEX idx_pins_search ON public.pins USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));