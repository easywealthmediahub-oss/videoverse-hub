import { Link } from "react-router-dom";

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
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
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
  compact = false 
}: VideoCardProps) => {
  const displayChannelName = channelName || channel || 'Unknown';
  return (
    <Link to={`/watch/${id}`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
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
        <div className="flex gap-3 mt-3">
          <div
            onClick={(e) => {
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
            <h3 className="font-medium text-sm line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div
              onClick={(e) => {
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
