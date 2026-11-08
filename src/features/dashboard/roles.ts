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
export const maxRoleColors = 9;
/** Reads "#XXXXXX, #XXXXXX, ..." into a clean list of up to nine colors; anything else is ignored. */
export function parseColorList(text: string): string[] {
  return text.split(',').map(c => c.trim()).filter(c => hex.test(c)).map(c => c.toLowerCase()).slice(0, maxRoleColors);
}
/** One color stays solid; several blend evenly across the name, each color getting an equal share. */
export function roleGradient(colors: readonly string[] | null | undefined): string | null {
  const safe = (colors ?? []).filter(c => hex.test(c)).slice(0, maxRoleColors);
  if (safe.length === 0) return null;
  if (safe.length === 1) return safe[0] ?? null;
  const step = 100 / (safe.length - 1);
  return `linear-gradient(90deg in oklab, ${safe.map((c, i) => `${c} ${(i * step).toFixed(1)}%`).join(', ')})`;
}
/** Inline style that paints text with a role color or gradient. */
export function roleTextStyle(colors: readonly string[] | null | undefined): Record<string, string> | undefined {
  const paint = roleGradient(colors);
  if (!paint) return undefined;
  if (paint.startsWith('#')) return { color: paint };
  return { backgroundImage: paint, color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' };
}

export const permissionsOptions = () => queryOptions({ queryKey: ['my-permissions'], staleTime: 300_000, queryFn: async () => {
  const r = await supabase.rpc('my_permissions');
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []) as Permission[];
} });

export type Identity = { username: string; displayName: string; role: { name: string; colors: string[] } | null; badges: { id: string; name: string; image_url: string | null }[]; avatar: string | null; bannerId?: string | null; bannerImage?: string | null };
/** Top role (lowest sort) and badges for every player who has any. */
export const identitiesOptions = () => queryOptions({ queryKey: ['identities'], staleTime: 15_000, refetchInterval: 15_000, queryFn: async () => {
  const [roles, badges, avatars, banners] = await Promise.all([
    supabase.from('user_staff_roles').select('user_id, staff_roles(name, colors, sort)'),
    supabase.from('user_badges').select('user_id, badges(id, name, image_url, sort)'),
    supabase.rpc('player_directory'),
    supabase.rpc('player_banner_directory'),
  ]);
  if (roles.error) throw new Error(roles.error.message);
  if (badges.error) throw new Error(badges.error.message);
  if (avatars.error) throw new Error(avatars.error.message);
  if (banners.error) throw new Error(banners.error.message);
  const map = new Map<string, Identity & { sort: number }>();
  const get = (id: string) => { let v = map.get(id); if (!v) { v = { username: '', displayName: '', role: null, badges: [], avatar: null, sort: Infinity }; map.set(id, v); } return v; };
  for (const r of roles.data) { const role = r.staff_roles; if (!role) continue; const v = get(r.user_id); if (role.sort < v.sort) { v.sort = role.sort; v.role = { name: role.name, colors: role.colors }; } }
  for (const b of badges.data) if (b.badges) get(b.user_id).badges.push(b.badges);
  for (const a of avatars.data ?? []) Object.assign(get(a.user_id), { avatar: a.image_url, username: a.username, displayName: a.display_name });
  for (const b of banners.data ?? []) Object.assign(get(b.user_id), { bannerId: b.banner_id, bannerImage: b.image_url });
  for (const v of map.values()) v.badges.sort((a, b) => a.name.localeCompare(b.name));
  return map as Map<string, Identity>;
} });

export const notificationsOptions = () => queryOptions({ queryKey: ['notifications'], staleTime: 15_000, refetchInterval: 15_000, queryFn: async () => {
  const r = await supabase.from('notifications').select('id, actor_name, body, message_id, read, created_at').order('created_at', { ascending: false }).limit(30);
  if (r.error) throw new Error(r.error.message);
  return r.data;
} });
