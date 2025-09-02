import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PinboardIframe from '@/components/PinboardIframe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2, Bookmark, ExternalLink, Users, Pin, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PinboardView = () => {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({
    totalPins: 0,
    totalBoards: 0,
    totalUsers: 0,
    totalGroups: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
  };

  const fetchStats = async () => {
    try {
      // Fetch platform statistics
      const [
        { count: pins },
        { count: boards },
        { count: users },
        { count: groups }
      ] = await Promise.all([
        supabase.from('pins').select('*', { count: 'exact', head: true }),
        supabase.from('boards').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalPins: pins || 0,
        totalBoards: boards || 0,
        totalUsers: users || 0,
        totalGroups: groups || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Pinterest-like Pinboard',
          text: 'Check out this amazing collection of pins!',
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Success',
          description: 'Link copied to clipboard!',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen gradient-warm">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="hover-scale"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Interactive Pinboard</h1>
                <p className="text-muted-foreground">Explore the full Pinterest-like experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Explore Pins
              </Button>
            </div>
          </div>

          {/* Platform Stats */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 text-center glass-card hover-lift">
                <div className="flex items-center justify-center mb-2">
                  <Pin className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalPins}</div>
                <div className="text-sm text-muted-foreground">Total Pins</div>
              </Card>
              
              <Card className="p-4 text-center glass-card hover-lift">
                <div className="flex items-center justify-center mb-2">
                  <Bookmark className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalBoards}</div>
                <div className="text-sm text-muted-foreground">Boards</div>
              </Card>
              
              <Card className="p-4 text-center glass-card hover-lift">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </Card>
              
              <Card className="p-4 text-center glass-card hover-lift">
                <div className="flex items-center justify-center mb-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalGroups}</div>
                <div className="text-sm text-muted-foreground">Groups</div>
              </Card>
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge variant="secondary" className="text-xs">
              📌 Pin Collections
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🖼️ Image Sharing
            </Badge>
            <Badge variant="secondary" className="text-xs">
              👥 Group Chat
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🔗 Link Previews
            </Badge>
            <Badge variant="secondary" className="text-xs">
              📱 Mobile Responsive
            </Badge>
            <Badge variant="secondary" className="text-xs">
              🎨 Custom Boards
            </Badge>
          </div>
        </div>

        {/* Pinboard Iframe */}
        <div className="max-w-6xl mx-auto">
          <PinboardIframe
            url={window.location.origin}
            title="Pinterest-like Pinboard"
            showPreview={false}
            className="shadow-hover"
          />
        </div>

        {/* Call to Action */}
        {!session && (
          <div className="text-center mt-12 p-8 glass-card rounded-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gradient">
              Join Our Creative Community
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Create your own pins, organize them into boards, chat with friends in groups, 
              and discover amazing content from our creative community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-full px-8 py-6 text-lg font-semibold btn-modern shadow-card hover:shadow-hover"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => navigate("/auth")}
                className="rounded-full px-8 py-6 text-lg font-semibold border-2 hover:bg-accent/50"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PinboardView;