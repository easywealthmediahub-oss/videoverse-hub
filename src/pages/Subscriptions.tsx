import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  duration: number;
  channel: Channel;
}

export default function Subscriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSubscriptions();
  }, [user, navigate]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    // Fetch subscribed channels
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('channel:channels(*)')
      .eq('subscriber_id', user.id);

    if (subs) {
      const channelList = subs.map((s: any) => s.channel);
      setChannels(channelList);

      // Fetch videos from subscribed channels
      if (channelList.length > 0) {
        const channelIds = channelList.map((c: Channel) => c.id);
        
        const { data: videosData } = await supabase
          .from('videos')
          .select(`
            *,
            channel:channels(id, name, avatar_url)
          `)
          .in('channel_id', channelIds)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(50);

        if (videosData) {
          setVideos(videosData as any);
        }
      }
    }
    
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 px-0 md:px-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6 px-3 md:px-0">Subscriptions</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : channels.length > 0 ? (
          <>
            {/* Subscribed Channels - horizontal scroll on mobile */}
            <div className="mb-6 md:mb-8">
              <ScrollArea className="w-full whitespace-nowrap md:rounded-lg md:border">
                <div className="flex p-3 md:p-4 gap-3 md:gap-4">
                  {channels.map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/channel/${channel.id}`}
                      className="flex flex-col items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="w-14 h-14 md:w-16 md:h-16">
                        <AvatarImage src={channel.avatar_url || undefined} />
                        <AvatarFallback>{channel.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs md:text-sm text-foreground font-medium truncate max-w-[70px] md:max-w-[80px]">
                        {channel.name}
                      </span>
                    </Link>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Videos from Subscriptions */}
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 md:gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="pb-4 md:pb-0">
                    <VideoCard
                      id={video.id}
                      title={video.title}
                      thumbnail={video.thumbnail_url || '/placeholder.svg'}
                      channelName={video.channel.name}
                      channelAvatar={video.channel.avatar_url || undefined}
                      views={video.view_count}
                      timestamp={video.created_at}
                      duration={video.duration}
                      channelId={video.channel.id}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <p className="text-muted-foreground">
                  No new videos from your subscriptions
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No subscriptions yet</h2>
            <p className="text-muted-foreground">
              Subscribe to channels to see their latest videos here
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
