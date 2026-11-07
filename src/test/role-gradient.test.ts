import { describe, expect, it } from 'vitest';
import { roleGradient } from '@/features/dashboard/roles';

describe('role colors', () => {
  it('uses a single color as a solid color', () => expect(roleGradient(['#ff0000'])).toBe('#ff0000'));
  it('turns several colors into a gradient', () => expect(roleGradient(['#ff0000', '#00ff00', '#0000ff'])).toBe('linear-gradient(90deg, #ff0000 6.7%, #ff0000 26.7%, #00ff00 40.0%, #00ff00 60.0%, #0000ff 73.3%, #0000ff 93.3%)'));
  it('drops unsafe values', () => expect(roleGradient(['red;}', '#abcdef'])).toBe('#abcdef'));
  it('returns nothing without valid colors', () => expect(roleGradient([])).toBeNull());
});
