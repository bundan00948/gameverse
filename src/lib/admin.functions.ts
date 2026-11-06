import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

type Ctx = { supabase: { rpc: (fn: 'has_role', args: { _user_id: string; _role: 'admin' }) => PromiseLike<{ data: boolean | null }> }; userId: string };
async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!data) throw new Error('Staff only');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

export const listUsers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map(u => u.id);
    const [profiles, wallets, roles] = await Promise.all([
      admin.from('profiles').select('id, username, display_name').in('id', ids),
      admin.from('wallets').select('user_id, tokens').in('user_id', ids),
      admin.from('user_roles').select('user_id, role').eq('role', 'admin'),
    ]);
    return data.users.map(u => ({
      id: u.id, email: u.email ?? '', created: u.created_at,
      username: profiles.data?.find(p => p.id === u.id)?.username ?? '',
      displayName: profiles.data?.find(p => p.id === u.id)?.display_name ?? '',
      tokens: wallets.data?.find(w => w.user_id === u.id)?.tokens ?? 0,
      admin: !!roles.data?.some(r => r.user_id === u.id),
    }));
  });

export const updateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(), username: z.string().trim().max(30), displayName: z.string().trim().max(50),
    tokens: z.number().int().min(0).max(1_000_000), password: z.string().min(6).max(72).optional(), admin: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    if (data.id === (context as unknown as Ctx).userId && !data.admin) throw new Error("You can't remove your own staff access");
    const auth = await admin.auth.admin.updateUserById(data.id, { ...(data.password ? { password: data.password } : {}), user_metadata: { username: data.username } });
    if (auth.error) throw new Error(auth.error.message);
    await admin.from('profiles').update({ username: data.username, display_name: data.displayName }).eq('id', data.id);
    await admin.from('wallets').upsert({ user_id: data.id, tokens: data.tokens });
    if (data.admin) await admin.from('user_roles').upsert({ user_id: data.id, role: 'admin' }, { onConflict: 'user_id,role' });
    else await admin.from('user_roles').delete().eq('user_id', data.id).eq('role', 'admin');
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context as unknown as Ctx);
    if (data.id === (context as unknown as Ctx).userId) throw new Error("You can't delete yourself");
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
