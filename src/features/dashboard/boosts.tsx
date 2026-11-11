import { queryOptions, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const boostsOptions = () => queryOptions({ queryKey: ['boosts'], staleTime: 30_000, refetchInterval: 60_000, refetchIntervalInBackground: false, queryFn: async () => {
  const r = await supabase.from('boosts').select('id, player_name, blook_name, rarity, pack_id, pack_name, affected, multiplier, ends_at').gt('ends_at', new Date().toISOString()).order('ends_at', { ascending: false }).limit(10);
  if (r.error) throw r.error;
  return r.data;
} });

export const sacrificeRarities = ['chroma', 'mythical', 'hidden'] as const;
export const boostDescription: Record<string, string> = {
  chroma: 'Boosts this pack: x1.5 for Rare and above, for 1 hour.',
  mythical: 'Boosts all packs: x1.5 to x2.0 for Rare and above, for 90 minutes.',
  hidden: 'Boosts all packs: x1.5 to x3.0 for Epic and above, for 2 hours.',
};

function left(ends: string) {
  const m = Math.max(0, Math.round((new Date(ends).getTime() - Date.now()) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export function BoostNotice() {
  const { data } = useQuery(boostsOptions());
  if (!data?.length) return null;
  return <aside aria-label="Active boosts" className="fixed bottom-4 right-4 z-40 w-72 max-w-[calc(100%-2rem)] space-y-1.5 rounded-xl border border-surface-border bg-surface/95 p-3 text-xs shadow-tile">
    <p className="font-display text-sm">Active boosts</p>
    {data.slice(0, 4).map(b => <p key={b.id}><span className="font-bold">{b.player_name}</span> boosted <span className="font-bold capitalize">{b.pack_name ?? 'all packs'}</span> x{Number(b.multiplier)} <span className="text-muted-foreground">· {left(b.ends_at)} left</span></p>)}
  </aside>;
}

export function boostFactor(boosts: { pack_id: string | null; affected: string[]; multiplier: number; ends_at: string }[] | undefined, pack: string, rarity: string) {
  return (boosts ?? []).filter(b => new Date(b.ends_at).getTime() > Date.now() && b.affected.includes(rarity) && (!b.pack_id || b.pack_id === pack)).reduce((f, b) => f * Number(b.multiplier), 1);
}
