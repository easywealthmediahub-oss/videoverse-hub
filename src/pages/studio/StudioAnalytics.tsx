import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, ThumbsUp, Users, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function StudioAnalytics() {
  const { channel } = useProfile();
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalWatchTime: 0,
    subscribers: 0,
    avgViewDuration: 0,
  });
  const [topVideos, setTopVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (channel) {
      fetchAnalytics();
    }
  }, [channel]);

  const fetchAnalytics = async () => {
    if (!channel) return;

    const { data: videos } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channel.id)
      .order('view_count', { ascending: false });

    if (videos) {
      const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
      const totalLikes = videos.reduce((sum, v) => sum + (v.like_count || 0), 0);
      const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
      const avgDuration = videos.length > 0 ? Math.round(totalDuration / videos.length) : 0;

      setStats({
        totalViews,
        totalLikes,
        totalWatchTime: Math.round(totalViews * avgDuration / 60),
        subscribers: channel.subscriber_count || 0,
        avgViewDuration: avgDuration,
      });

      setTopVideos(videos.slice(0, 10));
    }
    setLoading(false);
  };

  // Generate mock chart data (in real app, this would come from actual analytics)
  const generateChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      views: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 100) + 10,
    }));
  };

  const chartData = generateChartData();

  const statCards = [
    { label: 'Total Views', value: stats.totalViews, icon: Eye, change: '+12.5%' },
    { label: 'Watch Time (hrs)', value: stats.totalWatchTime, icon: Clock, change: '+8.2%' },
    { label: 'Subscribers', value: stats.subscribers, icon: Users, change: '+15.3%' },
    { label: 'Total Likes', value: stats.totalLikes, icon: ThumbsUp, change: '+5.7%' },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Channel Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your channel performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>Daily views for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>Likes per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="likes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Videos</CardTitle>
          <CardDescription>Your most viewed content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topVideos.map((video, index) => (
              <div key={video.id} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</span>
                <img
                  src={video.thumbnail_url || '/placeholder.svg'}
                  alt={video.title}
                  className="w-24 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{video.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {video.view_count?.toLocaleString() || 0} views • {video.like_count?.toLocaleString() || 0} likes
                  </p>
                </div>
              </div>
            ))}
            {topVideos.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No videos yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}