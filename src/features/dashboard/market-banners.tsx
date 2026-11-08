import { forwardRef, useState, type HTMLAttributes } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { BannerCard } from './banner-card';
import { bannersOptions, ownedBannersOptions, bannerPurchaseState, type Banner } from './banners';
import { appearanceOptions, walletOptions } from './data';
import { cn } from '@/lib/utils';
export interface MarketBannersProps extends HTMLAttributes<HTMLElement> {}
/** Listed banners beneath packs with explicit single-purchase confirmation. */
export const MarketBanners = forwardRef<HTMLElement, MarketBannersProps>(function MarketBanners({ className, ...props }, ref) {
 const { data: banners } = useSuspenseQuery(bannersOptions()); const { data: owned } = useSuspenseQuery(ownedBannersOptions()); const { data: colors } = useSuspenseQuery(appearanceOptions()); const { data: wallet } = useSuspenseQuery(walletOptions());
 const [chosen, setChosen] = useState<Banner | null>(null); const cache = useQueryClient();
 const purchase = useMutation({ mutationFn: async (id: string) => { const r = await supabase.rpc('purchase_banner', { _banner: id }); if (r.error) throw r.error; }, onSuccess: async () => { await Promise.all(['owned-banners','wallet','stats'].map(key => cache.invalidateQueries({ queryKey: [key] }))); setChosen(null); } });
 const state = chosen ? bannerPurchaseState(chosen, owned.some(b => b.id === chosen.id), wallet.tokens) : null;
 return <section ref={ref} {...props} className={cn('mt-10', className)} aria-labelledby="market-banners-title"><h2 id="market-banners-title" className="mb-6 border-b border-surface-border pb-3 font-display text-3xl">Banners</h2><div className="gv-banner-grid">{banners.map(b => <Button key={b.id} variant="ghost" className="gv-banner-choice" aria-label={`View ${b.name} banner, ${b.price} tokens`} onClick={() => { purchase.reset(); setChosen(b); }}><BannerCard banner={b} colors={colors}>{owned.some(o => o.id === b.id) && <span className="gv-banner-owned">Owned</span>}</BannerCard></Button>)}</div>{!banners.length && <p className="text-muted-foreground">No banners are currently for sale.</p>}<Dialog open={!!chosen} onOpenChange={open => { if (!open && !purchase.isPending) setChosen(null); }}><DialogContent className="border-surface-border bg-surface"><DialogTitle className="font-display text-2xl">{chosen?.name}</DialogTitle><DialogDescription>Purchase this nameplate background with tokens.</DialogDescription>{chosen && <BannerCard banner={chosen} colors={colors} variant="preview" />}<Button disabled={state !== 'available' || purchase.isPending} onClick={() => chosen && purchase.mutate(chosen.id)}>{purchase.isPending ? 'Purchasing…' : state === 'owned' ? 'Already owned' : state === 'insufficient' ? 'Not enough tokens' : state === 'unlisted' ? 'Not for sale' : `Buy for ${chosen?.price} tokens`}</Button>{purchase.error && <p role="alert" className="text-destructive">{purchase.error.message}</p>}</DialogContent></Dialog></section>;
});
