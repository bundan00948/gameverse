import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export const profileOptions = () => queryOptions({ queryKey: ['player-profile'], staleTime: 60_000, queryFn: async () => {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('Please sign in again.');
  const { data, error } = await supabase.from('profiles').select('id, username, display_name, created_at').eq('id', auth.user.id).single();
  if (error) throw error;
  return data;
} });
