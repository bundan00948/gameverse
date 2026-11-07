import type { QueryClient } from '@tanstack/react-query';

export interface PlayerProfileName { username?: string; displayName?: string }
/** Saved names override historical message names and auth metadata. */
export function playerName(profile: PlayerProfileName | undefined, fallback = 'Player'): string {
  return profile?.displayName?.trim() || profile?.username?.trim() || fallback || 'Player';
}
export function statsSearch(search: Record<string, unknown>): { player?: string } {
  const player = search['player'];
  return typeof player === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(player) ? { player } : {};
}
export function invalidatePlayerProfiles(cache: QueryClient) {
  for (const key of ['identities', 'player-profile', 'stats', 'wallet', 'admin-users']) void cache.invalidateQueries({ queryKey: [key] });
  window.localStorage.setItem('gameverse-profile-updated', String(Date.now()));
}