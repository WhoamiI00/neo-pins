import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GroupSidebar } from '@/components/groups/GroupSidebar';
import { GroupChatView } from '@/components/groups/GroupChatView';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { GroupInviteDialog } from '@/components/groups/GroupInviteDialog';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_private: boolean;
  created_by: string;
  member_role?: string;
}

const Groups = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (groupId && user) {
      fetchGroupDetails(groupId);
    }
  }, [groupId, user]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth error:', error);
        navigate('/auth');
        return;
      }
      
      if (!user) {
        navigate('/auth');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    try {
      // First, get the user's role in the group
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;

      // Then get the group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      if (memberData && groupData) {
        setSelectedGroup({
          ...groupData,
          member_role: memberData.role,
        });
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group details',
        variant: 'destructive',
      });
      navigate('/groups');
    }
  };

  const handleGroupSelect = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  const handleOpenInvite = () => {
    setShowInviteDialog(true);
  };

  const handleGroupUpdated = () => {
    if (selectedGroup) {
      fetchGroupDetails(selectedGroup.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Groups Sidebar - Mobile Drawer / Desktop Sidebar */}
        <div className="lg:w-80 lg:border-r bg-card/50 backdrop-blur-sm lg:block">
          <div className="h-full">
            <GroupSidebar
              selectedGroupId={selectedGroup?.id}
              onGroupSelect={handleGroupSelect}
              className="h-full"
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-gradient-warm min-h-0">
          {selectedGroup ? (
            <GroupChatView
              group={selectedGroup}
              onOpenSettings={handleOpenSettings}
              onOpenInvite={handleOpenInvite}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center space-y-4 max-w-md animate-fade-in">
                <div className="relative">
                  <div className="w-16 sm:w-24 h-16 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 sm:h-12 w-8 sm:w-12 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 sm:w-10 h-6 sm:h-10 bg-primary rounded-full flex items-center justify-center">
                    <MessageCircle className="h-3 sm:h-5 w-3 sm:w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gradient">Welcome to Groups</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Select a group from the sidebar to start chatting, or create a new group to get started.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Share images, links, and pins with your community!
                  </p>
                </div>
                <div className="flex flex-col gap-2 justify-center">
                  <Button onClick={() => navigate('/groups')} className="btn-modern w-full">
                    <Users className="h-4 w-4 mr-2" />
                    View All Groups
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Explore Pins
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedGroup && (
        <>
          <GroupSettingsDialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            group={selectedGroup}
            onGroupUpdated={handleGroupUpdated}
          />
          
          <GroupInviteDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            group={selectedGroup}
          />
        </>
      )}
    </div>
  );
};

export default Groups;