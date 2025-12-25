import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import CommentSection from "@/components/CommentSection";
import VideoAdManager from "@/components/VideoAdManager";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  duration: number;
  created_at: string;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
    subscriber_count: number;
    user_id: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  user_id: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
  return `${views} views`;
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
};

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Video ad management
  const [showVideoAds, setShowVideoAds] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchRecommendedVideos();
      if (user) {
        checkSubscription();
        checkUserLike();
        recordWatchHistory();
      }
    }
  }, [id, user, toast]);

  const fetchVideo = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        channel:channels(id, name, avatar_url, subscriber_count, user_id)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      navigate('/404');
      return;
    }
    
    setVideo(data as Video);
    setLoading(false);

    // Increment view count
    await supabase
      .from('videos')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);
  };

  const fetchRecommendedVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select(`
        *,
        channel:channels(id, name, avatar_url, subscriber_count, user_id)
      `)
      .eq('visibility', 'public')
      .neq('id', id)
      .order('view_count', { ascending: false })
      .limit(10);

    if (data) setRecommendedVideos(data as Video[]);
  };



  const checkSubscription = async () => {
    if (!user || !video) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', user.id)
      .eq('channel_id', video.channel.id)
      .maybeSingle();
    setIsSubscribed(!!data);
  };

  const checkUserLike = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('video_likes')
      .select('is_like')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle();
    setUserLike(data?.is_like ?? null);
  };

  const recordWatchHistory = async () => {
    if (!user) return;
    await supabase
      .from('watch_history')
      .upsert({
        user_id: user.id,
        video_id: id,
        watched_at: new Date().toISOString()
      }, { onConflict: 'user_id,video_id' });
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to subscribe' });
      return;
    }
    if (!video) return;

    if (isSubscribed) {
      await supabase
        .from('subscriptions')
        .delete()
        .eq('subscriber_id', user.id)
        .eq('channel_id', video.channel.id);
      setIsSubscribed(false);
      toast({ title: 'Unsubscribed' });
    } else {
      await supabase
        .from('subscriptions')
        .insert({ subscriber_id: user.id, channel_id: video.channel.id });
      setIsSubscribed(true);
      toast({ title: 'Subscribed!' });
    }
  };

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to like videos' });
      return;
    }

    if (userLike === isLike) {
      // Remove like/dislike
      await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', id);
      setUserLike(null);
    } else {
      // Add or update like/dislike
      await supabase
        .from('video_likes')
        .upsert({
          user_id: user.id,
          video_id: id,
          is_like: isLike
        }, { onConflict: 'user_id,video_id' });
      setUserLike(isLike);
    }
    fetchVideo();
  };



  // Video player controls
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);
      
      // Check for mid-roll ad at specific times
      if (Math.floor(newTime) === 30) { // Example: show mid-roll at 30 seconds
        // This would be handled by the VideoAdManager
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
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

  if (!video) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-foreground">Video not found</h2>
          <p className="text-muted-foreground">This video doesn't exist or has been removed.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Video Section */}
          <div className="flex-1 max-w-4xl">
            {/* Video Player */}
            <div 
              className="relative aspect-video bg-black rounded-xl overflow-hidden group"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(isPlaying ? false : true)}
            >
              {/* Video Ad Manager */}
              <VideoAdManager 
                videoId={id} 
                onAdStart={() => {
                  if (videoRef.current) {
                    videoRef.current.pause();
                  }
                }}
                onAdEnd={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
                onAdSkip={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
              
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url || undefined}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                  setIsPlaying(false);
                  setVideoEnded(true);
                }}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Video error:', e);
                  toast({ variant: 'destructive', title: 'Failed to load video', description: 'The video format may not be supported.' });
                }}
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
              />

              {/* Play button overlay when paused */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                    <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
                  </div>
                </div>
              )}

              {/* Video Controls */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress bar */}
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="mb-4"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                        className="w-20"
                      />
                    </div>
                    
                    <span className="text-white text-sm ml-2">
                      {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                      <Maximize className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <h1 className="text-xl font-semibold mt-4 text-foreground">{video.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              {/* Channel Info */}
              <div className="flex items-center gap-4">
                <Link to={`/channel/${video.channel.id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={video.channel.avatar_url || undefined} />
                    <AvatarFallback>{video.channel.name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link to={`/channel/${video.channel.id}`}>
                    <h3 className="font-medium text-sm text-foreground hover:text-primary">{video.channel.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatViews(video.channel.subscriber_count).replace(' views', '')} subscribers
                  </p>
                </div>
                {user?.id !== video.channel.user_id && (
                  <Button 
                    onClick={handleSubscribe}
                    className={`rounded-full ${isSubscribed ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-secondary rounded-full">
                  <Button 
                    variant="ghost" 
                    className={`rounded-l-full px-4 gap-2 ${userLike === true ? 'text-primary' : ''}`}
                    onClick={() => handleLike(true)}
                  >
                    <ThumbsUp className="h-5 w-5" fill={userLike === true ? 'currentColor' : 'none'} />
                    <span className="text-sm">{formatViews(video.like_count || 0).replace(' views', '')}</span>
                  </Button>
                  <div className="w-px h-6 bg-border" />
                  <Button 
                    variant="ghost" 
                    className={`rounded-r-full px-4 ${userLike === false ? 'text-primary' : ''}`}
                    onClick={() => handleLike(false)}
                  >
                    <ThumbsDown className="h-5 w-5" fill={userLike === false ? 'currentColor' : 'none'} />
                  </Button>
                </div>
                <Button 
                  variant="secondary" 
                  className="rounded-full gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: 'Link copied!' });
                  }}
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 p-4 bg-secondary rounded-xl">
              <div className="flex gap-2 text-sm font-medium mb-2 text-foreground">
                <span>{formatViews(video.view_count || 0)}</span>
                <span>•</span>
                <span>{formatTimeAgo(video.created_at)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {video.description || 'No description available.'}
              </p>
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <h3 className="font-medium mb-4 text-foreground">Comments</h3>
              <CommentSection videoId={id} />
            </div>
          </div>

          {/* Recommended Videos */}
          <div className="lg:w-[400px] space-y-3">
            <h3 className="font-semibold text-foreground mb-3">Recommended</h3>
            {recommendedVideos.length > 0 ? (
              recommendedVideos.map((rec) => (
                <Link key={rec.id} to={`/watch/${rec.id}`} className="flex gap-2 group">
                  <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={rec.thumbnail_url || '/placeholder.svg'}
                      alt={rec.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                      {formatDuration(rec.duration || 0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.channel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatViews(rec.view_count || 0)} • {formatTimeAgo(rec.created_at)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No recommended videos yet</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Watch;
