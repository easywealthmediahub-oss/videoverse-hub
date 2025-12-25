import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';

interface ChannelLink {
  title: string;
  url: string;
}

export default function StudioSettings() {
  const { user } = useAuth();
  const { channel, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<ChannelLink[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (channel) {
      setName(channel.name || '');
      setDescription(channel.description || '');
      const channelLinks = (channel as any).links as ChannelLink[] | null;
      setLinks(channelLinks || []);
    }
  }, [user, channel, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !channel) return;

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${channel.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ variant: 'destructive', title: 'Upload failed', description: uploadError.message });
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

    await supabase.from('channels').update({ avatar_url: publicUrl }).eq('id', channel.id);
    toast({ title: 'Avatar updated' });
    refetch();
    setUploadingAvatar(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !channel) return;

    setUploadingBanner(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${channel.id}/banner.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ variant: 'destructive', title: 'Upload failed', description: uploadError.message });
      setUploadingBanner(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);

    await supabase.from('channels').update({ banner_url: publicUrl }).eq('id', channel.id);
    toast({ title: 'Banner updated' });
    refetch();
    setUploadingBanner(false);
  };

  const handleSave = async () => {
    if (!channel) return;

    setLoading(true);
    const { error } = await supabase
      .from('channels')
      .update({
        name,
        description,
        links: links.filter(l => l.title && l.url) as any,
      })
      .eq('id', channel.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
    } else {
      toast({ title: 'Settings saved' });
      refetch();
    }
    setLoading(false);
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  if (!channel) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Channel Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your channel appearance and information</p>
      </div>

      {/* Banner */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Channel Banner</CardTitle>
          <CardDescription>Recommended size: 2048 x 1152 pixels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-[16/4] bg-muted rounded-lg overflow-hidden group">
            {channel.banner_url ? (
              <img src={channel.banner_url} alt="Channel banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No banner uploaded
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingBanner ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Avatar and Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Channel Info</CardTitle>
          <CardDescription>Basic information about your channel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={channel.avatar_url || ''} />
                <AvatarFallback className="text-2xl">{channel.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Channel Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell viewers about your channel"
            />
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Add links to your social media and websites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Input
                  placeholder="Title (e.g., Twitter)"
                  value={link.title}
                  onChange={(e) => updateLink(index, 'title', e.target.value)}
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeLink(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addLink} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <a href={`/channel/${channel.id}`} target="_blank" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Channel
          </a>
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}