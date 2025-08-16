import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw, Trash2, Link as LinkIcon, Calendar, Users } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_private: boolean;
}

interface GroupInvite {
  id: string;
  invite_code: string;
  expires_at?: string;
  is_active: boolean;
  usage_count: number;
  max_uses?: number;
  created_at: string;
}

interface GroupInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
}

export const GroupInviteDialog = ({ open, onOpenChange, group }: GroupInviteDialogProps) => {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [hasExpiry, setHasExpiry] = useState(true);
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchInvites();
    }
  }, [open, group.id]);

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', group.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invites:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invite links',
          variant: 'destructive',
        });
        return;
      }
      
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invite links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const inviteCode = await generateInviteCode();
      const expiresAt = hasExpiry 
        ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('group_invites')
        .insert({
          group_id: group.id,
          invite_code: inviteCode,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: hasMaxUses ? maxUses : null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invite link created successfully!',
      });

      fetchInvites();
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invite link',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const generateInviteCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_invite_code');
    if (error) throw error;
    return data;
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard',
    });
  };

  const deactivateInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('group_invites')
        .update({ is_active: false })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invite link deactivated',
      });

      fetchInvites();
    } catch (error) {
      console.error('Error deactivating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate invite',
        variant: 'destructive',
      });
    }
  };

  const isInviteExpired = (invite: GroupInvite) => {
    if (!invite.expires_at) return false;
    return new Date(invite.expires_at) < new Date();
  };

  const isInviteMaxUsed = (invite: GroupInvite) => {
    if (!invite.max_uses) return false;
    return invite.usage_count >= invite.max_uses;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Invite Links for {group.name}
          </DialogTitle>
          <DialogDescription>
            Create and manage invite links to let others join this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Invite */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Create New Invite Link</h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Expires after</Label>
                  <p className="text-sm text-muted-foreground">Set when this link expires</p>
                </div>
                <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
              </div>

              {hasExpiry && (
                <div className="space-y-2">
                  <Label htmlFor="expiry">Hours until expiry</Label>
                  <Input
                    id="expiry"
                    type="number"
                    min="1"
                    max="8760"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Limit uses</Label>
                  <p className="text-sm text-muted-foreground">Set max number of people who can use this link</p>
                </div>
                <Switch checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
              </div>

              {hasMaxUses && (
                <div className="space-y-2">
                  <Label htmlFor="max-uses">Maximum uses</Label>
                  <Input
                    id="max-uses"
                    type="number"
                    min="1"
                    max="1000"
                    value={maxUses || ''}
                    onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              )}
            </div>

            <Button onClick={createInvite} disabled={creating} className="w-full">
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invite Link'
              )}
            </Button>
          </div>

          {/* Existing Invites */}
          <div className="space-y-4">
            <h3 className="font-medium">Active Invite Links</h3>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active invite links</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {invites.map((invite) => {
                    const isExpired = isInviteExpired(invite);
                    const isMaxUsed = isInviteMaxUsed(invite);
                    const isInactive = isExpired || isMaxUsed;
                    
                    return (
                      <div key={invite.id} className={`p-4 border rounded-lg ${isInactive ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {invite.invite_code}
                              </code>
                              {isExpired && <Badge variant="destructive">Expired</Badge>}
                              {isMaxUsed && <Badge variant="destructive">Max Uses Reached</Badge>}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {invite.usage_count} used
                                {invite.max_uses && ` / ${invite.max_uses}`}
                              </div>
                              
                              {invite.expires_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Expires {new Date(invite.expires_at).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyInviteLink(invite.invite_code)}
                              disabled={isInactive}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deactivateInvite(invite.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
