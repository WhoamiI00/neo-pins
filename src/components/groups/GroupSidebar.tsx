import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Settings, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateGroupDialog } from './CreateGroupDialog';
import { GroupSettingsDialog } from './GroupSettingsDialog';
import { GroupInviteDialog } from './GroupInviteDialog';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_private: boolean;
  created_by: string;
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
  member_role?: string;
}

interface GroupSidebarProps {
  selectedGroupId?: string;
  onGroupSelect: (groupId: string) => void;
  className?: string;
}

export const GroupSidebar = ({ selectedGroupId, onGroupSelect, className }: GroupSidebarProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserGroups();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('group-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchUserGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, fetchUserGroups)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserGroups = async () => {
    try {
      console.log('Starting fetchUserGroups...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!user) {
        console.log('No user found, setting empty groups');
        setGroups([]);
        return;
      }

      console.log('Current user ID:', user.id);

      // First get the group memberships
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching group members:', memberError);
        throw memberError;
      }

      console.log('Member data:', memberData);

      if (!memberData || memberData.length === 0) {
        console.log('No group memberships found, setting empty groups');
        setGroups([]);
        return;
      }

      // Then get the groups details
      const groupIds = memberData.map(m => m.group_id);
      console.log('Fetching groups with IDs:', groupIds);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }

      console.log('Groups data:', groupsData);

      // Combine the data
      const groupsWithRoles = (groupsData || []).map(group => {
        const membership = memberData.find(m => m.group_id === group.id);
        return {
          ...group,
          member_role: membership?.role || 'member',
          unread_count: 0 // TODO: Calculate unread messages
        };
      });

      console.log('Final groups with roles:', groupsWithRoles);
      setGroups(groupsWithRoles);
    } catch (error) {
      console.error('Error in fetchUserGroups:', error);
      toast({
        title: 'Error',
        description: `Failed to load groups: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      // Set empty groups on error so UI doesn't stay in loading state
      setGroups([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleGroupSettings = (group: Group) => {
    setSelectedGroup(group);
    setShowSettingsDialog(true);
  };

  const handleGroupInvite = (group: Group) => {
    setSelectedGroup(group);
    setShowInviteDialog(true);
  };

  if (loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 border-b">
          <div className="h-6 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Groups
          </h2>
          <Button size="sm" variant="ghost" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Groups List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No groups yet</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => setShowCreateDialog(true)}
              >
                Create your first group
              </Button>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  selectedGroupId === group.id ? 'bg-accent' : ''
                }`}
                onClick={() => onGroupSelect(group.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={group.avatar_url} />
                  <AvatarFallback>
                    {group.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{group.name}</h3>
                    {group.is_private && (
                      <Badge variant="secondary" className="h-4 text-xs px-1">
                        Private
                      </Badge>
                    )}
                  </div>
                  {group.last_message && (
                    <p className="text-xs text-muted-foreground truncate">
                      {group.last_message}
                    </p>
                  )}
                </div>

                {group.unread_count && group.unread_count > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                    {group.unread_count > 99 ? '99+' : group.unread_count}
                  </Badge>
                )}

                {/* Group Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupInvite(group);
                      }}
                    >
                      <LinkIcon className="h-3 w-3" />
                    </Button>
                    {group.member_role === 'admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupSettings(group);
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onGroupCreated={fetchUserGroups}
      />
      
      {selectedGroup && (
        <>
          <GroupSettingsDialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            group={selectedGroup}
            onGroupUpdated={fetchUserGroups}
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