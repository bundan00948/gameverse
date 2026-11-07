import { describe, it, expect } from 'vitest';
import { applyTheme, normalizeTheme, THEME_STORAGE_KEY } from '../lib/theme';
describe('GameVerse appearance', () => {
  it('uses dark as the default', () => { expect(normalizeTheme(null)).toBe('dark'); expect(normalizeTheme('unknown')).toBe('dark'); });
  it('remembers Bright mode and can return to dark', () => {
    applyTheme('bright'); expect(document.documentElement.classList.contains('bright')).toBe(true); expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('bright');
    applyTheme('dark'); expect(document.documentElement.classList.contains('bright')).toBe(false); expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});