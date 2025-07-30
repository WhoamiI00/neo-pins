-- Add foreign key constraints for better relationships
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_pin_id_fkey 
FOREIGN KEY (pin_id) REFERENCES public.pins(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_pin_id_fkey 
FOREIGN KEY (pin_id) REFERENCES public.pins(id) ON DELETE CASCADE;

ALTER TABLE public.saved_pins 
ADD CONSTRAINT saved_pins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.saved_pins 
ADD CONSTRAINT saved_pins_pin_id_fkey 
FOREIGN KEY (pin_id) REFERENCES public.pins(id) ON DELETE CASCADE;

ALTER TABLE public.saved_pins 
ADD CONSTRAINT saved_pins_board_id_fkey 
FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;

ALTER TABLE public.pins 
ADD CONSTRAINT pins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.pins 
ADD CONSTRAINT pins_board_id_fkey 
FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;