import { createFileRoute, Link } from '@tanstack/react-router';
import { BlookArt } from '@/features/dashboard/blook-art';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Lock, Search, X } from 'lucide-react';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { collectionOptions, rarityClass } from '@/features/dashboard/data';
import { PageError, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/inventory')({
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionOptions()),
  head: () => meta('Inventory', 'Your collection of GameVerse blooks.'),
  component: Inventory, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

type Blook = { id: string; name: string; emoji: string; image_url: string | null; rarity: string; weight: number; owned: number; pack: string; total: number };
const select = 'rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm font-bold';

function Inventory() {
  const { data } = useSuspenseQuery(collectionOptions());
  const [q, setQ] = useState(''); const [rarity, setRarity] = useState('all'); const [show, setShow] = useState('all');
  const [open, setOpen] = useState<Blook | null>(null);
  const all = data.flatMap(p => p.blooks);
  const unlocked = all.filter(b => b.owned > 0).length;
  const groups = useMemo(() => data.map(p => ({ ...p, blooks: p.blooks.filter(b =>
    (rarity === 'all' || b.rarity === rarity) && (show === 'all' || (show === 'owned' ? b.owned > 0 : b.owned === 0)) &&
    (!q || b.name.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase()))) })).filter(p => p.blooks.length), [data, q, rarity, show]);

  return <DashboardShell bare>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-4xl">Inventory</h1>
      <div className="rounded-xl border border-surface-border bg-surface px-4 py-2 shadow-tile"><span className="font-display text-2xl">{unlocked}</span><span className="text-sm text-muted-foreground"> / {all.length} unlocked</span></div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <label className="relative min-w-60 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search blooks or packs…" aria-label="Search" className="w-full rounded-lg border border-surface-border bg-surface py-2 pl-9 pr-3 text-sm" /></label>
      <select aria-label="Rarity" className={select} value={rarity} onChange={e => setRarity(e.target.value)}><option value="all">All rarities</option>{['common', 'uncommon', 'rare', 'legendary'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}</select>
      <select aria-label="Show" className={select} value={show} onChange={e => setShow(e.target.value)}><option value="all">All blooks</option><option value="owned">Unlocked</option><option value="locked">Locked</option></select>
    </div>

    {groups.length === 0 && <p className="mt-8 text-center text-muted-foreground">Nothing matches. <Link to="/shop" reloadDocument className="font-bold text-primary underline">Visit the Market</Link></p>}
    {groups.map(p => { const totalInPack = data.find(x => x.id === p.id)!.blooks; const got = totalInPack.filter(b => b.owned > 0).length;
      return <section key={p.id} className="mt-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-2">
          <h2 className="font-display text-2xl"><BlookArt src={p.image_url} emoji={p.emoji} alt="" className="mr-2 size-9 align-middle text-3xl" />{p.name}</h2>
          <div className="flex items-center gap-2 text-sm font-bold"><div className="h-2 w-28 overflow-hidden rounded-full bg-surface"><div className="h-full bg-tile-c" style={{ width: `${(got / totalInPack.length) * 100}%` }} /></div>{got} / {totalInPack.length}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">{p.blooks.map(b => (
          <button key={b.id} type="button" onClick={() => setOpen({ ...b, pack: p.name, total: p.blooks.reduce((s, x) => s + x.weight, 0) })} aria-label={b.owned ? b.name : `Locked blook`}
            className={`relative grid size-20 place-items-center rounded-xl text-4xl shadow-[0_4px_0_rgb(0_0_0/0.3)] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${b.owned ? 'bg-surface' : 'bg-surface/50'}`}>
            {b.owned ? <BlookArt src={b.image_url} emoji={b.emoji} alt={b.name} className="size-16 text-5xl" /> : <Lock className="size-6 text-muted-foreground" />}
            {b.owned > 0 && <span className="absolute -bottom-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{b.owned}</span>}
          </button>))}</div>
      </section>; })}

    {open && <div role="dialog" aria-modal="true" aria-label={open.name} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(null)}>
      <div className="relative w-full max-w-sm rounded-2xl border border-surface-border bg-surface p-6 text-center shadow-tile" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="absolute right-3 top-3 rounded-md p-1 hover:bg-glass-hover"><X className="size-5" /></button>
        <div className="mx-auto grid size-28 place-items-center rounded-2xl bg-glass-hover text-6xl">{open.owned ? <BlookArt src={open.image_url} emoji={open.emoji} alt={open.name} className="size-24 text-7xl" /> : <Lock className="size-10 text-muted-foreground" />}</div>
        <h2 className="mt-4 font-display text-3xl">{open.owned ? open.name : '???'}</h2>
        <p className={`text-sm font-bold uppercase ${rarityClass[open.rarity] ?? ''}`}>{open.rarity}</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-glass-hover p-2"><dt className="text-xs text-muted-foreground">Pack</dt><dd className="font-bold">{open.pack}</dd></div>
          <div className="rounded-lg bg-glass-hover p-2"><dt className="text-xs text-muted-foreground">Owned</dt><dd className="font-bold">{open.owned}</dd></div>
          <div className="rounded-lg bg-glass-hover p-2"><dt className="text-xs text-muted-foreground">Chance</dt><dd className="font-bold">{((open.weight / open.total) * 100).toFixed(1)}%</dd></div>
        </dl>
        {!open.owned && <a href="/shop" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Find it in the Market</a>}
      </div>
    </div>}
  </DashboardShell>;
}
