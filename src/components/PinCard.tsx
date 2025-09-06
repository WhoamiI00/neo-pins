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
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

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

  // Motion values for smooth interactions
  const scale = useMotionValue(1);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        mass: 0.8
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const
      }
    }
  };

  const buttonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 20,
        delay: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer pin-card bg-gradient-card",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        ref={cardRef}
        className="border-0 bg-transparent shadow-none"
      >
      <div className="relative">
        {/* Enhanced Image with Motion */}
        <div className="relative overflow-hidden rounded-xl">
          {!imageError ? (
            <div className="relative">
                <motion.img
                src={pin.image_url}
                alt={pin.title}
                className={cn(
                  "w-full h-auto object-cover",
                  pin.is_nsfw && !showNsfwContent && "blur-md"
                )}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setIsImageLoaded(true);
                }}
                loading="lazy"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

        {/* Enhanced Hover Overlay */}
        {isHovered && (
          <motion.div 
            className="absolute inset-0 bg-black/20"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute top-2 right-2 flex space-x-2">
              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
              >
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
              </motion.div>
              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.05 }}
              >
                <ImageActions 
                  imageUrl={pin.image_url} 
                  title={pin.title}
                  pinId={pin.id}
                  userId={pin.user_id}
                  currentUserId={currentUserId}
                  onDelete={handlePinDeleted}
                />
              </motion.div>
            </div>
            
            {/* Enhanced Stats Overlay */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              {statsLoaded && (
                <motion.div 
                  className="flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    delay: 0.2 
                  }}
                >
                  <motion.div 
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Heart className="h-3 w-3" />
                    <span>{likesCount}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.1 }}
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>{commentsCount}</span>
                  </motion.div>
                </motion.div>
              )}
            </div>

            {pin.original_url && (
              <div className="absolute bottom-2 right-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                >
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
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <SavePinDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        pinId={pin.id}
        pinTitle={pin.title}
      />

      {/* Enhanced Pin Info */}
      <motion.div 
        className="p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.h3 
          className="font-medium text-sm line-clamp-2 mb-1"
          whileHover={{ color: "hsl(var(--primary))" }}
          transition={{ duration: 0.2 }}
        >
          {pin.title}
        </motion.h3>
        {pin.description && (
          <motion.p 
            className="text-xs text-muted-foreground line-clamp-2 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {pin.description}
          </motion.p>
        )}
        {pin.profiles && (
          <motion.div 
            className="flex items-center text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span>{pin.profiles.full_name || pin.profiles.email}</span>
          </motion.div>
        )}
      </motion.div>
    </Card>
    </motion.div>
  );
};

export default PinCard;