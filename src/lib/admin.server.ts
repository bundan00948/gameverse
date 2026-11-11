import { setResponseHeader } from '@tanstack/react-start/server';

export type Ctx = { supabase: { rpc: (fn: 'has_permission', args: { _user_id: string; _perm: string }) => PromiseLike<{ data: boolean | null }> }; userId: string };

export async function hasPerm(context: Ctx, perm: string) {
  const { data } = await context.supabase.rpc('has_permission', { _user_id: context.userId, _perm: perm });
  return !!data;
}

export async function assertAdmin(context: Ctx, perms: string[] = ['players.view']) {
  setResponseHeader('Cache-Control', 'no-store');
  const banned = await (context.supabase.rpc as unknown as (f: 'is_account_banned', a: { _user_id: string }) => PromiseLike<{ data: boolean | null; error: unknown }>)('is_account_banned', { _user_id: context.userId });
  if (banned.error || banned.data) throw new Error('Account unavailable');
  const checks = await Promise.all(perms.map(p => hasPerm(context, p)));
  if (!checks.some(Boolean)) throw new Error('Staff only');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

type Admin = Awaited<ReturnType<typeof assertAdmin>>;
export async function tierOf(admin: Admin, id: string) {
  const r = await admin.rpc('staff_tier', { _user_id: id });
  if (r.error) throw new Error('Could not check staff tier');
  return Number(r.data);
}

/** Staff may only act on accounts ranked strictly below their own tier. */
export async function assertLowerTier(admin: Admin, callerId: string, targetId: string) {
  const [caller, target] = await Promise.all([tierOf(admin, callerId), tierOf(admin, targetId)]);
  if (!(target > caller)) throw new Error('You can only manage players ranked below you');
}