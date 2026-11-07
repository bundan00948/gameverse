import { describe, expect, it } from 'vitest';
import { playerName, statsSearch } from '@/features/dashboard/player-profile';

describe('synchronized player profiles', () => {
  it('uses the saved display name instead of an old chat username', () => {
    expect(playerName({ username: 'Brendan', displayName: 'New Name' }, 'Old Name')).toBe('New Name');
  });
  it('uses the saved username when no display name is set', () => {
    expect(playerName({ username: 'Brendan', displayName: '' }, 'Old Name')).toBe('Brendan');
  });
  it('accepts an other-player identifier for View Stats', () => {
    const id = '8b44ca91-c56b-4244-8fec-9218cd4b72cf';
    expect(statsSearch({ player: id })).toEqual({ player: id });
  });
  it('rejects malformed player identifiers', () => {
    expect(statsSearch({ player: 'invalid' })).toEqual({});
  });
});