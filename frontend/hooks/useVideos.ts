import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Video, Profile } from '../types';

export function useVideos() {
  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      // 先查视频
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'ready')
        .order('view_count', { ascending: false })
        .limit(20);

      if (error || !data) return [];

      // 收集所有 user_id 批量查 profiles
      const userIds = [...new Set(data.map((v: any) => v.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap: Record<string, Profile> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = p;
      });

      // 合并
      return data.map((v: any) => ({
        ...v,
        user: profileMap[v.user_id] ?? { username: '未知', avatar_url: null },
      })) as Video[];
    },
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  return { videos, loading: isLoading, refetch };
}
