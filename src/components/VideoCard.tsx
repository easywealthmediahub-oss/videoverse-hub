import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  channelName?: string;
  channel?: string;
  channelAvatar?: string;
  views: number;
  timestamp: string;
  duration: number;
  channelId: string;
  compact?: boolean;
  horizontal?: boolean;
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
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

const VideoCard = ({ 
  id, 
  title, 
  thumbnail, 
  channelName, 
  channel,
  channelAvatar, 
  views, 
  timestamp, 
  duration,
  channelId,
  compact = false,
  horizontal = false
}: VideoCardProps) => {
  const displayChannelName = channelName || channel || 'Unknown';

  // Horizontal layout for mobile recommendations
  if (horizontal) {
    return (
      <Link to={`/watch/${id}`} className="group flex gap-2">
        <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
            {formatDuration(duration)}
          </span>
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight text-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs mt-1">{displayChannelName}</p>
          <p className="text-muted-foreground text-xs">
            {formatViews(views)} • {formatTimeAgo(timestamp)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/watch/${id}`} className="group block">
      <div className="relative aspect-video rounded-xl md:rounded-xl rounded-none overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {formatDuration(duration)}
        </span>
      </div>
      {!compact && (
        <div className="flex gap-3 mt-3 px-3 md:px-0">
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/channel/${channelId}`;
            }}
            className="flex-shrink-0 cursor-pointer"
          >
            {channelAvatar ? (
              <img
                src={channelAvatar}
                alt={displayChannelName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {displayChannelName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 -mr-2 opacity-0 group-hover:opacity-100 md:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/channel/${channelId}`;
              }}
              className="text-muted-foreground text-xs hover:text-foreground transition-colors mt-1 block cursor-pointer"
            >
              {displayChannelName}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatViews(views)} • {formatTimeAgo(timestamp)}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
};

export default VideoCard;
