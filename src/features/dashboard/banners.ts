import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { playerId } from '@/features/account/auth-user';
export const bannerRarities = ['common','uncommon','rare','epic','legendary','chroma'] as const;
export const bannerSchema = z.object({ name: z.string().trim().min(1).max(80), image_url: z.string().url().nullable(), rarity: z.enum(bannerRarities), price: z.number().int().min(0).max(1_000_000), listed: z.boolean(), sort: z.number().int() }).refine(b => !b.listed || !!b.image_url, { message: 'Upload artwork before listing this banner.' });
export type BannerDraft = z.infer<typeof bannerSchema>;
export interface Banner extends BannerDraft { id: string }
export function bannerPurchaseState(b: BannerDraft, owned: boolean, tokens: number) { return owned ? 'owned' : !b.listed ? 'unlisted' : tokens < b.price ? 'insufficient' : 'available'; }
export const bannersOptions = (admin = false) => queryOptions({ queryKey: ['banners', admin ? 'admin' : 'market'], staleTime: 30_000, queryFn: async () => { let q = supabase.from('banners').select('*').order('sort').order('name'); if (!admin) q = q.eq('listed', true); const r = await q; if (r.error) throw r.error; return r.data; } });
export const ownedBannersOptions = () => queryOptions({ queryKey: ['owned-banners'], staleTime: 30_000, queryFn: async () => { const id = await playerId(); const r = await supabase.from('user_banners').select('banner_id, banners(*)').eq('user_id', id); if (r.error) throw r.error; return r.data.flatMap(row => row.banners ? [row.banners] : []); } });
