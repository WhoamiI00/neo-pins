import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Search, Plus, User, LogOut, Download, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error) {
      setUserProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const downloadProfilePicture = async () => {
    if (!userProfile?.avatar_url) {
      toast({
        title: "No profile picture",
        description: "You don't have a profile picture to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(userProfile.avatar_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `profile-picture-${userProfile.full_name || user?.email || 'user'}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded!",
        description: "Your profile picture has been downloaded.",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download failed",
        description: "Failed to download your profile picture.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer flex-shrink-0" 
          onClick={() => navigate("/")}
        >
          <img 
            src="/lovable-uploads/dd15324d-eb74-4e88-9e81-b3dac66be0a1.png" 
            alt="PinBoard Logo" 
            className="w-8 h-8"
          />
          <span className="text-lg md:text-xl font-bold hidden sm:block">PinBoard</span>
        </div>

        {/* Search Bar (centered) */}
        <div className="flex-1 max-w-2xl mx-4 md:mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for pins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </form>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          {user ? (
            <>
              <ThemeToggle />
{/*               <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/groups")}
                className="rounded-full"
              >
                <Users className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Groups</span>
              </Button> */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/create-pin")}
                className="rounded-full"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Create</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.avatar_url || ""} alt={userProfile?.full_name || user.email || ""} />
                      <AvatarFallback>
                        {(userProfile?.full_name || user.email || '').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {userProfile?.avatar_url && (
                    <DropdownMenuItem onClick={downloadProfilePicture} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Profile Picture
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={() => navigate("/auth")}
                className="rounded-full text-sm"
                size="sm"
              >
                <span className="hidden md:inline">Log in</span>
                <span className="md:hidden">Login</span>
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                className="rounded-full text-sm"
                size="sm"
              >
                <span className="hidden md:inline">Sign up</span>
                <span className="md:hidden">Join</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
