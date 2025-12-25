import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditVideoDialog from '@/components/EditVideoDialog';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Eye, ThumbsUp, Trash2, Edit, ExternalLink, Plus, Video, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoItem {
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

export default function StudioContent() {
  const { channel } = useProfile();
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [shorts, setShorts] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [videoForPlaylist, setVideoForPlaylist] = useState<VideoItem | null>(null);
  const [playlists, setPlaylists] = useState<{id: string, title: string}[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  useEffect(() => {
    if (channel) {
      fetchVideos();
      fetchPlaylists();
    }
  }, [channel]);

  const fetchVideos = async () => {
    if (!channel) return;

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const regularVideos = data.filter(v => !v.duration || v.duration > 60);
      const shortVideos = data.filter(v => v.duration && v.duration <= 60);
      setVideos(regularVideos);
      setShorts(shortVideos);
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

  const fetchPlaylists = async () => {
    if (!channel) return;

    const { data, error } = await supabase
      .from('playlists')
      .select('id, title')
      .eq('user_id', channel.user_id);

    if (!error && data) {
      setPlaylists(data);
    }
  };

  const handleAddToPlaylist = async () => {
    if (!videoForPlaylist || !selectedPlaylist) return;

    // Check if video is already in playlist
    const { data: existing, error: existingError } = await supabase
      .from('playlist_videos')
      .select('id')
      .eq('playlist_id', selectedPlaylist)
      .eq('video_id', videoForPlaylist.id)
      .single();

    if (existing) {
      toast({ variant: 'destructive', title: 'Error', description: 'Video already in playlist.' });
      return;
    }

    const { error } = await supabase
      .from('playlist_videos')
      .insert({
        playlist_id: selectedPlaylist,
        video_id: videoForPlaylist.id,
        position: 0, // Will be updated based on count
      });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add video to playlist.' });
    } else {
      toast({ title: 'Video added to playlist!' });
      setPlaylistDialogOpen(false);
      setSelectedPlaylist('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const VideoTable = ({ items, isShort = false }: { items: VideoItem[]; isShort?: boolean }) => (
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
                  <span className="font-medium line-clamp-2 max-w-[200px] text-foreground">{video.title}</span>
                  {isShort && <Badge variant="secondary" className="mt-1">Short</Badge>}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={video.visibility === 'public' ? 'default' : 'secondary'}>
                {video.visibility || 'public'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(video.created_at)}</TableCell>
            <TableCell className="text-foreground">{(video.view_count || 0).toLocaleString()}</TableCell>
            <TableCell className="text-foreground">{(video.like_count || 0).toLocaleString()}</TableCell>
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
                  <DropdownMenuItem onClick={() => { setEditingVideo(video); setEditDialogOpen(true); }} className="gap-2">
                    <Edit className="w-4 h-4" />Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVideoForPlaylist(video)} className="gap-2">
                    <Play className="w-4 h-4" />Add to Playlist
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
                          This action cannot be undone. This will permanently delete your video.
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Channel Content</h1>
          <p className="text-muted-foreground mt-1">Manage your videos and shorts</p>
        </div>
        <Button asChild>
          <Link to="/upload" className="gap-2"><Plus className="w-4 h-4" />Upload</Link>
        </Button>
      </div>

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
                  <Button asChild><Link to="/upload">Upload Video</Link></Button>
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
                  <p className="text-muted-foreground mb-4">Upload a video under 60 seconds</p>
                  <Button asChild><Link to="/upload">Upload Short</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditVideoDialog
        video={editingVideo}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={fetchVideos}
      />

      <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>
              Select a playlist to add "{videoForPlaylist?.title}" to
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
              <SelectTrigger>
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlaylistDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToPlaylist} disabled={!selectedPlaylist}>
              Add to Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}