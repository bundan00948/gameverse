import { supabase } from '@/integrations/supabase/client';

/** Session IDs scope browser queries only; the route gate and database still verify access. */
export async function playerId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('Please sign in again.');
  return data.session.user.id;
}