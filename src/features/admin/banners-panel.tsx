import { forwardRef, useState, type HTMLAttributes } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EditorSection } from './editor-section';
import { ImagePicker } from '@/features/dashboard/image-picker';
import { BannerCard } from '@/features/dashboard/banner-card';
import { bannersOptions, bannerSchema, bannerRarities, type Banner, type BannerDraft } from '@/features/dashboard/banners';
import { appearanceOptions } from '@/features/dashboard/data';
import { cn } from '@/lib/utils';
import { z } from 'zod';
export interface BannersPanelProps extends HTMLAttributes<HTMLDivElement> {}
/** Folded banner editors with live rarity/footer previews and sale listing controls. */
export const BannersPanel = forwardRef<HTMLDivElement, BannersPanelProps>(function BannersPanel({ className, ...props }, ref) {
 const cache = useQueryClient(); const { data, error, isPending } = useQuery(bannersOptions(true)); const [search, setSearch] = useState('');
 const add = useMutation({ mutationFn: async () => { const r = await supabase.from('banners').insert({ name: 'New banner' }); if (r.error) throw r.error; }, onSuccess: () => cache.invalidateQueries({ queryKey: ['banners'] }) });
 return <div ref={ref} {...props} className={cn('space-y-4', className)}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Banners</h2><Button disabled={add.isPending} onClick={() => add.mutate()}><Plus />Add banner</Button></div><label className="block text-sm font-bold">Search banners<input type="search" className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2" value={search} onChange={e => setSearch(e.target.value)} /></label>{isPending && <p role="status">Loading banners…</p>}{(error || add.error) && <p role="alert" className="text-destructive">{(error ?? add.error)?.message}</p>}{data?.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).map(b => <BannerEditor key={b.id} banner={b} />)}{!isPending && !data?.length && <p className="text-muted-foreground">No banners yet.</p>}</div>;
});
interface BannerEditorProps { banner: Banner }
function BannerEditor({ banner }: BannerEditorProps) {
 const [draft, setDraft] = useState<BannerDraft>(banner); const cache = useQueryClient(); const { data: colors } = useQuery(appearanceOptions());
 const save = useMutation({ mutationFn: async () => { const parsed = bannerSchema.safeParse(draft); if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check banner fields.'); const r = await supabase.from('banners').update(parsed.data).eq('id', banner.id).select('id').single(); if (r.error) throw r.error; }, onSuccess: async () => { await Promise.all(['banners','owned-banners','identities'].map(key => cache.invalidateQueries({ queryKey: [key] }))); window.localStorage.setItem('gameverse-profile-updated', String(Date.now())); } });
 const field = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2';
 return <EditorSection title={draft.name} summary={`${draft.rarity} · ${draft.price} tokens · ${draft.listed ? 'For sale' : 'Unlisted'}`}><div className="grid gap-6 lg:grid-cols-2"><div className="space-y-4"><label className="block text-sm font-bold">Name<input className={field} maxLength={80} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label><div className="grid grid-cols-2 gap-4"><label className="text-sm font-bold">Rarity<select className={field} value={draft.rarity} onChange={e => setDraft({ ...draft, rarity: z.enum(bannerRarities).parse(e.target.value) })}>{bannerRarities.map(r => <option key={r} value={r}>{r}</option>)}</select></label><label className="text-sm font-bold">Price<input className={field} type="number" min={0} value={draft.price} onChange={e => setDraft({ ...draft, price: Number(e.target.value) })} /></label></div><label className="block text-sm font-bold">Sort order<input type="number" className={field} value={draft.sort} onChange={e => setDraft({ ...draft, sort: Number(e.target.value) })} /></label><ImagePicker label="Banner artwork" value={draft.image_url} onChange={image_url => setDraft({ ...draft, image_url })} /><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={draft.listed} onChange={e => setDraft({ ...draft, listed: e.target.checked })} />Sold in Market</label></div><div className="min-w-0"><p className="mb-3 text-sm font-bold">Result</p><BannerCard banner={draft} colors={colors} variant="preview" /></div></div><div className="staff-actions"><Button disabled={save.isPending} onClick={() => save.mutate()}><Save />{save.isPending ? 'Saving…' : 'Save banner'}</Button></div>{save.error && <p role="alert" className="text-destructive">{save.error.message}</p>}{save.isSuccess && <p role="status">Saved.</p>}</EditorSection>;
}
