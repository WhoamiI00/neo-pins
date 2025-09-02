import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Image, Link, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  groupId: string;
  onMessageSent: () => void;
  disabled?: boolean;
}

const MessageInput = ({ groupId, onMessageSent, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mode, setMode] = useState<'text' | 'image' | 'link'>('text');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectPlatform = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return 'youtube';
      }
      if (hostname.includes('instagram.com')) {
        return 'instagram';
      }
      if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
        return 'facebook';
      }
      if (hostname.includes(window.location.hostname)) {
        // This is our own pinboard - check if it's a pin URL
        if (urlObj.pathname.startsWith('/pin/')) {
          return 'pin';
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const fetchLinkPreview = async (url: string) => {
    setLoadingPreview(true);
    try {
      // For external links, we'll create a basic preview
      // In production, you'd want to use a service like linkpreview.net
      const platform = detectPlatform(url);
      
      if (platform === 'pin') {
        // Handle internal pin links
        const pinId = url.split('/pin/')[1];
        const { data: pinData, error } = await supabase
          .from('pins')
          .select('id, title, description, image_url')
          .eq('id', pinId)
          .single();
          
        if (!error && pinData) {
          setLinkPreview({
            url,
            title: pinData.title,
            description: pinData.description,
            image: pinData.image_url,
            platform: 'pin'
          });
        }
      } else {
        // For external links, create a basic preview
        const urlObj = new URL(url);
        setLinkPreview({
          url,
          title: `Link to ${urlObj.hostname}`,
          description: `Visit ${urlObj.hostname}`,
          image: null,
          platform
        });
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
      toast({
        title: 'Error',
        description: 'Could not load link preview',
        variant: 'destructive',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'Error',
        description: 'Image size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('group-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-images')
        .getPublicUrl(filePath);

      // Send image message
      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: message.trim() || '',
          message_type: 'image',
          image_url: publicUrl,
        });

      if (messageError) throw messageError;

      setMessage('');
      setMode('text');
      onMessageSent();
      
      toast({
        title: 'Success',
        description: 'Image sent successfully',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const sendTextMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: message.trim(),
          message_type: 'text',
        });

      if (error) throw error;

      setMessage('');
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const sendLinkMessage = async () => {
    if (!linkPreview) return;
    
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: message.trim(),
          message_type: linkPreview.platform === 'pin' ? 'pin' : 'link',
          link_url: linkPreview.url,
          link_title: linkPreview.title,
          link_description: linkPreview.description,
          link_image_url: linkPreview.image,
          platform: linkPreview.platform,
        });

      if (error) throw error;

      setMessage('');
      setLinkUrl('');
      setLinkPreview(null);
      setMode('text');
      onMessageSent();
    } catch (error) {
      console.error('Error sending link:', error);
      toast({
        title: 'Error',
        description: 'Failed to send link',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || sending || uploading) return;

    switch (mode) {
      case 'text':
        sendTextMessage();
        break;
      case 'link':
        sendLinkMessage();
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Link Preview */}
      {linkPreview && mode === 'link' && (
        <Card className="p-3">
          <div className="flex items-start gap-3">
            {linkPreview.image && (
              <img
                src={linkPreview.image}
                alt="Link preview"
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">{linkPreview.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {linkPreview.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{linkPreview.url}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLinkPreview(null);
                setLinkUrl('');
                setMode('text');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Link Input */}
      {mode === 'link' && !linkPreview && (
        <div className="space-y-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste a link (YouTube, Instagram, Facebook, or pin)..."
            className="focus-ring"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => fetchLinkPreview(linkUrl)}
              disabled={!linkUrl.trim() || loadingPreview}
            >
              {loadingPreview ? 'Loading...' : 'Preview Link'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMode('text');
                setLinkUrl('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          {mode === 'text' ? (
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={disabled || sending}
              className="focus-ring"
              maxLength={1000}
            />
          ) : (
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a caption (optional)..."
              disabled={disabled || sending}
              className="focus-ring resize-none"
              rows={2}
              maxLength={1000}
            />
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-1">
            {mode === 'text' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                  className="px-3"
                >
                  {uploading ? (
                    <Upload className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMode('link')}
                  disabled={disabled}
                  className="px-3"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={
                disabled || 
                sending || 
                uploading ||
                (mode === 'text' && !message.trim()) ||
                (mode === 'link' && !linkPreview)
              }
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setMode('image');
            handleImageUpload(file);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;