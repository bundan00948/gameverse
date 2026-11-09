import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ResultPreview } from './result-preview';
import { Plus, Save, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { alphabeticalBlooks, rarityOrder, validDropWeight } from '@/features/dashboard/blook-catalog';
import { BlookArt } from '@/features/dashboard/blook-art';
import { ImagePicker } from '@/features/dashboard/image-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Blook = Tables<'blooks'>;
type Pack = Pick<Tables<'packs'>, 'id' | 'name'>;
const field = 'w-full rounded-md border border-surface-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export interface BlooksPanelProps extends HTMLAttributes<HTMLDivElement> {}
export const BlooksPanel = forwardRef<HTMLDivElement, BlooksPanelProps>(function BlooksPanel({ className, ...props }, ref) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Blook | 'new' | null>(null);
  const { data, error, isLoading } = useQuery({ queryKey: ['admin-blooks'], queryFn: async () => {
    const [blooks, packs] = await Promise.all([supabase.from('blooks').select('*'), supabase.from('packs').select('id, name').order('name')]);
    if (blooks.error) throw blooks.error;
    if (packs.error) throw packs.error;
    return { blooks: alphabeticalBlooks(blooks.data), packs: packs.data };
  } });
  const visible = data?.blooks.filter(b => b.name.toLowerCase().includes(search.toLowerCase())) ?? [];
  return <div ref={ref} {...props} className={cn("min-w-0", className)}>
    <div className="flex flex-wrap items-center gap-3 border-b border-surface-border pb-4">
      <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search blooks" placeholder="Search blooks…" className={`${field} bg-surface pl-9`} value={search} onChange={e => setSearch(e.target.value)} /></label>
      <span className="text-sm font-bold text-muted-foreground">{data?.blooks.length ?? 0} blooks</span><Button onClick={() => setSelected('new')} disabled={!data}><Plus />Add blook</Button>
    </div>
    {isLoading && <p className="mt-6">Loading blooks…</p>}{error && <p role="alert" className="mt-6 text-destructive">{error.message}</p>}
    {!isLoading && !error && !visible.length && <p className="mt-8 text-muted-foreground">{search ? 'No blooks match your search.' : 'No blooks yet.'}</p>}
    <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-4 sm:gap-6">{visible.map(b => <Button key={b.id} variant="ghost" title={b.name} onClick={() => setSelected(b)} aria-label={`Edit ${b.name}`} className="aspect-square h-auto w-full rounded-none border-0 bg-transparent p-1 shadow-none transition-transform hover:scale-105 hover:bg-transparent focus-visible:ring-2"><BlookArt src={b.image_url} alt={b.name} className="h-auto w-full max-w-20" /></Button>)}</div>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>{selected && data && <BlookEditor key={typeof selected === 'string' ? selected : selected.id} blook={selected === 'new' ? null : selected} packs={data.packs} onClose={() => setSelected(null)} />}</Dialog>
  </div>;
});
interface BlookEditorProps { blook: Blook | null; packs: Pack[]; onClose: () => void; }
function BlookEditor({ blook, packs, onClose }: BlookEditorProps) {
  const cache = useQueryClient();
  const [form, setForm] = useState({ name: blook?.name ?? '', image_url: blook?.image_url ?? null, rarity: blook?.rarity ?? 'common', weight: blook?.drop_weight ?? 10, pack_id: blook?.pack_id ?? '' });
  const done = async () => { await Promise.all(['admin-blooks', 'admin', 'shop', 'collection', 'inventory', 'stats'].map(key => cache.invalidateQueries({ queryKey: [key] }))); onClose(); };
  const save = useMutation({ mutationFn: async () => {
    if (!form.name.trim()) throw new Error('Enter a blook name.');
    if (!validDropWeight(form.weight)) throw new Error('Drop weight must be greater than zero.');
    const { weight, ...values } = form;
    const patch = { ...values, drop_weight: weight, name: form.name.trim(), pack_id: form.pack_id || null };
    const result = blook ? await supabase.from('blooks').update(patch).eq('id', blook.id) : await supabase.from('blooks').insert({ ...patch, emoji: '' });
    if (result.error) throw result.error;
  }, onSuccess: done });
  const del = useMutation({ mutationFn: async () => { if (!blook) return; const result = await supabase.from('blooks').delete().eq('id', blook.id); if (result.error) throw result.error; }, onSuccess: done });
  return <DialogContent className="max-h-[90dvh] overflow-y-auto border-surface-border bg-surface"><DialogTitle>{blook ? 'Edit blook' : 'Add blook'}</DialogTitle><DialogDescription>{blook?.name ?? 'New blook'}</DialogDescription>
    <ResultPreview name={form.name || 'New blook'} image={form.image_url}><p className="text-center text-sm capitalize">{form.rarity} · {packs.find(p => p.id === form.pack_id)?.name ?? 'Unassigned'}</p></ResultPreview>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
      <ImagePicker label="Blook image" value={form.image_url} onChange={image_url => setForm({ ...form, image_url })} />
      <label className="block space-y-1 text-sm font-bold"><span>Name</span><input required className={field} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label className="block space-y-1 text-sm font-bold"><span>Assigned pack</span><select className={field} value={form.pack_id} onChange={e => setForm({ ...form, pack_id: e.target.value })}><option value="">Unassigned</option>{packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-sm font-bold"><span>Rarity</span><select className={field} value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value })}>{[...new Set([...rarityOrder, form.rarity])].map(r => <option key={r} value={r}>{r}</option>)}</select></label><label className="space-y-1 text-sm font-bold"><span>Drop weight</span><input type="number" min="0" step="any" required className={field} value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} /></label></div>
      {(save.error || del.error) && <p role="alert" className="text-sm text-destructive">{(save.error ?? del.error)?.message}</p>}
      <div className="flex justify-between gap-3 border-t border-surface-border pt-4">{blook ? <Button type="button" variant="destructive" disabled={save.isPending || del.isPending} onClick={() => { if (confirm(`Permanently delete ${blook.name} and all owned copies?`)) del.mutate(); }}><Trash2 />Delete blook</Button> : <span />}<Button type="submit" disabled={save.isPending || del.isPending}><Save />{save.isPending ? 'Saving…' : 'Save blook'}</Button></div>
    </form>
  </DialogContent>;
}
