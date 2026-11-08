import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { EditorSection } from './editor-section';
import { ResultPreview } from './result-preview';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/features/dashboard/image-picker';
import { listUsers } from '@/lib/admin.functions';
import { maxRoleColors, parseColorList, permissionList, roleTextStyle } from '@/features/dashboard/roles';

const input = 'mt-1 w-full min-w-0 rounded-md border border-surface-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
type Player = { id: string; label: string };

function usePlayers() {
  const fetchUsers = useServerFn(listUsers);
  return useQuery({ queryKey: ['admin-users'], queryFn: () => fetchUsers() }).data?.map(u => ({ id: u.id, label: u.username || u.email })) ?? [];
}
function refresh(cache: ReturnType<typeof useQueryClient>) { ['admin-roles', 'admin-badges', 'identities', 'my-permissions'].forEach(k => cache.invalidateQueries({ queryKey: [k] })); }

function Members({ table, column, id, players, members }: { table: 'user_staff_roles' | 'user_badges'; column: 'role_id' | 'badge_id'; id: string; players: Player[]; members: string[] }) {
  const cache = useQueryClient(); const [pick, setPick] = useState('');
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from(table).insert({ user_id: pick, [column]: id } as never); if (error) throw error; }, onSuccess: () => { setPick(''); refresh(cache); } });
  const remove = useMutation({ mutationFn: async (user: string) => { const { error } = await supabase.from(table).delete().eq('user_id', user).eq(column as 'user_id', id); if (error) throw error; }, onSuccess: () => refresh(cache) });
  return <div className="mt-3 space-y-2"><p className="text-xs font-bold">Players ({members.length})</p>
    <div className="flex flex-wrap gap-1.5">{members.map(m => <span key={m} className="inline-flex items-center gap-1 rounded-full bg-glass-hover px-2 py-0.5 text-xs font-bold">{players.find(p => p.id === m)?.label ?? 'Player'}<Button type="button" variant="ghost" size="icon" aria-label={`Remove ${players.find(p => p.id === m)?.label ?? 'player'}`} disabled={remove.isPending} onClick={() => remove.mutate(m)}><X /></Button></span>)}</div>
    <div className="flex gap-2"><select aria-label="Choose player" className={input + ' mt-0'} value={pick} onChange={e => setPick(e.target.value)}><option value="">Choose a player…</option>{players.filter(p => !members.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select><Button type="button" disabled={!pick || add.isPending} onClick={() => add.mutate()}><Plus />Give</Button></div>
    {(add.error || remove.error) && <p role="alert" className="text-xs text-destructive">{(add.error ?? remove.error)?.message}</p>}
  </div>;
}

type Role = { id: string; name: string; colors: string[]; permissions: string[]; sort: number; user_staff_roles: { user_id: string }[] };
export interface RolesPanelProps extends HTMLAttributes<HTMLDivElement> {}
export const RolesPanel = forwardRef<HTMLDivElement, RolesPanelProps>(function RolesPanel({ className, ...props }, ref) {
  const cache = useQueryClient(); const players = usePlayers();
  const { data, error } = useQuery({ queryKey: ['admin-roles'], queryFn: async () => { const r = await supabase.from('staff_roles').select('id, name, colors, permissions, sort, user_staff_roles(user_id)').order('sort'); if (r.error) throw r.error; return r.data as Role[]; } });
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from('staff_roles').insert({ name: 'New role', sort: (data?.length ?? 0) }); if (error) throw error; }, onSuccess: () => refresh(cache) });
  return <div ref={ref} {...props} className={cn("space-y-4", className)}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Roles <span className="ml-2 text-sm text-muted-foreground">{data?.length ?? 0}</span></h2><Button type="button" onClick={() => add.mutate()}><Plus />Add role</Button></div>
    <p className="text-sm text-muted-foreground">A player's highest role (lowest order number) sets their chat name color. Permissions from every role they hold are combined.</p>
    {error && <p role="alert" className="text-destructive">{error.message}</p>}
    {data?.map(r => <RoleRow key={r.id} role={r} players={players} />)}
  </div>;
});
function RoleRow({ role, players }: { role: Role; players: Player[] }) {
  const cache = useQueryClient(); const [f, setF] = useState(role);
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from('staff_roles').update({ name: f.name, colors: f.colors, permissions: f.permissions, sort: f.sort }).eq('id', role.id); if (error) throw error; }, onSuccess: () => refresh(cache) });
  const del = useMutation({ mutationFn: async () => { const { error } = await supabase.from('staff_roles').delete().eq('id', role.id); if (error) throw error; }, onSuccess: () => refresh(cache) });
  const [colorText, setColorText] = useState(role.colors.join(', '));
  const setColors = (colors: string[]) => { setF({ ...f, colors }); setColorText(colors.join(', ')); };
  return <EditorSection title={f.name || 'Role'} summary={`${f.permissions.length} permissions · ${role.user_staff_roles.length} players`}>
    <p className="text-xs text-muted-foreground">Result</p><p className="mb-3 font-display text-2xl" style={roleTextStyle(f.colors)}>{f.name || 'Role'}</p>
    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
      <label className="text-xs font-bold">Name<input className={input} value={f.name} maxLength={30} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className="text-xs font-bold">Order<input type="number" className={input} value={f.sort} onChange={e => setF({ ...f, sort: Number(e.target.value) })} /></label>
    </div>
    <label className="mt-3 block text-xs font-bold">Name colors (up to {maxRoleColors}, separated by commas)<input className={input + ' font-mono'} value={colorText} placeholder="#ff4d6d, #ffd166, #06d6a0" onChange={e => { setColorText(e.target.value); const c = parseColorList(e.target.value); if (c.length) setF({ ...f, colors: c }); }} /></label>
    <div className="mt-1 flex flex-wrap items-center gap-2">{f.colors.map((c, i) => <span key={i} className="inline-flex items-center gap-1"><input type="color" aria-label={`Color ${i + 1}`} value={c} onChange={e => setColors(f.colors.map((x, j) => j === i ? e.target.value : x))} className="h-9 w-12 rounded" />{f.colors.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove color ${i + 1}`} onClick={() => setColors(f.colors.filter((_, j) => j !== i))}><X /></Button>}</span>)}
      {f.colors.length < maxRoleColors && <Button type="button" size="sm" variant="outline" onClick={() => setColors([...f.colors, '#ffffff'])}><Plus />Color</Button>}</div>
    <p className="mt-3 text-xs font-bold">Access</p>
    <div className="mt-1 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">{permissionList.map(p => <label key={p.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.permissions.includes(p.key)} onChange={e => setF({ ...f, permissions: e.target.checked ? [...f.permissions, p.key] : f.permissions.filter(x => x !== p.key) })} />{p.label}</label>)}</div>
    <Members table="user_staff_roles" column="role_id" id={role.id} players={players} members={role.user_staff_roles.map(u => u.user_id)} />
    <div className="staff-actions"><Button type="button" variant="outline" aria-label="Delete role" onClick={() => confirm('Delete this role?') && del.mutate()}><Trash2 className="text-destructive" /></Button><Button type="button" disabled={save.isPending} onClick={() => save.mutate()}><Save />{save.isPending ? 'Saving…' : 'Save changes'}</Button></div>
    {(save.error || del.error) && <p role="alert" className="text-xs text-destructive">{(save.error ?? del.error)?.message}</p>}
    {save.isSuccess && <p role="status" className="text-xs">Saved.</p>}
  </EditorSection>;
}

type Badge = { id: string; name: string; description: string; image_url: string | null; sort: number; user_badges: { user_id: string }[] };
export interface BadgesPanelProps extends HTMLAttributes<HTMLDivElement> {}
export const BadgesPanel = forwardRef<HTMLDivElement, BadgesPanelProps>(function BadgesPanel({ className, ...props }, ref) {
  const cache = useQueryClient(); const players = usePlayers();
  const { data, error } = useQuery({ queryKey: ['admin-badges'], queryFn: async () => { const r = await supabase.from('badges').select('id, name, description, image_url, sort, user_badges(user_id)').order('name'); if (r.error) throw r.error; return r.data as Badge[]; } });
  const add = useMutation({ mutationFn: async () => { const { error } = await supabase.from('badges').insert({ name: 'New badge' }); if (error) throw error; }, onSuccess: () => refresh(cache) });
  return <div ref={ref} {...props} className={cn("space-y-4", className)}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Badges <span className="ml-2 text-sm text-muted-foreground">{data?.length ?? 0}</span></h2><Button type="button" onClick={() => add.mutate()}><Plus />Add badge</Button></div>
    {error && <p role="alert" className="text-destructive">{error.message}</p>}
    <div className="grid gap-4 lg:grid-cols-2">{data?.map(b => <BadgeRow key={b.id} badge={b} players={players} />)}</div>
  </div>;
});
function BadgeRow({ badge, players }: { badge: Badge; players: Player[] }) {
  const cache = useQueryClient(); const [f, setF] = useState(badge);
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from('badges').update({ name: f.name, description: f.description, image_url: f.image_url }).eq('id', badge.id); if (error) throw error; }, onSuccess: () => refresh(cache) });
  const del = useMutation({ mutationFn: async () => { const { error } = await supabase.from('badges').delete().eq('id', badge.id); if (error) throw error; }, onSuccess: () => refresh(cache) });
  return <EditorSection title={f.name || 'Badge'} summary={`${badge.user_badges.length} players`}>
    <ResultPreview name={f.name || 'Badge'} image={f.image_url}><p className="break-words text-sm text-muted-foreground">{f.description}</p></ResultPreview>
    <div className="grid gap-3"><label className="text-xs font-bold">Name<input className={input} value={f.name} maxLength={30} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className="text-xs font-bold">Description<input className={input} value={f.description} maxLength={120} onChange={e => setF({ ...f, description: e.target.value })} /></label>
      <ImagePicker label="Badge image" value={f.image_url} onChange={url => setF({ ...f, image_url: url })} /></div>
    <Members table="user_badges" column="badge_id" id={badge.id} players={players} members={badge.user_badges.map(u => u.user_id)} />
    <div className="staff-actions"><Button type="button" variant="outline" aria-label="Delete badge" onClick={() => confirm('Delete this badge?') && del.mutate()}><Trash2 className="text-destructive" /></Button><Button type="button" disabled={save.isPending} onClick={() => save.mutate()}><Save />{save.isPending ? 'Saving…' : 'Save changes'}</Button></div>
    {(save.error || del.error) && <p role="alert" className="text-xs text-destructive">{(save.error ?? del.error)?.message}</p>}
  </EditorSection>;
}
