import { describe, expect, it } from 'vitest';
import { activeBan, loginDurations, requiredPlayerPermissions, validLoginHours } from '@/lib/account-safety';

describe('Account safety rules', () => {
  it.each([24,48,72,168,720])('accepts the requested %i-hour login duration', hours => {
    expect(validLoginHours(hours)).toBe(true);
  });
  it('rejects durations outside the five choices', () => {
    expect(loginDurations).toHaveLength(5);
    expect(validLoginHours(25)).toBe(false);
    expect(validLoginHours(0)).toBe(false);
  });
  it('requires separate profile-edit permission', () => { expect(requiredPlayerPermissions({ username: 'Player' })).toEqual(['players.profile']); });
  it('requires separate token permission', () => { expect(requiredPlayerPermissions({ tokens: 10 })).toEqual(['players.tokens']); });
  it('requires separate password-reset permission', () => { expect(requiredPlayerPermissions({ password: 'temporary' })).toEqual(['players.password_reset']); });
  it('requires every permission when combining changes', () => { expect(requiredPlayerPermissions({ displayName: 'Player', tokens: 10, password: 'temporary' })).toEqual(['players.profile','players.tokens','players.password_reset']); });
  it('enforces permanent bans until revoked', () => {
    expect(activeBan({ revoked_at: null, expires_at: null })).toBe(true);
    expect(activeBan({ revoked_at: '2026-11-11T10:00:00Z', expires_at: null })).toBe(false);
  });
  it('enforces temporary bans only before expiry', () => {
    const ban = { revoked_at: null, expires_at: '2026-11-12T10:00:00Z' };
    expect(activeBan(ban, Date.parse('2026-11-11T10:00:00Z'))).toBe(true);
    expect(activeBan(ban, Date.parse(ban.expires_at))).toBe(false);
  });
});