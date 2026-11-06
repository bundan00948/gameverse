import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { rarityClass, shopOptions, walletOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/shop')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(shopOptions()), context.queryClient.ensureQueryData(walletOptions())]),
  head: () => meta('Shop', 'Spend tokens on packs and unlock blooks.'),
  component: Shop, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const bg: Record<string, string> = { 'tile-a': 'bg-tile-a', 'tile-b': 'bg-tile-b', 'tile-c': 'bg-tile-c', 'tile-d': 'bg-tile-d' };

function Shop() {
  const { data: packs } = useSuspenseQuery(shopOptions()); const { data: wallet } = useSuspenseQuery(walletOptions()); const cache = useQueryClient();
  const open = useMutation({
    mutationFn: async (id: string) => { const { data, error } = await supabase.rpc('open_pack', { _pack: id }); if (error) throw error; return data as { name: string; emoji: string; rarity: string }; },
    onSuccess: () => ['wallet', 'stats', 'inventory', 'missions'].forEach(k => cache.invalidateQueries({ queryKey: [k] })),
  });
  return <DashboardShell>
    <PageTitle kicker="Market" title="Shop"><span className="flex items-center gap-2 rounded-lg border border-surface-border px-4 py-2 text-xl font-bold"><Coins className="size-5 text-tile-d" />{wallet.tokens}</span></PageTitle>
    {open.error && <p role="alert" className="mt-4 text-destructive">{open.error.message}</p>}
    {open.data && <div role="status" className="mt-6 flex items-center gap-4 rounded-xl border-2 border-primary p-4"><span className="animate-float text-6xl">{open.data.emoji}</span><div><p className="text-sm text-muted-foreground">You unlocked</p><p className="text-2xl font-bold">{open.data.name}</p><p className={`text-sm font-bold uppercase ${rarityClass[open.data.rarity] ?? ''}`}>{open.data.rarity}</p></div></div>}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{packs.map(p => (
      <article key={p.id} className="overflow-hidden rounded-2xl border-4 border-surface-border shadow-tile transition hover:-translate-y-1">
        <div className={`${bg[p.color] ?? 'bg-tile-a'} grid aspect-square place-items-center text-tile-fg`}><div className="text-center"><div className="text-7xl">{p.emoji}</div><p className="mt-2 font-display text-2xl">{p.name}</p><p className="mt-1 text-xl tracking-widest">{p.blooks.map(b => b.emoji).join(' ')}</p></div></div>
        <button type="button" disabled={open.isPending || wallet.tokens < p.price} onClick={() => open.mutate(p.id)} className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-xl font-bold text-primary-foreground disabled:opacity-50"><Coins className="size-5" />{p.price}</button>
      </article>))}</div>
  </DashboardShell>;
}
