import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import { ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Channel {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  duration: number;
  channel: Channel;
}

export default function LikedVideos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchLikedVideos();
  }, [user]);

  const fetchLikedVideos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('video_likes')
      .select(`
        video_id,
        videos(
          id, title, thumbnail_url, view_count, created_at, duration,
          channel:channels(id, name, avatar_url)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_like', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted = data
        .filter((item: any) => item.videos)
        .map((item: any) => ({
          ...item.videos,
          channel: item.videos.channel as Channel,
        }));
      setVideos(formatted);
    }
    setLoading(false);
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ThumbsUp className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to see liked videos</h2>
          <p className="text-muted-foreground mb-4">Your liked videos will appear here</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <ThumbsUp className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Liked Videos</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail_url || '/placeholder.svg'}
                channelName={video.channel.name}
                channelId={video.channel.id}
                channelAvatar={video.channel.avatar_url || undefined}
                views={video.view_count}
                timestamp={video.created_at}
                duration={video.duration}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ThumbsUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No liked videos yet</h2>
            <p className="text-muted-foreground">Videos you like will appear here</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
