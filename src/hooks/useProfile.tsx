import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileAndChannel();
    } else {
      setProfile(null);
      setChannel(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfileAndChannel = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [profileResult, channelResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('channels')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profileResult.data) setProfile(profileResult.data);
      if (channelResult.data) setChannel(channelResult.data);
    } catch (error) {
      console.error('Error fetching profile/channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const updateChannel = async (updates: Partial<Channel>) => {
    if (!channel) return { error: new Error('Channel not found') };

    const { error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', channel.id);

    if (!error) {
      setChannel(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  return { profile, channel, loading, updateProfile, updateChannel, refetch: fetchProfileAndChannel };
}
