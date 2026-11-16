import { setResponseHeader } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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
  // A new client per request attributes privileged writes without shared mutable headers.
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) throw new Error('Admin service unavailable');
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-gv-audit-actor': context.userId }, fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  // Auth-admin endpoints retain the generated client's compatible authentication.
  return Object.assign(client, { auth: supabaseAdmin.auth });
}

export async function recordAdminEvent(admin: Admin, actor: string, action: string, target: string, details: Record<string, string | boolean> = {}) {
  const profiles = await admin.from('profiles').select('id,username').in('id', [actor, target]);
  if (profiles.error) throw new Error('Could not prepare activity record');
  const r = await admin.from('admin_audit_log').insert({ actor_id: actor, actor_name: profiles.data.find(p => p.id === actor)?.username ?? 'Staff', target_user_id: target, target_name: profiles.data.find(p => p.id === target)?.username ?? target, action, resource: 'accounts', resource_id: target, details });
  if (r.error) throw new Error('Could not record admin action');
}

type Admin = Awaited<ReturnType<typeof assertAdmin>>;
export async function tierOf(admin: Admin, id: string) {
  const r = await admin.rpc('staff_tier', { _user_id: id });
  if (r.error) throw new Error('Could not check staff tier');
  return Number(r.data);
}

/** Staff may only act on accounts ranked strictly below their own tier. */
export async function assertLowerTier(admin: Admin, callerId: string, targetId: string) {
  const owner = await admin.rpc('is_site_owner', { _user_id: callerId });
  if (owner.data === true) return;
  const [caller, target] = await Promise.all([tierOf(admin, callerId), tierOf(admin, targetId)]);
  if (!(target > caller)) throw new Error('You can only manage players ranked below you');
}