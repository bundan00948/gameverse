import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { PageError, meta } from '@/features/dashboard/page';
import { BlookArt } from '@/features/dashboard/blook-art';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Gavel, Search } from '@/lib/icons';
import tokenIcon from '@/assets/icons/gameverse-token.webp.asset.json';
import { appearanceOptions, inventoryOptions, walletOptions } from '@/features/dashboard/data';
import { rarityPaint, rarityDefaults } from '@/features/dashboard/appearance';
import { identitiesOptions } from '@/features/dashboard/roles';
import { PlayerName } from '@/features/dashboard/player-identity';
import { playerName } from '@/features/dashboard/player-profile';
import { usePlayer } from '@/features/account/session';
import { auctionHours, bazaarCatalogOptions, bazaarOptions, canAuction, minimumBid, timeLeft, type Listing } from '@/features/bazaar/data';
import { rarityOrder } from '@/features/dashboard/blook-catalog';

export const Route = createFileRoute('/_authenticated/bazaar')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(bazaarOptions()), context.queryClient.ensureQueryData(bazaarCatalogOptions())]),
  head: () => meta('Bazaar', 'Buy, sell and auction blooks with other GameVerse players.'),
  component: Bazaar, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const views = ['Blooks', 'Listings', 'Auctions', 'Mine'] as const;
type View = (typeof views)[number];
const Price = ({ n, className = '' }: { n: number; className?: string }) => <span className={`inline-flex items-center gap-1 font-bold ${className}`}><img src={tokenIcon.url} alt="" className="size-4 object-contain" />{n.toLocaleString('en-US')}</span>;

function Bazaar() {
  const { data: listings } = useSuspenseQuery(bazaarOptions());
  const { data: catalog } = useSuspenseQuery(bazaarCatalogOptions());
  const { data: ids } = useQuery(identitiesOptions());
  const me = usePlayer();
  const [view, setView] = useState<View>('Blooks');
  const [pack, setPack] = useState<string | null>(null);
  const [blook, setBlook] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Listing | null>(null);
  const [selling, setSelling] = useState(false);

  const counts = useMemo(() => { const m = new Map<string, number>(); listings.forEach(l => m.set(l.blook.id, (m.get(l.blook.id) ?? 0) + 1)); return m; }, [listings]);
  const rank = (r: string) => rarityOrder.indexOf(r as never);
  const grid = catalog.blooks.filter(b => (pack ? b.pack_id === pack : true) && (!q || b.name.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => rank(a.rarity) - rank(b.rarity) || a.name.localeCompare(b.name));
  const results = listings.filter(l =>
    (view === 'Auctions' ? l.kind === 'auction' : view === 'Mine' ? l.seller_id === me?.id : view === 'Listings' ? true : !!blook && l.blook.id === blook) &&
    (view === 'Blooks' || !q || l.blook.name.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => (a.current_bid ?? a.price) - (b.current_bid ?? b.price));
  const chosen = catalog.blooks.find(b => b.id === blook);

  return <DashboardShell bare>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-3 font-display text-3xl sm:text-4xl"><Gavel className="size-8" />Bazaar</h1>
      <Button onClick={() => setSelling(true)} className="font-bold">List a blook</Button>
    </div>
    <div className="bazaar-layout mt-5">
      <nav aria-label="Bazaar views" className="bazaar-tabs">{views.map(v => <Button key={v} variant={view === v ? 'default' : 'secondary'} aria-pressed={view === v} onClick={() => setView(v)} className="justify-start font-bold">{v === 'Mine' ? 'My listings' : v}</Button>)}</nav>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={chosen && view === 'Blooks' ? chosen.name : q} onChange={e => { setBlook(null); setQ(e.target.value); }} placeholder="Search blooks…" aria-label="Search blooks" className="w-full rounded-lg border border-surface-border bg-surface py-2 pl-9 pr-3 font-display text-lg" /></label>
          <Button variant="secondary" onClick={() => { setQ(''); setBlook(null); setPack(null); }}>Clear</Button>
        </div>
        {view === 'Blooks' && <>
          <div className="bazaar-panel flex gap-2 overflow-x-auto p-3" role="group" aria-label="Filter by pack">
            {catalog.packs.map(p => <button key={p.id} type="button" aria-pressed={pack === p.id} aria-label={p.name} title={p.name} onClick={() => setPack(pack === p.id ? null : p.id)} className={`shrink-0 rounded-lg p-1 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pack === p.id ? 'bg-white/20 ring-2 ring-primary' : ''}`}><BlookArt src={p.image_url} alt="" className="size-16" /></button>)}
          </div>
          <div className="bazaar-panel flex flex-wrap justify-center gap-1 p-3">
            {grid.length === 0 && <p className="py-6 text-muted-foreground">No blooks match.</p>}
            {grid.map(b => { const c = counts.get(b.id) ?? 0; return <button key={b.id} type="button" onClick={() => setBlook(b.id)} aria-pressed={blook === b.id} aria-label={`${b.name}, ${c} listed`} title={`${b.name} · ${c} listed`} className={`relative rounded-lg p-1 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${blook === b.id ? 'bg-white/20 ring-2 ring-primary' : ''} ${c ? '' : 'opacity-45'}`}><BlookArt src={b.image_url} alt="" className="size-[4.5rem]" />{c > 0 && <span className="absolute bottom-0 right-0 rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">{c}</span>}</button>; })}
          </div>
        </>}
        <h2 className="text-center font-display text-2xl">{view === 'Blooks' ? (chosen ? `Results: ${chosen.name}` : 'Pick a blook to see listings') : 'Results:'}</h2>
        {(view !== 'Blooks' || chosen) && <div className="bazaar-panel grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3 p-4">
          {results.length === 0 && <p className="col-span-full py-6 text-center text-muted-foreground">No listings yet.</p>}
          {results.map(l => { const id = ids?.get(l.seller_id); return <button key={l.id} type="button" onClick={() => setOpen(l)} className="bazaar-result">
            {l.kind === 'auction' && <Gavel aria-label="Auction" className="absolute left-1.5 top-1.5 size-4 text-tile-d" />}
            <BlookArt src={l.blook.image_url} alt={l.blook.name} className="size-16" />
            <PlayerName name={playerName(id)} identity={id} className="w-full truncate text-sm" />
            <Price n={l.current_bid ?? l.price} className="text-xs" />
            {l.kind === 'auction' && <span className="text-[11px] text-muted-foreground">{timeLeft(l.ends_at)}</span>}
          </button>; })}
        </div>}
      </div>
    </div>
    {open && <ListingDialog listing={open} onClose={() => setOpen(null)} />}
    {selling && <SellDialog onClose={() => setSelling(false)} />}
  </DashboardShell>;
}

function useRefresh() { const qc = useQueryClient(); return () => ['bazaar', 'wallet', 'stats', 'collection', 'inventory', 'mail'].forEach(k => qc.invalidateQueries({ queryKey: [k] })); }

function RarityPill({ rarity }: { rarity: string }) {
  const { data: colors } = useQuery(appearanceOptions());
  return <span className="rounded-full border-2 border-white/50 px-4 py-1 font-display text-sm uppercase text-white shadow-[var(--rarity-shadow)]" style={{ background: rarityPaint(colors?.[rarity], rarityDefaults[rarity] ?? 'var(--secondary)') }}>{rarity}</span>;
}

function ListingDialog({ listing: l, onClose }: { listing: Listing; onClose: () => void }) {
  const me = usePlayer(); const { data: ids } = useQuery(identitiesOptions()); const { data: wallet } = useQuery(walletOptions()); const refresh = useRefresh();
  const min = minimumBid(l.price, l.current_bid); const [bid, setBid] = useState(min); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const mine = l.seller_id === me?.id; const seller = ids?.get(l.seller_id); const top = l.bidder_id ? ids?.get(l.bidder_id) : undefined;
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) => { setBusy(true); setMsg(''); const { error } = await fn(); setBusy(false); if (error) { setMsg(error.message); return; } setMsg(ok); refresh(); setTimeout(onClose, 900); };
  return <Dialog open onOpenChange={v => !v && onClose()}><DialogContent aria-describedby={undefined} className="max-w-md rounded-xl bg-surface p-6 text-center">
    <BlookArt src={l.blook.image_url} alt={l.blook.name} className="mx-auto size-32" />
    <DialogTitle className="font-display text-3xl">{l.blook.name}</DialogTitle>
    <p><RarityPill rarity={l.blook.rarity} /></p>
    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-lg bg-background/60 p-3"><dt className="text-muted-foreground">Seller</dt><dd><PlayerName name={playerName(seller)} identity={seller} /></dd></div>
      <div className="rounded-lg bg-background/60 p-3"><dt className="text-muted-foreground">{l.kind === 'auction' ? (l.current_bid ? 'Highest bid' : 'Starting bid') : 'Price'}</dt><dd><Price n={l.current_bid ?? l.price} className="text-lg" /></dd></div>
      {l.kind === 'auction' && <><div className="rounded-lg bg-background/60 p-3"><dt className="text-muted-foreground">Top bidder</dt><dd>{top ? <PlayerName name={playerName(top)} identity={top} /> : 'No bids yet'}</dd></div><div className="rounded-lg bg-background/60 p-3"><dt className="text-muted-foreground">Ends</dt><dd className="font-bold">{timeLeft(l.ends_at)}</dd></div></>}
    </dl>
    {mine ? (!l.bidder_id && <Button variant="secondary" disabled={busy} onClick={() => run(() => supabase.rpc('bazaar_cancel', { _listing: l.id }), 'Listing removed. The blook is back in your inventory.')}>Remove listing</Button>)
      : l.kind === 'sale' ? <Button disabled={busy || (wallet?.tokens ?? 0) < l.price} onClick={() => run(() => supabase.rpc('bazaar_buy', { _listing: l.id }), 'Bought! It is in your inventory.')}>{busy ? 'Buying…' : <>Buy for <Price n={l.price} /></>}</Button>
      : l.bidder_id === me?.id ? <p className="font-bold text-tile-c">You have the highest bid.</p>
      : <div className="flex items-end justify-center gap-2"><label className="text-left text-sm font-bold">Your bid (min {min.toLocaleString('en-US')})<input type="number" min={min} value={bid} onChange={e => setBid(Math.floor(Number(e.target.value)))} className="mt-1 w-36 rounded-md border border-surface-border bg-background px-3 py-2" /></label><Button disabled={busy || bid < min} onClick={() => run(() => supabase.rpc('bazaar_bid', { _listing: l.id, _amount: bid }), 'Bid placed! You will get mail if you are outbid.')}><Gavel />{busy ? 'Bidding…' : 'Place bid'}</Button></div>}
    {msg && <p role="status" className="text-sm font-bold">{msg}</p>}
  </DialogContent></Dialog>;
}

function SellDialog({ onClose }: { onClose: () => void }) {
  const { data: inv = [] } = useQuery(inventoryOptions()); const refresh = useRefresh();
  const owned = inv.filter(i => i.quantity > 0 && i.blooks).map(i => ({ ...i.blooks!, quantity: i.quantity })).sort((a, b) => a.name.localeCompare(b.name));
  const [pick, setPick] = useState<string | null>(null); const [price, setPrice] = useState(10); const [auction, setAuction] = useState(false); const [hours, setHours] = useState<number>(24);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const b = owned.find(o => o.id === pick); const allowAuction = !!b && canAuction(b.rarity);
  const submit = async () => { if (!b) return; setBusy(true); setMsg(''); const { error } = await supabase.rpc('bazaar_list', { _blook: b.id, _price: price, _auction: auction && allowAuction, _hours: hours }); setBusy(false); if (error) { setMsg(error.message); return; } refresh(); onClose(); };
  return <Dialog open onOpenChange={v => !v && onClose()}><DialogContent aria-describedby={undefined} className="max-h-[90dvh] max-w-xl overflow-y-auto rounded-xl bg-surface p-6">
    <DialogTitle className="font-display text-3xl">List a blook</DialogTitle>
    <p className="text-sm text-muted-foreground">The blook leaves your inventory while it is listed. Remove the listing any time before it sells (or before an auction gets a bid).</p>
    <div className="flex max-h-56 flex-wrap gap-1 overflow-y-auto rounded-lg bg-background/50 p-2">
      {owned.length === 0 && <p className="p-4 text-muted-foreground">You have no blooks to list.</p>}
      {owned.map(o => <button key={o.id} type="button" aria-pressed={pick === o.id} aria-label={`${o.name}, ${o.quantity} owned`} title={o.name} onClick={() => { setPick(o.id); if (!canAuction(o.rarity)) setAuction(false); }} className={`relative rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pick === o.id ? 'bg-white/20 ring-2 ring-primary' : ''}`}><BlookArt src={o.image_url} alt="" className="size-14" /><span className="absolute bottom-0 right-0 rounded-full bg-black/70 px-1 text-[10px] font-bold">{o.quantity}</span></button>)}
    </div>
    {b && <div className="space-y-3">
      <p className="flex items-center gap-2 font-display text-xl">{b.name} <RarityPill rarity={b.rarity} /></p>
      <div role="radiogroup" aria-label="Listing type" className="flex gap-2"><Button variant={!auction ? 'default' : 'secondary'} aria-pressed={!auction} onClick={() => setAuction(false)}>Fixed price</Button><Button variant={auction ? 'default' : 'secondary'} aria-pressed={auction} disabled={!allowAuction} onClick={() => setAuction(true)}><Gavel />Auction</Button></div>
      {!allowAuction && <p className="text-xs text-muted-foreground">Auctions are only for Legendary, Chroma, Mythical and Hidden blooks.</p>}
      <div className="flex flex-wrap gap-3"><label className="text-sm font-bold">{auction ? 'Starting bid' : 'Price'}<input type="number" min={1} value={price} onChange={e => setPrice(Math.floor(Number(e.target.value)))} className="mt-1 block w-40 rounded-md border border-surface-border bg-background px-3 py-2" /></label>
        {auction && <label className="text-sm font-bold">Length<select value={hours} onChange={e => setHours(Number(e.target.value))} className="mt-1 block rounded-md border border-surface-border bg-background px-3 py-2">{auctionHours.map(h => <option key={h} value={h}>{h < 24 ? `${h} hour${h > 1 ? 's' : ''}` : `${h / 24} day${h > 24 ? 's' : ''}`}</option>)}</select></label>}</div>
    </div>}
    {msg && <p role="alert" className="text-sm font-bold text-destructive">{msg}</p>}
    <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!b || busy || price < 1} onClick={submit}>{busy ? 'Listing…' : 'List it'}</Button></div>
  </DialogContent></Dialog>;
}
