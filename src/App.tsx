import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BotProtectionWrapper } from "@/components/BotProtectionWrapper";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CreatePin from "./pages/CreatePin";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Board from "./pages/Board";
import Groups from "./pages/Groups";
import JoinGroup from "./pages/JoinGroup";
import PinboardView from "./pages/PinboardView";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                      />
                      <span className="font-bold text-lg">PinBoard</span>
                    </div>
                    <div className="w-8" /> {/* Spacer for centering */}
                  </div>
                </header>

                {/* Desktop Sidebar */}
                <AppSidebar user={user} userProfile={userProfile} />
                
                {/* Main Content */}
                <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
                  {/* <BotProtectionWrapper> */}
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
                  {/* </BotProtectionWrapper> */}
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