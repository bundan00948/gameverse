import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const accountStatus = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const r = await context.supabase.from('account_bans').select('reason, expires_at, revoked_at').eq('user_id', context.userId).maybeSingle();
  if (r.error) throw new Error('Unable to check account status');
  return r.data;
});

export const recordGameOpen = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ gameId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const banned = await context.supabase.rpc('is_account_banned', { _user_id: context.userId });
    if (banned.error || banned.data) throw new Error('Account unavailable');
    const game = await context.supabase.from('games').select('id,title').eq('id', data.gameId).single();
    if (game.error) throw new Error('Game unavailable');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const log = await supabaseAdmin.from('security_activity').insert({ user_id: context.userId, kind: 'game', game_id: game.data.id, game_title: game.data.title, ip_address: getRequestHeader('cf-connecting-ip') || null });
    if (log.error) throw new Error('Could not record game opening');
    const play = await context.supabase.rpc('record_play', { _game: data.gameId });
    if (play.error) throw new Error('Could not record play history');
    return { ok: true };
  });

export const registerAccount = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ email: z.string().email(), password: z.string().min(6).max(72), username: z.string().trim().min(1).max(40), origin: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Registration unavailable');
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization'); h.set('apikey', key); return fetch(input, { ...init, headers: h }); } } });
    const { data: result, error } = await client.auth.signUp({ email: data.email, password: data.password, options: { data: { username: data.username } } });
    if (error) throw new Error(error.message);
    // Fake duplicate-signup responses have no identities: never log those as registrations.
    if (result.user?.identities?.length) {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const r = await supabaseAdmin.from('security_activity').insert({ user_id: result.user.id, kind: 'register', ip_address: getRequestHeader('cf-connecting-ip') || null });
      if (r.error) console.error('Registration activity could not be saved');
    }
    return { session: result.session ? { access_token: result.session.access_token, refresh_token: result.session.refresh_token } : null };
  });