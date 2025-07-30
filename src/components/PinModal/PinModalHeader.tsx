import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
}

const PinModalHeader = ({ pin, isLiked, likesCount, onLike, onSave, onClose }: PinModalHeaderProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
    <div className="p-6 border-b bg-card">
      {/* Top actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="rounded-full hover:bg-muted"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="rounded-full hover:bg-muted"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={onSave}
            className="rounded-full px-6"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Pin info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold leading-tight">{pin.title}</h1>
        
        {pin.description && (
          <p className="text-muted-foreground leading-relaxed">{pin.description}</p>
        )}

        {/* User info */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/user/${pin.user_id}`)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={pin.profiles?.avatar_url} />
            <AvatarFallback>
              {(pin.profiles?.full_name || pin.profiles?.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium group-hover:text-primary transition-colors">
            {pin.profiles?.full_name || pin.profiles?.email || 'Anonymous'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className="flex items-center gap-2 rounded-full"
            >
              <Heart className={`h-5 w-5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-full"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModalHeader;