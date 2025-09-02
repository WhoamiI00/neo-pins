import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Play, Instagram, Youtube, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupMessage {
  id: string;
  content: string;
  message_type: string;
  image_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  link_image_url?: string;
  platform?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
    email: string;
  };
}

interface MessageRendererProps {
  message: GroupMessage;
  isOwnMessage: boolean;
}

const MessageRenderer = ({ message, isOwnMessage }: MessageRendererProps) => {
  const [showIframe, setShowIframe] = useState(false);

  const renderTextMessage = () => (
    <div
      className={cn(
        "inline-block p-3 rounded-lg max-w-xs break-words",
        isOwnMessage
          ? "bg-primary text-primary-foreground"
          : "bg-muted"
      )}
    >
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    </div>
  );

  const renderImageMessage = () => (
    <div className="max-w-sm">
      {message.content && (
        <div
          className={cn(
            "inline-block p-3 rounded-lg mb-2",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      )}
      <div className="rounded-lg overflow-hidden shadow-card hover-lift">
        <img
          src={message.image_url}
          alt="Shared image"
          className="w-full h-auto object-cover cursor-pointer"
          onClick={() => window.open(message.image_url, '_blank')}
        />
      </div>
    </div>
  );

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getEmbedUrl = (url: string, platform?: string) => {
    if (!platform) return url;

    try {
      const urlObj = new URL(url);
      
      switch (platform) {
        case 'youtube':
          const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
          return `https://www.youtube.com/embed/${videoId}`;
        case 'instagram':
          return `${url}embed/`;
        case 'facebook':
          return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
        default:
          return url;
      }
    } catch {
      return url;
    }
  };

  const renderLinkMessage = () => (
    <div className="max-w-sm">
      {message.content && (
        <div
          className={cn(
            "inline-block p-3 rounded-lg mb-2",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      )}
      
      <Card className="overflow-hidden shadow-card hover-lift cursor-pointer">
        {/* Link Preview */}
        <div onClick={() => !showIframe && window.open(message.link_url, '_blank')}>
          {message.link_image_url && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={message.link_image_url}
                alt={message.link_title || 'Link preview'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              {getPlatformIcon(message.platform)}
              <span className="text-xs text-muted-foreground capitalize">
                {message.platform || 'Link'}
              </span>
            </div>
            {message.link_title && (
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {message.link_title}
              </h4>
            )}
            {message.link_description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {message.link_description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(message.link_url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit
              </Button>
              {message.platform && ['youtube', 'instagram', 'facebook'].includes(message.platform) && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIframe(!showIframe);
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {showIframe ? 'Hide' : 'View'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Embedded Content */}
        {showIframe && message.platform && (
          <div className="border-t">
            <div className="aspect-video w-full">
              <iframe
                src={getEmbedUrl(message.link_url!, message.platform)}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={message.link_title || 'Embedded content'}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderPinMessage = () => (
    <div className="max-w-sm">
      {message.content && (
        <div
          className={cn(
            "inline-block p-3 rounded-lg mb-2",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      )}
      
      <Card className="overflow-hidden shadow-card hover-lift cursor-pointer">
        <div onClick={() => window.open(message.link_url, '_blank')}>
          {message.link_image_url && (
            <div className="aspect-[3/4] w-full overflow-hidden">
              <img
                src={message.link_image_url}
                alt={message.link_title || 'Pin preview'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                📌 Pin
              </span>
            </div>
            {message.link_title && (
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {message.link_title}
              </h4>
            )}
            {message.link_description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {message.link_description}
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(message.link_url, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Pin
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  switch (message.message_type) {
    case 'image':
      return renderImageMessage();
    case 'link':
      return renderLinkMessage();
    case 'pin':
      return renderPinMessage();
    default:
      return renderTextMessage();
  }
};

export default MessageRenderer;