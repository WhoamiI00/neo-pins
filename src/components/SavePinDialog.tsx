import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface Board {
  id: string;
  name: string;
  cover_image_url?: string;
}

interface SavePinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pinId: string;
  pinTitle: string;
}

const SavePinDialog = ({ isOpen, onClose, pinId, pinTitle }: SavePinDialogProps) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUserBoards();
    }
  }, [isOpen]);

  const fetchUserBoards = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your boards",
        variant: "destructive",
      });
    } else {
      setBoards(data || []);
    }
  };

  const saveToBoard = async (boardId: string) => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { error } = await supabase
      .from('saved_pins')
      .insert({
        user_id: session.session.user.id,
        pin_id: pinId,
        board_id: boardId
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already saved",
          description: "This pin is already saved to this board",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save pin",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Pin saved!",
        description: `"${pinTitle}" has been saved to your board`,
      });
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save pin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose a board to save this pin</p>
          
          {boards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You don't have any boards yet</p>
              <Button onClick={onClose} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create a board first
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {boards.map((board) => (
                <Card
                  key={board.id}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => saveToBoard(board.id)}
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                    {board.cover_image_url ? (
                      <img
                        src={board.cover_image_url}
                        alt={board.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">📌</span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{board.name}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavePinDialog;