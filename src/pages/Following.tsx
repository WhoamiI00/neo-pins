import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserMinus } from "lucide-react";

interface Following {
  id: string;
  following_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

const Following = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    };

    checkAuth();

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
      fetchFollowing();
    }
  }, [session]);

  const fetchFollowing = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          following_id,
          created_at,
          profiles!follows_following_id_fkey (
            user_id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('follower_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching following:', error);
        toast({
          title: "Error",
          description: "Failed to load following",
          variant: "destructive",
        });
        return;
      }

      setFollowing(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (followingId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session?.user.id)
        .eq('following_id', followingId);

      if (error) {
        console.error('Error unfollowing user:', error);
        toast({
          title: "Error",
          description: "Failed to unfollow user",
          variant: "destructive",
        });
        return;
      }

      setFollowing(prev => prev.filter(f => f.following_id !== followingId));
      toast({
        title: "Success",
        description: "Unfollowed user",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Following</CardTitle>
          <p className="text-muted-foreground">
            You're following {following.length} {following.length === 1 ? 'person' : 'people'}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You're not following anyone yet</p>
              <p className="text-sm text-muted-foreground">
                Discover and follow users to see their pins in your feed!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {following.map((follow) => (
                <div
                  key={follow.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => navigate(`/user/${follow.profiles.user_id}`)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={follow.profiles.avatar_url || ""} />
                      <AvatarFallback>
                        {(follow.profiles.full_name || follow.profiles.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {follow.profiles.full_name || follow.profiles.email}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {follow.profiles.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Following since {new Date(follow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unfollowUser(follow.following_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Following;