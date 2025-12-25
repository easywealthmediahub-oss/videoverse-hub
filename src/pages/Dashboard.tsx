import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditVideoDialog from '@/components/EditVideoDialog';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Eye, ThumbsUp, Video, Users, Trash2, Edit, ExternalLink, Plus, Play } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  visibility: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  duration: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { channel } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    totalShorts: 0,
    subscribers: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (channel) {
      fetchVideos();
      setStats(prev => ({ ...prev, subscribers: channel.subscriber_count }));
    }
  }, [user, channel, navigate]);

  const fetchVideos = async () => {
    if (!channel) return;
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Separate videos and shorts
      const regularVideos = data.filter(v => !v.duration || v.duration > 60);
      const shortVideos = data.filter(v => v.duration && v.duration <= 60);
      
      setVideos(regularVideos);
      setShorts(shortVideos);
      
      const totalViews = data.reduce((sum, v) => sum + (v.view_count || 0), 0);
      const totalLikes = data.reduce((sum, v) => sum + (v.like_count || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalViews,
        totalLikes,
        totalVideos: regularVideos.length,
        totalShorts: shortVideos.length,
      }));
    }
    setLoading(false);
  };

  const handleDelete = async (videoId: string, isShort: boolean) => {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete video.',
      });
    } else {
      if (isShort) {
        setShorts(shorts.filter(v => v.id !== videoId));
      } else {
        setVideos(videos.filter(v => v.id !== videoId));
      }
      toast({ title: 'Video deleted' });
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  const VideoTable = ({ items, isShort = false }: { items: Video[]; isShort?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Video</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Likes</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((video) => (
          <TableRow key={video.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={video.thumbnail_url || '/placeholder.svg'}
                    alt={video.title}
                    className={`${isShort ? 'w-12 h-20' : 'w-24 h-14'} object-cover rounded`}
                  />
                  {!isShort && video.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium line-clamp-2 max-w-[200px]">
                    {video.title}
                  </span>
                  {isShort && (
                    <Badge variant="secondary" className="mt-1">Short</Badge>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={video.visibility === 'public' ? 'default' : 'secondary'}>
                {video.visibility || 'public'}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(video.created_at)}</TableCell>
            <TableCell>{(video.view_count || 0).toLocaleString()}</TableCell>
            <TableCell>{(video.like_count || 0).toLocaleString()}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/watch/${video.id}`} className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(video)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete video?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your video.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(video.id, isShort)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Channel Dashboard</h1>
            <p className="text-muted-foreground mt-1">{channel?.name}</p>
          </div>
          <Button asChild>
            <Link to="/upload" className="gap-2">
              <Plus className="w-4 h-4" />
              Upload Video
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shorts</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShorts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subscribers.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Videos & Shorts Tabs */}
        <Tabs defaultValue="videos">
          <TabsList className="mb-4">
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="shorts">Shorts ({shorts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Your Videos</CardTitle>
                <CardDescription>Manage your uploaded videos</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : videos.length > 0 ? (
                  <VideoTable items={videos} />
                ) : (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No videos yet</h3>
                    <p className="text-muted-foreground mb-4">Upload your first video to get started</p>
                    <Button asChild>
                      <Link to="/upload">Upload Video</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shorts">
            <Card>
              <CardHeader>
                <CardTitle>Your Shorts</CardTitle>
                <CardDescription>Manage your short videos (under 60 seconds)</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : shorts.length > 0 ? (
                  <VideoTable items={shorts} isShort />
                ) : (
                  <div className="text-center py-12">
                    <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No shorts yet</h3>
                    <p className="text-muted-foreground mb-4">Upload a video under 60 seconds to create a short</p>
                    <Button asChild>
                      <Link to="/upload">Upload Short</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Video Dialog */}
      <EditVideoDialog
        video={editingVideo}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={fetchVideos}
      />
    </Layout>
  );
}