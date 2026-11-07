import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const permissionList = [
  { key: 'users', label: 'Manage players' },
  { key: 'shop', label: 'Market & packs' },
  { key: 'blooks', label: 'Blooks' },
  { key: 'games', label: 'Games' },
  { key: 'missions', label: 'Missions' },
  { key: 'chat', label: 'Delete chat messages' },
  { key: 'roles', label: 'Roles' },
  { key: 'badges', label: 'Badges' },
] as const;
export type Permission = (typeof permissionList)[number]['key'];

const hex = /^#[0-9a-f]{6}$/i;
/** Builds a safe CSS paint for a role color list: one color stays solid, several become a gradient. */
export function roleGradient(colors: readonly string[] | null | undefined): string | null {
  const safe = (colors ?? []).filter(c => hex.test(c)).slice(0, 5);
  if (safe.length === 0) return null;
  if (safe.length === 1) return safe[0]!;
  // Each color gets its own solid band with a short blend, so later colors stay clearly visible.
  const band = 100 / safe.length; const blend = band * 0.2;
  const stops = safe.map((c, i) => `${c} ${Math.max(0, i * band + blend).toFixed(1)}%, ${c} ${Math.min(100, (i + 1) * band - blend).toFixed(1)}%`);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export const permissionsOptions = () => queryOptions({ queryKey: ['my-permissions'], staleTime: 300_000, queryFn: async () => {
  const r = await supabase.rpc('my_permissions');
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []) as Permission[];
} });

export type Identity = { role: { name: string; colors: string[] } | null; badges: { id: string; name: string; image_url: string | null }[] };
/** Top role (lowest sort) and badges for every player who has any. */
export const identitiesOptions = () => queryOptions({ queryKey: ['identities'], staleTime: 30_000, queryFn: async () => {
  const [roles, badges] = await Promise.all([
    supabase.from('user_staff_roles').select('user_id, staff_roles(name, colors, sort)'),
    supabase.from('user_badges').select('user_id, badges(id, name, image_url, sort)'),
  ]);
  if (roles.error) throw new Error(roles.error.message);
  if (badges.error) throw new Error(badges.error.message);
  const map = new Map<string, Identity & { sort: number }>();
  const get = (id: string) => { let v = map.get(id); if (!v) { v = { role: null, badges: [], sort: Infinity }; map.set(id, v); } return v; };
  for (const r of roles.data) { const role = r.staff_roles; if (!role) continue; const v = get(r.user_id); if (role.sort < v.sort) { v.sort = role.sort; v.role = { name: role.name, colors: role.colors }; } }
  for (const b of badges.data) if (b.badges) get(b.user_id).badges.push(b.badges);
  for (const v of map.values()) v.badges.sort((a, b) => a.name.localeCompare(b.name));
  return map as Map<string, Identity>;
} });

export const notificationsOptions = () => queryOptions({ queryKey: ['notifications'], refetchInterval: 15_000, queryFn: async () => {
  const r = await supabase.from('notifications').select('id, actor_name, body, message_id, read, created_at').order('created_at', { ascending: false }).limit(30);
  if (r.error) throw new Error(r.error.message);
  return r.data;
} });
