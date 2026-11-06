import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Coins, Sparkles, Package, MessageCircle, Gamepad2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { statsOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, card, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/stats')({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsOptions()),
  head: () => meta('Stats', 'Your GameVerse tokens, blooks and play stats.'),
  component: Stats, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Stats() {
  const { data } = useSuspenseQuery(statsOptions()); const cache = useQueryClient();
  const claim = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc('claim_daily'); if (error) throw error; }, onSuccess: () => cache.invalidateQueries() });
  const items = [
    { label: 'Tokens', value: data.tokens, icon: Coins, color: 'text-tile-d' },
    { label: 'Blooks unlocked', value: data.blooks, icon: Sparkles, color: 'text-tile-b' },
    { label: 'Packs opened', value: data.packsOpened, icon: Package, color: 'text-tile-a' },
    { label: 'Games played', value: data.plays, icon: Gamepad2, color: 'text-tile-c' },
    { label: 'Messages sent', value: data.messages, icon: MessageCircle, color: 'text-discord' },
  ];
  return <DashboardShell>
    <PageTitle kicker="Your progress" title="Stats">
      <button type="button" disabled={claim.isPending} onClick={() => claim.mutate()} className="flex items-center gap-2 rounded-lg bg-tile-c px-4 py-2.5 font-bold text-tile-fg transition hover:-translate-y-0.5 disabled:opacity-60"><Star className="size-4" />Claim 50 daily tokens</button>
    </PageTitle>
    {claim.error && <p role="alert" className="mt-3 text-destructive">{claim.error.message}</p>}
    {claim.isSuccess && <p role="status" className="mt-3">+50 tokens claimed!</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(i => (
      <div key={i.label} className={`${card} flex items-center gap-4`}><i.icon className={`size-12 ${i.color}`} /><div><p className="text-sm text-muted-foreground">{i.label}</p><p className="font-display text-4xl">{i.value}</p></div></div>))}</div>
  </DashboardShell>;
}
