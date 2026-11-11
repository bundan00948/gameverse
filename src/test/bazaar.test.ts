import { describe, expect, it } from 'vitest';
import { canAuction, minimumBid } from '@/features/bazaar/data';

describe('bazaar rules', () => {
  it('allows auctions only for Legendary and rarer', () => {
    expect(['common', 'uncommon', 'rare', 'epic'].some(canAuction)).toBe(false);
    expect(['legendary', 'chroma', 'mythical', 'hidden'].every(canAuction)).toBe(true);
  });
  it('first bid must meet the starting price', () => expect(minimumBid(300, null)).toBe(300));
  it('later bids must beat the current bid by 5%', () => expect(minimumBid(300, 400)).toBe(420));
});
