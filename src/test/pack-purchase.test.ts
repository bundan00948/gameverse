import { describe, expect, it } from 'vitest';
import { purchaseTotal, validQuantity } from '@/features/dashboard/purchase';
describe('pack purchase quantity', () => {
  it('charges the pack price for each selected pack', () => {
    expect(purchaseTotal(25, 3)).toBe(75);
  });
  it('requires positive whole quantities', () => {
    expect(validQuantity(1)).toBe(true);
    expect(validQuantity(0)).toBe(false);
    expect(validQuantity(1.5)).toBe(false);
  });
});