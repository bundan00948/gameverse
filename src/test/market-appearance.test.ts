import { describe, expect, it } from 'vitest';
import { rarityColors, safeColor, rarityPaint, rarityEndpoints } from '@/features/dashboard/appearance';

describe('saved Market appearance', () => {
  it('supports saved comma-separated rarity gradients and both celebration endpoints', () => {
    const value = rarityColors({ rare: '#123456, #abcdef' })['rare'];
    expect(value).toBe('#123456, #abcdef');
    expect(rarityPaint(value, '#000000')).toBe('linear-gradient(90deg in oklab, #123456, #abcdef)');
    expect(rarityEndpoints(value, '#000000')).toEqual(['#123456', '#abcdef']);
  });
  it('rejects arbitrary CSS and oversized rarity color lists', () => {
    expect(rarityPaint('url(https://example.com)', '#123456')).toBe('#123456');
    expect(rarityPaint(Array(10).fill('#ffffff').join(', '), '#123456')).toBe('#123456');
  });
  it('uses an administrator-selected rarity color', () => {
    expect(rarityColors({ rare: '#123456' })['rare']).toBe('#123456');
  });
  it('rejects non-color values', () => {
    expect(safeColor('url(https://example.com)', '#123456')).toBe('#123456');
  });
});