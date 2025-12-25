import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Users, ExternalLink, Settings, Globe, Instagram, Twitter, Facebook, Youtube, Phone, MessageCircle, Link as LinkIcon, Music } from 'lucide-react';

interface ChannelLink {
  title: string;
  url: string;
}

interface Channel {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  subscriber_count: number;
  created_at: string;
  links: ChannelLink[] | null;
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

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChannel();
      fetchVideos();
      if (user) {
        checkSubscription();
      }
    }
  }, [id, user]);

  const fetchChannel = async () => {
    // Check if the id parameter looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    let data, error;
    
    if (uuidRegex.test(id)) {
      // If it's a UUID, directly query by ID
      ({ data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .maybeSingle());
    } else {
      // If it's not a UUID, try to find by username
      ({ data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('username', id)
        .maybeSingle());
      
      // If not found by username, try by ID as fallback
      if (!data && !error) {
        const result = await supabase
          .from('channels')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }
    }

    if (data) {
      // Parse links if they exist
      const parsedChannel = {
        ...data,
        links: data.links ? (data.links as unknown as ChannelLink[]) : null
      };
      setChannel(parsedChannel);
    }
    setLoading(false);
  };

  const fetchVideos = async () => {
    if (!channel) return;
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          channel:channels(*)
        `)
        .eq('channel_id', channel.id)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }
      
      if (data) {
        const allVideos = data as any[];
        // Separate videos and shorts based on duration
        const regularVideos = allVideos.filter(v => !v.duration || v.duration > 60);
        const shortVideos = allVideos.filter(v => v.duration && v.duration <= 60);
        setVideos(regularVideos);
        setShorts(shortVideos);
      }
    } catch (error) {
      console.error('Error in fetchVideos:', error);
    }
  };

  const checkSubscription = async () => {
    if (!user || !channel) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('channel_id', channel.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('Error in checkSubscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login required',
        description: 'Please login to subscribe to channels.',
      });
      return;
    }

    if (!channel) return;
    
    try {
      if (isSubscribed) {
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', user.id)
          .eq('channel_id', channel.id);

        if (!error) {
          setIsSubscribed(false);
          setChannel(prev => prev ? { ...prev, subscriber_count: prev.subscriber_count - 1 } : null);
          toast({ title: 'Unsubscribed' });
        }
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert({ subscriber_id: user.id, channel_id: channel.id });

        if (!error) {
          setIsSubscribed(true);
          setChannel(prev => prev ? { ...prev, subscriber_count: prev.subscriber_count + 1 } : null);
          toast({ title: 'Subscribed!' });
        }
      }
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong with subscription',
      });
    }
  };

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!channel) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-foreground">Channel not found</h2>
          <p className="text-muted-foreground">This channel doesn't exist or has been removed.</p>
        </div>
      </Layout>
    );
  }

  const isOwner = channel && user?.id === channel.user_id;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <div className="w-full h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/40 rounded-xl overflow-hidden">
          {channel.banner_url && (
            <img src={channel.banner_url} alt="Channel banner" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Channel Info */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 -mt-8 md:-mt-12">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
            <AvatarImage src={channel.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">{channel.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{channel.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              {channel.username && (
                <>
                  <span className="text-sm">@{channel.username}</span>
                  <span>•</span>
                </>
              )}
              <Users className="w-4 h-4" />
              <span>{formatSubscribers(channel.subscriber_count)} subscribers</span>
              <span>•</span>
              <span>{videos.length + shorts.length} videos</span>
            </div>
            
            {/* Channel Description */}
            {channel.description && (
              <p className="mt-2 text-foreground max-w-2xl">{channel.description}</p>
            )}
            
            {/* Channel Links */}
            {channel.links && channel.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {channel.links.map((link, index) => {
                  // Determine icon based on URL
                  const getLinkIcon = () => {
                    const url = link.url.toLowerCase();
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      return <Youtube className="w-4 h-4 text-red-500" />;
                    } else if (url.includes('instagram.com')) {
                      return <Instagram className="w-4 h-4 text-pink-500" />;
                    } else if (url.includes('twitter.com') || url.includes('x.com')) {
                      return <Twitter className="w-4 h-4 text-blue-400" />;
                    } else if (url.includes('facebook.com')) {
                      return <Facebook className="w-4 h-4 text-blue-600" />;
                    } else if (url.includes('tiktok.com')) {
                      return <Music className="w-4 h-4 text-black dark:text-white" />;
                    } else if (url.includes('whatsapp.com') || url.includes('wa.me')) {
                      return <Phone className="w-4 h-4 text-green-500" />;
                    } else if (url.includes('t.me') || url.includes('telegram')) {
                      return <MessageCircle className="w-4 h-4 text-blue-500" />;
                    } else {
                      return <Globe className="w-4 h-4 text-gray-500" />;
                    }
                  };
                  
                  return (
                    <Button 
                      key={index}
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex items-center gap-1"
                    >
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {getLinkIcon()}
                        <span className="sr-only">{link.title}</span>
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isOwner ? (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/channel/settings">
                  <Settings className="w-4 h-4" />
                  Edit Channel
                </Link>
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                variant={isSubscribed ? 'outline' : 'default'}
                className="gap-2"
              >
                {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="mt-6">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="shorts">Shorts</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-6">
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    thumbnail={video.thumbnail_url || '/placeholder.svg'}
                    channelName={channel.name}
                    channelAvatar={channel.avatar_url || undefined}
                    views={video.view_count}
                    timestamp={video.created_at}
                    duration={video.duration}
                    channelId={channel.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No videos yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shorts" className="mt-6">
            {shorts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {shorts.map((short) => (
                  <Link 
                    key={short.id} 
                    to={`/watch/${short.id}`}
                    className="group relative aspect-[9/16] bg-muted rounded-xl overflow-hidden"
                  >
                    <img 
                      src={short.thumbnail_url || '/placeholder.svg'} 
                      alt={short.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium line-clamp-2">{short.title}</p>
                      <p className="text-white/70 text-xs mt-1">{short.view_count} views</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No shorts yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {channel.description || 'No description available.'}
                </p>
              </div>
              
              {channel.links && channel.links.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {channel.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Joined {new Date(channel.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}