export const rarityDefaults: Record<string, string> = {
  common: '#8d817a', uncommon: '#4bb853', rare: '#329be9',
  epic: '#a44ac9', legendary: '#eea12c', chroma: '#ec4669',
};
export function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
export function rarityColors(value: unknown): Record<string, string> {
  const colors = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(rarityDefaults).map(([key, fallback]) => [key, safeColor(colors[key], fallback)]));
}