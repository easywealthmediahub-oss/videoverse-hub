import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  ListVideo, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  Video,
  Loader2
} from 'lucide-react';

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  visibility: string | null;
  created_at: string;
  video_count?: number;
  thumbnail_url?: string | null;
}

interface PlaylistVideo {
  id: string;
  video_id: string;
  position: number;
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number | null;
  };
}

export default function StudioPlaylists() {
  const { channel } = useProfile();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');

  useEffect(() => {
    if (channel) {
      fetchPlaylists();
    }
  }, [channel]);

  const fetchPlaylists = async () => {
    if (!channel) return;

    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_videos(count)
      `)
      .eq('user_id', channel.user_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const playlistsWithCount = data.map(p => ({
        ...p,
        video_count: p.playlist_videos?.[0]?.count || 0
      }));
      setPlaylists(playlistsWithCount);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingPlaylist(null);
    setTitle('');
    setDescription('');
    setVisibility('public');
    setDialogOpen(true);
  };

  const openEditDialog = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setTitle(playlist.title);
    setDescription(playlist.description || '');
    setVisibility(playlist.visibility || 'public');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!channel || !title.trim()) return;

    setSaving(true);

    if (editingPlaylist) {
      // Update existing
      const { error } = await supabase
        .from('playlists')
        .update({ title, description, visibility })
        .eq('id', editingPlaylist.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update playlist.' });
      } else {
        toast({ title: 'Playlist updated!' });
        fetchPlaylists();
        setDialogOpen(false);
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('playlists')
        .insert({
          user_id: channel.user_id,
          title,
          description,
          visibility,
        });

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create playlist.' });
      } else {
        toast({ title: 'Playlist created!' });
        fetchPlaylists();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!playlistToDelete) return;

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistToDelete.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete playlist.' });
    } else {
      toast({ title: 'Playlist deleted!' });
      setPlaylists(playlists.filter(p => p.id !== playlistToDelete.id));
    }
    setDeleteDialogOpen(false);
    setPlaylistToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Playlists</h1>
          <p className="text-muted-foreground mt-1">Organize your videos into collections</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Playlist
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{playlist.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {playlist.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(playlist)} className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => { setPlaylistToDelete(playlist); setDeleteDialogOpen(true); }}
                        className="text-destructive gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {playlist.video_count || 0} videos
                    </span>
                    <Badge variant={playlist.visibility === 'public' ? 'default' : 'secondary'}>
                      {playlist.visibility === 'public' ? (
                        <><Eye className="w-3 h-3 mr-1" /> Public</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1" /> Private</>
                      )}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {formatDate(playlist.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ListVideo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No playlists yet</h3>
              <p className="text-muted-foreground mb-4">Create a playlist to organize your videos</p>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Playlist
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}</DialogTitle>
            <DialogDescription>
              {editingPlaylist ? 'Update your playlist details' : 'Create a new playlist to organize your videos'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-title">Title</Label>
              <Input
                id="playlist-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter playlist title"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description</Label>
              <Textarea
                id="playlist-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your playlist"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                editingPlaylist ? 'Save Changes' : 'Create Playlist'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{playlistToDelete?.title}". Videos in this playlist won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
