import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BlookArt } from './blook-art';
import { appearanceOptions } from './data';
import { rarityDefaults, safeColor } from './appearance';

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
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const refresh = () => ['wallet', 'stats', 'inventory', 'collection', 'missions'].forEach(k => cache.invalidateQueries({ queryKey: [k] }));
  const buy = useMutation({
    mutationFn: async () => { const r = await supabase.rpc('open_pack', { _pack: pack.id }); if (r.error) throw r.error; return r.data as unknown as Pull; },
    onSuccess: () => { refresh(); setStage('ready'); },
  });
  const sell = useMutation({
    mutationFn: async (id: string) => { const r = await supabase.rpc('sell_blook', { _blook: id }); if (r.error) throw r.error; return r.data; },
    onSuccess: n => { refresh(); setSold(n); },
  });
  const result = buy.data;
  const pull = result ? { ...result, ...pack.blooks.find(b => b.id === result.id) } : undefined;
  const glow = colors?.[pull?.rarity ?? 'common'] ?? rarityDefaults[pull?.rarity ?? 'common'] ?? 'var(--muted)';
  const total = pack.blooks.reduce((s, b) => s + b.weight, 0) || 1;
  const variables = { '--glow': glow, '--pack-start': safeColor(pack.gradient_start, '#17b9cc'), '--pack-end': safeColor(pack.gradient_end, '#308ee5') } as CSSProperties;
  function crack() { if (stage !== 'ready') return; setStage('burst'); timer.current = setTimeout(() => setStage('reveal'), 650); }

  return <Dialog open onOpenChange={open => { if (!open && !buy.isPending) onClose(); }}>
    <DialogContent aria-describedby={undefined} className={stage === 'confirm' ? 'pack-confirm' : 'pack-stage'} style={variables} onClick={() => { if (stage === 'reveal') onClose(); }}>
      <DialogTitle className={stage === 'confirm' ? 'font-display text-2xl' : 'sr-only'}>{stage === 'confirm' ? pack.name : `Opening ${pack.name}`}</DialogTitle>
      {stage === 'confirm' ? <>
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto">{[...pack.blooks].sort((a, b) => b.weight - a.weight).map(b => <li key={b.id} className="flex items-center gap-2 rounded-md bg-glass p-2">
          <BlookArt src={b.image_url} alt={b.name} className="size-10" /><span className="min-w-0 flex-1 font-bold">{b.name}</span>
          <span className="rarity-label" style={{ '--glow': colors?.[b.rarity] ?? rarityDefaults[b.rarity] } as CSSProperties}>{b.rarity}</span>
          <span className="text-sm">{((b.weight / total) * 100).toFixed(2)}%</span>
        </li>)}</ul>
        {buy.error && <p role="alert" className="text-destructive">{buy.error.message}</p>}
        <Button disabled={buy.isPending || tokens < pack.price || !pack.blooks.length} onClick={() => buy.mutate()} className="font-display text-lg">{buy.isPending ? 'Purchasing…' : tokens < pack.price ? 'Not enough tokens' : <>Buy for <Coins />{pack.price}</>}</Button>
      </> : <>
        {pack.open_image_url && <img src={pack.open_image_url} alt="" className="pack-stage-background" />}
        {stage === 'reveal' && <div aria-hidden className="pack-rays absolute size-[160vmax]" />}
        {stage === 'burst' && <><div aria-hidden className="pack-flash absolute inset-0 bg-foreground" />{Array.from({ length: 18 }, (_, i) => <span key={i} aria-hidden className="pack-spark absolute size-3 rounded-full bg-market-coin" style={{ '--a': `${i * 20}deg` } as CSSProperties} />)}</>}
        {(stage === 'ready' || stage === 'burst') && <Button variant="ghost" onClick={crack} disabled={stage === 'burst'} aria-label={`Open ${pack.name}`} className={`opening-pack ${stage === 'ready' ? 'pack-wobble' : 'pack-break'}`}>
          <BlookArt src={pack.image_url} alt={pack.name} className="size-full" />{!pack.image_url && <span className="font-display text-3xl">{pack.name}</span>}
        </Button>}
        {stage === 'reveal' && pull && <div className="pack-result" onClick={e => e.stopPropagation()}>
          <BlookArt src={pull.image_url ?? null} alt={pull.name} className="pack-reveal size-56" />
          <h2 className="mt-6 font-display text-4xl">{pull.name}</h2><span className="rarity-label mt-2">{pull.rarity}</span>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Button disabled={sell.isPending || sold !== null} onClick={() => sell.mutate(pull.id)}>{sold !== null ? `Sold for ${sold}` : <>Sell <Coins />{sellPrice[pull.rarity] ?? 2}</>}</Button><Button variant="secondary" onClick={onClose}>Back to Market</Button></div>
          {sell.error && <p role="alert" className="mt-2 text-destructive">{sell.error.message}</p>}
        </div>}
      </>}
    </DialogContent>
  </Dialog>;
}
