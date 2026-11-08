export const rarityDefaults: Record<string, string> = {
  common: '#8d817a', uncommon: '#4bb853', rare: '#329be9',
  epic: '#a44ac9', legendary: '#eea12c', chroma: '#ec4669',
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
export function rarityPaint(value: unknown, fallback: string): string {
  const colors = rarityColorValue(value, fallback).split(', ');
  return colors.length > 1 ? `linear-gradient(90deg in oklab, ${colors.join(', ')})` : colors[0] ?? fallback;
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