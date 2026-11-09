import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { alphabeticalBlooks, dropChanceLabel, groupCollection, raritySortedBlooks } from '@/features/dashboard/blook-catalog';

describe('Drop chance display', () => {
  it('shows three decimal places', () => {
    expect(dropChanceLabel(1, 8)).toBe('12.500%');
    expect(dropChanceLabel(1, 3)).toBe('33.333%');
    expect(dropChanceLabel(7, 1000)).toBe('0.700%');
  });
  it('never divides by a zero total', () => expect(dropChanceLabel(1, 0)).toBe('100.000%'));
});

describe('Independent blooks', () => {
  it('sorts pack blooks by lowest rarity first then alphabetically, not weight', () => {
    const rows = [{ id: '1', name: 'Apple', rarity: 'chroma', weight: 100 }, { id: '2', name: 'Zebra', rarity: 'common', weight: 1 }, { id: '3', name: 'Bear', rarity: 'common', weight: 2 }, { id: '4', name: 'A', rarity: 'legendary', weight: 4 }, { id: '5', name: 'B', rarity: 'epic', weight: 5 }, { id: '6', name: 'C', rarity: 'rare', weight: 6 }, { id: '7', name: 'D', rarity: 'uncommon', weight: 7 }];
    expect(raritySortedBlooks(rows).map(b => b.id)).toEqual(['3', '2', '7', '6', '5', '4', '1']);
    expect(groupCollection([{ id: 'p', name: 'Pack', image_url: null }], rows.map(b => ({ ...b, pack_id: 'p' })), new Map())[0]?.blooks.map(b => b.id)).toEqual(['3', '2', '7', '6', '5', '4', '1']);
  });
  it('orders the complete admin catalog alphabetically', () => {
    expect(alphabeticalBlooks([{ id: '1', name: 'Zebra', pack_id: null }, { id: '2', name: 'apple', pack_id: 'p' }, { id: '3', name: 'Bear', pack_id: null }]).map(b => b.name)).toEqual(['apple', 'Bear', 'Zebra']);
  });
  it('retains unassigned blooks and owned copies in inventory after pack deletion', () => {
    expect(groupCollection([], [{ id: 'b', name: 'Bear', pack_id: null }], new Map([['b', 3]]))).toMatchObject([{ id: 'unassigned', name: 'Unassigned', image_url: null, blooks: [{ id: 'b', name: 'Bear', pack_id: null, owned: 3 }] }]);
  });
  it('uses a nullable assignment and SET NULL rather than cascading pack deletion', () => {
    const sql = readFileSync('drizzle/migrations/0009_independent_blooks.sql', 'utf8');
    expect(sql).toContain('ALTER COLUMN pack_id DROP NOT NULL');
    expect(sql).toContain('REFERENCES public.packs(id) ON DELETE SET NULL');
    expect(sql).not.toContain('ON DELETE CASCADE');
  });
});