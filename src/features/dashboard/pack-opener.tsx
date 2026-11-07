import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Blook = { id: string; name: string; emoji: string; rarity: string; weight: number };
export type Pack = { id: string; name: string; emoji: string; color: string; price: number; blooks: Blook[] };
type Pull = { id: string; name: string; emoji: string; rarity: string };

/** Glow + tag colours per rarity tier. */
export const rarityStyle: Record<string, { glow: string; tag: string; label: string }> = {
  common: { glow: 'oklch(0.6 0.03 60)', tag: 'bg-[oklch(0.55_0.03_60)]', label: 'Common' },
  uncommon: { glow: 'oklch(0.72 0.2 145)', tag: 'bg-[oklch(0.6_0.18_145)]', label: 'Uncommon' },
  rare: { glow: 'oklch(0.65 0.2 250)', tag: 'bg-[oklch(0.55_0.2_250)]', label: 'Rare' },
  epic: { glow: 'oklch(0.55 0.25 300)', tag: 'bg-[oklch(0.5_0.25_300)]', label: 'Epic' },
  legendary: { glow: 'oklch(0.75 0.19 60)', tag: 'bg-[oklch(0.68_0.19_55)]', label: 'Legendary' },
  chroma: { glow: 'oklch(0.7 0.25 0)', tag: 'rarity-rainbow', label: 'Chroma' },
};
const packBg: Record<string, string> = { 'tile-a': 'bg-tile-a', 'tile-b': 'bg-tile-b', 'tile-c': 'bg-tile-c', 'tile-d': 'bg-tile-d' };
const sellPrice: Record<string, number> = { common: 2, uncommon: 5, rare: 15, epic: 30, legendary: 75, chroma: 200 };

export function PackOpener({ pack, tokens, onClose }: { pack: Pack; tokens: number; onClose: () => void }) {
  const cache = useQueryClient();
  const [stage, setStage] = useState<'confirm' | 'ready' | 'burst' | 'reveal'>('confirm');
  const [sold, setSold] = useState<number | null>(null);
  const refresh = () => ['wallet', 'stats', 'inventory', 'collection', 'missions'].forEach(k => cache.invalidateQueries({ queryKey: [k] }));
  const buy = useMutation({
    mutationFn: async () => { const { data, error } = await supabase.rpc('open_pack', { _pack: pack.id }); if (error) throw error; return data as unknown as Pull; },
    onSuccess: () => { refresh(); setStage('ready'); },
  });
  const sell = useMutation({
    mutationFn: async (id: string) => { const { data, error } = await supabase.rpc('sell_blook', { _blook: id }); if (error) throw error; return data as number; },
    onSuccess: n => { refresh(); setSold(n); setTimeout(onClose, 900); },
  });
  const total = pack.blooks.reduce((s, b) => s + b.weight, 0) || 1;
  const pull = buy.data; const style = rarityStyle[pull?.rarity ?? 'common'] ?? rarityStyle.common!;

  function crack() { setStage('burst'); setTimeout(() => setStage('reveal'), 650); }

  if (stage === 'confirm') return (
    <div role="dialog" aria-modal="true" aria-labelledby="pack-title" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface p-5 shadow-tile" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between"><h2 id="pack-title" className="font-display text-2xl">{pack.emoji} {pack.name}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 hover:bg-glass-hover"><X className="size-5" /></button></div>
        <p className="mt-1 text-sm text-muted-foreground">Drop rates</p>
        <ul className="mt-2 space-y-1.5">{[...pack.blooks].sort((a, b) => b.weight - a.weight).map(b => (
          <li key={b.id} className="flex items-center gap-3 rounded-lg bg-glass px-3 py-1.5">
            <span className="text-2xl">{b.emoji}</span><span className="flex-1 font-bold">{b.name}</span>
            <span className={cn('rounded px-2 py-0.5 text-xs font-bold text-white', rarityStyle[b.rarity]?.tag)}>{rarityStyle[b.rarity]?.label ?? b.rarity}</span>
            <span className="w-14 text-right font-mono text-sm">{((b.weight / total) * 100).toFixed(b.weight / total < 0.01 ? 2 : 1)}%</span>
          </li>))}</ul>
        {buy.error && <p role="alert" className="mt-3 text-sm text-destructive">{buy.error.message}</p>}
        <button type="button" disabled={buy.isPending || tokens < pack.price} onClick={() => buy.mutate()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-tile-d py-2.5 font-display text-xl text-white shadow-[0_4px_0_rgb(0_0_0/0.35)] transition hover:brightness-110 active:translate-y-1 active:shadow-none disabled:opacity-60">
          {tokens < pack.price ? 'Not enough tokens' : <>Buy for <Coins className="size-5" />{pack.price}</>}
        </button>
      </div>
    </div>);

  return (
    <div role="dialog" aria-modal="true" aria-label="Opening pack" className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[radial-gradient(circle,oklch(0.32_0.04_260),oklch(0.14_0.03_260))]"
      onClick={() => stage === 'reveal' && onClose()}>
      {stage === 'reveal' && <div aria-hidden className={cn('pack-rays absolute size-[160vmax]', pull?.rarity === 'chroma' && 'rarity-rainbow-rays')} style={{ ['--glow' as string]: style.glow }} />}
      {stage === 'burst' && <><div aria-hidden className="pack-flash absolute inset-0 bg-white" />
        {Array.from({ length: 18 }, (_, i) => <span key={i} aria-hidden className="pack-spark absolute size-3 rounded-full" style={{ ['--a' as string]: `${i * 20}deg`, background: i % 2 ? 'white' : 'oklch(0.85 0.16 90)' }} />)}</>}

      {(stage === 'ready' || stage === 'burst') && (
        <button type="button" onClick={crack} disabled={stage === 'burst'} aria-label={`Click to open ${pack.name}`}
          className={cn('relative grid size-56 place-items-center rounded-2xl border-4 border-white/70 text-8xl shadow-2xl', packBg[pack.color] ?? 'bg-tile-a', stage === 'ready' ? 'pack-wobble' : 'pack-break')}>
          {pack.emoji}<span className="absolute -bottom-10 font-display text-lg text-white">Click to open!</span>
        </button>)}

      {stage === 'reveal' && pull && (
        <div className="relative flex flex-col items-center text-center text-white">
          <span className="pack-reveal text-[9rem] leading-none drop-shadow-[0_0_40px_var(--glow)]" style={{ ['--glow' as string]: style.glow }}>{pull.emoji}</span>
          <p className="mt-6 font-display text-4xl drop-shadow-[0_3px_0_rgb(0_0_0/0.4)]">{pull.name}</p>
          <span className={cn('mt-2 rounded-md px-3 py-1 text-sm font-bold uppercase tracking-wider text-white', style.tag)}>{style.label}</span>
          <div className="mt-10 flex gap-3" onClick={e => e.stopPropagation()}>
            <button type="button" disabled={sell.isPending || sold !== null} onClick={() => sell.mutate(pull.id)}
              className="flex items-center gap-2 rounded-lg bg-tile-b px-5 py-2.5 font-display text-lg shadow-[0_4px_0_rgb(0_0_0/0.35)] hover:brightness-110 disabled:opacity-70">
              {sold !== null ? <>Sold for <Coins className="size-5" />{sold}</> : <>Sell <Coins className="size-5" />{sellPrice[pull.rarity] ?? 2}</>}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-white/15 px-5 py-2.5 font-display text-lg hover:bg-white/25">Back to Market</button>
          </div>
          {sell.error && <p role="alert" className="mt-2 text-sm text-destructive">{sell.error.message}</p>}
          <p className="mt-4 text-xs text-white/60">Click anywhere to return</p>
        </div>)}
    </div>);
}
