export const THEME_STORAGE_KEY = 'gameverse-theme';
export type Theme = 'dark' | 'bright';
export function normalizeTheme(value: string | null): Theme { return value === 'bright' ? 'bright' : 'dark'; }
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('bright', theme === 'bright');
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Theme still works without storage. */ }
  window.dispatchEvent(new Event('gameverse-theme-change'));
}
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="bright")document.documentElement.classList.add("bright")}catch(e){}`;