export interface CatalogBlook { id: string; name: string; pack_id: string | null; }
export function alphabeticalBlooks<T extends CatalogBlook>(blooks: T[]): T[] {
  return [...blooks].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id));
}
export const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'chroma', 'mythical', 'hidden'] as const;
export function raritySortedBlooks<T extends { id: string; name: string; rarity?: string }>(blooks: T[]): T[] {
  const rank = (rarity?: string) => { const index = rarityOrder.findIndex(r => r === rarity); return index < 0 ? rarityOrder.length : index; };
  return [...blooks].sort((a, b) => rank(a.rarity) - rank(b.rarity) || a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id));
}
export function dropChanceLabel(weight: number, total: number): string {
  const sum = total > 0 ? total : 1;
  return `${((weight / sum) * 100).toFixed(3)}%`;
}
export function validDropWeight(weight: number): boolean {
  return Number.isFinite(weight) && weight > 0;
}
export function groupCollection<T extends CatalogBlook, P extends { id: string; name: string; image_url: string | null }>(packs: P[], blooks: T[], owned: Map<string, number>) {
  const items = alphabeticalBlooks(blooks).map(b => ({ ...b, owned: owned.get(b.id) ?? 0 }));
  return [
    ...packs.map(p => ({ ...p, blooks: raritySortedBlooks(items.filter(b => b.pack_id === p.id)) })),
    { id: 'unassigned', name: 'Unassigned', image_url: null, gradient_start: null, gradient_end: null, pattern_image_url: null, open_image_url: null, blooks: items.filter(b => !b.pack_id || !packs.some(p => p.id === b.pack_id)) },
  ].filter(p => p.blooks.length > 0);
}export const rarityWorth: Record<string, number> = { common: 2, uncommon: 5, rare: 20, epic: 75, legendary: 200, chroma: 500, mythical: 1000, hidden: 5000 };
export function worthLabel(rarity: string | undefined): string {
  const v = rarityWorth[(rarity ?? '').toLowerCase()];
  return v === undefined ? '—' : `${v.toLocaleString('en-US')} Tokens`;
}
