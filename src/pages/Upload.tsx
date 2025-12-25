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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, Image, X, Video, Clock, Check, AlertCircle } from 'lucide-react';
import AdvancedSpinner from '@/components/ui/AdvancedSpinner';

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
      <div className="max-w-6xl mx-auto py-6 md:py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            Upload Your Content
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Upload Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <span>Video Content</span>
                </CardTitle>
                <CardDescription>
                  Select your video file to upload
                </CardDescription>
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
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Video className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px] md:max-w-[300px]">
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
                        className="h-9 w-9"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoDuration(0);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {videoDuration > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
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
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 group"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                        <UploadIcon className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-foreground font-semibold text-lg mb-1">Upload your video</p>
                      <p className="text-muted-foreground mb-3">MP4, WebM, or MOV (Max 500MB)</p>
                      <p className="text-sm text-muted-foreground/70">
                        Videos under 60 seconds will be marked as Shorts
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <span>Thumbnail</span>
                </CardTitle>
                <CardDescription>
                  Add a custom thumbnail to make your video stand out
                </CardDescription>
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
                  <div className="relative rounded-xl overflow-hidden border border-border/50">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-64 object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-3 right-3 h-9 w-9 bg-destructive/90 hover:bg-destructive text-white"
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
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 group aspect-video flex flex-col items-center justify-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                        <Image className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-foreground font-semibold text-lg mb-1">Add a thumbnail</p>
                      <p className="text-muted-foreground mb-1">JPG, PNG, or WebP</p>
                      <p className="text-sm text-muted-foreground/70">
                        Recommended: 1280x720 (16:9 ratio)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details & Upload Section */}
          <div className="space-y-8">
            {/* Video Details */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Video Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    maxLength={100}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your video"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-11">
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
                    <Label className="text-sm font-medium">Visibility</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Enter tags separated by commas"
                      className="h-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Status & Button */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Upload Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <AdvancedSpinner progress={uploadProgress} />
                    </div>
                  ) : videoFile ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-green-100/20 border border-green-500/30">
                        <Check className="w-12 h-12 text-green-500" />
                      </div>
                      <p className="text-center text-muted-foreground">
                        Ready to upload
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/50 border border-border/30">
                        <AlertCircle className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <p className="text-center text-muted-foreground">
                        Select a video to begin
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleUpload}
                    disabled={!videoFile || !title || uploading}
                    className="w-full mt-6 h-12 text-lg"
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                        Uploading...
                      </div>
                    ) : isShort ? (
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Upload Short
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UploadIcon className="w-5 h-5" />
                        Upload Video
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}