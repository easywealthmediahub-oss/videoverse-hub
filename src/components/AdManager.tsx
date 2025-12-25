import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdUnit {
  id: string;
  name: string;
  ad_format: string;
  ad_type: string;
  ad_code: string;
  ad_placement: any;
  page_placement: string;
  video_position_seconds: number;
  priority: number;
  status: string;
  sizes: any;
  targeting: any;
}

interface AdManagerProps {
  videoId?: string;
  pageType?: string;
}

const AdManager = ({ videoId, pageType = 'general' }: AdManagerProps) => {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdUnits();
  }, [videoId, pageType]);

  const fetchAdUnits = async () => {
    try {
      let query = supabase
        .from('ad_units')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: true });

      // Filter based on page type
      if (pageType === 'video' && videoId) {
        query = query.or('page_placement.eq.video_player,page_placement.eq.in_player');
      } else if (pageType === 'video') {
        query = query.eq('page_placement', 'video_player');
      } else {
        query = query.neq('page_placement', 'video_player'); // Exclude video-specific ads
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Filter video ads if not on video page
        const filteredAdUnits = pageType === 'video' 
          ? data 
          : data.filter(ad => !ad.ad_format.includes('video'));

        setAdUnits(filteredAdUnits);
      }
    } catch (error) {
      console.error('Error fetching ad units:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAd = (adUnit: AdUnit) => {
    // Handle different ad formats
    if (adUnit.ad_format.includes('google_adsense')) {
      // Render Google AdSense
      return (
        <div 
          key={adUnit.id} 
          className="ad-container"
          dangerouslySetInnerHTML={{ __html: adUnit.ad_code || '' }}
        />
      );
    } else if (adUnit.ad_format.includes('html')) {
      // Render HTML ad
      return (
        <div 
          key={adUnit.id} 
          className="ad-container"
          dangerouslySetInnerHTML={{ __html: adUnit.ad_code || '' }}
        />
      );
    } else if (adUnit.ad_format.includes('image')) {
      // Render image ad
      return (
        <div key={adUnit.id} className="ad-container">
          <a href="#" target="_blank" rel="noopener noreferrer">
            <img 
              src={adUnit.ad_code} 
              alt={adUnit.name} 
              className="w-full h-auto rounded-md"
            />
          </a>
        </div>
      );
    } else if (adUnit.ad_format.includes('link')) {
      // Render link ad
      return (
        <div key={adUnit.id} className="ad-container">
          <a 
            href={adUnit.ad_code} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-4 bg-muted rounded-md hover:bg-muted/80 transition-colors"
          >
            <div className="font-medium">{adUnit.name}</div>
            <div className="text-sm text-muted-foreground truncate">{adUnit.ad_code}</div>
          </a>
        </div>
      );
    } else {
      // Default display ad
      return (
        <div 
          key={adUnit.id} 
          className="ad-container p-4 bg-muted rounded-md"
        >
          <div className="font-medium">{adUnit.name}</div>
          <div className="text-sm text-muted-foreground">Advertisement</div>
        </div>
      );
    }
  };

  if (loading || adUnits.length === 0) {
    return null;
  }

  return (
    <div className="ad-manager">
      {adUnits.map(adUnit => renderAd(adUnit))}
    </div>
  );
};

export default AdManager;