import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rarityColors, rarityBadgeImages } from './appearance';
import { groupCollection, raritySortedBlooks } from './blook-catalog';
import { playerId as uid } from '@/features/account/auth-user';

function ok<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export const gamesOptions = () => queryOptions({ queryKey: ['games'], staleTime: 60_000, queryFn: async () => ok(await supabase.from('games').select('id, title, description, image_url, play_url').order('title')) });

export const walletOptions = () => queryOptions({ queryKey: ['wallet'], staleTime: 30_000, refetchInterval: 30_000, queryFn: async () => ok(await supabase.rpc('ensure_wallet')) });

export const statsOptions = (player?: string) => queryOptions({ queryKey: ['stats', player ?? 'me'], staleTime: 30_000, queryFn: async ({ client }) => ({ ...(await loadStats(client, player)), totalBlooks: (await supabase.from('blooks').select('id', { count: 'exact', head: true })).count ?? 0 }) });

async function loadStats(client: QueryClient, player?: string) {
  if (player) {
    const rows = ok(await supabase.rpc('player_stats', { _player: player }));
    const row = rows[0];
    if (!row) throw new Error('Player not found.');
    return { tokens: row.tokens, packsOpened: row.packs_opened, blooks: row.blooks, plays: row.plays, messages: row.messages };
  }
  const id = await uid();
  const [wallet, blooks, plays, msgs] = await Promise.all([
    client.ensureQueryData(walletOptions()),
    supabase.from('user_blooks').select('quantity').eq('user_id', id),
    supabase.from('game_plays').select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('user_id', id),
  ]);
  const w = wallet;
  return { tokens: w.tokens, packsOpened: w.packs_opened, blooks: ok(blooks).length, plays: plays.count ?? 0, messages: msgs.count ?? 0 };
}

export const historyOptions = () => queryOptions({ queryKey: ['history'], staleTime: 30_000, queryFn: async () => {
  const id = await uid();
  return ok(await supabase.from('game_plays').select('id, played_at, games(title, emoji)').eq('user_id', id).order('played_at', { ascending: false }).limit(50));
} });

export const shopOptions = () => queryOptions({ queryKey: ['shop'], staleTime: 60_000, queryFn: async () => ok(await supabase.from('packs').select('id, name, image_url, gradient_start, gradient_end, open_image_url, pattern_image_url, price, blooks(id, name, image_url, rarity, weight)').order('sort')).map(pack => ({ ...pack, blooks: raritySortedBlooks(pack.blooks) })) });

export const appearanceOptions = () => queryOptions({ queryKey: ['market-appearance'], staleTime: 30_000, queryFn: async () => {
  const r = await supabase.from('market_settings').select('colors').eq('id', 'rarity').maybeSingle();
  if (r.error) throw r.error;
  return rarityColors(r.data?.colors);
} });
export const rarityBadgesOptions = () => queryOptions({ queryKey: ['rarity-badges'], staleTime: 30_000, queryFn: async () => {
  const r = await supabase.from('market_settings').select('badge_images').eq('id', 'rarity').maybeSingle();
  if (r.error) throw r.error;
  return rarityBadgeImages(r.data?.badge_images);
} });

export const inventoryOptions = () => queryOptions({ queryKey: ['inventory'], staleTime: 30_000, queryFn: async () => {
  const id = await uid();
  return ok(await supabase.from('user_blooks').select('quantity, blooks(id, name, emoji, image_url, rarity, packs(name))').eq('user_id', id));
} });

export const collectionOptions = () => queryOptions({ queryKey: ['collection'], staleTime: 30_000, queryFn: async () => {
  const id = await uid();
  const [packs, blooks, mine] = await Promise.all([
    supabase.from('packs').select('id, name, image_url, gradient_start, gradient_end, pattern_image_url, open_image_url').order('sort'),
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

export const missionsOptions = () => queryOptions({ queryKey: ['missions'], staleTime: 30_000, queryFn: async () => {
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
