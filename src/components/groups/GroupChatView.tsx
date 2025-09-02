import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Users, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MessageRenderer from './MessageRenderer';
import MessageInput from './MessageInput';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_private: boolean;
  member_role?: string;
}

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

interface GroupChatViewProps {
  group: Group;
  onOpenSettings: () => void;
  onOpenInvite: () => void;
}

export const GroupChatView = ({ group, onOpenSettings, onOpenInvite }: GroupChatViewProps) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel(`group-messages-${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          // Fetch the new message with profile data
          fetchMessageWithProfile(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchMessages = async () => {
    console.log('Fetching messages for group:', group.id);
    try {
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Raw messages data:', messagesData);

      // Fetch profiles separately
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, email')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const messagesWithProfiles = (messagesData || []).map(message => ({
        ...message,
        profiles: profilesMap[message.user_id] || null
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageWithProfile = async (messageId: string) => {
    try {
      const { data: messageData, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (error) throw error;
      
      if (messageData) {
        // Fetch profile separately
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, email')
          .eq('user_id', messageData.user_id)
          .single();

        const messageWithProfile = {
          ...messageData,
          profiles: profileData || null
        };

        setMessages(prev => [...prev, messageWithProfile]);
      }
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  };

  const handleMessageSent = () => {
    // The MessageInput component handles sending, we just need to refresh
    // Real-time updates will handle adding the new message
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: 'Success',
        description: 'Message deleted',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isOwnMessage = (message: GroupMessage) => {
    return currentUser && message.user_id === currentUser.id;
  };

  const canDeleteMessage = (message: GroupMessage) => {
    return isOwnMessage(message) || group.member_role === 'admin';
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="h-6 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={group.avatar_url} />
            <AvatarFallback>
              {group.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{group.name}</h2>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
          {group.is_private && (
            <Badge variant="secondary">Private</Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenInvite}>
              <Users className="h-4 w-4 mr-2" />
              Invite Members
            </DropdownMenuItem>
            {group.member_role === 'admin' && (
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Group Settings
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Send the first message to get the conversation started!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${isOwnMessage(message) ? 'justify-end' : ''}`}
              >
                {!isOwnMessage(message) && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.profiles?.avatar_url} />
                    <AvatarFallback>
                      {(message.profiles?.full_name || message.profiles?.email || '').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex-1 ${isOwnMessage(message) ? 'text-right' : ''}`}>
                  {!isOwnMessage(message) && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.profiles?.full_name || message.profiles?.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  
                  <div className="group relative">
                    <MessageRenderer 
                      message={message} 
                      isOwnMessage={isOwnMessage(message)} 
                    />
                    
                    {isOwnMessage(message) && (
                      <span className="text-xs text-muted-foreground block mt-1">
                        {formatMessageTime(message.created_at)}
                      </span>
                    )}

                    {canDeleteMessage(message) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => deleteMessage(message.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Message Input */}
      <div className="p-4 border-t bg-muted/30">
        <MessageInput
          groupId={group.id}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
};