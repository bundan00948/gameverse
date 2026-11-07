import { describe, expect, it } from 'vitest';
import { parseColorList, roleGradient } from '@/features/dashboard/roles';

describe('role colors', () => {
  it('uses a single color as a solid color', () => expect(roleGradient(['#ff0000'])).toBe('#ff0000'));
  it('blends colors evenly by how many there are', () => expect(roleGradient(['#ff0000', '#00ff00', '#0000ff'])).toBe('linear-gradient(90deg in oklab, #ff0000 0.0%, #00ff00 50.0%, #0000ff 100.0%)'));
  it('drops unsafe values', () => expect(roleGradient(['red;}', '#abcdef'])).toBe('#abcdef'));
  it('returns nothing without valid colors', () => expect(roleGradient([])).toBeNull());
  it('reads comma separated #XXXXXX colors', () => expect(parseColorList('#FF0000, #00ff00,bad, #0000ff')).toEqual(['#ff0000', '#00ff00', '#0000ff']));
  it('caps at nine colors', () => expect(parseColorList(Array(12).fill('#123456').join(', '))).toHaveLength(9));
});
