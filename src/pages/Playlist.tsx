import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, Clock, Eye, ThumbsUp, ThumbsDown, MoreHorizontal, Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlaylistVideo {
  id: string;
  playlist_id: string;
  video_id: string;
  position: number;
  created_at: string;
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number;
    view_count: number;
    like_count: number;
    dislike_count: number;
    created_at: string;
    channel: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  };
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  thumbnail_url: string | null;
  created_at: string;
  user_id: string;
  video_count: number;
  profile: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export default function Playlist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) {
      navigate('/playlists');
      return;
    }
    fetchPlaylist();
  }, [id, navigate]);

  const fetchPlaylist = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;
      if (!playlistData) {
        toast({
          variant: 'destructive',
          title: 'Playlist not found',
          description: 'The requested playlist does not exist.',
        });
        navigate('/playlists');
        return;
      }

      // Fetch profile for the playlist owner
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', playlistData.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Combine playlist data with profile
      const playlistWithProfile = {
        ...playlistData,
        profile: profileData || null
      };

      setPlaylist(playlistWithProfile);

      // Fetch videos in the playlist
      const { data: videosData, error: videosError } = await supabase
        .from('playlist_videos')
        .select(`
          *,
          video:videos!playlist_videos_video_id_fkey (
            id,
            title,
            thumbnail_url,
            duration,
            view_count,
            like_count,
            dislike_count,
            created_at,
            channel:channels!videos_channel_id_fkey (id, name, avatar_url)
          )
        `)
        .eq('playlist_id', id)
        .order('position');

      if (videosError) throw videosError;

      // Filter out any entries where the video was deleted
      const validVideos = videosData.filter(item => item.video).map(item => ({
        ...item,
        video: item.video
      }));

      setVideos(validVideos);
    } catch (error: any) {
      console.error('Error fetching playlist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load playlist',
      });
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-foreground">Playlist not found</h1>
            <p className="text-muted-foreground mt-2">No playlist ID provided</p>
            <Button asChild className="mt-4">
              <Link to="/playlists">Back to Playlists</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!playlist) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-foreground">Playlist not found</h1>
            <p className="text-muted-foreground mt-2">The requested playlist does not exist</p>
            <Button asChild className="mt-4">
              <Link to="/playlists">Back to Playlists</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Please select an image file' });
      return;
    }

    if (!playlist) {
      toast({ variant: 'destructive', title: 'Playlist not loaded' });
      return;
    }

    // Check if the current user is the owner of the playlist
    if (!user || playlist.user_id !== user.id) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'You can only update thumbnails for your own playlists',
      });
      return;
    }

    setUploadingThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `playlists/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('playlists')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Thumbnail upload error:', uploadError);
        toast({
          title: 'Upload Error',
          description: `Failed to upload thumbnail: ${uploadError.message}. This may be due to storage permissions. Please contact an administrator.`,
          variant: 'destructive',
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('playlists')
        .getPublicUrl(filePath);

      // Update the playlist with the new thumbnail URL
      const { error: updateError } = await supabase
        .from('playlists')
        .update({ thumbnail_url: publicUrl })
        .eq('id', playlist.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          variant: 'destructive',
          title: 'Failed to update playlist',
          description: 'Could not save the thumbnail to the playlist',
        });
        return;
      }

      // Update local state
      setPlaylist(prev => prev ? { ...prev, thumbnail_url: publicUrl } : null);
      toast({ title: 'Thumbnail updated!' });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast({ variant: 'destructive', title: 'Failed to upload thumbnail' });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-4 px-4">
        {/* Playlist Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div 
              className={`relative w-48 h-28 rounded-lg overflow-hidden flex-shrink-0 ${user && playlist.user_id === user.id ? 'cursor-pointer group' : ''}`}
              onClick={() => user && playlist.user_id === user.id && thumbnailInputRef.current?.click()}
            >
              {playlist.thumbnail_url ? (
                <div className="relative w-full h-full">
                  <img
                    src={playlist.thumbnail_url}
                    alt={playlist.title}
                    className="w-full h-full object-cover"
                  />
                  {user && playlist.user_id === user.id && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-white text-xs">Change</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-4xl">🎬</div>
                  {user && playlist.user_id === user.id && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-white text-xs">Add</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {uploadingThumbnail && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            {user && playlist.user_id === user.id && (
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{playlist.title}</h1>
              <p className="text-muted-foreground mt-1">
                {videos.length} videos
              </p>
              {playlist.description && (
                <p className="text-foreground mt-2">{playlist.description}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={playlist.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {playlist.profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {playlist.profile?.username || 'Unknown User'}
                  </span>
                </div>
                
                <span className="text-sm text-muted-foreground">
                  Created {new Date(playlist.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div className="space-y-2">
          {videos.map((playlistVideo, index) => (
            <Card key={playlistVideo.id} className="overflow-hidden hover:bg-accent transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                  {playlistVideo.video.thumbnail_url ? (
                    <img
                      src={playlistVideo.video.thumbnail_url}
                      alt={playlistVideo.video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="text-xl">🎬</div>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(playlistVideo.video.duration)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                    <Button size="sm" variant="secondary" className="rounded-full">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {playlistVideo.video.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Link 
                      to={`/c/${playlistVideo.video.channel.name || playlistVideo.video.channel.id}`}
                      className="hover:underline"
                    >
                      {playlistVideo.video.channel.name}
                    </Link>
                    <span>•</span>
                    <span>{playlistVideo.video.view_count?.toLocaleString()} views</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{playlistVideo.video.like_count || 0}</span>
                      <ThumbsDown className="w-4 h-4 ml-2" />
                      <span>{playlistVideo.video.dislike_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Added #{playlistVideo.position + 1}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-foreground">No videos in this playlist</h2>
            <p className="text-muted-foreground mt-2">This playlist is currently empty</p>
          </div>
        )}
      </div>
    </Layout>
  );
}