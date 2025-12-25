import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ThumbsUp, Users, Video, DollarSign, TrendingUp, Play, ArrowUpRight } from 'lucide-react';

export default function StudioDashboard() {
  const { channel } = useProfile();
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    totalShorts: 0,
    subscribers: 0,
    earnings: 0,
    pendingEarnings: 0,
  });
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (channel) {
      fetchStats();
      fetchRecentVideos();
    }
  }, [channel]);

  const fetchStats = async () => {
    if (!channel) return;

    const { data: videos } = await supabase
      .from('videos')
      .select('view_count, like_count, duration')
      .eq('channel_id', channel.id);

    const { data: monetization } = await supabase
      .from('monetization_settings')
      .select('total_earnings, pending_earnings')
      .eq('channel_id', channel.id)
      .maybeSingle();

    if (videos) {
      const regularVideos = videos.filter(v => !v.duration || v.duration > 60);
      const shortVideos = videos.filter(v => v.duration && v.duration <= 60);
      
      setStats({
        totalViews: videos.reduce((sum, v) => sum + (v.view_count || 0), 0),
        totalLikes: videos.reduce((sum, v) => sum + (v.like_count || 0), 0),
        totalVideos: regularVideos.length,
        totalShorts: shortVideos.length,
        subscribers: channel.subscriber_count || 0,
        earnings: monetization?.total_earnings || 0,
        pendingEarnings: monetization?.pending_earnings || 0,
      });
    }
    setLoading(false);
  };

  const fetchRecentVideos = async () => {
    if (!channel) return;

    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentVideos(data);
    }
  };

  const statCards = [
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-blue-500' },
    { label: 'Subscribers', value: stats.subscribers, icon: Users, color: 'text-purple-500' },
    { label: 'Total Likes', value: stats.totalLikes, icon: ThumbsUp, color: 'text-green-500' },
    { label: 'Videos', value: stats.totalVideos, icon: Video, color: 'text-orange-500' },
    { label: 'Shorts', value: stats.totalShorts, icon: Play, color: 'text-pink-500' },
    { label: 'Earnings', value: `$${stats.earnings.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Channel Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {channel?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Videos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Content</CardTitle>
              <CardDescription>Your latest uploads</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/studio/content">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentVideos.length > 0 ? (
              <div className="space-y-4">
                {recentVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-3">
                    <img
                      src={video.thumbnail_url || '/placeholder.svg'}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{video.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {video.view_count?.toLocaleString() || 0} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No videos yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get things done faster</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start gap-2">
              <Link to="/upload">
                <Video className="h-4 w-4" />
                Upload a video
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start gap-2">
              <Link to="/studio/analytics">
                <TrendingUp className="h-4 w-4" />
                View analytics
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start gap-2">
              <Link to="/studio/comments">
                <TrendingUp className="h-4 w-4" />
                Manage comments
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start gap-2">
              <Link to="/studio/earn">
                <DollarSign className="h-4 w-4" />
                View earnings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}