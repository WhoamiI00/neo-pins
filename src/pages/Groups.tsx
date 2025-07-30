import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
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
      if (error) throw error;
      
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
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          groups!inner(*)
        `)
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedGroup({
          ...data.groups,
          member_role: data.role,
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4">
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Groups Sidebar */}
        <div className="w-80 border-r bg-card">
          <GroupSidebar
            selectedGroupId={selectedGroup?.id}
            onGroupSelect={handleGroupSelect}
            className="h-full"
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          {selectedGroup ? (
            <GroupChatView
              group={selectedGroup}
              onOpenSettings={handleOpenSettings}
              onOpenInvite={handleOpenInvite}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="relative">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <MessageCircle className="h-8 w-8 absolute -bottom-1 -right-1 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Welcome to Groups</h2>
                  <p className="text-muted-foreground">
                    Select a group from the sidebar to start chatting, or create a new group to get started.
                  </p>
                </div>
                <Button onClick={() => navigate('/groups')}>
                  <Users className="h-4 w-4 mr-2" />
                  View All Groups
                </Button>
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