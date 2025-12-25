import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  siteName?: string;
  logoUrl?: string;
  logoBackgroundColor?: string;
  faviconUrl?: string;
  siteTitle?: string;
  metaDescription?: string;
  metaImage?: string;
  theme?: string;
  [key: string]: any; // Allow for additional settings
}

const SETTINGS_KEYS = {
  SITE_NAME: 'site_name',
  LOGO_URL: 'logo_url',
  LOGO_BACKGROUND_COLOR: 'logo_background_color',
  FAVICON_URL: 'favicon_url',
  SITE_TITLE: 'site_title',
  META_DESCRIPTION: 'meta_description',
  META_IMAGE: 'meta_image',
  THEME: 'theme',
} as const;

export const siteSettingsService = {
  // Get all site settings
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settings: SiteSettings = {};
      data?.forEach(item => {
        settings[item.key as keyof SiteSettings] = item.value;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return {};
    }
  },

  // Update a single setting
  async updateSetting(key: string, value: any) {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key, value },
          { onConflict: 'key' }
        );

      if (error) throw error;

      // Update the document head if it's a meta setting
      if (key === SETTINGS_KEYS.SITE_NAME) {
        document.title = value as string;
      } else if (key === SETTINGS_KEYS.SITE_TITLE) {
        const titleTag = document.querySelector('title');
        if (titleTag) titleTag.textContent = value as string;
      } else if (key === SETTINGS_KEYS.META_DESCRIPTION) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', value as string);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating site setting:', error);
      return { success: false, error };
    }
  },

  // Update multiple settings at once
  async updateSettings(settings: Partial<SiteSettings>) {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      for (const update of updates) {
        await this.updateSetting(update.key, update.value);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating site settings:', error);
      return { success: false, error };
    }
  },

  // Get a specific setting
  async getSetting(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw error;
      }

      return data?.value;
    } catch (error) {
      console.error('Error fetching site setting:', error);
      return null;
    }
  },

  // Default settings
  getDefaultSettings(): SiteSettings {
    return {
      [SETTINGS_KEYS.SITE_NAME]: 'VideoHub',
      [SETTINGS_KEYS.SITE_TITLE]: 'VideoHub - Watch and Share Videos',
      [SETTINGS_KEYS.META_DESCRIPTION]: 'Watch and share videos on VideoHub - the platform for creators and viewers.',
      [SETTINGS_KEYS.THEME]: 'light',
      [SETTINGS_KEYS.LOGO_BACKGROUND_COLOR]: '',
    };
  },

  // Settings keys for reference
  getSettingsKeys() {
    return SETTINGS_KEYS;
  }
};