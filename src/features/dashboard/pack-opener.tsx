import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Minus, Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BlookArt } from './blook-art';
import { appearanceOptions } from './data';
import { rarityDefaults, safeColor } from './appearance';
import { purchaseTotal, validQuantity } from './purchase';

type Blook = { id: string; name: string; image_url: string | null; rarity: string; weight: number };
export type Pack = { id: string; name: string; image_url: string | null; gradient_start: string; gradient_end: string; open_image_url: string | null; pattern_image_url: string | null; price: number; blooks: Blook[] };
type Pull = { id: string; name: string; rarity: string; image_url?: string | null };
export interface PackOpenerProps { pack: Pack; tokens: number; onClose: () => void; }
const sellPrice: Record<string, number> = { common: 2, uncommon: 5, rare: 15, epic: 30, legendary: 75, chroma: 200 };

export function PackOpener({ pack, tokens, onClose }: PackOpenerProps) {
  const cache = useQueryClient();
  const { data: colors } = useQuery(appearanceOptions());
  const [stage, setStage] = useState<'confirm' | 'ready' | 'burst' | 'reveal'>('confirm');
  const [sold, setSold] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [rates, setRates] = useState(false);
  const [pullIndex, setPullIndex] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const cost = purchaseTotal(pack.price, quantity);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const refresh = () => ['wallet', 'stats', 'inventory', 'collection', 'missions'].forEach(k => cache.invalidateQueries({ queryKey: [k] }));
  const buy = useMutation({
    mutationFn: async () => { const r = await supabase.rpc('open_packs', { _pack: pack.id, _quantity: quantity }); if (r.error) throw r.error; return r.data as unknown as Pull[]; },
    onSuccess: () => { refresh(); setStage('ready'); },
  });
  const sell = useMutation({
    mutationFn: async (id: string) => { const r = await supabase.rpc('sell_blook', { _blook: id }); if (r.error) throw r.error; return r.data; },
    onSuccess: n => { refresh(); setSold(n); },
  });
  const result = buy.data?.[pullIndex];
  const pull = result ? { ...result, ...pack.blooks.find(b => b.id === result.id) } : undefined;
  const glow = stage === 'ready' ? safeColor(pack.gradient_start, '#17b9cc') : colors?.[pull?.rarity ?? 'common'] ?? rarityDefaults[pull?.rarity ?? 'common'] ?? 'var(--muted)';
  const total = pack.blooks.reduce((s, b) => s + b.weight, 0) || 1;
  const variables = { '--glow': glow, '--pack-start': safeColor(pack.gradient_start, '#17b9cc'), '--pack-end': safeColor(pack.gradient_end, '#308ee5') } as CSSProperties;
  function crack() { if (stage !== 'ready') return; setStage('burst'); timer.current = setTimeout(() => setStage('reveal'), 650); }

  return <Dialog open onOpenChange={open => { if (!open && !buy.isPending && stage === 'confirm') onClose(); }}>
    <DialogContent ref={scene} aria-describedby={undefined} className={stage === 'confirm' ? 'pack-confirm' : 'pack-stage translate-x-0 translate-y-0'} style={variables}
      onPointerDownOutside={e => { if (buy.isPending || stage !== 'confirm') e.preventDefault(); }}
      onEscapeKeyDown={e => { if (buy.isPending || stage !== 'confirm') e.preventDefault(); }}
      onPointerMove={e => { if (stage === 'confirm') return; const rect = e.currentTarget.getBoundingClientRect(); scene.current?.style.setProperty('--scene-x', `${((e.clientX - rect.left) / rect.width) * 100}%`); scene.current?.style.setProperty('--scene-y', `${((e.clientY - rect.top) / rect.height) * 100}%`); }}>
      <DialogTitle className="sr-only">{stage === 'confirm' ? pack.name : `Opening ${pack.name}`}</DialogTitle>
      {stage === 'confirm' ? <>
        <div className="pack-preview market-pack-art">
          {pack.pattern_image_url && <img src={pack.pattern_image_url} alt="" className="market-pack-pattern" />}
          <BlookArt src={pack.image_url} alt={pack.name} className="market-pack-picture" />
          {!pack.image_url && <span className="market-pack-name">{pack.name}</span>}
        </div>
        <div className="pack-purchase-details">
        <h2 className="font-display text-3xl sm:text-4xl">{pack.name}</h2>
        <Button variant="secondary" className="mt-3 self-start" aria-expanded={rates} aria-controls="pack-drop-rates" onClick={() => setRates(!rates)}>{rates ? 'Hide Drop Rates' : 'Show Drop Rates'}</Button>
        <span className="pack-unit-price"><Coins className="size-5 text-market-coin" />{pack.price}</span>
        {rates && <ul id="pack-drop-rates" className="pack-drop-rates">{[...pack.blooks].sort((a, b) => b.weight - a.weight).map(b => <li key={b.id} className="flex items-center gap-2 rounded-md bg-glass p-2">
          <BlookArt src={b.image_url} alt={b.name} className="size-10" /><span className="min-w-0 flex-1 font-bold">{b.name}</span>
          <span className="rarity-label" style={{ '--glow': colors?.[b.rarity] ?? rarityDefaults[b.rarity] } as CSSProperties}>{b.rarity}</span>
          <span className="text-sm">{((b.weight / total) * 100).toFixed(2)}%</span>
        </li>)}</ul>}
        <div className="pack-quantity"><label htmlFor="pack-quantity">Purchase Quantity:</label><div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Decrease quantity" disabled={quantity <= 1 || buy.isPending} onClick={() => setQuantity(n => n - 1)}><Minus /></Button>
          <input id="pack-quantity" type="number" min="1" step="1" value={quantity} disabled={buy.isPending} onChange={e => setQuantity(Number(e.target.value))} />
          <Button size="icon" variant="ghost" aria-label="Increase quantity" disabled={buy.isPending} onClick={() => setQuantity(n => n + 1)}><Plus /></Button>
        </div></div>
        {buy.error && <p role="alert" className="text-destructive">{buy.error.message}</p>}
        <Button disabled={buy.isPending || !validQuantity(quantity) || tokens < cost || !pack.blooks.length} onClick={() => buy.mutate()} className="pack-buy">{buy.isPending ? 'Purchasing…' : <>Buy {quantity} for <Coins className="text-market-coin" />{cost}</>}</Button>
        {tokens < cost && <p className="mt-2 text-sm text-muted-foreground">Not enough tokens</p>}
        </div>
      </> : <>
        <div aria-hidden className="pack-scene-gradient" />
        {pack.open_image_url && <img src={pack.open_image_url} alt="" className="pack-stage-background" />}
        {stage === 'reveal' && <div aria-hidden className="pack-rays absolute size-[160vmax]" />}
        {stage === 'burst' && <><div aria-hidden className="pack-flash absolute inset-0 bg-foreground" />{Array.from({ length: 18 }, (_, i) => <span key={i} aria-hidden className="pack-spark absolute size-3 rounded-full" style={{ '--a': `${i * 20}deg` } as CSSProperties} />)}</>}
        {stage === 'reveal' && <div key={`confetti-${pullIndex}`} aria-hidden className="pack-confetti">{Array.from({ length: 64 }, (_, i) => <span key={i} style={{ '--confetti-x': `${(i * 37) % 100}%`, '--confetti-delay': `${(i % 12) * 0.08}s`, '--confetti-duration': `${2.4 + (i % 5) * 0.25}s`, '--confetti-drift': `${(i % 2 ? 1 : -1) * (40 + i % 70)}px`, '--confetti-turn': `${(i % 2 ? 1 : -1) * (360 + i * 13)}deg` } as CSSProperties} />)}</div>}
        {(stage === 'ready' || stage === 'burst') && <div className="pack-ready"><Button variant="ghost" onClick={crack} disabled={stage === 'burst'} aria-label={`Open ${pack.name}`} className={`opening-pack ${stage === 'ready' ? 'pack-wobble' : 'pack-break'}`}>
          <BlookArt src={pack.image_url} alt={pack.name} className="size-full" />{!pack.image_url && <span className="font-display text-3xl">{pack.name}</span>}
        </Button><Button size="lg" variant="secondary" disabled={stage === 'burst'} onClick={crack}><Sparkles />{stage === 'burst' ? 'Opening…' : 'Open pack'}</Button><span className="text-sm font-bold">{pullIndex + 1} / {buy.data?.length ?? 1}</span></div>}
        {stage === 'reveal' && pull && <div key={`result-${pullIndex}`} className="pack-result" aria-live="polite">
          <BlookArt src={pull.image_url ?? null} alt={pull.name} className="pack-reveal size-56" />
          <h2 className="mt-6 font-display text-4xl">{pull.name}</h2><span className="rarity-label mt-2">{pull.rarity}</span>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Button disabled={sell.isPending || sold !== null} onClick={() => sell.mutate(pull.id)}>{sold !== null ? `Sold for ${sold}` : <>Sell <Coins />{sellPrice[pull.rarity] ?? 2}</>}</Button>{pullIndex + 1 < (buy.data?.length ?? 0) ? <Button onClick={() => { setPullIndex(i => i + 1); setSold(null); setStage('ready'); }}>Next Pack ({pullIndex + 1}/{buy.data?.length})</Button> : <Button variant="secondary" onClick={onClose}>Back to Market</Button>}</div>
          {sell.error && <p role="alert" className="mt-2 text-destructive">{sell.error.message}</p>}
        </div>}
      </>}
    </DialogContent>
  </Dialog>;
}
