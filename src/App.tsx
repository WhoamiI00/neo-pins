import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { BotProtectionWrapper } from "@/components/BotProtectionWrapper";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CreatePin from "./pages/CreatePin";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Board from "./pages/Board";
import Groups from "./pages/Groups";
import JoinGroup from "./pages/JoinGroup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BotProtectionWrapper>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BotProtectionWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
