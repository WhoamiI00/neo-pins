import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Users, Lock, Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface GroupInvite {
  id: string;
  invite_code: string;
  expires_at?: string;
  is_active: boolean;
  usage_count: number;
  max_uses?: number;
  groups: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    is_private: boolean;
  };
}

const JoinGroup = () => {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (inviteCode && user) {
      fetchInviteDetails();
    }
  }, [inviteCode, user]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        // Store the invite code and redirect to auth
        localStorage.setItem('pendingInvite', inviteCode || '');
        navigate('/auth');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    }
  };

  const fetchInviteDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('group_invites')
        .select(`
          *,
          groups!inner(*)
        `)
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Invalid Invite',
          description: 'This invite link is not valid or has expired.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Check if invite is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: 'Invite Expired',
          description: 'This invite link has expired.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Check if max uses reached
      if (data.max_uses && data.usage_count >= data.max_uses) {
        toast({
          title: 'Invite Full',
          description: 'This invite link has reached its maximum number of uses.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setInvite(data);

      // Check if user is already a member
      const { data: memberData } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', data.groups.id)
        .eq('user_id', user.id)
        .single();

      setAlreadyMember(!!memberData);
    } catch (error) {
      console.error('Error fetching invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invite details',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!invite) return;

    setJoining(true);
    try {
      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.groups.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Update invite usage count
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ usage_count: invite.usage_count + 1 })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success!',
        description: `You've joined ${invite.groups.name}`,
      });

      // Navigate to the group
      navigate(`/groups/${invite.groups.id}`);
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'Failed to join group',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading invite details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
              <p className="text-muted-foreground mb-4">
                This invite link is not valid or has expired.
              </p>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              Join Group
            </CardTitle>
            <CardDescription>
              You've been invited to join a group chat
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Group Info */}
            <div className="text-center space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={invite.groups.avatar_url} />
                <AvatarFallback className="text-lg">
                  {invite.groups.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{invite.groups.name}</h3>
                  <Badge variant={invite.groups.is_private ? 'secondary' : 'outline'}>
                    {invite.groups.is_private ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </>
                    )}
                  </Badge>
                </div>
                
                {invite.groups.description && (
                  <p className="text-muted-foreground">{invite.groups.description}</p>
                )}
              </div>
            </div>

            {/* Invite Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {invite.expires_at && (
                <p>
                  Expires: {new Date(invite.expires_at).toLocaleDateString()} at{' '}
                  {new Date(invite.expires_at).toLocaleTimeString()}
                </p>
              )}
              
              {invite.max_uses && (
                <p>
                  Uses: {invite.usage_count} / {invite.max_uses}
                </p>
              )}
            </div>

            {/* Action Button */}
            {alreadyMember ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>You're already a member of this group</span>
                </div>
                <Button onClick={() => navigate(`/groups/${invite.groups.id}`)} className="w-full">
                  Go to Group
                </Button>
              </div>
            ) : (
              <Button onClick={joinGroup} disabled={joining} className="w-full">
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Group'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinGroup;