import { useEffect, useState, lazy, Suspense, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

// Lazy load page components for code splitting
// This significantly reduces initial bundle size and improves First Contentful Paint (FCP)
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CreatePin = lazy(() => import("./pages/CreatePin"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Board = lazy(() => import("./pages/Board"));
const Groups = lazy(() => import("./pages/Groups"));
const JoinGroup = lazy(() => import("./pages/JoinGroup"));
const PinboardView = lazy(() => import("./pages/PinboardView"));
const Followers = lazy(() => import("./pages/Followers"));
const Following = lazy(() => import("./pages/Following"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with better defaults for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevent refetch on every window focus
      retry: 1, // Reduce retry attempts for faster failure feedback
    },
  },
});

// Memoized loading fallback to prevent unnecessary re-renders
const RouteLoadingFallback = memo(() => (
  <motion.div
    className="flex items-center justify-center min-h-screen"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
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
        Loading...
      </motion.p>
    </div>
  </motion.div>
));

RouteLoadingFallback.displayName = "RouteLoadingFallback";

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }

        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          localStorage.removeItem('pendingInvite');
          window.location.href = '/auth';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                {/* Mobile header with hamburger */}
                <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur border-b lg:hidden">
                  <div className="flex items-center justify-between px-4 h-full">
                    <SidebarTrigger className="lg:hidden" />
                    <div className="flex items-center gap-2">
                      <img 
                        src="/lovable-uploads/dd15324d-eb74-4e88-9e81-b3dac66be0a1.png" 
                        alt="PinBoard Logo" 
                        className="w-6 h-6"
                        width="24"
                        height="24"
                        loading="eager"
                      />
                      <span className="font-bold text-lg">PinBoard</span>
                    </div>
                    <div className="w-8" /> {/* Spacer for centering */}
                  </div>
                </header>

                {/* Desktop Sidebar */}
                <AppSidebar user={user} userProfile={userProfile} />
                
                {/* Main Content with Suspense for lazy-loaded routes */}
                <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/auth/reset-pass" element={<ResetPassword />} />
                      <Route path="/create-pin" element={<CreatePin />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/user/:userId" element={<UserProfile />} />
                      <Route path="/board/:boardId" element={<Board />} />
                      <Route path="/pin/:pinId" element={<Index />} />
                      <Route path="/groups" element={<Groups />} />
                      <Route path="/groups/:groupId" element={<Groups />} />
                      <Route path="/join/:inviteCode" element={<JoinGroup />} />
                      <Route path="/pinboard" element={<PinboardView />} />
                      <Route path="/followers" element={<Followers />} />
                      <Route path="/following" element={<Following />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
              
              
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;