import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ImageActions from "@/components/ImageActions";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

interface PinModalHeaderProps {
  pin: Pin;
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  onSave: () => void;
  onClose: () => void;
  onPinDeleted?: () => void;
}

const PinModalHeader = ({ pin, isLiked, likesCount, onLike, onSave, onClose, onPinDeleted }: PinModalHeaderProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getCurrentUser();
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        description: "Link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(pin.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pin.title}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-3 sm:p-6 border-b bg-card flex-shrink-0">
      {/* Top actions */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="rounded-full hover:bg-muted h-8 w-8 sm:h-10 sm:w-10"
          >
            <Share className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <ImageActions 
            imageUrl={pin.image_url} 
            title={pin.title}
            pinId={pin.id}
            userId={pin.user_id}
            currentUserId={currentUserId || undefined}
            onDelete={onPinDeleted}
            className="flex"
          />
          <Button
            onClick={onSave}
            className="rounded-full px-3 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Pin info */}
      <div className="space-y-2 sm:space-y-4">
        <h1 className="text-lg sm:text-2xl font-bold leading-tight">{pin.title}</h1>
        
        {pin.description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{pin.description}</p>
        )}

        {/* User info */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          onClick={() => navigate(`/user/${pin.user_id}`)}
        >
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={pin.profiles?.avatar_url} />
            <AvatarFallback>
              {(pin.profiles?.full_name || pin.profiles?.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm sm:text-base font-medium group-hover:text-primary transition-colors">
            {pin.profiles?.full_name || pin.profiles?.email || 'Anonymous'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className="flex items-center gap-1 sm:gap-2 rounded-full h-8 sm:h-9 px-2 sm:px-3"
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {likesCount > 0 && <span className="text-xs sm:text-sm">{likesCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 sm:gap-2 rounded-full h-8 sm:h-9 px-2 sm:px-3"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModalHeader;