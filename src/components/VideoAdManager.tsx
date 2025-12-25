import { useEffect, useRef, useState } from 'react';
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

interface VideoAdManagerProps {
  videoId: string;
  onAdStart?: () => void;
  onAdEnd?: () => void;
  onAdSkip?: () => void;
}

const VideoAdManager = ({ 
  videoId, 
  onAdStart, 
  onAdEnd, 
  onAdSkip 
}: VideoAdManagerProps) => {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [currentAd, setCurrentAd] = useState<AdUnit | null>(null);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [skipAvailable, setSkipAvailable] = useState(false);
  const [timeUntilSkip, setTimeUntilSkip] = useState(5);
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const skipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preRollPlayedRef = useRef(false);
  const midRollPlayedRef = useRef(false);

  useEffect(() => {
    fetchVideoAds();
    
    return () => {
      if (skipTimerRef.current) clearInterval(skipTimerRef.current);
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [videoId]);

  const fetchVideoAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_units')
        .select('*')
        .eq('status', 'active')
        .or('ad_format.eq.video_pre_roll,ad_format.eq.video_mid_roll,ad_format.eq.video_post_roll')
        .order('priority', { ascending: true });

      if (error) throw error;

      if (data) {
        setAdUnits(data);
        
        // Play pre-roll ad automatically
        setTimeout(() => {
          playPreRollAd();
        }, 500); // Small delay to ensure player is ready
      }
    } catch (error) {
      console.error('Error fetching video ads:', error);
    }
  };

  const playPreRollAd = () => {
    if (preRollPlayedRef.current) return; // Don't play pre-roll again
    preRollPlayedRef.current = true;
    
    const preRollAd = adUnits.find(ad => ad.ad_format === 'video_pre_roll');
    if (preRollAd) {
      playAd(preRollAd);
    }
  };

  const playMidRollAd = (positionSeconds: number) => {
    if (midRollPlayedRef.current) return; // Don't play mid-roll again
    midRollPlayedRef.current = true;
    
    const midRollAd = adUnits.find(ad => 
      ad.ad_format === 'video_mid_roll' && ad.video_position_seconds === positionSeconds
    );
    if (midRollAd) {
      playAd(midRollAd);
    }
  };

  const playPostRollAd = () => {
    const postRollAd = adUnits.find(ad => ad.ad_format === 'video_post_roll');
    if (postRollAd) {
      playAd(postRollAd);
    }
  };

  const playAd = (adUnit: AdUnit) => {
    setCurrentAd(adUnit);
    setAdPlaying(true);
    setAdProgress(0);
    setSkipAvailable(false);
    setTimeUntilSkip(5);

    if (onAdStart) onAdStart();

    // Start skip timer (5 seconds)
    if (skipTimerRef.current) clearInterval(skipTimerRef.current);
    skipTimerRef.current = setInterval(() => {
      setTimeUntilSkip(prev => {
        if (prev <= 1) {
          if (skipTimerRef.current) clearInterval(skipTimerRef.current);
          setSkipAvailable(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate ad progress
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    adTimerRef.current = setInterval(() => {
      setAdProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          finishAd();
          return 100;
        }
        return newProgress;
      });
    }, 100); // Update every 100ms for a 10-second ad at 100% speed
  };

  const finishAd = () => {
    setCurrentAd(null);
    setAdPlaying(false);
    setAdProgress(0);
    if (onAdEnd) onAdEnd();
  };

  const skipAd = () => {
    if (skipAvailable || currentAd?.ad_format.includes('pre_roll')) {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
      if (skipTimerRef.current) clearInterval(skipTimerRef.current);
      finishAd();
      if (onAdSkip) onAdSkip();
    }
  };

  const renderAdContent = () => {
    if (!currentAd) return null;

    return (
      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Ad content - this would be where the actual ad video/content goes */}
          <div className="text-center p-4">
            <div className="text-white text-xl mb-4">{currentAd.name}</div>
            <div className="text-gray-300 mb-4">Advertisement</div>
            
            {/* Ad progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${adProgress}%` }}
              ></div>
            </div>
            
            {/* Skip button */}
            {skipAvailable ? (
              <button
                onClick={skipAd}
                className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Skip Ad
              </button>
            ) : (
              <div className="absolute top-4 right-4 text-white text-sm">
                Skip in {timeUntilSkip}s
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return {
    playPreRollAd,
    playMidRollAd,
    playPostRollAd,
    skipAd,
    adPlaying,
    currentAd,
    adProgress,
    skipAvailable,
    skipTime: timeUntilSkip,
    AdOverlay: adPlaying ? renderAdContent() : null
  };
};

// Component wrapper for use in JSX
const VideoAdManagerComponent = ({ 
  videoId, 
  onAdStart, 
  onAdEnd, 
  onAdSkip 
}: VideoAdManagerProps) => {
  const videoAdManager = VideoAdManager({ videoId, onAdStart, onAdEnd, onAdSkip });
  
  return videoAdManager.AdOverlay;
};

export default VideoAdManagerComponent;