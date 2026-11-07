import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Trash2, Plus, Save, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { isAdminOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';
import { ImagePicker } from '@/features/dashboard/image-picker';
import { Button } from '@/components/ui/button';
import { rarityColors, rarityDefaults } from '@/features/dashboard/appearance';
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
    <Link to="/admin-blooks" preload={false} reloadDocument className="mt-3 inline-block text-sm font-bold text-primary underline">Blooks</Link>
    <div className="mt-4 flex gap-1 border-b border-surface-border">{tabs.map(t => <Button key={t} type="button" onClick={() => setTab(t)} className={`rounded-t-md px-4 py-2 text-sm font-bold ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{t}</Button>)}</div>
    <div className="mt-4">{tab === 'Users' ? <Users /> : tab === 'Shop' ? <Shop /> : tab === 'Games' ? <Table table="games" fields={['title', 'description', 'play_url']} blank={{ emoji: '', title: 'New game', description: '', play_url: '' }} /> : <Table table="missions" fields={['title', 'kind', 'goal', 'reward']} blank={{ title: 'New mission', kind: 'plays', goal: 5, reward: 10 }} />}</div>
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
        <Button type="button" disabled={m.isPending} onClick={() => m.mutate()}><Save className="size-3.5" />Save</Button>
        <Button type="button" disabled={d.isPending} onClick={() => confirm(`Delete ${u.email}?`) && d.mutate()} className={`${btn} bg-destructive`} aria-label="Delete user"><Trash2 className="size-3.5" /></Button>
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
  const done = () => { ['admin', 'admin-blooks', 'shop', 'collection', 'inventory'].forEach(key => cache.invalidateQueries({ queryKey: [key] })); };
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).insert({ ...blank, ...(filter ? { [filter.col]: filter.val } : {}) } as never); if (error) throw error; }, onSuccess: done });
  return <div className="space-y-2">
    <div className="flex items-center justify-between">{title ? <h3 className="font-bold">{title}</h3> : <span />}<Button type="button" onClick={() => add.mutate()} className={`${btn} bg-[oklch(0.6_0.16_150)]`}><Plus className="size-3.5" />Add</Button></div>
    {error && <p className="text-xs text-destructive">{error.message}</p>}
    {add.error && <p className="text-xs text-destructive">{add.error.message}</p>}
    {data?.map(r => <EditRow key={r.id} table={table} row={r} fields={fields} onDone={done} />)}
  </div>;
}
function EditRow({ table, row, fields, onDone }: { table: TableName; row: Row; fields: string[]; onDone: () => void }) {
  const [f, setF] = useState(row);
  const save = useMutation({ mutationFn: async () => { const patch = Object.fromEntries([...fields, ...Object.keys(row).filter(k => k.endsWith('image_url'))].map(k => [k, f[k]])); const { error } = await supabase.from(table).update(patch as never).eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  const del = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).delete().eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  return <div className="rounded-lg bg-glass-hover p-2">
    <div className="flex flex-wrap items-end gap-2">
      {fields.map(k => <label key={k} className={`text-xs capitalize ${k === 'emoji' ? 'w-16' : typeof row[k] === 'number' ? 'w-20' : 'min-w-32 flex-1'}`}>{k.replaceAll('_', ' ')}
        <input className={input} type={k.startsWith('gradient_') ? 'color' : typeof row[k] === 'number' ? 'number' : 'text'} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: typeof row[k] === 'number' ? Number(e.target.value) : e.target.value })} /></label>)}
      {Object.keys(row).filter(k => k.endsWith('image_url')).map(k => <ImagePicker key={k} label={k === 'image_url' ? table === 'packs' ? 'Pack image' : 'Blook image' : k === 'open_image_url' ? 'Pack open container image' : 'Bottom-right pattern image'} value={(f[k] as string | null) ?? null} onChange={url => setF({ ...f, [k]: url as string })} />)}
      <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}><Save className="size-3.5" />Save</Button>
      <Button type="button" onClick={() => confirm(table === 'packs' ? 'Delete this pack? Its blooks and owned copies will be kept and unassigned.' : 'Delete this?') && del.mutate()} className={`${btn} bg-destructive`} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
    </div>
    {(save.error || del.error) && <p className="mt-1 text-xs text-destructive">{(save.error ?? del.error)?.message}</p>}
    {save.isSuccess && <p className="mt-1 text-xs">Saved.</p>}
  </div>;
}

function Shop() {
  return <div className="space-y-6">
    <RarityEditor />
    <Table table="packs" title="Packs" fields={['name', 'gradient_start', 'gradient_end', 'price', 'sort']} blank={{ emoji: '', name: 'New pack', gradient_start: '#17b9cc', gradient_end: '#308ee5', price: 20, sort: 99 }} />
    <Link to="/admin-blooks" preload={false} reloadDocument className="inline-block text-sm font-bold text-primary underline">Manage blooks</Link>
  </div>;
}

function RarityEditor() {
  const cache = useQueryClient();
  const { data, error } = useQuery({ queryKey: ['admin-rarity'], queryFn: async () => {
    const r = await supabase.from('market_settings').select('colors').eq('id', 'rarity').maybeSingle();
    if (r.error) throw r.error;
    return rarityColors(r.data?.colors);
  } });
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const colors = draft ?? data ?? rarityDefaults;
  const save = useMutation({ mutationFn: async () => {
    const r = await supabase.from('market_settings').upsert({ id: 'rarity', colors });
    if (r.error) throw r.error;
  }, onSuccess: () => { cache.invalidateQueries({ queryKey: ['market-appearance'] }); cache.invalidateQueries({ queryKey: ['admin-rarity'] }); } });
  return <section className="space-y-3 border-b border-surface-border pb-4"><h3 className="font-bold">Rarity colors</h3>
    <div className="flex flex-wrap gap-4">{Object.entries(colors).map(([key, value]) => <label key={key} className="flex items-center gap-2 text-sm capitalize">{key}<input aria-label={`${key} color`} type="color" value={value} onChange={e => setDraft({ ...colors, [key]: e.target.value })} /></label>)}</div>
    <Button size="sm" onClick={() => save.mutate()} disabled={!data || save.isPending}><Save />Save rarity colors</Button>
    {(error || save.error) && <p role="alert" className="text-destructive">{(error ?? save.error)?.message}</p>}
    {save.isSuccess && <p role="status">Saved.</p>}
  </section>;
}
