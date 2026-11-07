import { describe, expect, it } from 'vitest';
import { rarityColors, safeColor } from '@/features/dashboard/appearance';

describe('saved Market appearance', () => {
  it('uses an administrator-selected rarity color', () => {
    expect(rarityColors({ rare: '#123456' })['rare']).toBe('#123456');
  });
  it('rejects non-color values', () => {
    expect(safeColor('url(https://example.com)', '#123456')).toBe('#123456');
  });
});