import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Trash2, Plus, Save, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { isAdminOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';
import { listUsers, updateUser, deleteUser } from '@/lib/admin.functions';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => meta('Admin Panel', 'Staff controls for GameVerse.'),
  component: Admin, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const input = 'w-full rounded-md border border-surface-border bg-background px-2 py-1 text-sm';
const btn = 'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50';
const tabs = ['Users', 'Shop', 'Games', 'Missions'] as const;

function Admin() {
  const { data: isAdmin, isLoading } = useQuery(isAdminOptions());
  const [tab, setTab] = useState<(typeof tabs)[number]>('Users');
  if (isLoading) return <DashboardShell><p>Loading…</p></DashboardShell>;
  if (!isAdmin) return <DashboardShell><PageTitle kicker="Staff" title="Admin Panel" /><p className="mt-4 text-muted-foreground">This page is for staff only.</p></DashboardShell>;
  return <DashboardShell>
    <PageTitle kicker="Staff" title="Admin Panel" />
    <div className="mt-4 flex gap-1 border-b border-surface-border">{tabs.map(t => <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-t-md px-4 py-2 text-sm font-bold ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>)}</div>
    <div className="mt-4">{tab === 'Users' ? <Users /> : tab === 'Shop' ? <Shop /> : tab === 'Games' ? <Table table="games" fields={['emoji', 'title', 'description', 'play_url']} blank={{ emoji: '🎮', title: 'New game', description: '', play_url: '' }} /> : <Table table="missions" fields={['title', 'kind', 'goal', 'reward']} blank={{ title: 'New mission', kind: 'plays', goal: 5, reward: 10 }} />}</div>
  </DashboardShell>;
}

type U = Awaited<ReturnType<typeof listUsers>>[number];
function Users() {
  const fetchUsers = useServerFn(listUsers);
  const { data, error, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => fetchUsers() });
  if (isLoading) return <p>Loading players…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  return <div className="space-y-2">{data?.map(u => <UserRow key={u.id} u={u} />)}</div>;
}
function UserRow({ u }: { u: U }) {
  const cache = useQueryClient(); const save = useServerFn(updateUser); const del = useServerFn(deleteUser);
  const [f, setF] = useState({ username: u.username, displayName: u.displayName, tokens: u.tokens, password: '', admin: u.admin });
  const m = useMutation({ mutationFn: () => save({ data: { id: u.id, ...f, password: f.password || undefined } }), onSuccess: () => { setF(s => ({ ...s, password: '' })); cache.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const d = useMutation({ mutationFn: () => del({ data: { id: u.id } }), onSuccess: () => cache.invalidateQueries({ queryKey: ['admin-users'] }) });
  return <div className="rounded-lg bg-glass-hover p-3">
    <p className="mb-2 text-xs text-muted-foreground">{u.email} · joined {new Date(u.created).toLocaleDateString()}</p>
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_1fr_auto_auto]">
      <label className="text-xs">Username<input className={input} value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></label>
      <label className="text-xs">Display name<input className={input} value={f.displayName} onChange={e => setF({ ...f, displayName: e.target.value })} /></label>
      <label className="text-xs">Tokens<input type="number" className={input} value={f.tokens} onChange={e => setF({ ...f, tokens: Number(e.target.value) })} /></label>
      <label className="text-xs">New password<input type="password" placeholder="leave blank to keep" className={input} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
      <label className="flex items-end gap-1 pb-1 text-xs font-bold"><input type="checkbox" checked={f.admin} onChange={e => setF({ ...f, admin: e.target.checked })} /><Shield className="size-3.5" />Staff</label>
      <div className="flex items-end gap-1">
        <button type="button" disabled={m.isPending} onClick={() => m.mutate()} className={`${btn} bg-primary`}><Save className="size-3.5" />Save</button>
        <button type="button" disabled={d.isPending} onClick={() => confirm(`Delete ${u.email}?`) && d.mutate()} className={`${btn} bg-destructive`} aria-label="Delete user"><Trash2 className="size-3.5" /></button>
      </div>
    </div>
    {(m.error || d.error) && <p role="alert" className="mt-1 text-xs text-destructive">{(m.error ?? d.error)?.message}</p>}
    {m.isSuccess && <p role="status" className="mt-1 text-xs">Saved.</p>}
  </div>;
}

type TableName = 'games' | 'missions' | 'packs' | 'blooks';
type Row = Record<string, string | number> & { id: string };
function Table({ table, fields, blank, filter, title }: { table: TableName; fields: string[]; blank: Record<string, string | number>; filter?: { col: string; val: string }; title?: string }) {
  const cache = useQueryClient(); const key = ['admin', table, filter?.val ?? ''];
  const { data, error } = useQuery({ queryKey: key, queryFn: async () => {
    let q = supabase.from(table).select('*');
    if (filter) q = q.eq(filter.col, filter.val);
    const r = await q; if (r.error) throw r.error; return r.data as unknown as Row[];
  } });
  const done = () => { cache.invalidateQueries({ queryKey: ['admin', table] }); cache.invalidateQueries({ queryKey: ['shop'] }); };
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).insert({ ...blank, ...(filter ? { [filter.col]: filter.val } : {}) } as never); if (error) throw error; }, onSuccess: done });
  return <div className="space-y-2">
    <div className="flex items-center justify-between">{title ? <h3 className="font-bold">{title}</h3> : <span />}<button type="button" onClick={() => add.mutate()} className={`${btn} bg-[oklch(0.6_0.16_150)]`}><Plus className="size-3.5" />Add</button></div>
    {error && <p className="text-xs text-destructive">{error.message}</p>}
    {add.error && <p className="text-xs text-destructive">{add.error.message}</p>}
    {data?.map(r => <EditRow key={r.id} table={table} row={r} fields={fields} onDone={done} />)}
  </div>;
}
function EditRow({ table, row, fields, onDone }: { table: TableName; row: Row; fields: string[]; onDone: () => void }) {
  const [f, setF] = useState(row);
  const save = useMutation({ mutationFn: async () => { const patch = Object.fromEntries(fields.map(k => [k, f[k]])); const { error } = await supabase.from(table).update(patch as never).eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  const del = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).delete().eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  return <div className="rounded-lg bg-glass-hover p-2">
    <div className="flex flex-wrap items-end gap-2">
      {fields.map(k => <label key={k} className={`text-xs capitalize ${k === 'emoji' ? 'w-16' : typeof row[k] === 'number' ? 'w-20' : 'min-w-32 flex-1'}`}>{k.replace('_', ' ')}
        <input className={input} type={typeof row[k] === 'number' ? 'number' : 'text'} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: typeof row[k] === 'number' ? Number(e.target.value) : e.target.value })} /></label>)}
      <button type="button" onClick={() => save.mutate()} className={`${btn} bg-primary`}><Save className="size-3.5" />Save</button>
      <button type="button" onClick={() => confirm('Delete this?') && del.mutate()} className={`${btn} bg-destructive`} aria-label="Delete"><Trash2 className="size-3.5" /></button>
    </div>
    {(save.error || del.error) && <p className="mt-1 text-xs text-destructive">{(save.error ?? del.error)?.message}</p>}
    {save.isSuccess && <p className="mt-1 text-xs">Saved.</p>}
  </div>;
}

function Shop() {
  const { data: packs } = useQuery({ queryKey: ['admin', 'packs', ''], queryFn: async () => { const r = await supabase.from('packs').select('id, name').order('sort'); if (r.error) throw r.error; return r.data; } });
  const [pack, setPack] = useState('');
  return <div className="space-y-6">
    <Table table="packs" title="Packs" fields={['emoji', 'name', 'color', 'price', 'sort']} blank={{ emoji: '📦', name: 'New pack', color: 'tile-a', price: 20, sort: 99 }} />
    <div>
      <label className="text-sm font-bold">Blooks in pack <select className={`${input} mt-1 max-w-xs`} value={pack} onChange={e => setPack(e.target.value)}><option value="">Choose a pack…</option>{packs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {pack && <div className="mt-2"><Table key={pack} table="blooks" fields={['emoji', 'name', 'rarity', 'weight']} blank={{ emoji: '⭐', name: 'New blook', rarity: 'common', weight: 10 }} filter={{ col: 'pack_id', val: pack }} /></div>}
    </div>
  </div>;
}
