import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Coins, Sparkles, Package, MessageCircle, Search, Store, Target, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { usePlayer } from '@/features/account/session';
import { statsOptions } from '@/features/dashboard/data';
import { PageError, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/stats')({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsOptions()),
  head: () => meta('Stats', 'Your GameVerse tokens, blooks and play stats.'),
  component: Stats, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const btn = 'flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-bold text-white shadow-[0_4px_0_rgb(0_0_0/0.35)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60';
const tab = 'inline-block rounded-t-xl bg-surface px-6 pt-3 pb-1 font-display text-4xl shadow-tile';

function Stats() {
  const { data } = useSuspenseQuery(statsOptions()); const cache = useQueryClient(); const user = usePlayer();
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  const level = Math.floor(data.plays / 5); const xp = (data.plays % 5) * 20;
  const claim = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc('claim_daily'); if (error) throw error; }, onSuccess: () => cache.invalidateQueries() });
  const items = [
    { label: 'Tokens', value: data.tokens, icon: Coins, color: 'text-tile-d' },
    { label: 'Blooks Unlocked', value: data.blooks, icon: Sparkles, color: 'text-tile-b' },
    { label: 'Packs Opened', value: data.packsOpened, icon: Package, color: 'text-tile-a' },
    { label: 'Messages Sent', value: data.messages, icon: MessageCircle, color: 'text-discord' },
  ];
  return <DashboardShell>
    <div className="max-w-md">
      <div className="rounded-xl bg-surface px-6 py-4 text-center shadow-[0_6px_0_rgb(0_0_0/0.3)]"><p className="font-display text-4xl">{name}</p><p className="text-muted-foreground">Player</p></div>
      <div className="relative mt-5 flex items-center">
        <span className="absolute -left-3 z-10 grid size-14 place-items-center"><Star className="size-14 fill-tile-b text-tile-b" /><span className="absolute font-display text-xl text-tile-fg">{level}</span></span>
        <div className="ml-6 h-6 flex-1 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-tile-b" style={{ width: `${xp}%` }} /></div>
      </div>
    </div>
    <div className="mt-6 flex flex-wrap gap-3">
      <a href="/history" className={`${btn} bg-[oklch(0.62_0.18_40)]`}><Search className="size-4" />View History</a>
      <a href="/shop" className={`${btn} bg-[oklch(0.6_0.16_150)]`}><Store className="size-4" />Shop</a>
      <a href="/missions" className={`${btn} bg-[oklch(0.58_0.2_310)]`}><Target className="size-4" />Missions</a>
      <button type="button" disabled={claim.isPending} onClick={() => claim.mutate()} className={`${btn} bg-[oklch(0.6_0.18_140)]`}><Star className="size-4" />Claim Tokens</button>
    </div>
    {claim.error && <p role="alert" className="mt-3 text-destructive">{claim.error.message}</p>}
    {claim.isSuccess && <p role="status" className="mt-3">+50 tokens claimed!</p>}

    <section className="mt-10"><h2 className={tab}>Stats</h2>
      <div className="grid gap-4 rounded-b-xl rounded-tr-xl bg-surface p-5 sm:grid-cols-2 xl:grid-cols-4">{items.map(i => (
        <div key={i.label} className="relative flex items-center rounded-lg bg-glass-hover py-3 pl-14 pr-4 shadow-[0_4px_0_rgb(0_0_0/0.25)]">
          <i.icon className={`absolute -left-2 size-14 drop-shadow ${i.color}`} />
          <div className="w-full text-center"><p className="text-muted-foreground">{i.label}</p><p className="font-display text-4xl">{i.value}</p></div>
        </div>))}</div>
    </section>

    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <section><h2 className={tab}>Friends</h2><div className="rounded-b-xl rounded-tr-xl bg-surface p-6 text-muted-foreground">No friends yet — say hi in <Link to="/chat" reloadDocument className="font-bold text-primary underline">Chat</Link>.</div></section>
      <section className="md:text-right"><h2 className={tab}>Requests</h2><div className="rounded-b-xl rounded-tl-xl bg-surface p-6 text-left text-muted-foreground">No friend requests.</div></section>
    </div>
  </DashboardShell>;
}
