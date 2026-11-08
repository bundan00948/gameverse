import { describe, expect, it } from 'vitest';
import { bannerSchema, bannerPurchaseState, type BannerDraft } from '@/features/dashboard/banners';
const banner: BannerDraft = { name: 'Harvest', image_url: 'https://example.com/harvest.png', rarity: 'uncommon', price: 100, listed: true, sort: 0 };
describe('banner sale and ownership rules', () => {
 it('prevents unlisted purchases', () => expect(bannerPurchaseState({ ...banner, listed: false }, false, 1000)).toBe('unlisted'));
 it('prevents repeat purchases', () => expect(bannerPurchaseState(banner, true, 1000)).toBe('owned'));
 it('keeps owned unlisted banners', () => expect(bannerPurchaseState({ ...banner, listed: false }, true, 0)).toBe('owned'));
 it('requires full token price', () => { expect(bannerPurchaseState(banner, false, 99)).toBe('insufficient'); expect(bannerPurchaseState(banner, false, 100)).toBe('available'); });
 it('requires artwork to list', () => expect(bannerSchema.safeParse({ ...banner, image_url: null }).success).toBe(false));
 it('accepts only supported rarities', () => expect(bannerSchema.safeParse({ ...banner, rarity: 'invalid' }).success).toBe(false));
});
