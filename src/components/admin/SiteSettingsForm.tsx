import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { siteSettingsService } from '@/services/siteSettingsService';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettingsFormProps {
  onSave?: () => void;
}

export default function SiteSettingsForm({ onSave }: SiteSettingsFormProps) {
  const { settings, loading, updateSettings } = useSiteSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    site_name: settings.site_name || 'VideoHub',
    site_title: settings.site_title || 'VideoHub - Watch and Share Videos',
    meta_description: settings.meta_description || 'Watch and share videos on VideoHub - the platform for creators and viewers.',
    logo_url: settings.logo_url || '',
    logo_background_color: settings.logo_background_color || '',
    favicon_url: settings.favicon_url || '',
    meta_image: settings.meta_image || '',
    theme: settings.theme || 'light',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Create refs for the file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const metaImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({
      site_name: settings.site_name || 'VideoHub',
      site_title: settings.site_title || 'VideoHub - Watch and Share Videos',
      meta_description: settings.meta_description || 'Watch and share videos on VideoHub - the platform for creators and viewers.',
      logo_url: settings.logo_url || '',
      logo_background_color: settings.logo_background_color || '',
      favicon_url: settings.favicon_url || '',
      meta_image: settings.meta_image || '',
      theme: settings.theme || 'light',
    });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file (jpg, png, gif, etc.)',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
      });
      return;
    }

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${settingKey}_${Date.now()}.${fileExt}`;
      const bucket = 'avatars'; // Using avatars bucket for all site images

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Update the setting
      await siteSettingsService.updateSetting(settingKey, publicUrl);

      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        [settingKey]: publicUrl
      }));

      toast({
        title: 'File uploaded successfully',
        description: `${settingKey.replace('_', ' ')} updated`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload the file. Please try again.',
      });
    }
  };

  const handleUploadClick = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateSettings({
        site_name: formData.site_name,
        site_title: formData.site_title,
        meta_description: formData.meta_description,
        logo_url: formData.logo_url,
        logo_background_color: formData.logo_background_color,
        favicon_url: formData.favicon_url,
        meta_image: formData.meta_image,
        theme: formData.theme,
      });

      toast({
        title: 'Settings saved successfully',
        description: 'Site settings have been updated.',
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
          <CardDescription>Configure your site's global settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Name */}
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                name="site_name"
                value={formData.site_name}
                onChange={handleChange}
                placeholder="VideoHub"
              />
            </div>

            {/* Site Title */}
            <div className="space-y-2">
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                name="site_title"
                value={formData.site_title}
                onChange={handleChange}
                placeholder="VideoHub - Watch and Share Videos"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                placeholder="Watch and share videos on VideoHub - the platform for creators and viewers."
                rows={3}
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
                <Input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  className="hidden"
                  id="logo_upload"
                  onChange={(e) => handleFileUpload(e, 'logo_url')}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUploadClick(logoInputRef)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Favicon URL */}
            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <div className="flex gap-2">
                <Input
                  id="favicon_url"
                  name="favicon_url"
                  value={formData.favicon_url}
                  onChange={handleChange}
                  placeholder="https://example.com/favicon.ico"
                />
                <Input
                  type="file"
                  accept="image/*"
                  ref={faviconInputRef}
                  className="hidden"
                  id="favicon_upload"
                  onChange={(e) => handleFileUpload(e, 'favicon_url')}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUploadClick(faviconInputRef)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Meta Image URL */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="meta_image">Meta Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="meta_image"
                  name="meta_image"
                  value={formData.meta_image}
                  onChange={handleChange}
                  placeholder="https://example.com/meta-image.jpg"
                  className="flex-1"
                />
                <Input
                  type="file"
                  accept="image/*"
                  ref={metaImageInputRef}
                  className="hidden"
                  id="meta_image_upload"
                  onChange={(e) => handleFileUpload(e, 'meta_image')}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUploadClick(metaImageInputRef)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            {/* Logo Background Color */}
            <div className="space-y-2">
              <Label htmlFor="logo_background_color">Logo Background Color</Label>
              <Input
                id="logo_background_color"
                name="logo_background_color"
                value={formData.logo_background_color}
                onChange={handleChange}
                placeholder="e.g., #3b82f6, blue, bg-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Enter a color value (hex, named color, or Tailwind class)
              </p>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}