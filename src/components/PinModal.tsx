import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SavePinDialog from "./SavePinDialog";
import PinModalHeader from "./PinModal/PinModalHeader";
import PinModalComments from "./PinModal/PinModalComments";
import { useGSAP } from "@/hooks/useGSAP";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

interface PinModalProps {
  pin: Pin | null;
  isOpen: boolean;
  onClose: () => void;
  pinId?: string; // For dynamic routing
}

const PinModal = ({ pin, isOpen, onClose, pinId }: PinModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentPin, setCurrentPin] = useState<Pin | null>(pin);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { gsap } = useGSAP();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle dynamic routing
  useEffect(() => {
    if (pinId && !pin) {
      fetchPinById(pinId);
    }
  }, [pinId]);

  // Handle URL changes for sharing
  useEffect(() => {
    if (pin && isOpen) {
      const newUrl = `/pin/${pin.id}`;
      if (location.pathname !== newUrl) {
        window.history.pushState({}, '', newUrl);
      }
    }
  }, [pin, isOpen, location.pathname]);

  useEffect(() => {
    if (currentPin && isOpen) {
      fetchComments();
      fetchLikes();
      checkIfLiked();
      animateModalEntrance();
    }
  }, [currentPin, isOpen]);

  const fetchPinById = async (id: string) => {
    const { data: pinData, error } = await supabase
      .from('pins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pin:', error);
      navigate('/');
      return;
    }

    // Fetch the profile separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('user_id', pinData.user_id)
      .single();

    const pinWithProfile = {
      ...pinData,
      profiles: profileData
    };

    setCurrentPin(pinWithProfile);
  };

  const animateModalEntrance = () => {
    if (!modalRef.current) return;

    const tl = gsap.timeline();
    tl.fromTo(modalRef.current, 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    );
  };

  const handleClose = () => {
    if (location.pathname.startsWith('/pin/')) {
      navigate('/');
    }
    onClose();
  };

  const fetchComments = async () => {
    const activePin = currentPin || pin;
    if (!activePin) return;

    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('*')
      .eq('pin_id', activePin.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    // Fetch profiles for each comment
    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
      
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id)
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
  };

  const fetchLikes = async () => {
    const activePin = currentPin || pin;
    if (!activePin) return;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('pin_id', activePin.id);

    setLikesCount(count || 0);
  };

  const checkIfLiked = async () => {
    const activePin = currentPin || pin;
    if (!activePin) return;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('pin_id', activePin.id)
      .eq('user_id', session.session.user.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const toggleLike = async () => {
    const activePin = currentPin || pin;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user || !activePin) return;

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('pin_id', activePin.id)
        .eq('user_id', session.session.user.id);

      if (!error) {
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          pin_id: activePin.id,
          user_id: session.session.user.id
        });

      if (!error) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }
  };


  const displayPin = currentPin || pin;
  if (!displayPin) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent ref={modalRef} className="max-w-6xl max-h-[95vh] p-0 overflow-hidden w-[95vw] sm:w-full" hideCloseButton>
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[95vh]">
            {/* Image Section */}
            <div className="relative bg-muted/30 flex items-center justify-center p-2 sm:p-4 max-h-[40vh] lg:max-h-none">
              <img
                src={displayPin.image_url}
                alt={displayPin.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Content Section */}
            <div className="flex flex-col h-full max-h-[55vh] lg:max-h-[95vh] min-h-0">
              <PinModalHeader
                pin={displayPin}
                isLiked={isLiked}
                likesCount={likesCount}
                onLike={toggleLike}
                onSave={() => setShowSaveDialog(true)}
                onClose={handleClose}
                onPinDeleted={() => {
                  handleClose();
                  // Optionally navigate away or refresh data
                }}
              />
              
              <PinModalComments
                comments={comments}
                pinId={displayPin.id}
                onCommentsUpdate={fetchComments}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SavePinDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        pinId={displayPin.id}
        pinTitle={displayPin.title}
      />
    </>
  );
};

export default PinModal;