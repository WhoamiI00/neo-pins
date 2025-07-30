import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Settings } from "lucide-react";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import NewProfilePictureUpload from "@/components/NewProfilePictureUpload";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface Board {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  created_at: string;
  pin_count?: number;
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
}

const Profile = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [userPins, setUserPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [error, setError] = useState("");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and redirect if not logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setUserProfile(profileData);
      }
      
      // Fetch user's boards
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (boardsError) {
        console.error('Error fetching boards:', boardsError);
      } else {
        setBoards(boardsData || []);
      }

      // Fetch user's pins
      const { data: pinsData, error: pinsError } = await supabase
        .from('pins')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (pinsError) {
        console.error('Error fetching pins:', pinsError);
      } else {
        setUserPins(pinsData || []);
      }

      // Fetch follow counts
      await fetchFollowCounts();
      
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

  const fetchFollowCounts = async () => {
    if (!session?.user?.id) return;

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', session.user.id);

    // Get following count  
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', session.user.id);

    setFollowersCount(followersCount || 0);
    setFollowingCount(followingCount || 0);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setCreatingBoard(true);
    setError("");

    try {
      if (!newBoardName.trim()) {
        throw new Error("Board name is required");
      }

      const { error } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          user_id: session.user.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Board created!",
        description: "Your new board has been created successfully.",
      });

      setNewBoardName("");
      setNewBoardDescription("");
      setIsCreateBoardOpen(false);
      fetchUserData(); // Refresh the data
    } catch (error: any) {
      console.error('Error creating board:', error);
      setError(error.message || "Failed to create board");
    } finally {
      setCreatingBoard(false);
    }
  };


  if (!session) {
    return <div>Loading...</div>;
  }

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

  return (
    <div className="min-h-screen gradient-warm">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <NewProfilePictureUpload
              currentAvatarUrl={userProfile?.avatar_url}
              userEmail={session.user.email || ''}
              userId={session.user.id}
              onAvatarUpdate={(newUrl) => setUserProfile({...userProfile, avatar_url: newUrl})}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            {userProfile?.full_name || session.user.email}
          </h1>
          <div className="flex items-center justify-center space-x-6 md:space-x-8 text-muted-foreground">
            <div className="text-center">
              <div className="text-lg md:text-xl font-semibold text-foreground">{userPins.length}</div>
              <div className="text-sm">pins</div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-xl font-semibold text-foreground">{boards.length}</div>
              <div className="text-sm">boards</div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-xl font-semibold text-foreground">{followersCount}</div>
              <div className="text-sm">followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-xl font-semibold text-foreground">{followingCount}</div>
              <div className="text-sm">following</div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Boards Section */}
          <div>
              <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-gradient">Your Boards</h2>
                <p className="text-muted-foreground">Organize your pins into themed collections</p>
              </div>
              <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full btn-modern shadow-card hover:shadow-hover">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Board
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                    <DialogDescription>
                      Create a board to organize your pins by theme
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBoard} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="boardName">Board Name *</Label>
                      <Input
                        id="boardName"
                        placeholder="e.g., Living Room Ideas"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardDescription">Description</Label>
                      <Input
                        id="boardDescription"
                        placeholder="What's this board about?"
                        value={newBoardDescription}
                        onChange={(e) => setNewBoardDescription(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="submit" 
                        disabled={creatingBoard || !newBoardName.trim()}
                        className="flex-1 rounded-xl"
                      >
                        {creatingBoard ? "Creating..." : "Create Board"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsCreateBoardOpen(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {boards.length === 0 ? (
              <Card className="p-12 text-center glass-card rounded-2xl border-0">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gradient">Create your first board</h3>
                <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
                  Boards help you organize your pins by theme or project. Start collecting your favorite ideas!
                </p>
                <Button onClick={() => setIsCreateBoardOpen(true)} className="rounded-full btn-modern shadow-card hover:shadow-hover px-8 py-3 text-lg">
                  Create Board
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {boards.map((board) => (
                  <Card 
                    key={board.id} 
                    className="cursor-pointer pin-card group rounded-2xl border-0"
                    onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                      {board.cover_image_url ? (
                        <img 
                          src={board.cover_image_url} 
                          alt={board.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <span className="text-3xl md:text-4xl">📌</span>
                      )}
                    </div>
                    <CardContent className="p-2 md:p-3">
                      <h3 className="font-medium text-xs md:text-sm line-clamp-2 mb-1">
                        {board.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {userPins.filter(pin => pin.board_id === board.id).length} pins
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pins Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-gradient">Your Pins</h2>
                <p className="text-muted-foreground">All your saved ideas in one place</p>
              </div>
              <Button 
                onClick={() => navigate("/create-pin")}
                className="rounded-full btn-modern shadow-card hover:shadow-hover"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pin
              </Button>
            </div>

            {userPins.length === 0 ? (
              <Card className="p-12 text-center glass-card rounded-2xl border-0">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📌</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gradient">No pins yet</h3>
                <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
                  Start creating pins to build your collection and share your favorite ideas with the world
                </p>
                <Button onClick={() => navigate("/create-pin")} className="rounded-full btn-modern shadow-card hover:shadow-hover px-8 py-3 text-lg">
                  Create Your First Pin
                </Button>
              </Card>
            ) : (
              <PinGrid pins={userPins} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;