export interface CatalogBlook { id: string; name: string; pack_id: string | null; }
export function alphabeticalBlooks<T extends CatalogBlook>(blooks: T[]): T[] {
  return [...blooks].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }) || a.id.localeCompare(b.id));
}
export function groupCollection<T extends CatalogBlook, P extends { id: string; name: string; image_url: string | null }>(packs: P[], blooks: T[], owned: Map<string, number>) {
  const items = alphabeticalBlooks(blooks).map(b => ({ ...b, owned: owned.get(b.id) ?? 0 }));
  return [
    ...packs.map(p => ({ ...p, blooks: items.filter(b => b.pack_id === p.id) })),
    { id: 'unassigned', name: 'Unassigned', image_url: null, blooks: items.filter(b => !b.pack_id || !packs.some(p => p.id === b.pack_id)) },
  ].filter(p => p.blooks.length > 0);
}