import { describe, expect, it } from 'vitest';
import { rarityColors, safeColor, rarityPaint, rarityEndpoints, rarityBadgeImages } from '@/features/dashboard/appearance';

describe('saved Market appearance', () => {
  it('keeps admin-selected rarity badge artwork and allows removing it', () => {
    expect(rarityBadgeImages({ common: 'https://example.com/badge.png', rare: null })).toMatchObject({ common: 'https://example.com/badge.png', rare: null });
  });
  it('rejects unsafe badge image URLs', () => {
    expect(rarityBadgeImages({ common: 'javascript:alert(1)', rare: 'http://example.com/badge.png' })).toMatchObject({ common: null, rare: null });
  });
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