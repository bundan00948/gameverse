import { createFileRoute } from '@tanstack/react-router';
import { BlookArt } from '@/features/dashboard/blook-art';
import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PackOpener } from '@/features/dashboard/pack-opener';
import { Coins } from 'lucide-react';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { shopOptions, walletOptions } from '@/features/dashboard/data';
import { PageError, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/shop')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(shopOptions()), context.queryClient.ensureQueryData(walletOptions())]),
  head: () => meta('Market', 'Spend tokens on packs and unlock blooks.'),
  component: Shop, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const bg: Record<string, string> = { 'tile-a': 'bg-tile-a', 'tile-b': 'bg-tile-b', 'tile-c': 'bg-tile-c', 'tile-d': 'bg-tile-d' };

function Shop() {
  const { data: packs } = useSuspenseQuery(shopOptions()); const { data: wallet } = useSuspenseQuery(walletOptions()); const [chosen, setChosen] = useState<string | null>(null);
  const pack = packs.find(p => p.id === chosen);
  return <DashboardShell bare><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]"><div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl drop-shadow-[0_3px_0_rgb(0_0_0/0.3)] sm:text-4xl">Market</h1>
          </div>
    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{packs.map(p => (
      <button key={p.id} type="button" aria-label={`View ${p.name}, costs ${p.price} tokens`} onClick={() => setChosen(p.id)}
        className="group overflow-hidden rounded-xl border-4 border-[oklch(0.55_0.15_250)] bg-[oklch(0.62_0.17_250)] text-left shadow-[0_5px_0_rgb(0_0_0/0.3)] transition hover:-translate-y-1 ">
        <div className={`${bg[p.color] ?? 'bg-tile-a'} relative grid aspect-square place-items-center overflow-hidden p-2.5 text-tile-fg`}>
          <div className="relative w-full -rotate-3 rounded-sm bg-white/85 px-2 pb-3 pt-3 text-center shadow-lg transition group-hover:rotate-0 [mask:radial-gradient(6px_at_50%_0,#0000_96%,#000)_50%_0/12px_51%_repeat-x,radial-gradient(6px_at_50%_100%,#0000_96%,#000)_50%_100%/12px_51%_repeat-x]">
            <p className="font-display text-base leading-tight text-[oklch(0.25_0.05_260)] sm:text-lg">{p.name}</p>
            <BlookArt src={p.image_url} emoji={p.emoji} alt={p.name} className="mx-auto mt-1 size-20 text-6xl" />
            <p className="mt-1 text-sm tracking-wider">{p.blooks.map(b => b.emoji).join(' ')}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 border-t-4 border-white/70 py-1.5 font-display text-xl text-white"><Coins className="size-5 text-tile-d" />{p.price}</div>
      </button>))}</div></div>
    <aside className="hidden self-start xl:sticky xl:top-6 xl:block"><div className="overflow-hidden rounded-xl border border-surface-border bg-surface text-center shadow-tile">
      <p className="bg-foreground py-2 font-display text-2xl tracking-widest text-background">MARKET</p>
      <div className="grid h-40 place-items-center bg-[repeating-linear-gradient(90deg,oklch(0.45_0.08_60)_0_18px,oklch(0.4_0.08_60)_18px_36px)] text-6xl">🛒</div>
      <p className="p-3 text-sm text-muted-foreground">Click a pack to see its drop rates. You have <b className="text-foreground">{wallet.tokens}</b> tokens.</p>
    </div></aside></div>
    {pack && <PackOpener pack={pack} tokens={wallet.tokens} onClose={() => setChosen(null)} />}
  </DashboardShell>;
}
