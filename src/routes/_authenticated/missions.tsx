import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Coins, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { missionsOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, card, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/missions')({
  loader: ({ context }) => context.queryClient.ensureQueryData(missionsOptions()),
  head: () => meta('Missions', 'Complete missions to earn GameVerse tokens.'),
  component: Missions, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Missions() {
  const { data } = useSuspenseQuery(missionsOptions()); const cache = useQueryClient();
  const claim = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.rpc('claim_mission', { _mission: id }); if (error) throw error; }, onSuccess: () => ['missions', 'wallet', 'stats'].forEach(k => cache.invalidateQueries({ queryKey: [k] })) });
  return <DashboardShell>
    <PageTitle kicker="Earn tokens" title="Missions" />
    {claim.error && <p role="alert" className="mt-4 text-destructive">{claim.error.message}</p>}
    <div className="mt-5 space-y-3">{data.map(m => { const done = m.progress >= m.goal; return (
      <div key={m.id} className={`${card} flex flex-wrap items-center gap-3`}>
        <div className="min-w-40 flex-1"><p className="text-base font-bold">{m.title}</p>
          <div role="progressbar" aria-label={m.title} aria-valuemin={0} aria-valuemax={m.goal} aria-valuenow={Math.min(m.progress, m.goal)} className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-border"><div className="h-full bg-tile-c transition-all" style={{ width: `${(m.progress / m.goal) * 100}%` }} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{m.progress} / {m.goal}</p></div>
        {m.claimed ? <span className="flex items-center gap-1 text-sm font-bold text-tile-c"><Check className="size-4" />Claimed</span> :
          <Button type="button" disabled={!done || claim.isPending} onClick={() => claim.mutate(m.id)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50"><Coins className="size-4" />Claim {m.reward}</Button>}
      </div>); })}</div>
  </DashboardShell>;
}
