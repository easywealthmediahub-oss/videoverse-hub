import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Search, 
  Settings, 
  Video, 
  Download, 
  Film, 
  BookOpen,
  ExternalLink,
  Play,
  PlaySquare,
  Clock,
  ListVideo,
  MoreHorizontal,
  History,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileBottomNav from '@/components/MobileBottomNav';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number;
  view_count: number;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
  video_count: number;
  thumbnail_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { channel: profileChannel, loading: profileLoading } = useProfile();
  
  // Create a local channel variable that includes subscriber count
  const channel = profileChannel ? {
    ...profileChannel,
    subscriber_count: profileChannel.subscriber_count || 0
  } : null;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [watchHistory, setWatchHistory] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (data && data.role === 'admin') {
      setIsAdmin(true);
    }
    setCheckingAdmin(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (user && profileChannel) {
      fetchUserData();
    }
  }, [user, profileChannel, navigate]);

  const fetchUserData = async () => {
    if (!user || !profileChannel) return;
    
    try {
      setLoading(true);
      
      // Fetch user's videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('channel_id', profileChannel.id)
        .order('created_at', { ascending: false })
        .limit(10); // Limit for initial load

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Fetch user's playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .limit(10); // Limit for initial load

      if (playlistsError) throw playlistsError;
      setPlaylists(playlistsData || []);

      // Fetch watch history (this would need a watch_history table)
      // For now, we'll use a placeholder implementation
      setWatchHistory(videosData?.slice(0, 5) || []);

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load profile data',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please login to view your profile.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Channel Found</h1>
          <p className="text-muted-foreground mb-4">You don't have a channel yet.</p>
          <Button asChild>
            <Link to="/channel/settings">Create Channel</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pb-16">
        {/* Profile Header - Full width with background */}
        <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 border-4 border-white mb-4">
              <AvatarImage src={channel.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {channel.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold text-foreground">{channel.name || 'User'}</h1>
            <p className="text-sm text-muted-foreground mt-1">@{channel.username || user.email?.split('@')[0]}</p>
            
            <div className="flex gap-4 mt-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-foreground">{channel.subscriber_count || 0}</div>
                <div className="text-muted-foreground text-xs">Subscribers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">{videos.length}</div>
                <div className="text-muted-foreground text-xs">Videos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">{playlists.length}</div>
                <div className="text-muted-foreground text-xs">Playlists</div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/c/${channel.username || user.id}`}>
                  View channel
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/studio">
                  <PlaySquare className="h-4 w-4 mr-1" />
                  Studio
                </Link>
              </Button>
              {!checkingAdmin && isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    Admin
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <section className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">History</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
              <Link to="/history">
                View all
              </Link>
            </Button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {watchHistory.length > 0 ? (
              watchHistory.map((video) => (
                <Link 
                  key={video.id} 
                  to={`/watch/${video.id}`}
                  className="flex-shrink-0 w-40 group"
                >
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={video.thumbnail_url || '/placeholder.svg'} 
                      alt={video.title}
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-foreground text-sm mt-1 line-clamp-2">{video.title}</p>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            )}
          </div>
        </section>

        {/* Playlists Section */}
        <section className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Playlists</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                <Link to="/studio/playlists">
                  Add
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                <Link to="/playlists">
                  View all
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Link 
                  key={playlist.id} 
                  to={`/playlist/${playlist.id}`}
                  className="flex-shrink-0 w-32 group"
                >
                  <div className="relative rounded-lg overflow-hidden">
                    {playlist.thumbnail_url ? (
                      <img 
                        src={playlist.thumbnail_url} 
                        alt={playlist.name}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <ListVideo className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                      <Play className="h-4 w-4 text-white ml-auto" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {playlist.video_count}
                    </div>
                  </div>
                  <p className="text-foreground text-sm mt-1 line-clamp-2">{playlist.name}</p>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No playlists yet</p>
            )}
          </div>
        </section>

        {/* Navigation Shortcuts */}
        <section className="p-4">
          <div className="space-y-1">
            <Link to="/studio/content" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Your videos</span>
            </Link>
            <Link to="/history" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
              <Download className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Downloads</span>
            </Link>
            <Link to="/explore" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
              <Film className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Films</span>
            </Link>
            <Link to="/explore" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Courses</span>
            </Link>
          </div>
        </section>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0">
        <MobileBottomNav />
      </div>
    </div>
  );
}