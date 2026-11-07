import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Only overlapping validations are shared; completed validations are never cached.
let pending: Promise<User | null> | undefined;
export function validatedPlayer(): Promise<User | null> {
  if (pending) return pending;
  const request = supabase.auth.getUser().then(({ data, error }) => {
    if (error) return null;
    return data.user;
  });
  pending = request;
  void request.then(() => { if (pending === request) pending = undefined; }, () => { if (pending === request) pending = undefined; });
  return request;
}

/** Session IDs scope browser queries only; the route gate and database still verify access. */
export async function playerId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) throw new Error('Please sign in again.');
  return data.session.user.id;
}