import { createFileRoute, Link } from '@tanstack/react-router';
import { BlookArt } from '@/features/dashboard/blook-art';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState, type CSSProperties } from 'react';
import { Lock, Search } from '@/lib/icons';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { appearanceOptions, collectionOptions, rarityBadgesOptions } from '@/features/dashboard/data';
import { PageError, meta } from '@/features/dashboard/page';
import { rarityPaint, rarityDefaults, safeColor } from '@/features/dashboard/appearance';

export const Route = createFileRoute('/_authenticated/inventory')({
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionOptions()),
  head: () => meta('Inventory', 'Your collection of GameVerse blooks.'),
  component: Inventory, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

type Blook = { id: string; name: string; emoji: string; image_url: string | null; rarity: string; weight: number; owned: number; pack: string; total: number; gradient_start?: string | null; gradient_end?: string | null; pattern_image_url?: string | null; open_image_url?: string | null };
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const select = 'rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm font-bold';

function Inventory() {
  const { data } = useSuspenseQuery(collectionOptions());
  const { data: colors } = useQuery(appearanceOptions());
  const { data: badges } = useQuery(rarityBadgesOptions());
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
      <select aria-label="Rarity" className={select} value={rarity} onChange={e => setRarity(e.target.value)}><option value="all">All rarities</option>{['common', 'uncommon', 'rare', 'epic', 'legendary', 'chroma', 'mythical', 'hidden'].map(r => <option key={r} value={r} className="capitalize">{r}</option>)}</select>
      <select aria-label="Show" className={select} value={show} onChange={e => setShow(e.target.value)}><option value="all">All blooks</option><option value="owned">Unlocked</option><option value="locked">Locked</option></select>
    </div>

    {groups.length === 0 && <p className="mt-8 text-center text-muted-foreground">Nothing matches. <Link to="/shop" className="font-bold text-primary underline">Visit the Market</Link></p>}
    {groups.map(p => { const totalInPack = data.find(x => x.id === p.id)?.blooks ?? []; const got = totalInPack.filter(b => b.owned > 0).length;
      return <section key={p.id} className="mt-6">
        <div className="flex items-center justify-between border-b border-surface-border pb-2">
          <h2 className="font-display text-2xl"><BlookArt src={p.image_url} alt="" className="mr-2 size-9 align-middle text-3xl" />{p.name}</h2>
          <div className="flex items-center gap-2 text-sm font-bold"><div className="h-2 w-28 overflow-hidden rounded-full bg-surface"><div className="h-full bg-tile-c" style={{ width: `${(got / totalInPack.length) * 100}%` }} /></div>{got} / {totalInPack.length}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">{p.blooks.map(b => (
          <Button variant="ghost" key={b.id} type="button" onClick={() => setOpen({ ...b, pack: p.name, total: p.blooks.reduce((s, x) => s + x.weight, 0), gradient_start: p.gradient_start, gradient_end: p.gradient_end, pattern_image_url: p.pattern_image_url, open_image_url: p.open_image_url })} aria-label={b.owned ? b.name : `Locked blook`}
            className="relative grid size-24 place-items-center rounded-none border-0 bg-transparent p-0 text-4xl shadow-none transition-transform hover:-translate-y-1 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {b.owned ? <BlookArt src={b.image_url} alt={b.name} className="size-20 text-5xl" /> : <span className="relative grid size-20 place-items-center">{b.image_url && <BlookArt src={b.image_url} alt="" aria-hidden className="blook-silhouette size-full" />}<Lock className="absolute size-6 text-foreground/85" /></span>}
            {b.owned > 0 && <span aria-label={`${b.owned} owned, ${b.rarity}`} title={`${b.rarity} · ${b.owned} owned`} className="absolute bottom-0 right-0 isolate grid min-h-7 min-w-7 place-items-center px-1 text-xs font-bold text-white">{badges?.[b.rarity] ? <img aria-hidden="true" src={badges[b.rarity] ?? undefined} alt="" className="absolute inset-0 -z-10 size-full object-contain" /> : <span aria-hidden="true" className="absolute inset-0 -z-10 drop-shadow-[0_2px_3px_rgb(0_0_0/0.5)] [clip-path:polygon(50%_0%,63%_12%,80%_7%,85%_25%,100%_35%,92%_50%,100%_65%,85%_75%,80%_93%,63%_88%,50%_100%,37%_88%,20%_93%,15%_75%,0%_65%,8%_50%,0%_35%,15%_25%,20%_7%,37%_12%)]" style={{ background: rarityPaint(colors?.[b.rarity], rarityDefaults[b.rarity] ?? 'var(--secondary)') }} />}<span className="[text-shadow:0_1px_2px_var(--background),0_0_3px_var(--background)]">{b.owned.toLocaleString()}</span></span>}
          </Button>))}</div>
      </section>; })}

    {open && <Dialog open onOpenChange={value => { if (!value) setOpen(null); }}><DialogContent aria-describedby={undefined} className="w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-md bg-surface p-8 text-center" style={{ '--pack-start': safeColor(open.gradient_start, 'var(--market-start)'), '--pack-end': safeColor(open.gradient_end, 'var(--market-end)'), border: '7px solid color-mix(in srgb, var(--pack-start) 50%, transparent)', boxShadow: 'var(--market-shadow)' } as CSSProperties}>
        <div aria-hidden className="pack-scene-gradient rounded-md" />
        {open.open_image_url && <img aria-hidden src={open.open_image_url} alt="" className="pack-stage-background rounded-md" />}
        {open.pattern_image_url && <img aria-hidden src={open.pattern_image_url} alt="" className="market-pack-pattern" />}
        <div className="relative">
        <div className="mx-auto grid size-36 place-items-center text-6xl">{open.owned ? <BlookArt src={open.image_url} alt={open.name} className="size-32 text-7xl" /> : <span className="relative grid size-32 place-items-center">{open.image_url && <BlookArt src={open.image_url} alt="" aria-hidden className="blook-silhouette size-full" />}<Lock className="absolute size-12 text-foreground/85" /></span>}</div>
        <DialogTitle className="mt-5 font-display text-4xl">{open.owned ? open.name : 'Locked blook'}</DialogTitle>
        <p className="mt-3 flex items-center justify-center gap-1.5">
          {badges?.[open.rarity] ? <img aria-hidden="true" src={badges[open.rarity] ?? undefined} alt="" className="size-8 object-contain" /> : <span aria-hidden="true" className="size-8 [clip-path:polygon(50%_0%,63%_12%,80%_7%,85%_25%,100%_35%,92%_50%,100%_65%,85%_75%,80%_93%,63%_88%,50%_100%,37%_88%,20%_93%,15%_75%,0%_65%,8%_50%,0%_35%,15%_25%,20%_7%,37%_12%)]" style={{ background: rarityPaint(colors?.[open.rarity], rarityDefaults[open.rarity] ?? 'var(--secondary)') }} />}
          <span className="rounded-full border-2 border-white/50 px-4 py-1.5 font-display text-[14px] uppercase tracking-wide text-white shadow-[var(--rarity-shadow)]" style={{ background: rarityPaint(colors?.[open.rarity], rarityDefaults[open.rarity] ?? 'var(--foreground)') }}>{open.rarity}</span>
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-base">
          <div className="rounded-lg border border-white/25 bg-background/70 p-3.5 shadow-tile"><dt className="text-sm text-muted-foreground">Pack</dt><dd className="text-lg font-bold">{open.pack}</dd></div>
          <div className="rounded-lg border border-white/25 bg-background/70 p-3.5 shadow-tile"><dt className="text-sm text-muted-foreground">Owned</dt><dd className="text-lg font-bold">{open.owned}</dd></div>
          <div className="rounded-lg border border-white/25 bg-background/70 p-3.5 shadow-tile"><dt className="text-sm text-muted-foreground">Chance</dt><dd className="text-lg font-bold">{open.pack === 'Unassigned' ? '—' : `${((open.weight / open.total) * 100).toFixed(2)}%`}</dd></div>
        </dl>
        {!open.owned && open.pack !== 'Unassigned' && <Link to="/shop" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Find it in the Market</Link>}
        </div>
    </DialogContent></Dialog>}
  </DashboardShell>;
}
