import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { playerId } from './auth-user';
export const profileOptions = () => queryOptions({ queryKey: ['player-profile'], staleTime: 60_000, queryFn: async () => {
  const id = await playerId();
  const { data, error } = await supabase.from('profiles').select('id, username, display_name, created_at').eq('id', id).single();
  if (error) throw error;
  return data;
} });
