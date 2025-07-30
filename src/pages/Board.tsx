import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Plus, Edit } from "lucide-react";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import BoardImageUpload from "@/components/BoardImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface Board {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  board_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditingCover, setIsEditingCover] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (boardId) {
      fetchBoardData();
    }
  }, [boardId]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);

      // Fetch board details
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) {
        console.error('Error fetching board:', boardError);
        toast({
          title: "Error",
          description: "Board not found or access denied",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Fetch board owner profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('user_id', boardData.user_id)
        .single();

      const boardWithProfile = {
        ...boardData,
        profiles: profileData
      };

      setBoard(boardWithProfile);
      setIsOwner(session?.user?.id === boardData.user_id);

      // Fetch pins in this board
      const { data: pinsData, error: pinsError } = await supabase
        .from('pins')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false});

      // Fetch profiles for pins separately
      const pinsWithProfiles = [];
      if (pinsData) {
        for (const pin of pinsData) {
          const { data: pinProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', pin.user_id)
            .single();
          
          pinsWithProfiles.push({
            ...pin,
            profiles: pinProfile
          });
        }
      }

      if (pinsError) {
        console.error('Error fetching pins:', pinsError);
      } else {
        setPins(pinsWithProfiles);
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Board not found</h1>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Board Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{board.name}</h1>
                {isOwner && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    Owner
                  </Badge>
                )}
              </div>
              {board.description && (
                <p className="text-muted-foreground text-base md:text-lg">{board.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <Dialog open={isEditingCover} onOpenChange={setIsEditingCover}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Edit className="h-4 w-4" />
                        <span className="hidden md:inline ml-2">Edit Cover</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Edit Board Cover</DialogTitle>
                      </DialogHeader>
                      <BoardImageUpload
                        boardId={board.id}
                        currentImageUrl={board.cover_image_url}
                        onImageUpdate={(newUrl) => {
                          setBoard({ ...board, cover_image_url: newUrl || undefined });
                          setIsEditingCover(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Settings</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Board Cover Image */}
          {board.cover_image_url && (
            <div className="aspect-[3/1] w-full rounded-xl md:rounded-2xl overflow-hidden mb-6">
              <img 
                src={board.cover_image_url} 
                alt={board.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Board Owner Info */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Avatar className="w-10 h-10 md:w-12 md:h-12">
                <AvatarImage src={board.profiles?.avatar_url} />
                <AvatarFallback>
                  {board.profiles?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm md:text-base truncate">
                  {board.profiles?.full_name || board.profiles?.email}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Created {new Date(board.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {pins.length} {pins.length === 1 ? 'pin' : 'pins'}
                </p>
              </div>
              {isOwner && (
                <Button
                  onClick={() => navigate('/create-pin')}
                  size="sm"
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Add Pin</span>
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Pins Grid */}
        {pins.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📌</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No pins in this board yet</h3>
            <p className="text-muted-foreground mb-4">
              {isOwner 
                ? "Start adding pins to organize your ideas" 
                : "This board doesn't have any pins yet"
              }
            </p>
            {isOwner && (
              <Button onClick={() => navigate('/create-pin')} className="rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Pin
              </Button>
            )}
          </Card>
        ) : (
          <PinGrid pins={pins} />
        )}
      </main>
    </div>
  );
};

export default Board;