import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rarityColors } from './appearance';
import { groupCollection } from './blook-catalog';

async function uid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in again.');
  return data.user.id;
}
function ok<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export const gamesOptions = () => queryOptions({ queryKey: ['games'], staleTime: 60_000, queryFn: async () => ok(await supabase.from('games').select('id, title, description, image_url, play_url').order('title')) });

export const walletOptions = () => queryOptions({ queryKey: ['wallet'], queryFn: async () => ok(await supabase.rpc('ensure_wallet')) });

export const statsOptions = () => queryOptions({ queryKey: ['stats'], queryFn: async () => {
  const id = await uid();
  const [wallet, blooks, plays, msgs] = await Promise.all([
    supabase.rpc('ensure_wallet'),
    supabase.from('user_blooks').select('quantity').eq('user_id', id),
    supabase.from('game_plays').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('user_id', id),
  ]);
  const w = ok(wallet);
  return { tokens: w.tokens, packsOpened: w.packs_opened, blooks: ok(blooks).length, plays: plays.count ?? 0, messages: msgs.count ?? 0 };
} });

export const historyOptions = () => queryOptions({ queryKey: ['history'], queryFn: async () => {
  const id = await uid();
  return ok(await supabase.from('game_plays').select('id, played_at, games(title, emoji)').eq('user_id', id).order('played_at', { ascending: false }).limit(50));
} });

export const shopOptions = () => queryOptions({ queryKey: ['shop'], staleTime: 60_000, queryFn: async () => ok(await supabase.from('packs').select('id, name, image_url, gradient_start, gradient_end, open_image_url, pattern_image_url, price, blooks(id, name, image_url, rarity, weight)').order('sort')) });

export const appearanceOptions = () => queryOptions({ queryKey: ['market-appearance'], queryFn: async () => {
  const r = await supabase.from('market_settings').select('colors').eq('id', 'rarity').maybeSingle();
  if (r.error) throw r.error;
  return rarityColors(r.data?.colors);
} });

export const inventoryOptions = () => queryOptions({ queryKey: ['inventory'], queryFn: async () => {
  const id = await uid();
  return ok(await supabase.from('user_blooks').select('quantity, blooks(id, name, emoji, image_url, rarity, packs(name))').eq('user_id', id));
} });

export const collectionOptions = () => queryOptions({ queryKey: ['collection'], queryFn: async () => {
  const id = await uid();
  const [packs, blooks, mine] = await Promise.all([
    supabase.from('packs').select('id, name, image_url').order('sort'),
    supabase.from('blooks').select('id, name, pack_id, emoji, image_url, rarity, weight'),
    supabase.from('user_blooks').select('blook_id, quantity').eq('user_id', id),
  ]);
  const own = new Map(ok(mine).map(m => [m.blook_id, m.quantity]));
  return groupCollection(ok(packs), ok(blooks), own);
} });

export const isAdminOptions = () => queryOptions({ queryKey: ['is-admin'], staleTime: 300_000, queryFn: async () => {
  const id = await uid();
  return ok(await supabase.rpc('has_role', { _user_id: id, _role: 'admin' })) === true;
} });

export const missionsOptions = () => queryOptions({ queryKey: ['missions'], queryFn: async () => {
  const id = await uid();
  const [missions, claims] = await Promise.all([
    supabase.from('missions').select('id, title, kind, goal, reward').order('goal'),
    supabase.from('mission_claims').select('mission_id').eq('user_id', id),
  ]);
  const claimed = new Set(ok(claims).map(c => c.mission_id));
  const list = ok(missions);
  const kinds = [...new Set(list.map(m => m.kind))];
  const progress = Object.fromEntries(await Promise.all(kinds.map(async k => [k, ok(await supabase.rpc('mission_progress', { _kind: k }))] as const)));
  return list.map(m => ({ ...m, progress: Math.min(progress[m.kind] ?? 0, m.goal), claimed: claimed.has(m.id) }));
} });

export const chatOptions = () => queryOptions({ queryKey: ['chat'], refetchInterval: 4000, queryFn: async () => {
  const rows = ok(await supabase.from('chat_messages').select('id, username, body, created_at, user_id, reply_to').order('created_at', { ascending: false }).limit(60));
  return rows.reverse();
} });

export const rarityClass: Record<string, string> = {
  common: 'text-muted-foreground', uncommon: 'text-tile-c', rare: 'text-tile-b', legendary: 'text-tile-d',
};
