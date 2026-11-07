import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { alphabeticalBlooks, groupCollection } from '@/features/dashboard/blook-catalog';

describe('Independent blooks', () => {
  it('orders the complete admin catalog alphabetically', () => {
    expect(alphabeticalBlooks([{ id: '1', name: 'Zebra', pack_id: null }, { id: '2', name: 'apple', pack_id: 'p' }, { id: '3', name: 'Bear', pack_id: null }]).map(b => b.name)).toEqual(['apple', 'Bear', 'Zebra']);
  });
  it('retains unassigned blooks and owned copies in inventory after pack deletion', () => {
    expect(groupCollection([], [{ id: 'b', name: 'Bear', pack_id: null }], new Map([['b', 3]]))).toEqual([{ id: 'unassigned', name: 'Unassigned', image_url: null, blooks: [{ id: 'b', name: 'Bear', pack_id: null, owned: 3 }] }]);
  });
  it('uses a nullable assignment and SET NULL rather than cascading pack deletion', () => {
    const sql = readFileSync('drizzle/migrations/0009_independent_blooks.sql', 'utf8');
    expect(sql).toContain('ALTER COLUMN pack_id DROP NOT NULL');
    expect(sql).toContain('REFERENCES public.packs(id) ON DELETE SET NULL');
    expect(sql).not.toContain('ON DELETE CASCADE');
  });
});