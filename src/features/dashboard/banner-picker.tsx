import { forwardRef, type HTMLAttributes } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ownedBannersOptions } from './banners';
import { invalidatePlayerProfiles } from './player-profile';
import { cn } from '@/lib/utils';
export interface BannerPickerProps extends HTMLAttributes<HTMLDivElement> { userId: string; selected?: string | null | undefined; onSelected: () => void }
/** Select owned backgrounds, even when no longer listed for sale. */
export const BannerPicker = forwardRef<HTMLDivElement, BannerPickerProps>(function BannerPicker({ userId, selected, onSelected, className, ...props }, ref) {
 const cache = useQueryClient(); const { data, error, isPending } = useQuery(ownedBannersOptions());
 const save = useMutation({ mutationFn: async (id: string | null) => { const r = await supabase.from('profiles').update({ banner_id: id }).eq('id', userId).select('banner_id').single(); if (r.error) throw r.error; if (r.data.banner_id !== id) throw new Error('Your banner could not be saved.'); }, onSuccess: async () => { invalidatePlayerProfiles(cache); await cache.refetchQueries({ queryKey: ['identities'] }); onSelected(); } });
 return <div ref={ref} {...props} className={cn('space-y-4', className)}><Button variant="outline" aria-pressed={!selected} disabled={save.isPending} onClick={() => save.mutate(null)}>Default background</Button>{isPending && <p role="status">Loading your banners…</p>}<div className="grid max-h-[55dvh] gap-3 overflow-y-auto">{data?.map(b => <Button key={b.id} variant="ghost" aria-pressed={selected === b.id} disabled={save.isPending} className="h-auto flex-col items-stretch gap-2 whitespace-normal border border-surface-border p-3" onClick={() => save.mutate(b.id)}>{b.image_url && <img src={b.image_url} alt="" className="aspect-[4.5/1] w-full object-contain" />}<span>{b.name}{selected === b.id ? ' · Selected' : ''}</span></Button>)}</div>{!isPending && !data?.length && <p>No banners owned yet.</p>}<Button asChild variant="link"><Link to="/shop" onClick={onSelected}>Browse Market banners</Link></Button>{(error || save.error) && <p role="alert" className="text-destructive">{(error ?? save.error)?.message}</p>}</div>;
});
