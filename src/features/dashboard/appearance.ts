export const rarityDefaults: Record<string, string> = {
  common: '#a39890, #6f645d', uncommon: '#6fd877, #2f9137', rare: '#5cb8f5, #1f6fc0',
  epic: '#c56be6, #7a2aa3', legendary: '#ffc44d, #e07a12', chroma: '#ff6f8f, #c41f4a',
  mythical: '#4ef0d0, #1b8f9e', hidden: '#3a3a4a, #0d0d14',
};
export function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
export function rarityColors(value: unknown): Record<string, string> {
  const colors = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(rarityDefaults).map(([key, fallback]) => [key, rarityColorValue(colors[key], fallback)]));
}
/** Saved rarity values are one to nine comma-separated hex colors, never arbitrary CSS. */
export function rarityColorValue(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const parts = value.split(',').map(c => c.trim());
  return parts.length <= 9 && parts.every(c => /^#[0-9a-f]{6}$/i.test(c)) ? parts.join(', ') : fallback;
}
/** Every rarity paints as a gradient; a single saved color becomes a light-to-dark blend. */
export function rarityPaint(value: unknown, fallback: string): string {
  const colors = rarityColorValue(value, fallback).split(', ');
  if (colors.length > 1) return `linear-gradient(90deg in oklab, ${colors.join(', ')})`;
  const c = colors[0] ?? fallback;
  return `linear-gradient(180deg in oklab, color-mix(in oklab, ${c}, white 25%), color-mix(in oklab, ${c}, black 25%))`;
}
export function rarityEndpoints(value: unknown, fallback: string): [string, string] {
  const colors = rarityColorValue(value, fallback).split(', ');
  return [colors[0] ?? fallback, colors.at(-1) ?? fallback];
}
/** Only HTTPS image URLs from saved rarity settings reach image elements. */
export function rarityBadgeImages(value: unknown): Record<string, string | null> {
  const images = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.keys(rarityDefaults).map(key => {
    const image = images[key];
    try { return [key, typeof image === 'string' && new URL(image).protocol === 'https:' ? image : null]; }
    catch { return [key, null]; }
  }));
}