import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Minimize,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Clock,
  Bell,
  BellOff,
  Flag,
  Download,
  ListPlus,
  ExternalLink
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import CommentSection from "@/components/CommentSection";
import VideoAdManager from "@/components/VideoAdManager";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

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
  tags?: string[];
  category?: string;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
    subscriber_count: number;
    user_id: string;
  };
}

const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return `${views}`;
};

const formatViewsFull = (views: number): string => {
  return new Intl.NumberFormat().format(views);
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
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
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [video, setVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  
  // Video ad management
  const [showVideoAds, setShowVideoAds] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  // Hide controls timeout
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

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
  }, [id, user]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      .limit(12);

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
      await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', id);
      setUserLike(null);
    } else {
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
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(bufferedEnd);
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
    if (videoContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoContainerRef.current.requestFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            <p className="text-muted-foreground text-sm">Loading video...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Video not found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            This video doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')} variant="secondary">
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="flex flex-col xl:flex-row gap-6 max-w-[1800px] mx-auto">
          {/* Main Video Section */}
          <div className="flex-1 xl:max-w-[1200px]">
            {/* Video Player Container */}
            <div 
              ref={videoContainerRef}
              className={`relative bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video md:rounded-2xl overflow-hidden'}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
            >
              {/* Video Ad Manager */}
              <VideoAdManager 
                videoId={id} 
                onAdStart={() => videoRef.current?.pause()}
                onAdEnd={() => videoRef.current?.play()}
                onAdSkip={() => videoRef.current?.play()}
              />
              
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url || undefined}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onProgress={handleProgress}
                onEnded={() => {
                  setIsPlaying(false);
                  setVideoEnded(true);
                }}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Video error:', e);
                  toast({ variant: 'destructive', title: 'Failed to load video' });
                }}
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
              />

              {/* Center Play Button Overlay */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/90 hover:bg-primary rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl">
                    <Play className="w-7 h-7 md:w-9 md:h-9 text-primary-foreground ml-1" fill="currentColor" />
                  </div>
                </div>
              )}

              {/* Video Controls Overlay */}
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                {/* Progress Bar */}
                <div className="px-3 md:px-4 pt-8">
                  <div className="relative group/progress">
                    {/* Buffered progress */}
                    <div className="absolute inset-0 h-1 group-hover/progress:h-1.5 bg-white/20 rounded-full transition-all">
                      <div 
                        className="h-full bg-white/40 rounded-full"
                        style={{ width: `${(buffered / duration) * 100}%` }}
                      />
                    </div>
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="relative z-10 [&>span:first-child]:h-1 group-hover/progress:[&>span:first-child]:h-1.5 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:opacity-0 group-hover/progress:[&_[role=slider]]:opacity-100 [&_[role=slider]]:transition-opacity"
                    />
                  </div>
                </div>
                
                {/* Controls Row */}
                <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={togglePlay} 
                      className="text-white hover:bg-white/20 h-9 w-9"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    {/* Volume Controls */}
                    <div className="hidden md:flex items-center gap-1 group/volume">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleMute} 
                        className="text-white hover:bg-white/20 h-9 w-9"
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.05}
                          onValueChange={handleVolumeChange}
                          className="w-20"
                        />
                      </div>
                    </div>
                    
                    {/* Time Display */}
                    <span className="text-white text-xs md:text-sm font-medium ml-2 tabular-nums">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Mobile Volume */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleMute} 
                      className="md:hidden text-white hover:bg-white/20 h-9 w-9"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    {/* Settings */}
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
                      <Settings className="w-5 h-5" />
                    </Button>
                    
                    {/* Fullscreen */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleFullscreen} 
                      className="text-white hover:bg-white/20 h-9 w-9"
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info Section */}
            <div className="px-4 md:px-0 mt-4">
              {/* Title */}
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground leading-tight">
                {video.title}
              </h1>

              {/* Stats Bar - Mobile */}
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground md:hidden">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatViews(video.view_count)} views
                </span>
                <span>•</span>
                <span>{formatTimeAgo(video.created_at)}</span>
              </div>

              {/* Channel & Actions Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 md:mt-3">
                {/* Channel Info */}
                <div className="flex items-center gap-3">
                  <Link to={`/channel/${video.channel.id}`} className="flex-shrink-0">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-background shadow-lg">
                      <AvatarImage src={video.channel.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {video.channel.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/channel/${video.channel.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {video.channel.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatViews(video.channel.subscriber_count)} subscribers
                    </p>
                  </div>
                  {user?.id !== video.channel.user_id && (
                    <Button 
                      onClick={handleSubscribe}
                      size="sm"
                      className={`rounded-full px-4 font-medium transition-all ${
                        isSubscribed 
                          ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isSubscribed ? (
                        <>
                          <BellOff className="w-4 h-4 mr-1.5" />
                          Subscribed
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-1.5" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
                  {/* Like/Dislike Buttons */}
                  <div className="flex items-center bg-secondary rounded-full flex-shrink-0 shadow-sm">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`rounded-l-full px-4 gap-2 h-9 font-medium ${userLike === true ? 'text-primary' : 'text-foreground'}`}
                      onClick={() => handleLike(true)}
                    >
                      <ThumbsUp className="h-4 w-4" fill={userLike === true ? 'currentColor' : 'none'} />
                      <span>{formatViews(video.like_count || 0)}</span>
                    </Button>
                    <div className="w-px h-6 bg-border" />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`rounded-r-full px-3 h-9 ${userLike === false ? 'text-primary' : 'text-foreground'}`}
                      onClick={() => handleLike(false)}
                    >
                      <ThumbsDown className="h-4 w-4" fill={userLike === false ? 'currentColor' : 'none'} />
                    </Button>
                  </div>

                  {/* Share Button */}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="rounded-full gap-2 h-9 px-4 flex-shrink-0 font-medium shadow-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: 'Link copied to clipboard!' });
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>

                  {/* Save Button */}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="rounded-full gap-2 h-9 px-4 flex-shrink-0 font-medium shadow-sm hidden sm:flex"
                  >
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>

                  {/* More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="icon"
                        className="rounded-full h-9 w-9 flex-shrink-0 shadow-sm"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="sm:hidden">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ListPlus className="h-4 w-4 mr-2" />
                        Add to Playlist
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Description Card */}
              <Collapsible open={descriptionExpanded} onOpenChange={setDescriptionExpanded}>
                <div className="mt-4 bg-secondary/50 hover:bg-secondary/70 transition-colors rounded-xl p-3 md:p-4">
                  <CollapsibleTrigger className="w-full text-left">
                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-foreground">
                      <span className="hidden md:flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        {formatViewsFull(video.view_count)} views
                      </span>
                      <span className="hidden md:flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(video.created_at)}
                      </span>
                      {video.category && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {video.category}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Description Preview */}
                    <p className={`mt-2 text-sm text-foreground/90 whitespace-pre-wrap ${!descriptionExpanded ? 'line-clamp-2' : ''}`}>
                      {video.description || 'No description available.'}
                    </p>
                    
                    {/* Tags */}
                    {descriptionExpanded && video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                        {video.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-primary hover:bg-primary/10 cursor-pointer">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Expand/Collapse Button */}
                    <div className="flex items-center gap-1 mt-2 text-sm font-medium text-foreground">
                      {descriptionExpanded ? (
                        <>Show less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>Show more <ChevronDown className="w-4 h-4" /></>
                      )}
                    </div>
                  </CollapsibleTrigger>
                </div>
              </Collapsible>

              {/* Comments Section */}
              <div className="mt-6 md:mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Comments</h3>
                </div>
                <CommentSection videoId={id!} />
              </div>
            </div>
          </div>

          {/* Recommended Videos Sidebar */}
          <div className="xl:w-[400px] px-4 md:px-0 pb-20 md:pb-0">
            <h3 className="font-semibold text-foreground mb-4 hidden xl:block">Up Next</h3>
            <div className="space-y-3">
              {recommendedVideos.length > 0 ? (
                recommendedVideos.map((rec) => (
                  <Link 
                    key={rec.id} 
                    to={`/watch/${rec.id}`} 
                    className="flex gap-3 group p-2 -mx-2 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-40 md:w-44 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={rec.thumbnail_url || '/placeholder.svg'}
                        alt={rec.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                        {formatDuration(rec.duration || 0)}
                      </span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-snug">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                        {rec.channel.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <span>{formatViews(rec.view_count || 0)} views</span>
                        <span>•</span>
                        <span>{formatTimeAgo(rec.created_at)}</span>
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">No recommendations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Watch;
