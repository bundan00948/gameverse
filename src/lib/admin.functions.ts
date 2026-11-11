import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { requiredPlayerPermissions, sortByAuthority } from './account-safety';
import type { Ctx } from './admin.server';

export const listUsers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, tierOf } = await import('./admin.server');
    const admin = await assertAdmin(context as unknown as Ctx, ['players.view', 'players.profile', 'players.tokens', 'players.password_reset', 'players.delete', 'players.ban', 'roles', 'badges']);
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map(u => u.id);
    const [profiles, wallets, roles, owners, staff] = await Promise.all([
      admin.from('profiles').select('id, username, display_name').in('id', ids),
      admin.from('wallets').select('user_id, tokens').in('user_id', ids),
      admin.from('user_roles').select('user_id, role').eq('role', 'admin'),
      admin.from('site_owners').select('user_id'),
      admin.from('user_staff_roles').select('user_id, staff_roles(name, sort, permissions, colors)'),
    ]);
    const callerTier = await tierOf(admin, context.userId);
    const rows = data.users.map(u => {
      const owner = !!owners.data?.some(o => o.user_id === u.id);
      const isAdmin = !!roles.data?.some(r => r.user_id === u.id);
      const staffRoles = (staff.data ?? []).filter(r => r.user_id === u.id).flatMap(r => r.staff_roles ? [r.staff_roles] : []).sort((a, b) => a.sort - b.sort);
      const tier = owner ? -2 : isAdmin ? -1 : staffRoles[0]?.sort ?? 1e9;
      const effects = owner ? ['Owner: every permission'] : isAdmin ? ['Full admin: every permission except IP visibility unless granted'] : [...new Set(staffRoles.flatMap(r => r.permissions))];
      return {
        id: u.id, email: u.email ?? '', created: u.created_at, tier, owner,
        roles: [...(owner ? [{ name: 'Owner', colors: [] as string[] }] : []), ...(isAdmin ? [{ name: 'Full admin', colors: [] as string[] }] : []), ...staffRoles.map(r => ({ name: r.name, colors: r.colors }))],
        effects,
        username: profiles.data?.find(p => p.id === u.id)?.username ?? '',
        displayName: profiles.data?.find(p => p.id === u.id)?.display_name ?? '',
        tokens: wallets.data?.find(w => w.user_id === u.id)?.tokens ?? 0,
        admin: isAdmin,
      };
    });
    const callerIsOwner = !!owners.data?.some(o => o.user_id === context.userId);
    return sortByAuthority(callerIsOwner ? rows : rows.filter(r => r.tier > callerTier));
  });

export const updateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(), username: z.string().trim().max(30).optional(), displayName: z.string().trim().max(50).optional(),
    tokens: z.number().int().min(0).max(1_000_000).optional(), password: z.string().min(6).max(72).optional(), admin: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, hasPerm, assertLowerTier } = await import('./admin.server');
    const ctx = context as unknown as Ctx;
    for (const permission of requiredPlayerPermissions(data)) if (!await hasPerm(ctx, permission)) throw new Error('Permission denied');
    const admin = await assertAdmin(ctx, ['players.view', ...requiredPlayerPermissions(data)]);
    const full = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (data.admin !== undefined && (full.error || !full.data)) throw new Error('Only full admins can change full admin access');
    if (data.id === context.userId && data.admin === false) throw new Error("You can't remove your own staff access");
    await assertLowerTier(admin, context.userId, data.id);
    const owner = await admin.rpc('is_site_owner', { _user_id: data.id });
    const callerOwner = await context.supabase.rpc('is_site_owner', { _user_id: context.userId });
    if (owner.error || callerOwner.error || (owner.data && !callerOwner.data)) throw new Error('Only the Owner can change this account');
    if (data.password !== undefined || data.username !== undefined) {
      const r = await admin.auth.admin.updateUserById(data.id, { ...(data.password ? { password: data.password } : {}), ...(data.username !== undefined ? { user_metadata: { username: data.username } } : {}) });
      if (r.error) throw new Error(/weak|pwned|leak|breach|known/i.test(r.error.message) ? 'That password is too common or has appeared in a data leak — choose a stronger one.' : `Could not update account: ${r.error.message}`);
    }
    if (data.username !== undefined || data.displayName !== undefined) {
      const r = await admin.from('profiles').update({ ...(data.username !== undefined ? { username: data.username } : {}), ...(data.displayName !== undefined ? { display_name: data.displayName } : {}) }).eq('id', data.id);
      if (r.error) throw new Error('Could not save profile');
    }
    if (data.tokens !== undefined) { const r = await admin.from('wallets').upsert({ user_id: data.id, tokens: data.tokens }); if (r.error) throw new Error('Could not save tokens'); }
    if (data.admin !== undefined) {
      const r = data.admin ? await admin.from('user_roles').upsert({ user_id: data.id, role: 'admin' }, { onConflict: 'user_id,role' }) : await admin.from('user_roles').delete().eq('user_id', data.id).eq('role', 'admin');
      if (r.error) throw new Error('Could not save staff access');
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, assertLowerTier } = await import('./admin.server');
    const admin = await assertAdmin(context as unknown as Ctx, ['players.delete']);
    if (data.id === (context as unknown as Ctx).userId) throw new Error("You can't delete yourself");
    await assertLowerTier(admin, context.userId, data.id);
    const owner = await admin.rpc('is_site_owner', { _user_id: data.id });
    if (owner.error || owner.data) throw new Error('The Owner account cannot be deleted');
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAccountBan = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), banned: z.boolean(), reason: z.string().trim().max(500), hours: z.number().int().min(1).max(8760).nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, assertLowerTier } = await import('./admin.server');
    const admin = await assertAdmin(context as unknown as Ctx, ['players.ban']);
    const owner = await admin.rpc('is_site_owner', { _user_id: data.id });
    if (owner.error || owner.data || data.id === context.userId) throw new Error('Cannot ban this account');
    await assertLowerTier(admin, context.userId, data.id);
    if (data.banned) {
      const r = await admin.from('account_bans').upsert({ user_id: data.id, actor_id: context.userId, reason: data.reason, banned_at: new Date().toISOString(), revoked_at: null, expires_at: data.hours ? new Date(Date.now() + data.hours * 3600000).toISOString() : null });
      if (r.error) throw new Error('Could not ban account');
      const auth = await admin.auth.admin.updateUserById(data.id, { ban_duration: data.hours ? `${data.hours}h` : '876000h' });
      if (auth.error) throw new Error('Access blocked, but login blocking could not be updated. Retry the ban.');
    } else {
      const auth = await admin.auth.admin.updateUserById(data.id, { ban_duration: 'none' });
      if (auth.error) throw new Error('Could not restore login access');
      const r = await admin.from('account_bans').update({ revoked_at: new Date().toISOString() }).eq('user_id', data.id);
      if (r.error) throw new Error('Could not revoke ban');
    }
    return { ok: true };
  });
export const listAccountBans = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    const { assertAdmin } = await import('./admin.server');
  const admin = await assertAdmin(context as unknown as Ctx, ['players.ban']);
  const r = await admin.from('account_bans').select('user_id, reason, expires_at, revoked_at');
  if (r.error) throw new Error('Could not load bans'); return r.data;
});
export const listGameLog = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ page: z.number().int().min(0).max(10000), kind: z.enum(['all','game','register']) }).parse(d))
  .handler(async ({ context, data }) => {
    const { assertAdmin, hasPerm } = await import('./admin.server');
    const admin = await assertAdmin(context as unknown as Ctx, ['logs.view', 'ips.view']);
    const ips = await hasPerm(context as unknown as Ctx, 'ips.view');
    const base = () => admin.from('security_activity');
    const columns = 'id,user_id,kind,game_title,created_at' as const;
    const q = ips ? base().select('id,user_id,kind,game_title,created_at,ip_address', { count: 'exact' }) : base().select(columns, { count: 'exact' });
    const filtered = data.kind === 'all' ? q : q.eq('kind', data.kind);
    const r = await filtered.order('created_at', { ascending: false }).range(data.page*50, data.page*50+49);
    if (r.error) throw new Error('Could not load activity');
    const profiles = await admin.from('profiles').select('id,username,code_id');
    return { count: r.count ?? 0, ips, rows: (r.data ?? []).map(row => { const p = profiles.data?.find(p => p.id===row.user_id); return { id: row.id, kind: row.kind, title: row.game_title, created: row.created_at, player: p?.username || 'Deleted player', code: p?.code_id ?? null, ip: ips && 'ip_address' in row ? String(row.ip_address ?? '') || null : null }; }) };
  });

export const getUserInventory = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, assertLowerTier } = await import('./admin.server');
    const admin = await assertAdmin(context as unknown as Ctx, ['players.inventory']);
    await assertLowerTier(admin, context.userId, data.id);
    const r = await admin.from('user_blooks').select('blook_id, quantity').eq('user_id', data.id);
    if (r.error) throw new Error('Could not load inventory');
    return r.data;
  });
export const setUserBlook = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), blookId: z.string().uuid(), quantity: z.number().int().min(0).max(100000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, assertLowerTier } = await import('./admin.server');
    const admin = await assertAdmin(context as unknown as Ctx, ['players.inventory']);
    await assertLowerTier(admin, context.userId, data.id);
    const r = data.quantity === 0
      ? await admin.from('user_blooks').delete().eq('user_id', data.id).eq('blook_id', data.blookId)
      : await admin.from('user_blooks').upsert({ user_id: data.id, blook_id: data.blookId, quantity: data.quantity }, { onConflict: 'user_id,blook_id' });
    if (r.error) throw new Error('Could not save inventory');
    return { ok: true };
  });
