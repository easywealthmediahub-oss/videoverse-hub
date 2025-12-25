import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Share2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Short {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  channel: Channel;
}

export default function Shorts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [userLikes, setUserLikes] = useState<Record<string, boolean | null>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  useEffect(() => {
    if (user && shorts.length > 0) {
      fetchUserLikes();
    }
  }, [user, shorts]);

  const fetchShorts = async () => {
    // Shorts are videos with duration <= 60 seconds
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id, title, video_url, thumbnail_url, view_count, like_count, dislike_count,
        channel:channels(id, name, avatar_url)
      `)
      .eq('visibility', 'public')
      .lte('duration', 60)
      .gt('duration', 0)
      .order('view_count', { ascending: false })
      .limit(50);

    if (!error && data) {
      const formatted = data.map((v: any) => ({
        ...v,
        channel: v.channel as Channel,
      }));
      setShorts(formatted);
    }
    setLoading(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const shortIds = shorts.map(s => s.id);
    const { data } = await supabase
      .from('video_likes')
      .select('video_id, is_like')
      .eq('user_id', user.id)
      .in('video_id', shortIds);

    if (data) {
      const likes: Record<string, boolean | null> = {};
      data.forEach(like => {
        likes[like.video_id] = like.is_like;
      });
      setUserLikes(likes);
    }
  };

  const handleLike = async (shortId: string, isLike: boolean) => {
    if (!user) {
      toast({ title: 'Sign in to like videos' });
      return;
    }

    const currentLike = userLikes[shortId];
    
    if (currentLike === isLike) {
      // Remove like/dislike
      await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', shortId);
      
      setUserLikes(prev => ({ ...prev, [shortId]: null }));
    } else if (currentLike !== undefined && currentLike !== null) {
      // Update existing
      await supabase
        .from('video_likes')
        .update({ is_like: isLike })
        .eq('user_id', user.id)
        .eq('video_id', shortId);
      
      setUserLikes(prev => ({ ...prev, [shortId]: isLike }));
    } else {
      // Insert new
      await supabase
        .from('video_likes')
        .insert({ user_id: user.id, video_id: shortId, is_like: isLike });
      
      setUserLikes(prev => ({ ...prev, [shortId]: isLike }));
    }
  };

  const goToNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = async (short: Short) => {
    const url = `${window.location.origin}/watch/${short.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to copy link' });
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (shorts.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Play className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Shorts yet</h2>
          <p className="text-muted-foreground">Short videos (under 60 seconds) will appear here</p>
        </div>
      </Layout>
    );
  }

  const currentShort = shorts[currentIndex];

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="relative flex items-center gap-4">
          {/* Navigation */}
          <div className="absolute -left-16 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="rounded-full"
            >
              <ChevronUp className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === shorts.length - 1}
              className="rounded-full"
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
          </div>

          {/* Video Container */}
          <div className="relative w-[360px] h-[640px] bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              src={currentShort.video_url}
              className="w-full h-full object-cover"
              loop
              autoPlay
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!isPlaying && (
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              )}
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <Link to={`/channel/${currentShort.channel.id}`} className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentShort.channel.avatar_url || ''} />
                  <AvatarFallback>{currentShort.channel.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-white font-medium text-sm">@{currentShort.channel.name}</span>
              </Link>
              <p className="text-white text-sm line-clamp-2">{currentShort.title}</p>
            </div>

            {/* Volume Control */}
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${userLikes[currentShort.id] === true ? 'text-primary' : ''}`}
                onClick={() => handleLike(currentShort.id, true)}
              >
                <ThumbsUp className="w-6 h-6" />
              </Button>
              <span className="text-xs text-muted-foreground">{formatCount(currentShort.like_count)}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${userLikes[currentShort.id] === false ? 'text-destructive' : ''}`}
                onClick={() => handleLike(currentShort.id, false)}
              >
                <ThumbsDown className="w-6 h-6" />
              </Button>
              <span className="text-xs text-muted-foreground">{formatCount(currentShort.dislike_count)}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                asChild
              >
                <Link to={`/watch/${currentShort.id}`}>
                  <MessageCircle className="w-6 h-6" />
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">Comments</span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => handleShare(currentShort)}
              >
                <Share2 className="w-6 h-6" />
              </Button>
              <span className="text-xs text-muted-foreground">Share</span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {shorts.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
