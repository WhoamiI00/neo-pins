import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bot, Send, Loader2, Sparkles, X, MessageCircle, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useSpring } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  data?: any;
}

interface AIAssistantProps {
  className?: string;
}

export const AIAssistant = ({ className }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your PinBoard AI assistant. I can help you create groups, generate content templates, and more! Try asking me to 'create a group named [name]' or 'make a template for [topic]'.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: userMessage.content }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        data: data.data
      };

      setMessages(prev => [...prev, aiMessage]);

      if (data.success && data.data?.inviteLink) {
        toast({
          title: "Group Created Successfully!",
          description: "Your group has been created with an invite link.",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The link has been copied to your clipboard.",
    });
  };

  const buttonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95
    }
  };

  const chatVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20,
      x: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      x: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    }
  };

  if (!isOpen) {
    return (
      <motion.div
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        className={cn("fixed bottom-6 right-6", className)}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          size="icon"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bot className="h-6 w-6" />
          </motion.div>
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={chatVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("fixed bottom-6 right-6", className)}
      >
        <Card className="w-96 h-[500px] shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Enhanced Header */}
            <motion.div 
              className="flex items-center justify-between p-4 border-b bg-primary/5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <motion.div 
                  className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Bot className="h-4 w-4 text-primary" />
                </motion.div>
                <div>
                  <motion.h3 
                    className="font-semibold text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    AI Assistant
                  </motion.h3>
                  <motion.p 
                    className="text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Always ready to help
                  </motion.p>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>

        {/* Enhanced Messages */}
        <ScrollArea className="flex-1 p-4">
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex gap-2",
                    message.isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn(
                        "text-xs",
                        message.isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
                      )}>
                        {message.isUser ? "You" : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                
                <div className={cn("flex flex-col", message.isUser ? "items-end" : "items-start")}>
                  <motion.div
                    className={cn(
                      "max-w-[280px] rounded-lg p-3 text-sm",
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.p 
                      className="whitespace-pre-wrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                    >
                      {message.content}
                    </motion.p>
                    
                    {/* Enhanced Special UI for data responses */}
                    {message.data && (
                      <motion.div 
                        className="mt-3 pt-3 border-t border-border/20"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        {message.data.inviteLink && (
                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Badge variant="secondary" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Invite Link Created
                            </Badge>
                            <div className="flex items-center gap-2 p-2 bg-background/10 rounded text-xs">
                              <code className="flex-1 truncate">{message.data.inviteLink}</code>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(message.data.inviteLink)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                        
                        {message.data.group && (
                          <motion.div 
                            className="space-y-1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Group Created
                            </Badge>
                            <p className="text-xs opacity-90">
                              {message.data.group.name}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                  
                  <motion.span 
                    className="text-xs text-muted-foreground mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </motion.span>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                className="flex gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <motion.div 
                  className="bg-muted rounded-lg p-3"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.div>
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Thinking...
                    </motion.span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Enhanced Input */}
        <motion.div 
          className="p-4 border-t"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex gap-2">
            <motion.div
              className="flex-1"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create groups, generate content..."
                className="flex-1"
                disabled={isLoading}
              />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
              >
                <motion.div
                  animate={{ 
                    x: isLoading ? [0, 2, 0] : 0,
                    rotate: isLoading ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ 
                    duration: isLoading ? 0.5 : 0,
                    repeat: isLoading ? Infinity : 0
                  }}
                >
                  <Send className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
          <motion.p 
            className="text-xs text-muted-foreground mt-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Try: "create a group named photography" or "make a template for travel blog"
          </motion.p>
        </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  </AnimatePresence>
  );
};