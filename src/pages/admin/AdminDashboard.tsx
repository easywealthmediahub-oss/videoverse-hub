import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Video, MessageSquare, DollarSign, TrendingUp, Eye, Play, ArrowUpRight, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalShorts: 0,
    totalComments: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
    pendingMonetization: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Fetch all counts in parallel
    const [
      { count: usersCount },
      { data: videos },
      { count: commentsCount },
      { data: payoutsData },
      { data: monetizationData },
      { data: profiles },
      { data: recentVids }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('videos').select('view_count, duration'),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('payouts').select('amount, status'),
      supabase.from('monetization_settings').select('status, total_earnings'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('videos').select('*, channels(name)').order('created_at', { ascending: false }).limit(5),
    ]);

    const regularVideos = videos?.filter(v => !v.duration || v.duration > 60) || [];
    const shortVideos = videos?.filter(v => v.duration && v.duration <= 60) || [];
    const totalViews = videos?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;
    const pendingPayouts = payoutsData?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
    const pendingMonetization = monetizationData?.filter(m => m.status === 'pending').length || 0;
    const totalEarnings = monetizationData?.reduce((sum, m) => sum + (m.total_earnings || 0), 0) || 0;

    setStats({
      totalUsers: usersCount || 0,
      totalVideos: regularVideos.length,
      totalShorts: shortVideos.length,
      totalComments: commentsCount || 0,
      totalViews,
      totalEarnings,
      pendingPayouts,
      pendingMonetization,
    });

    setRecentUsers(profiles || []);
    setRecentVideos(recentVids || []);
    setLoading(false);
  };

  // Mock chart data
  const chartData = [
    { name: 'Mon', users: 12, videos: 5 },
    { name: 'Tue', users: 18, videos: 8 },
    { name: 'Wed', users: 15, videos: 12 },
    { name: 'Thu', users: 22, videos: 9 },
    { name: 'Fri', users: 28, videos: 15 },
    { name: 'Sat', users: 35, videos: 20 },
    { name: 'Sun', users: 30, videos: 18 },
  ];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', link: '/admin/users' },
    { label: 'Total Videos', value: stats.totalVideos, icon: Video, color: 'text-purple-500', link: '/admin/content' },
    { label: 'Total Shorts', value: stats.totalShorts, icon: Play, color: 'text-pink-500', link: '/admin/content' },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-green-500', link: '/admin/content' },
    { label: 'Comments', value: stats.totalComments, icon: MessageSquare, color: 'text-orange-500', link: '/admin/comments' },
    { label: 'Total Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500', link: '/admin/monetization' },
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
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform</p>
      </div>

      {/* Alerts */}
      {(stats.pendingPayouts > 0 || stats.pendingMonetization > 0) && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {stats.pendingPayouts > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="flex items-center gap-4 p-4">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Pending Payouts</p>
                  <p className="text-sm text-muted-foreground">${stats.pendingPayouts.toFixed(2)} awaiting processing</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/admin/monetization">Review</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {stats.pendingMonetization > 0 && (
            <Card className="border-blue-500/50 bg-blue-500/10">
              <CardContent className="flex items-center gap-4 p-4">
                <AlertCircle className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Monetization Applications</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingMonetization} pending review</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/admin/monetization">Review</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {statCards.map((stat) => (
          <Link to={stat.link} key={stat.label}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Platform Activity</CardTitle>
          <CardDescription>New users and videos over the past week</CardDescription>
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
                    borderRadius: '8px',
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60% / 0.2)" name="New Users" />
                <Area type="monotone" dataKey="videos" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="New Videos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Newly registered users</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.display_name || user.username}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No users yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Videos</CardTitle>
              <CardDescription>Latest uploads</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/content">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
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
                      className="w-16 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.channels?.name || 'Unknown'}</p>
                    </div>
                    <Badge variant={video.visibility === 'public' ? 'default' : 'secondary'}>
                      {video.visibility || 'public'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No videos yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}