import { useEffect } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const FaviconUpdater = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const updateFavicon = (href: string) => {
      // Remove existing favicons
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = href;
      document.head.appendChild(link);
    };

    if (settings.favicon_url) {
      updateFavicon(settings.favicon_url);
    } else {
      // Use default favicon
      updateFavicon('/favicon.ico');
    }
  }, [settings.favicon_url]);

  return null;
};

export default FaviconUpdater;