import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Trash2, Plus, Save, Shield, Users as UsersIcon, Store, Backpack, Gamepad2, Target, Crown, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { isAdminOptions } from '@/features/dashboard/data';
import { permissionsOptions } from '@/features/dashboard/roles';
import { RolesPanel, BadgesPanel } from '@/features/admin/roles-panel';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';
import { ImagePicker } from '@/features/dashboard/image-picker';
import { Button } from '@/components/ui/button';
import { rarityColors, rarityDefaults } from '@/features/dashboard/appearance';
import { listUsers, updateUser, deleteUser } from '@/lib/admin.functions';
import { BlooksPanel } from '@/features/admin/blooks-panel';
import { gameEmbedUrl } from '@/features/dashboard/game-embed';

export const Route = createFileRoute('/_authenticated/admin')({
  validateSearch: (search: Record<string, unknown>): { tab?: (typeof tabs)[number] } => {
    const tab = tabs.find(tab => tab === search['tab']);
    return tab ? { tab } : {};
  },
  head: () => meta('Admin Panel', 'Staff controls for GameVerse.'),
  component: Admin, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

const input = 'mt-1 w-full min-w-0 rounded-md border border-surface-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const btn = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50';
const tabs = ['Users', 'Roles', 'Badges', 'Shop', 'Blooks', 'Games', 'Missions'] as const;
const tabIcons = { Users: UsersIcon, Roles: Crown, Badges: Award, Shop: Store, Blooks: Backpack, Games: Gamepad2, Missions: Target };
const tabPerm = { Users: 'users', Roles: 'roles', Badges: 'badges', Shop: 'shop', Blooks: 'blooks', Games: 'games', Missions: 'missions' } as const;

function Admin() {
  const { data: perms = [], isLoading } = useQuery(permissionsOptions());
  const { data: isFullAdmin = false } = useQuery(isAdminOptions());
  const allowed = tabs.filter(t => perms.includes(tabPerm[t]));
  const search = Route.useSearch();
  const tab = search.tab && allowed.includes(search.tab) ? search.tab : allowed[0];
  const navigate = Route.useNavigate();
  if (isLoading) return <DashboardShell><p>Loading…</p></DashboardShell>;
  if (!tab) return <DashboardShell><PageTitle kicker="Staff" title="Admin Panel" /><p className="mt-4 text-muted-foreground">This page is for staff only.</p></DashboardShell>;
  return <DashboardShell bare><div className="staff-workspace">
    <PageTitle kicker="Staff" title="Admin Panel" />
    <nav aria-label="Admin sections" className="staff-tabs">{allowed.map(t => { const Icon = tabIcons[t]; return <Button key={t} type="button" variant={tab === t ? 'default' : 'ghost'} aria-pressed={tab === t} onClick={() => navigate({ search: { tab: t }, replace: true })} className="gap-2 font-bold"><Icon />{t}</Button>; })}</nav>
    <div className="mt-6">{tab === 'Blooks' ? <BlooksPanel /> : tab === 'Users' ? <Users canGrantStaff={isFullAdmin} /> : tab === 'Roles' ? <RolesPanel /> : tab === 'Badges' ? <BadgesPanel /> : tab === 'Shop' ? <Shop /> : tab === 'Games' ? <Table title="Games" table="games" fields={['title', 'description', 'play_url']} blank={{ emoji: '', title: 'New game', description: '', play_url: '' }} /> : <Table title="Missions" table="missions" fields={['title', 'kind', 'goal', 'reward']} blank={{ title: 'New mission', kind: 'plays', goal: 5, reward: 10 }} />}</div>
  </div></DashboardShell>;
}

type U = Awaited<ReturnType<typeof listUsers>>[number];
function Users({ canGrantStaff }: { canGrantStaff: boolean }) {
  const fetchUsers = useServerFn(listUsers);
  const { data, error, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => fetchUsers() });
  if (isLoading) return <p>Loading players…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;
  return <div className="space-y-4">{data?.map(u => <UserRow key={u.id} u={u} canGrantStaff={canGrantStaff} />)}</div>;
}
function UserRow({ u, canGrantStaff }: { u: U; canGrantStaff: boolean }) {
  const cache = useQueryClient(); const save = useServerFn(updateUser); const del = useServerFn(deleteUser);
  const [f, setF] = useState({ username: u.username, displayName: u.displayName, tokens: u.tokens, password: '', admin: u.admin });
  const m = useMutation({ mutationFn: () => save({ data: { id: u.id, ...f, password: f.password || undefined } }), onSuccess: () => { setF(s => ({ ...s, password: '' })); cache.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const d = useMutation({ mutationFn: () => del({ data: { id: u.id } }), onSuccess: () => cache.invalidateQueries({ queryKey: ['admin-users'] }) });
  return <div className="rounded-lg border border-surface-border bg-surface p-4">
    <p className="mb-4 break-words border-b border-surface-border pb-3 text-sm text-muted-foreground">{u.email} · joined {new Date(u.created).toLocaleDateString()}</p>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs">Username<input className={input} value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></label>
      <label className="text-xs">Display name<input className={input} value={f.displayName} onChange={e => setF({ ...f, displayName: e.target.value })} /></label>
      <label className="text-xs">Tokens<input type="number" className={input} value={f.tokens} onChange={e => setF({ ...f, tokens: Number(e.target.value) })} /></label>
      <label className="text-xs">New password<input type="password" placeholder="leave blank to keep" className={input} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
      <label className="flex items-end gap-1 pb-1 text-xs font-bold"><input type="checkbox" disabled={!canGrantStaff} checked={f.admin} onChange={e => setF({ ...f, admin: e.target.checked })} /><Shield className="size-3.5" />Full admin</label>
      <div className="flex items-end justify-end gap-2 sm:col-span-2 xl:col-span-3">
        <Button type="button" disabled={m.isPending} onClick={() => m.mutate()}><Save className="size-3.5" />Save</Button>
        <Button type="button" disabled={d.isPending} onClick={() => confirm(`Delete ${u.email}?`) && d.mutate()} variant="destructive" className={btn} aria-label="Delete user"><Trash2 className="size-3.5" /></Button>
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
  const done = () => { ['admin', 'admin-blooks', 'games', 'shop', 'collection', 'inventory'].forEach(key => cache.invalidateQueries({ queryKey: [key] })); };
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).insert({ ...blank, ...(filter ? { [filter.col]: filter.val } : {}) } as never); if (error) throw error; }, onSuccess: done });
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">{title ? <h3 className="text-xl font-bold">{title} <span className="ml-2 text-sm text-muted-foreground">{data?.length ?? 0}</span></h3> : <span />}<Button type="button" onClick={() => add.mutate()} disabled={add.isPending}><Plus />{add.isPending ? 'Adding…' : `Add ${table === 'missions' ? 'mission' : table === 'games' ? 'game' : 'pack'}`}</Button></div>
    {error && <p className="text-xs text-destructive">{error.message}</p>}
    {add.error && <p className="text-xs text-destructive">{add.error.message}</p>}
    {data?.map(r => <EditRow key={r.id} table={table} row={r} fields={fields} onDone={done} />)}
  </div>;
}
function EditRow({ table, row, fields, onDone }: { table: TableName; row: Row; fields: string[]; onDone: () => void }) {
  const [f, setF] = useState(row);
  const save = useMutation({ mutationFn: async () => { if (table === 'games' && f['play_url'] && !gameEmbedUrl(String(f['play_url']))) throw new Error('Enter a valid HTTPS embed link.'); const patch = Object.fromEntries([...fields, ...Object.keys(row).filter(k => k.endsWith('image_url'))].map(k => [k, f[k]])); const { error } = await supabase.from(table).update(patch as never).eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  const del = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).delete().eq('id', row.id); if (error) throw error; }, onSuccess: onDone });
  return <div className="rounded-lg border border-surface-border bg-surface p-4">
    <div className="staff-item-heading"><h4 className="min-w-0 break-words text-lg font-bold">{String(row['name'] ?? row['title'] ?? '')}</h4><span className="text-xs font-bold uppercase text-muted-foreground">{table === 'packs' ? 'Pack' : table === 'games' ? 'Game' : 'Mission'}</span></div>
    <div className="grid min-w-0 grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map(k => <label key={k} className="min-w-0 text-xs font-bold capitalize">{k === 'play_url' ? 'Embed link' : k.replaceAll('_', ' ')}
        <input className={input} type={k.startsWith('gradient_') ? 'color' : typeof row[k] === 'number' ? 'number' : 'text'} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: typeof row[k] === 'number' ? Number(e.target.value) : e.target.value })} /></label>)}
      {Object.keys(row).filter(k => k.endsWith('image_url')).map(k => <ImagePicker key={k} label={k === 'image_url' ? table === 'packs' ? 'Pack image' : table === 'games' ? 'Application icon' : 'Blook image' : k === 'open_image_url' ? 'Pack open container image' : 'Bottom-right pattern image'} value={(f[k] as string | null) ?? null} onChange={url => setF({ ...f, [k]: url as string })} />)}
    </div>
    <div className="staff-actions"><Button type="button" disabled={save.isPending || del.isPending} onClick={() => confirm(table === 'packs' ? 'Delete this pack? Its blooks and owned copies will be kept and unassigned.' : 'Delete this?') && del.mutate()} variant="outline" aria-label="Delete" title="Delete"><Trash2 className="text-destructive" /></Button><Button type="button" disabled={save.isPending || del.isPending} onClick={() => save.mutate()}><Save />{save.isPending ? 'Saving…' : 'Save changes'}</Button></div>
    {(save.error || del.error) && <p className="mt-1 text-xs text-destructive">{(save.error ?? del.error)?.message}</p>}
    {save.isSuccess && <p className="mt-1 text-xs">Saved.</p>}
  </div>;
}

function Shop() {
  return <div className="space-y-6">
    <RarityEditor />
    <Table table="packs" title="Packs" fields={['name', 'gradient_start', 'gradient_end', 'price', 'sort']} blank={{ emoji: '', name: 'New pack', gradient_start: '#17b9cc', gradient_end: '#308ee5', price: 20, sort: 99 }} />
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
    <div className="staff-rarity-grid">{Object.entries(colors).map(([key, value]) => <label key={key}>{key}<input aria-label={`${key} color`} type="color" value={value} onChange={e => setDraft({ ...colors, [key]: e.target.value })} /></label>)}</div>
    <Button size="sm" onClick={() => save.mutate()} disabled={!data || save.isPending}><Save />Save rarity colors</Button>
    {(error || save.error) && <p role="alert" className="text-destructive">{(error ?? save.error)?.message}</p>}
    {save.isSuccess && <p role="status">Saved.</p>}
  </section>;
}
