import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Users, User, LogOut, UserCheck, UserPlus, Search, LogIn } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppSidebarProps {
  user?: any;
  userProfile?: any;
}

export function AppSidebar({ user, userProfile }: AppSidebarProps) {
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Different navigation items based on authentication status
  const authenticatedItems = [
    { title: "Home", url: "/", icon: Home },
    { title: "Create Pin", url: "/create-pin", icon: Plus },
    { title: "Groups", url: "/groups", icon: Users },
    { title: "Followers", url: "/followers", icon: UserCheck },
    { title: "Following", url: "/following", icon: UserPlus },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const unauthenticatedItems = [
    { title: "Home", url: "/", icon: Home },
    { title: "Search", url: "/#search", icon: Search, isSearchToggle: true },
    { title: "LogIn", url: "/auth", icon: LogIn },
  ];

  const mainItems = user ? authenticatedItems : unauthenticatedItems;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/" || currentPath.startsWith("/?");
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
    // Close sidebar on mobile after search
    if (isMobile) setOpenMobile(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Signed out successfully",
      });
      // Close sidebar on mobile after sign out
      if (isMobile) setOpenMobile(false);
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        variant: "destructive",
      });
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/dd15324d-eb74-4e88-9e81-b3dac66be0a1.png" 
                alt="PinBoard Logo" 
                className="w-8 h-8 flex-shrink-0"
              />
              {!isCollapsed && (
                <span className="text-lg font-bold">PinBoard</span>
              )}
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                else setOpen(false);
              }}
            >
              ×
            </Button>
          </div>
        </div>

        {/* Search Section */}
        {((user && !isCollapsed) || (!user && showSearch && !isCollapsed)) && (
          <div className="p-4 border-b">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search pins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </form>
          </div>
        )}

        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={userProfile?.avatar_url || ""} />
                <AvatarFallback>
                  {(userProfile?.full_name || user.email || '').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {userProfile?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild={!(item as any).isSearchToggle} isActive={isActive(item.url)}>
                    {(item as any).isSearchToggle ? (
                      <button
                        className="flex items-center gap-3 w-full"
                        onClick={() => {
                          setShowSearch(!showSearch);
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </button>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        className="flex items-center gap-3"
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer Actions */}
        <div className="p-4 border-t space-y-2">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                onClick={handleSignOut}
                className={isCollapsed ? "h-8 w-8" : ""}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Sign Out</span>}
              </Button>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}