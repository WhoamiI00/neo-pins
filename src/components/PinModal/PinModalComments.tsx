import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MoreHorizontal, Trash2 } from "lucide-react";

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

interface PinModalCommentsProps {
  comments: Comment[];
  pinId: string;
  onCommentsUpdate: () => void;
}

const PinModalComments = ({ comments, pinId, onCommentsUpdate }: PinModalCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: session } = await supabase.auth.getSession();
      setCurrentUserId(session.session?.user.id || null);
    };
    getCurrentUser();
  }, []);

  const addComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        pin_id: pinId,
        user_id: session.session.user.id,
        content: newComment.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      onCommentsUpdate();
    }
    setLoading(false);
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    setDeletingComment(commentId);
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUserId); // Extra security check

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
      onCommentsUpdate();
    }
    setDeletingComment(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Comments header */}
      <div className="p-3 sm:p-6 border-b flex-shrink-0">
        <h3 className="text-base sm:text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6 min-h-0">
        {comments.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex gap-2 sm:gap-3">
                <Avatar 
                  className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer flex-shrink-0"
                  onClick={() => navigate(`/user/${comment.user_id}`)}
                >
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback>
                    {(comment.profiles?.full_name || comment.profiles?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <span 
                        className="font-medium text-xs sm:text-sm cursor-pointer hover:text-primary transition-colors truncate"
                        onClick={() => navigate(`/user/${comment.user_id}`)}
                      >
                        {comment.profiles?.full_name || comment.profiles?.email || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {formatDistanceToNow(new Date(comment.created_at))} ago
                      </span>
                    </div>
                    {currentUserId === comment.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            disabled={deletingComment === comment.id}
                          >
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteComment(comment.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingComment === comment.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingComment === comment.id ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed break-words">{comment.content}</p>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {formatDistanceToNow(new Date(comment.created_at))} ago
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment */}
      <div className="p-3 sm:p-6 border-t bg-muted/30 flex-shrink-0">
        <div className="space-y-2 sm:space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none border-0 bg-background shadow-sm text-sm sm:text-base"
            rows={2}
          />
          <div className="flex justify-end">
            <Button 
              onClick={addComment} 
              disabled={!newComment.trim() || loading}
              className="rounded-full px-4 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
            >
              {loading ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModalComments;