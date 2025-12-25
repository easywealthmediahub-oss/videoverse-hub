import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, Image, X, Video, Clock } from 'lucide-react';

const CATEGORIES = [
  'Entertainment', 'Music', 'Gaming', 'Education', 'Sports', 
  'News', 'Technology', 'Comedy', 'Film', 'Howto', 'Travel', 'Other'
];

export default function Upload() {
  const { user } = useAuth();
  const { channel } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState('');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please select a video file.',
        });
        return;
      }
      setVideoFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      // Extract video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        setVideoDuration(duration);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please select an image file.',
        });
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!videoFile || !title || !channel) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide a video file and title.',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video
      const videoPath = `${user!.id}/${Date.now()}_${videoFile.name}`;
      setUploadProgress(10);
      
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile);

      if (videoError) throw videoError;
      setUploadProgress(60);

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailPath = `${user!.id}/${Date.now()}_${thumbnailFile.name}`;
        
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailPath, thumbnailFile);

        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = publicUrl;
        }
      }
      setUploadProgress(80);

      // Create video record with duration
      const { data: video, error: dbError } = await supabase
        .from('videos')
        .insert({
          channel_id: channel.id,
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          visibility,
          category,
          tags: tags ? tags.split(',').map(t => t.trim()) : null,
          duration: videoDuration,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setUploadProgress(100);

      const isShort = videoDuration > 0 && videoDuration <= 60;
      
      toast({
        title: isShort ? 'Short uploaded!' : 'Video uploaded!',
        description: isShort 
          ? 'Your short has been published and will appear in Shorts.' 
          : 'Your video has been published.',
      });

      navigate(`/watch/${video.id}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload video.',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const isShort = videoDuration > 0 && videoDuration <= 60;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">Upload Video</h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Video Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video File
              </CardTitle>
              <CardDescription>Select a video file to upload</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              
              {videoFile ? (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-foreground truncate max-w-[200px]">
                          {videoFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoDuration(0);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {videoDuration > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Duration: {formatDuration(videoDuration)}
                      </span>
                      {isShort && (
                        <Badge variant="secondary" className="ml-2">
                          Short
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium">Click to select video</p>
                  <p className="text-sm text-muted-foreground mt-1">MP4, WebM, or MOV</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Videos under 60 seconds will be uploaded as Shorts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thumbnail Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Thumbnail
              </CardTitle>
              <CardDescription>Add a custom thumbnail (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors aspect-video flex flex-col items-center justify-center"
                >
                  <Image className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium">Click to add thumbnail</p>
                  <p className="text-sm text-muted-foreground mt-1">JPG, PNG, or WebP</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress & Button */}
        <div className="mt-8 space-y-4">
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!videoFile || !title || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Uploading...' : isShort ? 'Upload Short' : 'Upload Video'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}