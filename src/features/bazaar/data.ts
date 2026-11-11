import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const auctionRarities = ['legendary', 'chroma', 'mythical', 'hidden'] as const;
export const auctionHours = [1, 6, 12, 24, 48] as const;
/** Auctions are only allowed for Legendary or rarer blooks. */
export const canAuction = (rarity: string) => (auctionRarities as readonly string[]).includes(rarity);
/** Next acceptable bid: the starting price, or the current bid plus 5% (at least 1). */
export const minimumBid = (price: number, current: number | null) => current == null ? price : current + Math.max(1, Math.ceil(current * 0.05));

export interface Listing { id: string; seller_id: string; kind: 'sale' | 'auction'; price: number; current_bid: number | null; bidder_id: string | null; ends_at: string | null; created_at: string; blook: { id: string; name: string; image_url: string | null; rarity: string; pack_id: string | null } }

export const bazaarOptions = () => queryOptions({ queryKey: ['bazaar'], staleTime: 10_000, refetchInterval: 20_000, refetchIntervalInBackground: false, queryFn: async (): Promise<Listing[]> => {
  await supabase.rpc('settle_auctions');
  const r = await supabase.from('bazaar_listings').select('id, seller_id, kind, price, current_bid, bidder_id, ends_at, created_at, blook:blooks(id, name, image_url, rarity, pack_id)').eq('status', 'active').order('created_at', { ascending: false }).limit(500);
  if (r.error) throw r.error;
  return r.data as unknown as Listing[];
} });

export const bazaarCatalogOptions = () => queryOptions({ queryKey: ['bazaar-catalog'], staleTime: 60_000, queryFn: async () => {
  const [packs, blooks] = await Promise.all([
    supabase.from('packs').select('id, name, image_url').order('sort'),
    supabase.from('blooks').select('id, name, image_url, rarity, pack_id').order('name'),
  ]);
  if (packs.error) throw packs.error; if (blooks.error) throw blooks.error;
  return { packs: packs.data, blooks: blooks.data };
} });

export function timeLeft(iso: string | null) {
  if (!iso) return '';
  const s = Math.max(0, (new Date(iso).getTime() - Date.now()) / 1000);
  if (s <= 0) return 'Ending…';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m left` : m ? `${m}m left` : `${Math.ceil(s)}s left`;
}
