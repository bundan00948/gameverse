import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { identitiesOptions } from '@/features/dashboard/roles';
import { creditsOptions, CreditPlate, type CreditRow } from '@/features/credits/credits';
import { EditorSection } from './editor-section';

const input = 'mt-1 w-full rounded-md border border-surface-border bg-background px-3 py-2 text-sm';
export function CreditsPanel() {
  const cache = useQueryClient();
  const { data: rows = [] } = useQuery(creditsOptions());
  const { data: ids } = useQuery(identitiesOptions());
  const players = [...(ids?.entries() ?? [])].filter(([, v]) => v.username).sort((x, y) => (x[1].displayName || x[1].username).localeCompare(y[1].displayName || y[1].username));
  const [pick, setPick] = useState('');
  const done = () => cache.invalidateQueries({ queryKey: ['credits'] });
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from('credits').insert({ user_id: pick, sort: rows.length }); if (error) throw error; }, onSuccess: () => { setPick(''); void done(); } });
  return <section className="space-y-4">
    <h2 className="font-display text-2xl">Credits</h2>
    <p className="text-sm text-muted-foreground">Order 1 is the big nameplate, order 2 the medium one, the rest show two per row.</p>
    <div className="flex flex-wrap items-end gap-2"><label className="min-w-60 flex-1 text-sm font-bold">Player<select className={input} value={pick} onChange={e => setPick(e.target.value)}><option value="">Choose a player…</option>{players.map(([id, v]) => <option key={id} value={id}>{v.displayName || v.username}{v.codeId ? ` (#${v.codeId})` : ''}</option>)}</select></label><Button disabled={!pick || add.isPending} onClick={() => add.mutate()}><Plus />Add to credits</Button></div>
    {add.error && <p role="alert" className="text-destructive">{add.error.message}</p>}
    {rows.map((r, i) => <CreditEditor key={r.id} row={r} index={i} onDone={done} identity={ids?.get(r.user_id)} />)}
  </section>;
}
function CreditEditor({ row, index, onDone, identity }: { row: CreditRow; index: number; onDone: () => void; identity: Parameters<typeof CreditPlate>[0]['identity'] }) {
  const [desc, setDesc] = useState(row.description); const [sort, setSort] = useState(row.sort);
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from('credits').update({ description: desc, sort }).eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  const del = useMutation({ mutationFn: async () => { const { error } = await supabase.from('credits').delete().eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  return <EditorSection title={identity?.displayName || identity?.username || 'Player'} summary={index === 0 ? 'Big' : index === 1 ? 'Medium' : 'Small'}>
    <div className="grid gap-4 md:grid-cols-2"><div className="space-y-3">
      <label className="block text-sm font-bold">Description<textarea className={input} rows={3} maxLength={200} value={desc} onChange={e => setDesc(e.target.value)} /></label>
      <label className="block text-sm font-bold">Order<input className={input} type="number" value={sort} onChange={e => setSort(Number(e.target.value))} /></label>
    </div><CreditPlate size={index === 0 ? 'big' : index === 1 ? 'medium' : 'small'} identity={identity} description={desc} /></div>
    {(save.error || del.error) && <p role="alert" className="text-destructive">{(save.error ?? del.error)?.message}</p>}
    <div className="staff-actions"><Button variant="outline" aria-label="Remove" disabled={del.isPending} onClick={() => confirm('Remove from credits?') && del.mutate()}><Trash2 className="text-destructive" /></Button><Button disabled={save.isPending} onClick={() => save.mutate()}><Save />{save.isPending ? 'Saving…' : 'Save changes'}</Button></div>
  </EditorSection>;
}
