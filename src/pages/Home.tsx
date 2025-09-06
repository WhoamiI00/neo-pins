import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import PinModal from "@/components/PinModal";
import NetworkIndicator from "@/components/NetworkIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  board_id: string;
  created_at: string;
  is_nsfw?: boolean;
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


  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 1, 1] as const
      }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (!session) {
  return (
    <motion.div 
      className="min-h-screen"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <main className="container mx-auto px-4 py-8">
          {/* Enhanced Hero Section */}
          <motion.div 
            className="text-center py-12 px-4 max-w-5xl mx-auto"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="mb-6" variants={itemVariants}>
              <motion.span 
                className="inline-block px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                ✨ Discover & Save Ideas
              </motion.span>
            </motion.div>
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient leading-tight"
              variants={itemVariants}
            >
              Save ideas you love
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Collect your favorites so you can get back to them later. Create beautiful boards to organize your pins by theme and inspiration.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto sm:max-w-none"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="rounded-full px-8 py-4 text-base sm:text-lg font-semibold btn-modern shadow-card hover:shadow-hover w-full sm:w-auto"
                >
                  Get Started Free
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline"
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="rounded-full px-8 py-4 text-base sm:text-lg font-semibold border-2 hover:bg-accent/50 w-full sm:w-auto"
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

        {/* Enhanced Sample Pins Section */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              className="flex justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
              <div className="text-center">
                <motion.div 
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
                <motion.p 
                  className="text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Loading inspiring pins...
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              key="content"
            >
              <motion.div 
                className="text-center mb-8 px-4"
                variants={heroVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gradient"
                  variants={itemVariants}
                >
                  Discover inspiring ideas
                </motion.h2>
                <motion.p 
                  className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
                  variants={itemVariants}
                >
                  Explore beautiful pins from our community and get inspired for your next project
                </motion.p>
              </motion.div>
              <PinGrid pins={pins.slice(0, 12)} currentUserId={session?.user?.id} />
              <AnimatePresence>
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
               </AnimatePresence>
             </motion.div>
           )}
         </AnimatePresence>
        </main>
      </motion.div>
     );
  }

  return (
    <motion.div 
      className="min-h-screen gradient-warm"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <main className="py-8">
        {/* Network Status Indicator (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            className="container mx-auto px-4 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NetworkIndicator showDetails className="max-w-xs" />
          </motion.div>
        )}
        
        {searchQuery && (
          <motion.div 
            className="container mx-auto px-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h2 
              className="text-xl font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Search results for "{searchQuery}"
            </motion.h2>
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {pins.length} pins found
            </motion.p>
          </motion.div>
        )}
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              className="flex items-center justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loading"
            >
              <div className="text-center">
                <motion.div 
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
                <motion.p 
                  className="text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Loading your pins...
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              key="pins"
            >
              <PinGrid 
                pins={pins} 
                currentUserId={session?.user?.id}
                onPinDeleted={handlePinDeleted}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
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
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default Home;