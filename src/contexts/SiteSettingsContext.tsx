import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { siteSettingsService, SiteSettings } from '@/services/siteSettingsService';

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSetting: (key: string, value: any) => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const loadedSettings = await siteSettingsService.getSiteSettings();
      setSettings(loadedSettings);
      
      // Update document head based on loaded settings
      updateDocumentHead(loadedSettings);
    } catch (error) {
      console.error('Error loading site settings:', error);
      const defaultSettings = siteSettingsService.getDefaultSettings();
      setSettings(defaultSettings);
      updateDocumentHead(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentHead = (settings: SiteSettings) => {
    // Update site title
    if (settings.site_title) {
      document.title = settings.site_title as string;
    } else if (settings.site_name) {
      document.title = `${settings.site_name as string} - Watch and Share Videos`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && settings.meta_description) {
      metaDescription.setAttribute('content', settings.meta_description as string);
    }

    // Update meta image
    const metaImage = document.querySelector('meta[property="og:image"]') || 
                     document.querySelector('meta[name="twitter:image"]');
    if (metaImage && settings.meta_image) {
      metaImage.setAttribute('content', settings.meta_image as string);
    }

    // Update og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && settings.site_title) {
      ogTitle.setAttribute('content', settings.site_title as string);
    }

    // Update og:site_name
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName && settings.site_name) {
      ogSiteName.setAttribute('content', settings.site_name as string);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const result = await siteSettingsService.updateSetting(key, value);
    if (result.success) {
      setSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        updateDocumentHead(newSettings);
        return newSettings;
      });
    }
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const result = await siteSettingsService.updateSettings(newSettings);
    if (result.success) {
      setSettings(prev => {
        const updatedSettings = { ...prev, ...newSettings };
        updateDocumentHead(updatedSettings);
        return updatedSettings;
      });
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const value = {
    settings,
    loading,
    updateSetting,
    updateSettings,
    refreshSettings
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}