import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Coins, Sparkles, Package, MessageCircle, Gamepad2, Star, Gift, Users, UserPlus } from 'lucide-react';
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

const btn = 'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgb(0_0_0/0.35)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:shadow-none disabled:opacity-60';
const panel = 'rounded-xl border border-surface-border bg-surface shadow-tile';
const heading = 'mb-3 flex items-center gap-2 font-display text-xl';

function Stats() {
  const { data } = useSuspenseQuery(statsOptions()); const cache = useQueryClient(); const user = usePlayer();
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  const level = Math.floor(data.plays / 5); const xp = (data.plays % 5) * 20;
  const claim = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc('claim_daily'); if (error) throw error; }, onSuccess: () => cache.invalidateQueries() });
  const items = [
    { label: 'Tokens', value: data.tokens, icon: Coins, bg: 'bg-tile-d' },
    { label: 'Blooks Unlocked', value: data.blooks, icon: Sparkles, bg: 'bg-tile-b' },
    { label: 'Packs Opened', value: data.packsOpened, icon: Package, bg: 'bg-tile-a' },
    { label: 'Games Played', value: data.plays, icon: Gamepad2, bg: 'bg-tile-c' },
    { label: 'Messages Sent', value: data.messages, icon: MessageCircle, bg: 'bg-discord' },
  ];
  return <DashboardShell bare>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className={`${panel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center`}>
        <span className="font-display grid size-20 shrink-0 place-items-center rounded-2xl bg-primary text-4xl text-primary-foreground shadow-[0_5px_0_rgb(0_0_0/0.3)]">{name[0]?.toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-3xl leading-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">Player</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="relative grid size-10 shrink-0 place-items-center"><Star className="absolute size-10 fill-tile-b text-tile-b" /><span className="relative font-display text-sm text-tile-fg">{level}</span></span>
            <div className="flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-glass-hover"><div className="h-full rounded-full bg-tile-b transition-all" style={{ width: `${xp}%` }} /></div>
              <p className="mt-1 text-xs text-muted-foreground">Level {level} · {5 - (data.plays % 5)} games to next level</p>
            </div>
          </div>
        </div>
      </section>
      <section className={`${panel} flex flex-col justify-center gap-2 p-3`}>
        <button type="button" disabled={claim.isPending} onClick={() => claim.mutate()} className={`${btn} bg-[oklch(0.62_0.17_240)]`}><Gift className="size-4" />Claim Daily Tokens</button>
        {claim.error && <p role="alert" className="text-xs text-destructive">{claim.error.message}</p>}
        {claim.isSuccess && <p role="status" className="text-xs font-bold">+50 tokens claimed!</p>}
      </section>
    </div>

    <section className={`${panel} mt-4 p-5`}>
      <h2 className={heading}><Star className="size-5" />Stats</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{items.map(i => (
        <div key={i.label} className="flex items-center gap-3 rounded-xl bg-glass-hover p-3">
          <span className={`grid size-11 shrink-0 place-items-center rounded-lg text-white shadow-[0_3px_0_rgb(0_0_0/0.3)] ${i.bg}`}><i.icon className="size-6" /></span>
          <div className="min-w-0"><p className="font-display text-2xl leading-none">{i.value.toLocaleString()}</p><p className="mt-1 truncate text-xs text-muted-foreground">{i.label}</p></div>
        </div>))}</div>
    </section>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <section className={`${panel} p-5`}><h2 className={heading}><Users className="size-5" />Friends</h2><p className="text-sm text-muted-foreground">No friends yet — say hi in <Link to="/chat" reloadDocument className="font-bold text-primary underline">Chat</Link>.</p></section>
      <section className={`${panel} p-5`}><h2 className={heading}><UserPlus className="size-5" />Requests</h2><p className="text-sm text-muted-foreground">No friend requests.</p></section>
    </div>
  </DashboardShell>;
}
