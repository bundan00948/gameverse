import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCw, Sparkles } from 'lucide-react';
import tokenIcon from '@/assets/icons/gameverse-token.webp.asset.json';
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
  const [stage, setStage] = useState<'confirm' | 'ready' | 'torn' | 'drop' | 'reveal'>('confirm');
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
  const glow = stage === 'ready' || stage === 'torn' ? safeColor(pack.gradient_start, '#17b9cc') : colors?.[pull?.rarity ?? 'common'] ?? rarityDefaults[pull?.rarity ?? 'common'] ?? 'var(--muted)';
  const total = pack.blooks.reduce((s, b) => s + b.weight, 0) || 1;
  const variables = { '--glow': glow, '--pack-start': safeColor(pack.gradient_start, '#17b9cc'), '--pack-end': safeColor(pack.gradient_end, '#308ee5') } as CSSProperties;
  function crack() {
    if (stage !== 'ready') return;
    setStage('torn');
    timer.current = setTimeout(() => { setStage('drop'); timer.current = setTimeout(() => setStage('reveal'), 620); }, 1000);
  }

  return <Dialog open onOpenChange={open => { if (!open && !buy.isPending && stage === 'confirm') onClose(); }}>
    <DialogContent ref={scene} aria-describedby={undefined} className={stage === 'confirm' ? 'pack-confirm' : 'pack-stage translate-x-0 translate-y-0'} style={variables}
      onPointerDownOutside={e => { if (buy.isPending || stage !== 'confirm') e.preventDefault(); }}
      onEscapeKeyDown={e => { if (buy.isPending || stage !== 'confirm') e.preventDefault(); }}>
      <DialogTitle className="sr-only">{stage === 'confirm' ? pack.name : `Opening ${pack.name}`}</DialogTitle>
      {stage === 'confirm' ? <>
        <div className="pack-preview market-pack-art">
          {rates ? <ul id="pack-drop-rates" className="pack-drop-rates">{[...pack.blooks].sort((a, b) => b.weight - a.weight).map(b => <li key={b.id}>
            <BlookArt src={b.image_url} alt="" className="size-9 shrink-0" />
            <span className="pack-drop-name" title={b.name}>{b.name}</span>
            <span className="rarity-label" style={{ '--glow': colors?.[b.rarity] ?? rarityDefaults[b.rarity] } as CSSProperties}>{b.rarity}</span>
            <span className="pack-drop-chance">{Number(((b.weight / total) * 100).toFixed(2))}%</span>
          </li>)}</ul> : <>
            {pack.pattern_image_url && <img src={pack.pattern_image_url} alt="" className="market-pack-pattern" />}
            <BlookArt src={pack.image_url} alt={pack.name} className="market-pack-picture" />
            {!pack.image_url && <span className="market-pack-name">{pack.name}</span>}
          </>}
        </div>
        <div className="pack-purchase-details">
        <h2 className="font-display text-3xl">{pack.name}</h2>
        <Button variant="secondary" className="pack-rates-toggle" aria-expanded={rates} aria-controls={rates ? 'pack-drop-rates' : undefined} onClick={() => setRates(!rates)}>{rates ? 'Hide Drop Rates' : 'Show Drop Rates'}</Button>
        <span className="pack-unit-price"><img src={tokenIcon.url} alt="" className="size-5 object-contain" />{pack.price}</span>
        <div className="pack-quantity"><label htmlFor="pack-quantity">Purchase Quantity:</label>
          <input id="pack-quantity" type="number" min="1" step="1" value={quantity} disabled={buy.isPending} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div className="pack-quantity-shortcuts" aria-label="Adjust purchase quantity">
          {[-1, 1, 5, 10].map(change => <Button key={change} variant="secondary" disabled={buy.isPending || (change < 0 && quantity <= 1)} onClick={() => setQuantity(n => Math.max(1, (validQuantity(n) ? n : 1) + change))}>{change > 0 ? '+' : ''}{change}</Button>)}
        </div>
        <div className="pack-quantity-shortcuts" aria-label="Choose purchase quantity">
          {[1, 5, 10, 25, 50, 100].map(n => <Button key={n} variant="secondary" aria-pressed={quantity === n} disabled={buy.isPending} onClick={() => setQuantity(n)}>{n}</Button>)}
          <Button variant="secondary" size="icon" aria-label="Reset purchase quantity" disabled={buy.isPending} onClick={() => setQuantity(1)}><RotateCw /></Button>
        </div>
        {buy.error && <p role="alert" className="text-destructive">{buy.error.message}</p>}
        <Button disabled={buy.isPending || !validQuantity(quantity) || tokens < cost || !pack.blooks.length} onClick={() => buy.mutate()} className="pack-buy">{buy.isPending ? 'Purchasing…' : <>Buy {quantity} for <img src={tokenIcon.url} alt="" className="size-6 object-contain" />{cost}</>}</Button>
        {tokens < cost && <p className="mt-2 text-sm text-muted-foreground">Not enough tokens</p>}
        </div>
      </> : <>
        <div aria-hidden className="pack-scene-gradient" />
        {pack.open_image_url && <img src={pack.open_image_url} alt="" className="pack-stage-background" />}
        {stage === 'reveal' && <div aria-hidden className="pack-rays absolute size-[160vmax]" />}
        {stage === 'torn' && <div key={`flash-${pullIndex}`} aria-hidden className="pack-bg-rip-flash-dark" />}
        {(stage === 'drop' || stage === 'reveal') && <div key={`confetti-${pullIndex}`} aria-hidden className="pack-confetti">{Array.from({ length: 64 }, (_, i) => <span key={i} style={{ '--confetti-x': `${(i * 37) % 100}%`, '--confetti-delay': `${(i % 12) * 0.08}s`, '--confetti-duration': `${2.4 + (i % 5) * 0.25}s`, '--confetti-drift': `${(i % 2 ? 1 : -1) * (40 + i % 70)}px`, '--confetti-turn': `${(i % 2 ? 1 : -1) * (360 + i * 13)}deg` } as CSSProperties} />)}</div>}
        {stage !== 'reveal' && <div className="pack-ready">
          <div key={`unbox-${pullIndex}`} className={`pack-unbox ${stage !== 'ready' ? 'torn pack-unbox-peek' : ''} ${stage === 'drop' ? 'pack-unbox-cover-drop' : ''}`}>
            {pull && <BlookArt src={pull.image_url ?? null} alt="" className="pack-unbox-blook" style={{ width: "72%", height: "72%", left: "14%", top: "14%" }} />}
            {(['top', 'bot'] as const).map(h => <div key={h} aria-hidden className={`pack-unbox-half pack-unbox-half-${h}`}><BlookArt src={pack.image_url} alt="" className="size-full" />{!pack.image_url && <span className="font-display text-3xl">{pack.name}</span>}</div>)}
            <button type="button" id="pack-unbox-click-layer" className="pack-unbox-click-layer" onClick={crack} disabled={stage !== 'ready'} aria-label={`Open ${pack.name}`} />
          </div>
          <span className={`text-sm font-bold ${stage === 'ready' ? '' : 'invisible'}`}><Sparkles className="mr-1 inline size-4" />Click the pack to open · {pullIndex + 1} / {buy.data?.length ?? 1}</span>
        </div>}
        {stage === 'reveal' && <button type="button" id="pack-unbox-dismiss-layer" className="pack-unbox-dismiss-layer" aria-label={pullIndex + 1 < (buy.data?.length ?? 0) ? 'Next pack' : 'Back to Market'} onClick={() => { if (pullIndex + 1 < (buy.data?.length ?? 0)) { setPullIndex(i => i + 1); setSold(null); setStage('ready'); } else onClose(); }} />}
        {stage === 'reveal' && pull && <div key={`result-${pullIndex}`} className="pack-result pack-reveal-card" aria-live="polite">
          <BlookArt src={pull.image_url ?? null} alt={pull.name} className="pack-reveal size-56" />
          <h2 className="mt-6 font-display text-4xl">{pull.name}</h2><span className="rarity-label mt-2">{pull.rarity}</span>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Button disabled={sell.isPending || sold !== null} onClick={() => sell.mutate(pull.id)}>{sold !== null ? `Sold for ${sold}` : <>Sell <img src={tokenIcon.url} alt="" className="size-5 object-contain" />{sellPrice[pull.rarity] ?? 2}</>}</Button>{pullIndex + 1 < (buy.data?.length ?? 0) ? <Button onClick={() => { setPullIndex(i => i + 1); setSold(null); setStage('ready'); }}>Next Pack ({pullIndex + 1}/{buy.data?.length})</Button> : <Button variant="secondary" onClick={onClose}>Back to Market</Button>}</div>
          {sell.error && <p role="alert" className="mt-2 text-destructive">{sell.error.message}</p>}
        </div>}
      </>}
    </DialogContent>
  </Dialog>;
}
