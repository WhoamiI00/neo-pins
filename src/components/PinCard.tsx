import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { gsapAnimations } from "@/hooks/useGSAP";
import { Button } from "@/components/ui/button";
import { MoreVertical, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import SavePinDialog from "./SavePinDialog";
import ImageActions from "./ImageActions";
import { preloadImage } from "@/utils/imageUtils";
import { supabase } from "@/integrations/supabase/client";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  board_id: string;
  created_at: string;
  is_nsfw?: boolean;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

interface PinCardProps {
  pin: Pin;
  onClick?: () => void;
  className?: string;
  currentUserId?: string;
  onPinDeleted?: (pinId: string) => void;
}

const PinCard = ({ pin, onClick, className, currentUserId, onPinDeleted }: PinCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [showNsfwContent, setShowNsfwContent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    if (cardRef.current) {
      const cleanup = gsapAnimations.pinHover(cardRef.current);
      return cleanup;
    }
  }, []);

  // Fetch stats on hover
  useEffect(() => {
    if (isHovered && !statsLoaded) {
      fetchPinStats();
    }
  }, [isHovered, statsLoaded]);

  const fetchPinStats = async () => {
    try {
      // Fetch likes count
      const { count: likes } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('pin_id', pin.id);

      // Fetch comments count
      const { count: comments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('pin_id', pin.id);

      setLikesCount(likes || 0);
      setCommentsCount(comments || 0);
      setStatsLoaded(true);
    } catch (error) {
      console.error('Error fetching pin stats:', error);
    }
  };

  const handlePinDeleted = () => {
    onPinDeleted?.(pin.id);
  };

  // Use NetworkImage component for enhanced rendering

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer pin-card bg-gradient-card",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Standard Image */}
        <div className="relative overflow-hidden rounded-xl">
          {!imageError ? (
            <div className="relative">
              <img
                src={pin.image_url}
                alt={pin.title}
                className={cn(
                  "w-full h-auto object-cover transition-all duration-300",
                  isHovered && "scale-105",
                  pin.is_nsfw && !showNsfwContent && "blur-md"
                )}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setIsImageLoaded(true);
                }}
                loading="lazy"
              />
              
              {/* NSFW Overlay */}
              {pin.is_nsfw && !showNsfwContent && (
                <div 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNsfwContent(true);
                  }}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                    <p className="text-sm font-medium text-gray-900">NSFW Content</p>
                    <p className="text-xs text-gray-600 mt-1">Click to view</p>
                  </div>
                </div>
              )}
              
              {/* NSFW Tag */}
              {pin.is_nsfw && (
                <div className="absolute top-2 left-2">
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    NSFW
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 bg-muted flex items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-sm">Failed to load image</span>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 transition-opacity duration-200">
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                size="sm"
                className="rounded-full shadow-lg bg-primary hover:bg-primary-hover btn-modern text-white font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSaveDialog(true);
                }}
              >
                Save
              </Button>
              <ImageActions 
                imageUrl={pin.image_url} 
                title={pin.title}
                pinId={pin.id}
                userId={pin.user_id}
                currentUserId={currentUserId}
                onDelete={handlePinDeleted}
              />
            </div>
            
            {/* Stats overlay */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              {statsLoaded && (
                <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{commentsCount}</span>
                  </div>
                </div>
              )}
            </div>

            {pin.original_url && (
              <div className="absolute bottom-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-white/90 hover:bg-white text-foreground shadow-lg text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(pin.original_url, '_blank');
                  }}
                >
                  Visit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <SavePinDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        pinId={pin.id}
        pinTitle={pin.title}
      />

      {/* Pin info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">
          {pin.title}
        </h3>
        {pin.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {pin.description}
          </p>
        )}
        {pin.profiles && (
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{pin.profiles.full_name || pin.profiles.email}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PinCard;