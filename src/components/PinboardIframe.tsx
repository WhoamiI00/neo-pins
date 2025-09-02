import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Fullscreen, X, Share2, Bookmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PinboardIframeProps {
  url?: string;
  title?: string;
  className?: string;
  showPreview?: boolean;
  compact?: boolean;
}

const PinboardIframe = ({ 
  url = window.location.origin, 
  title = "Pinterest Board", 
  className,
  showPreview = false,
  compact = false
}: PinboardIframeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (showPreview) {
      // Generate a preview screenshot URL (in production, you'd use a service like urlbox.io)
      // For now, we'll use a placeholder
      setPreviewImage('/placeholder.svg');
    }
  }, [showPreview, url]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Success',
          description: 'Link copied to clipboard!',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Error',
        description: 'Failed to share link',
        variant: 'destructive',
      });
    }
  };

  const handleBookmark = () => {
    // Add to browser bookmarks (requires user interaction)
    toast({
      title: 'Bookmark',
      description: 'Press Ctrl/Cmd+D to bookmark this page',
    });
  };

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="btn-modern">
              <Fullscreen className="h-4 w-4 mr-2" />
              View Board
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden shadow-card hover-lift", className)}>
      {/* Preview Section */}
      <div className="relative">
        {showPreview && previewImage && (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img
              src={previewImage}
              alt={`Preview of ${title}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Button
                size="lg"
                onClick={() => setIsOpen(true)}
                className="btn-modern shadow-card"
              >
                <Fullscreen className="h-5 w-5 mr-2" />
                Open Pinboard
              </Button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-sm">📌</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground">Interactive Pinterest Board</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Embedded
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-modern">
                  <Fullscreen className="h-4 w-4 mr-2" />
                  Full View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
                <DialogHeader className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                      <span className="text-primary">📌</span>
                      {title}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 relative">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-muted-foreground">Loading pinboard...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title={title}
                    onLoad={() => setIsLoading(false)}
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock"
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              New Tab
            </Button>

            <Button size="sm" variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button size="sm" variant="outline" onClick={handleBookmark}>
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </Button>
          </div>
        </div>

        {/* Embedded Preview */}
        <div className="aspect-[4/3] relative bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}
          <iframe
            src={url}
            className="w-full h-full border-0 rounded-b-lg"
            title={title}
            onLoad={() => setIsLoading(false)}
            allow="fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </Card>
  );
};

export default PinboardIframe;