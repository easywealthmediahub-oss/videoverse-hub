import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  duration: number;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    if (query) {
      searchVideos();
    } else {
      setVideos([]);
      setLoading(false);
    }
  }, [query, sortBy]);

  const searchVideos = async () => {
    setLoading(true);
    
    let queryBuilder = supabase
      .from('videos')
      .select(`
        *,
        channel:channels(id, name, avatar_url)
      `)
      .eq('visibility', 'public')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    // Apply sorting
    switch (sortBy) {
      case 'date':
        queryBuilder = queryBuilder.order('created_at', { ascending: false });
        break;
      case 'views':
        queryBuilder = queryBuilder.order('view_count', { ascending: false });
        break;
      default:
        queryBuilder = queryBuilder.order('view_count', { ascending: false });
    }

    const { data, error } = await queryBuilder.limit(50);

    if (!error && data) {
      setVideos(data as any);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-4 px-4">
        {/* Search Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            {query && (
              <h1 className="text-xl font-semibold text-foreground">
                Search results for "{query}"
              </h1>
            )}
            <p className="text-sm text-muted-foreground">
              {videos.length} {videos.length === 1 ? 'result' : 'results'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Upload date</SelectItem>
                <SelectItem value="views">View count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex flex-col sm:flex-row gap-4 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <div className="w-full sm:w-80 flex-shrink-0">
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
                    compact
                  />
                </div>
                <div className="flex-1 min-w-0 hidden sm:block">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {video.channel.name} • {video.view_count.toLocaleString()} views
                  </p>
                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Search for videos</h2>
            <p className="text-muted-foreground">
              Enter a search term to find videos
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
