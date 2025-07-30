import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserMinus, Users, Grid3X3 } from "lucide-react";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface Board {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  created_at: string;
}

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  user_id: string;
  board_id: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [userPins, setUserPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId, session]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setUserProfile(profileData);

      // Fetch user's boards
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId)
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (pinsError) {
        console.error('Error fetching pins:', pinsError);
      } else {
        setUserPins(pinsData || []);
      }

      // Fetch follow counts
      await fetchFollowCounts();
      
      // Check if current user follows this user
      if (session?.user?.id && session.user.id !== userId) {
        await checkFollowStatus();
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    if (!userId) return;

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    setFollowersCount(followersCount || 0);
    setFollowingCount(followingCount || 0);
  };

  const checkFollowStatus = async () => {
    if (!session?.user?.id || !userId) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', session.user.id)
      .eq('following_id', userId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!session?.user?.id || !userId) {
      toast({
        title: "Login required",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      return;
    }

    if (session.user.id === userId) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own profile",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', userId);

        if (!error) {
          setIsFollowing(false);
          setFollowersCount(prev => prev - 1);
          toast({
            title: "Unfollowed",
            description: `You unfollowed ${userProfile?.full_name || userProfile?.email}`,
          });
        }
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: session.user.id,
            following_id: userId
          });

        if (!error) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
          toast({
            title: "Following",
            description: `You are now following ${userProfile?.full_name || userProfile?.email}`,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };


  if (loading || !userProfile) {
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

  const isOwnProfile = session?.user?.id === userId;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4">
            <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name || userProfile.email} />
            <AvatarFallback className="text-xl md:text-2xl font-bold">
              {(userProfile.full_name || userProfile.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {userProfile.full_name || userProfile.email}
          </h1>
          
          <div className="flex items-center justify-center space-x-4 md:space-x-6 mb-4 text-sm md:text-base text-muted-foreground">
            <span>{userPins.length} pins</span>
            <span>{boards.length} boards</span>
            <span>{followersCount} followers</span>
            <span>{followingCount} following</span>
          </div>

          {!isOwnProfile && session?.user && (
            <Button 
              onClick={toggleFollow}
              variant={isFollowing ? "outline" : "default"}
              className="rounded-full"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}

          {isOwnProfile && (
            <Button 
              onClick={() => navigate("/profile")}
              variant="outline"
              className="rounded-full"
            >
              Edit Profile
            </Button>
          )}
        </div>

        <div className="space-y-8">
          {/* Boards Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Boards</h2>
            {boards.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No boards yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "Create your first board to organize your pins" : "This user hasn't created any boards yet"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {boards.map((board) => (
                  <Card 
                    key={board.id} 
                    className="cursor-pointer hover:shadow-card transition-shadow duration-200"
                    onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                      {board.cover_image_url ? (
                        <img 
                          src={board.cover_image_url} 
                          alt={board.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <span className="text-4xl">📌</span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
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
            <h2 className="text-2xl font-semibold mb-6">Pins</h2>
            {userPins.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📌</span>
                </div>
                <h3 className="text-lg font-medium mb-2">No pins yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "Start creating pins to build your collection" : "This user hasn't created any pins yet"}
                </p>
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

export default UserProfile;