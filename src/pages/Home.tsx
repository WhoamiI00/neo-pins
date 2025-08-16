import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

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
    avatar_url?: string;
  };
}

const Home = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { pinId } = useParams();
  const searchQuery = searchParams.get('search');
  const [session, setSession] = useState<Session | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePinDeleted = (pinId: string) => {
    setPins(prev => prev.filter(pin => pin.id !== pinId));
    toast({
      title: "Pin deleted",
      description: "Pin has been removed from your view.",
    });
  };

  // Check if we're on a pin route
  useEffect(() => {
    if (pinId) {
      setShowPinModal(true);
    }
  }, [pinId]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPins();
  }, [searchQuery]);

  const fetchPins = async () => {
    setLoading(true);
    
    let query = supabase
      .from('pins')
      .select('*');

    if (searchQuery) {
      // Use ilike for basic text search
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: pinsData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pins:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for pins
    if (pinsData && pinsData.length > 0) {
      const userIds = [...new Set(pinsData.map(pin => pin.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
      
      const pinsWithProfiles = pinsData.map(pin => ({
        ...pin,
        profiles: profilesMap.get(pin.user_id)
      }));

      setPins(pinsWithProfiles);
    } else {
      setPins([]);
    }
    
    setLoading(false);
  };


  if (!session) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center py-20 max-w-5xl mx-auto">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                ✨ Discover & Save Ideas
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 text-gradient leading-tight">
              Save ideas you love
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
              Collect your favorites so you can get back to them later. Create beautiful boards to organize your pins by theme and inspiration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-full px-10 py-6 text-lg font-semibold btn-modern shadow-card hover:shadow-hover"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => navigate("/auth")}
                className="rounded-full px-10 py-6 text-lg font-semibold border-2 hover:bg-accent/50"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Sample pins for logged out users */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
                  Discover inspiring ideas
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Explore beautiful pins from our community and get inspired for your next project
                </p>
              </div>
              <PinGrid pins={pins.slice(0, 12)} currentUserId={session?.user?.id} />
              {pinId && (
                <PinModal
                  pin={null}
                  pinId={pinId}
                  isOpen={showPinModal}
                  onClose={() => {
                    setShowPinModal(false);
                    navigate('/');
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <Header />
      <main className="py-8">
        {searchQuery && (
          <div className="container mx-auto px-4 mb-6">
            <h2 className="text-xl font-semibold">Search results for "{searchQuery}"</h2>
            <p className="text-muted-foreground">{pins.length} pins found</p>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pins...</p>
            </div>
          </div>
        ) : (
          <PinGrid 
            pins={pins} 
            currentUserId={session?.user?.id}
            onPinDeleted={handlePinDeleted}
          />
        )}
        
        {pinId && (
          <PinModal
            pin={null}
            pinId={pinId}
            isOpen={showPinModal}
            onClose={() => {
              setShowPinModal(false);
              navigate('/');
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Home;