import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, MoreVertical, Video, Play, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  visibility: string | null;
  created_at: string;
  duration: number | null;
  channel: {
    id: string;
    name: string;
  };
}

export default function AdminContent() {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [shorts, setShorts] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*, channel:channels(id, name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const regularVideos = data.filter(v => !v.duration || v.duration > 60);
      const shortVideos = data.filter(v => v.duration && v.duration <= 60);
      setVideos(regularVideos as VideoItem[]);
      setShorts(shortVideos as VideoItem[]);
    }
    setLoading(false);
  };

  const handleDelete = async (videoId: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete video.' });
    } else {
      setVideos(videos.filter(v => v.id !== videoId));
      setShorts(shorts.filter(v => v.id !== videoId));
      toast({ title: 'Video deleted' });
    }
  };

  const handleToggleVisibility = async (video: VideoItem) => {
    const newVisibility = video.visibility === 'public' ? 'private' : 'public';
    const { error } = await supabase
      .from('videos')
      .update({ visibility: newVisibility })
      .eq('id', video.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update visibility.' });
    } else {
      toast({ title: `Video set to ${newVisibility}` });
      fetchContent();
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filterContent = (items: VideoItem[]) =>
    items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.channel?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const VideoTable = ({ items, isShort = false }: { items: VideoItem[]; isShort?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Content</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Date</TableHead>
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
                <span className="font-medium line-clamp-2 max-w-[200px] text-foreground">{video.title}</span>
              </div>
            </TableCell>
            <TableCell>
              <Link to={`/channel/${video.channel?.id}`} className="text-primary hover:underline">
                {video.channel?.name || 'Unknown'}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={video.visibility === 'public' ? 'default' : 'secondary'}>
                {video.visibility || 'public'}
              </Badge>
            </TableCell>
            <TableCell className="text-foreground">{(video.view_count || 0).toLocaleString()}</TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(video.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/watch/${video.id}`} className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleVisibility(video)} className="gap-2">
                    {video.visibility === 'public' ? (
                      <>
                        <EyeOff className="w-4 h-4" />Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />Make Public
                      </>
                    )}
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive gap-2">
                        <Trash2 className="w-4 h-4" />Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete video?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this video.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(video.id)}>Delete</AlertDialogAction>
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
        <p className="text-muted-foreground mt-1">Manage all videos and shorts on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{videos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shorts</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{shorts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <Tabs defaultValue="videos">
        <TabsList className="mb-4">
          <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="shorts">Shorts ({shorts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>All Videos</CardTitle>
              <CardDescription>Videos uploaded to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filterContent(videos).length > 0 ? (
                <VideoTable items={filterContent(videos)} />
              ) : (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No videos found</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shorts">
          <Card>
            <CardHeader>
              <CardTitle>All Shorts</CardTitle>
              <CardDescription>Short videos under 60 seconds</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filterContent(shorts).length > 0 ? (
                <VideoTable items={filterContent(shorts)} isShort />
              ) : (
                <div className="text-center py-12">
                  <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No shorts found</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}