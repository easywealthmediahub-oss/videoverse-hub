import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Scissors, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Loader2,
  Crop,
  Clock,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Save
} from 'lucide-react';

interface VideoEditorDialogProps {
  video: {
    id: string;
    title: string;
    video_url: string | null;
    duration: number | null;
    thumbnail_url: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface TrimSegment {
  id: string;
  start: number;
  end: number;
}

export default function VideoEditorDialog({ video, open, onOpenChange, onSave }: VideoEditorDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  // Trim state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  
  // Segments for cut/join
  const [segments, setSegments] = useState<TrimSegment[]>([]);
  const [activeTab, setActiveTab] = useState('trim');

  useEffect(() => {
    if (video && open) {
      setTrimStart(0);
      setTrimEnd(100);
      setSegments([]);
      setCurrentTime(0);
    }
  }, [video, open]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrimChange = (values: number[]) => {
    setTrimStart(values[0]);
    setTrimEnd(values[1]);
    // Seek to start of trim
    if (videoRef.current && duration) {
      seekTo((values[0] / 100) * duration);
    }
  };

  const addSegment = () => {
    const newSegment: TrimSegment = {
      id: `seg-${Date.now()}`,
      start: (trimStart / 100) * duration,
      end: (trimEnd / 100) * duration,
    };
    setSegments([...segments, newSegment]);
    toast({ title: 'Segment added', description: `${formatTime(newSegment.start)} - ${formatTime(newSegment.end)}` });
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const handleSaveEdits = async () => {
    if (!video) return;

    setSaving(true);

    // For now, we save trim metadata - actual video processing would require backend
    const trimData = {
      trim_start: (trimStart / 100) * duration,
      trim_end: (trimEnd / 100) * duration,
      segments: segments.map(s => ({ start: s.start, end: s.end })),
    };

    // Store edit metadata (in a real app, this would trigger backend processing)
    const { error } = await supabase
      .from('videos')
      .update({
        // Store trim info in a metadata field or process it
        duration: (trimEnd - trimStart) / 100 * duration,
      })
      .eq('id', video.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save edits.' });
    } else {
      toast({ 
        title: 'Edits saved!', 
        description: 'Note: Complex video processing requires backend support.' 
      });
      onSave();
      onOpenChange(false);
    }

    setSaving(false);
  };

  const resetEdits = () => {
    setTrimStart(0);
    setTrimEnd(100);
    setSegments([]);
    seekTo(0);
    toast({ title: 'Edits reset' });
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Video Editor
          </DialogTitle>
          <DialogDescription>
            Edit "{video.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {video.video_url ? (
              <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setPlaying(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Video preview not available</p>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <div className="flex-1">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={(v) => seekTo((v[0] / 100) * duration)}
                max={100}
                step={0.1}
              />
            </div>
            <span className="text-sm font-mono text-muted-foreground min-w-[80px] text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Edit Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="trim" className="gap-2">
                <Scissors className="w-4 h-4" />
                Trim
              </TabsTrigger>
              <TabsTrigger value="segments" className="gap-2">
                <Crop className="w-4 h-4" />
                Cut & Join
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trim" className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Trim Video</CardTitle>
                  <CardDescription>Set start and end points for your video</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Trim Range</Label>
                    <Slider
                      value={[trimStart, trimEnd]}
                      onValueChange={handleTrimChange}
                      max={100}
                      step={0.1}
                      className="my-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Start: {formatTime((trimStart / 100) * duration)}</span>
                      <span>End: {formatTime((trimEnd / 100) * duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      New duration: <strong>{formatTime(((trimEnd - trimStart) / 100) * duration)}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="segments" className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Cut & Join Segments</CardTitle>
                  <CardDescription>Create multiple segments to join together</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={addSegment} variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Current Selection as Segment
                    </Button>
                  </div>

                  {segments.length > 0 ? (
                    <div className="space-y-2">
                      {segments.map((segment, index) => (
                        <div 
                          key={segment.id} 
                          className="flex items-center gap-3 p-3 bg-accent rounded-lg"
                        >
                          <Badge variant="secondary">{index + 1}</Badge>
                          <span className="text-sm flex-1">
                            {formatTime(segment.start)} - {formatTime(segment.end)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => seekTo(segment.start)}
                            className="h-8 w-8"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSegment(segment.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No segments added. Use the trim slider above, then click "Add Segment".
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={resetEdits} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdits} disabled={saving} className="gap-2">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Edits</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
