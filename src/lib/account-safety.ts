export const loginDurations = [
  { hours: 24, label: '24 hours' }, { hours: 48, label: '48 hours' },
  { hours: 72, label: '72 hours' }, { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' },
] as const;
export function validLoginHours(hours: number) { return loginDurations.some(d => d.hours === hours); }
export const playerPermissions = ['players.view', 'players.profile', 'players.tokens', 'players.password_reset', 'players.delete', 'players.ban', 'players.inventory'] as const;
export function requiredPlayerPermissions(changes: { username?: string | undefined; displayName?: string | undefined; tokens?: number | undefined; password?: string | undefined; admin?: boolean | undefined }): string[] {
  const permissions: string[] = [];
  if (changes.username !== undefined || changes.displayName !== undefined) permissions.push('players.profile');
  if (changes.tokens !== undefined) permissions.push('players.tokens');
  if (changes.password !== undefined) permissions.push('players.password_reset');
  return permissions;
}
export function activeBan(ban: { revoked_at: string | null; expires_at: string | null } | null, now = Date.now()) {
  return !!ban && !ban.revoked_at && (!ban.expires_at || Date.parse(ban.expires_at) > now);
}/** Highest authority first (Owner, full admin, then role order); equal tiers sort alphabetically. */
export function sortByAuthority<T extends { tier: number; username: string; email: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.tier - b.tier || (a.username || a.email).localeCompare(b.username || b.email, undefined, { sensitivity: 'base' }));
}
