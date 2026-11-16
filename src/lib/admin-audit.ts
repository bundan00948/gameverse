import type { Json } from '@/integrations/supabase/types';

/** Ban records always carry the original duration, including permanent bans. */
export function auditDuration(details: Json): string {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return '—';
  if (details['permanent'] === true) return 'Permanent';
  const hours = details['duration_hours'];
  return typeof hours === 'number' ? `${Number(hours.toFixed(2))} hours` : '—';
}

export function auditChangedFields(details: Json): string[] {
  return details && typeof details === 'object' && !Array.isArray(details) ? Object.keys(details) : [];
}