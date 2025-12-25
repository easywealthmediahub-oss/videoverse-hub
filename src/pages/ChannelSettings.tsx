import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, ImageIcon, Loader2, Plus, Trash2, Link as LinkIcon } from 'lucide-react';

interface ChannelLink {
  title: string;
  url: string;
}

export default function ChannelSettings() {
  const { user } = useAuth();
  const { channel, updateChannel, updateProfile, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<ChannelLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setUsername(channel.username || channel.name || ''); // Use channel name as fallback
      setDescription(channel.description || '');
      // Parse links from channel data
      const channelLinks = (channel as any).links;
      if (channelLinks && Array.isArray(channelLinks)) {
        setLinks(channelLinks);
      }
    }
  }, [channel]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }

  if (!channel) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Please select an image file' });
      return;
    }

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${channel.id}/avatar.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        toast({
          title: 'Upload Error',
          description: `Failed to upload avatar: ${uploadError.message}. This may be due to storage permissions. Please contact an administrator.`,
          variant: 'destructive',
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateChannel({ avatar_url: publicUrl });
      // Use setTimeout to ensure refetch happens after render
      window.setTimeout(async () => {
        await refetch();
      }, 0);
      toast({ title: 'Avatar updated!' });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({ variant: 'destructive', title: 'Failed to upload avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Please select an image file' });
      return;
    }

    setUploadingBanner(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${channel.id}/banner.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Banner upload error:', uploadError);
        toast({
          title: 'Upload Error',
          description: `Failed to upload banner: ${uploadError.message}. This may be due to storage permissions. Please contact an administrator.`,
          variant: 'destructive',
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      await updateChannel({ banner_url: publicUrl });
      // Use setTimeout to ensure refetch happens after render
      window.setTimeout(async () => {
        await refetch();
      }, 0);
      toast({ title: 'Banner updated!' });
    } catch (error) {
      console.error('Banner upload error:', error);
      toast({ variant: 'destructive', title: 'Failed to upload banner' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Filter out empty links
    const validLinks = links.filter(link => link.title.trim() && link.url.trim());
    
    try {
      // Update channel with all fields, but handle username separately if it doesn't exist in DB
      let channelUpdateResult;
      
      // First, try to update with username if provided
      if (username) {
        const channelUpdates: any = { 
          name, 
          description,
          links: validLinks as unknown as any,
          username
        };
        
        channelUpdateResult = await supabase
          .from('channels')
          .update(channelUpdates)
          .eq('id', channel.id);
          
        // If there's an error about the username column not existing, try updating without username
        if (channelUpdateResult.error && channelUpdateResult.error.message && 
            (channelUpdateResult.error.message.includes('username') || channelUpdateResult.error.message.includes('column'))) {
          // Update without username column
          channelUpdateResult = await supabase
            .from('channels')
            .update({ 
              name, 
              description,
              links: validLinks as unknown as any
            })
            .eq('id', channel.id);
            
          if (channelUpdateResult.error) {
            throw channelUpdateResult.error;
          }
        } else if (channelUpdateResult.error) {
          throw channelUpdateResult.error;
        }
      } else {
        // If no username provided, just update other fields
        channelUpdateResult = await supabase
          .from('channels')
          .update({ 
            name, 
            description,
            links: validLinks as unknown as any
          })
          .eq('id', channel.id);
          
        if (channelUpdateResult.error) {
          throw channelUpdateResult.error;
        }
      }
      
      // Update profile
      const { error: profileError } = await updateProfile({ 
        username: name 
      });
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        // Continue anyway, since channel was updated
      }
      
      // The state will be updated via refetch below, no need to update directly here
      
      // Show success toast
      toast({ title: 'Changes saved!' });
      
      // Refetch in a separate operation after UI update using window setTimeout to ensure it runs after render
      window.setTimeout(async () => {
        if (!isUpdatingRef.current) {
          await refetch();
        }
      }, 0);
    } catch (error) {
      console.error('Error saving channel settings:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Failed to save channel changes',
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">Channel Settings</h1>

        {/* Banner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Channel Banner</CardTitle>
            <CardDescription>This appears at the top of your channel page. Recommended size: 2560x1440px</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="relative w-full h-40 bg-muted rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => bannerInputRef.current?.click()}
            >
              {channel.banner_url ? (
                <img 
                  src={channel.banner_url} 
                  alt="Channel banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingBanner ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Channel Avatar</CardTitle>
            <CardDescription>Your channel's profile picture. Recommended size: 800x800px</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div 
                className="relative cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Avatar className="w-24 h-24">
                  <AvatarImage src={channel.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">{channel.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Click on the avatar to upload a new image</p>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </CardContent>
        </Card>

        {/* Channel Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Channel Information</CardTitle>
            <CardDescription>Update your channel name, username, and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your channel name"
              />
              <p className="text-xs text-muted-foreground">This is the display name for your channel</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username-field">Username</Label>
              <Input
                id="username-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
              <p className="text-xs text-muted-foreground">This will be used in your channel URL (@username)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your channel"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Channel Links */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Channel Links
            </CardTitle>
            <CardDescription>Add links to your social media or website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Title (e.g., Twitter)"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="URL (e.g., https://twitter.com/...)"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button variant="outline" onClick={addLink} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Link
            </Button>
          </CardContent>
        </Card>

        {/* Share Channel Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Share Your Channel</CardTitle>
            <CardDescription>Copy your channel link to share with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/channel/${channel.id}`}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/channel/${channel.id}`);
                    toast({ title: 'Link copied to clipboard!' });
                  }}
                >
                  Copy UUID
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/c/${username}`}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/c/${username}`);
                    toast({ title: 'Link copied to clipboard!' });
                  }}
                >
                  Copy Username
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Share using /c/username for a shorter URL</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/channel/${channel.id}`)}>
            View Channel
          </Button>
        </div>
      </div>
    </Layout>
  );
}