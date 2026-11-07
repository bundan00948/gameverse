import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Coins, Sparkles, Package, MessageCircle, Star, Users, UserPlus, X, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { usePlayer } from '@/features/account/session';
import { inventoryOptions, statsOptions } from '@/features/dashboard/data';
import { PageError, meta } from '@/features/dashboard/page';
import { identitiesOptions, roleTextStyle } from '@/features/dashboard/roles';
import { BadgeList, PlayerAvatar, PlayerName } from '@/features/dashboard/player-identity';
import { BlookArt } from '@/features/dashboard/blook-art';

export const Route = createFileRoute('/_authenticated/stats')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(statsOptions()), context.queryClient.ensureQueryData(identitiesOptions())]),
  head: () => meta('Stats', 'Your GameVerse tokens, blooks and play stats.'),
  component: Stats, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const box = 'rounded-xl bg-surface shadow-[0_6px_0_rgb(0_0_0/0.35)]';
const tab = 'inline-block rounded-t-xl bg-surface px-6 pt-2 pb-1 font-display text-3xl shadow-[0_6px_0_rgb(0_0_0/0.35)]';
const btn = 'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_rgb(0_0_0/0.35)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-1 active:shadow-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Stats() {
  const { data } = useSuspenseQuery(statsOptions()); const { data: ids } = useSuspenseQuery(identitiesOptions());
  const cache = useQueryClient(); const user = usePlayer(); const [picking, setPicking] = useState(false);
  const me = user ? ids.get(user.id) : undefined;
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  const level = Math.floor(data.plays / 5); const xp = (data.plays % 5) * 20;
  const claim = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc('claim_daily'); if (error) throw error; }, onSuccess: () => cache.invalidateQueries() });
  const items = [
    { label: 'Tokens', value: data.tokens, icon: Coins, color: 'text-tile-d' },
    { label: 'Blooks Unlocked', value: data.blooks, icon: Sparkles, color: 'text-tile-c' },
    { label: 'Packs Opened', value: data.packsOpened, icon: Package, color: 'text-tile-a' },
    { label: 'Messages Sent', value: data.messages, icon: MessageCircle, color: 'text-tile-b' },
  ];
  return <DashboardShell bare>
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <button type="button" onClick={() => setPicking(true)} aria-label="Change profile picture" className="group relative grid size-28 shrink-0 place-items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <PlayerAvatar name={name} identity={me} className="size-28 rounded-2xl text-5xl" />
        <span className="absolute bottom-1 right-1 grid size-7 place-items-center rounded-full bg-surface opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100"><Pencil className="size-3.5" /></span>
      </button>
      <div className="w-full max-w-md">
        <div className={`${box} px-6 py-3 text-center`}>
          <h1 className="truncate font-display text-4xl leading-tight"><PlayerName name={name} identity={me} className="font-normal" /></h1>
          <p className="text-sm text-muted-foreground" style={roleTextStyle(me?.role?.colors)}>{me?.role?.name ?? 'Player'}</p>
          {me?.badges.length ? <div className="mt-2 flex justify-center"><BadgeList identity={me} size="lg" /></div> : null}
        </div>
        <div className="mt-4 flex items-center">
          <span className="relative z-10 -mr-3 grid size-14 shrink-0 place-items-center"><Star className="absolute size-14 fill-tile-b text-tile-b drop-shadow" /><span className="relative font-display text-lg text-white">{level}</span></span>
          <div className="h-5 flex-1 overflow-hidden rounded-r-full bg-black/40" title={`${5 - (data.plays % 5)} games to next level`}><div className="h-full bg-tile-b transition-all" style={{ width: `${xp}%` }} /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={claim.isPending} onClick={() => claim.mutate()} className={`${btn} bg-[oklch(0.6_0.17_145)]`}><Star className="size-4 fill-current" />Claim Tokens</button>
        </div>
        {claim.error && <p role="alert" className="mt-2 text-xs text-destructive">{claim.error.message}</p>}
        {claim.isSuccess && <p role="status" className="mt-2 text-xs font-bold">+50 tokens claimed!</p>}
      </div>
    </div>

    <section className="mt-10">
      <h2 className={tab}>Stats</h2>
      <div className={`${box} grid grid-cols-1 gap-4 rounded-tl-none p-5 sm:grid-cols-2 xl:grid-cols-4`}>{items.map(i => (
        <div key={i.label} className="relative flex items-center gap-3 rounded-xl bg-glass-hover px-4 py-3 shadow-[0_4px_0_rgb(0_0_0/0.25)]">
          <i.icon className={`size-10 shrink-0 ${i.color}`} />
          <div className="min-w-0 flex-1 text-center"><p className="text-sm text-muted-foreground">{i.label}</p><p className="font-display text-3xl leading-none">{i.value.toLocaleString()}</p></div>
        </div>))}</div>
    </section>

    <section className="mt-8">
      <div className="flex justify-between"><h2 className={tab}>Friends</h2><h2 className={tab}>Requests</h2></div>
      <div className={`${box} grid gap-4 rounded-t-none p-5 md:grid-cols-2`}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" />No friends yet. Say hi in <Link to="/chat" reloadDocument className="font-bold text-primary underline">Chat</Link>.</p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground md:justify-end"><UserPlus className="size-4" />No friend requests.</p>
      </div>
    </section>
    {picking && user && <AvatarPicker userId={user.id} onClose={() => setPicking(false)} />}
  </DashboardShell>;
}

function AvatarPicker({ userId, onClose }: { userId: string; onClose: () => void }) {
  const cache = useQueryClient(); const { data, isLoading, error } = useQuery(inventoryOptions());
  const owned = (data ?? []).flatMap(r => r.blooks ? [r.blooks] : []).sort((a, b) => a.name.localeCompare(b.name));
  const save = useMutation({ mutationFn: async (blook: string | null) => { const { error } = await supabase.from('profiles').update({ avatar_blook_id: blook }).eq('id', userId); if (error) throw error; }, onSuccess: () => { cache.invalidateQueries({ queryKey: ['identities'] }); onClose(); } });
  return <div role="dialog" aria-modal="true" aria-label="Choose profile picture" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose} onKeyDown={e => e.key === 'Escape' && onClose()}>
    <div className={`${box} w-full max-w-xl p-5`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Choose a blook</h2><button type="button" aria-label="Close" onClick={onClose}><X /></button></div>
      {isLoading && <p className="mt-4">Loading your blooks…</p>}
      {error && <p role="alert" className="mt-4 text-destructive">{error.message}</p>}
      {!isLoading && owned.length === 0 && <p className="mt-4 text-muted-foreground">Open packs in the Market to unlock blooks.</p>}
      <div className="mt-4 grid max-h-[55vh] grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-6">{owned.map(b => <button key={b.id} type="button" title={b.name} aria-label={b.name} disabled={save.isPending} onClick={() => save.mutate(b.id)} className="aspect-square rounded-lg p-1 transition hover:scale-110 hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><BlookArt src={b.image_url} name={b.name} className="size-full" /></button>)}</div>
      <button type="button" onClick={() => save.mutate(null)} className="mt-4 text-sm font-bold underline">Use my initial instead</button>
      {save.error && <p role="alert" className="mt-2 text-destructive">{save.error.message}</p>}
    </div>
  </div>;
}
