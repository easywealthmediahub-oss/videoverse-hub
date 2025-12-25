import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import VideoCard from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  duration: number;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface HistoryItem {
  id: string;
  watched_at: string;
  video: Video;
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('watch_history')
      .select(`
        id,
        watched_at,
        video:videos(
          id,
          title,
          thumbnail_url,
          view_count,
          duration,
          channel:channels(id, name, avatar_url)
        )
      `)
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setHistory(data as any);
    }
    setLoading(false);
  };

  const clearHistory = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setHistory([]);
      toast({ title: 'Watch history cleared' });
    }
  };

  const removeFromHistory = async (historyId: string) => {
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('id', historyId);

    if (!error) {
      setHistory(history.filter(h => h.id !== historyId));
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 px-0 md:px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6 px-3 md:px-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Watch History</h1>
          
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory} className="gap-2">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-0 md:space-y-4">
            {history.map((item) => (
              <div key={item.id} className="group">
                {/* Mobile: Full width video card */}
                <div className="md:hidden pb-4">
                  <VideoCard
                    id={item.video.id}
                    title={item.video.title}
                    thumbnail={item.video.thumbnail_url || '/placeholder.svg'}
                    channelName={item.video.channel.name}
                    channelAvatar={item.video.channel.avatar_url || undefined}
                    views={item.video.view_count}
                    timestamp={item.watched_at}
                    duration={item.video.duration}
                    channelId={item.video.channel.id}
                  />
                </div>
                
                {/* Desktop: Horizontal layout */}
                <div className="hidden md:flex gap-4">
                  <div className="w-64 flex-shrink-0">
                    <VideoCard
                      id={item.video.id}
                      title={item.video.title}
                      thumbnail={item.video.thumbnail_url || '/placeholder.svg'}
                      channelName={item.video.channel.name}
                      channelAvatar={item.video.channel.avatar_url || undefined}
                      views={item.video.view_count}
                      timestamp={item.watched_at}
                      duration={item.video.duration}
                      channelId={item.video.channel.id}
                      compact
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {item.video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.video.channel.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Watched {new Date(item.watched_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromHistory(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <HistoryIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No watch history</h2>
            <p className="text-muted-foreground">
              Videos you watch will appear here
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
