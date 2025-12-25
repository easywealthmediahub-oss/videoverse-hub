import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import { Compass } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
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

export default function Explore() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id, title, thumbnail_url, view_count, created_at, duration,
        channel:channels(id, name, avatar_url)
      `)
      .eq('visibility', 'public')
      .gt('duration', 60)
      .order('view_count', { ascending: false })
      .limit(50);

    if (!error && data) {
      const formatted = data.map((v: any) => ({
        ...v,
        channel: v.channel as Channel,
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
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 md:py-6 px-0 md:px-4">
        <div className="flex items-center gap-3 mb-4 md:mb-6 px-3 md:px-0">
          <Compass className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Explore</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 md:gap-4">
            {videos.map((video) => (
              <div key={video.id} className="pb-4 md:pb-0">
                <VideoCard
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <Compass className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nothing to explore yet</h2>
            <p className="text-muted-foreground">Videos will appear here once they're uploaded</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
