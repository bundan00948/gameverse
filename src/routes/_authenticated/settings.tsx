import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { profileOptions } from '@/features/account/profile';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Save, Link2, Trash2, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { loginDurations } from '@/lib/account-safety';
import { applyTheme } from '@/lib/theme';
import { PageTitle } from '@/features/dashboard/page';
import { identitiesOptions } from '@/features/dashboard/roles';
import { PlayerAvatar, PlayerName, BadgeList } from '@/features/dashboard/player-identity';
import { playerName, invalidatePlayerProfiles } from '@/features/dashboard/player-profile';
export const Route = createFileRoute('/_authenticated/settings')({ loader: async ({ context }) => { await context.queryClient.ensureQueryData(profileOptions()); }, head: () => ({ meta: [{ title: 'Settings — GameVerse' }, { name: 'description', content: 'Manage your GameVerse account settings.' }, { property: 'og:title', content: 'Settings — GameVerse' }, { property: 'og:description', content: 'Manage your GameVerse account settings.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Profile, errorComponent: ProfileError, notFoundComponent: () => <p>Profile not found.</p> });
function ProfileError() { const router = useRouter(); return <DashboardShell><h1 className="text-2xl">Could not load your profile</h1><Button className="mt-4" onClick={() => router.invalidate()}>Try again</Button></DashboardShell>; }
function Profile() {
 const { data } = useSuspenseQuery(profileOptions()); const { data: ids } = useSuspenseQuery(identitiesOptions()); const identity = ids.get(data.id); const name = playerName(identity); const cache = useQueryClient();
 const [bright, setBright] = useState(false);
 useEffect(() => { setBright(document.documentElement.classList.contains('bright')); }, []);
 const save = useMutation({ mutationFn: async (values: { username: string; display_name: string }) => { const { error } = await supabase.from('profiles').update(values).eq('id', data.id); if (error) throw error; }, onSuccess: () => invalidatePlayerProfiles(cache) });
 return <DashboardShell><PageTitle kicker="Your account" title="Settings" />
 <div className="mt-8 grid gap-10 lg:grid-cols-2">
 <section className="min-w-0"><h2 className="font-display text-2xl">Profile</h2><div className="mt-5 flex items-center gap-3"><PlayerAvatar name={name} identity={identity} className="size-12" /><div><p className="font-bold"><PlayerName name={name} identity={identity} /></p><BadgeList identity={identity} /><p className="text-xs text-muted-foreground">Member since {data.created_at.slice(0, 10)}</p></div></div>
 <form className="mt-6 space-y-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); save.mutate({ username: String(form.get('username')).trim(), display_name: String(form.get('display_name')).trim() }); }}>
 <label className="block text-sm font-semibold">Username<input name="username" autoComplete="username" required maxLength={40} defaultValue={data.username} className="mt-2 h-12 w-full rounded-md border border-input bg-surface px-3" /></label>
 <label className="block text-sm font-semibold">Display name<input name="display_name" autoComplete="nickname" maxLength={80} defaultValue={data.display_name} className="mt-2 h-12 w-full rounded-md border border-input bg-surface px-3" /></label>
 <Button disabled={save.isPending} type="submit"><Save />{save.isPending ? 'Saving…' : 'Save profile'}</Button>{save.isSuccess && <p role="status" className="text-sm">Profile saved.</p>}{save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}</form></section>
 <section className="min-w-0 border-t border-surface-border pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><h2 className="font-display text-2xl">Appearance</h2>
 <div className="mt-6 flex items-center gap-4 border-y border-surface-border py-5"><span className="grid size-12 shrink-0 place-items-center rounded-md bg-secondary">{bright ? <Sun /> : <Moon />}</span><label htmlFor="bright-mode" className="flex-1 text-base font-bold">Bright mode</label><Switch id="bright-mode" checked={bright} onCheckedChange={next => { setBright(next); applyTheme(next ? 'bright' : 'dark'); }} /></div>
 <p role="status" className="mt-3 text-sm text-muted-foreground">{bright ? 'Bright' : 'Dark'} theme</p><LoginLinks /></section></div></DashboardShell>;
}

function LoginLinks() {
 const cache = useQueryClient(); const [fresh, setFresh] = useState<string | null>(null);
 const [hours, setHours] = useState(24);
 const { data: links = [] } = useQuery({ queryKey: ['auth-links'], queryFn: async () => { const r = await supabase.from('auth_links').select('id, created_at, expires_at').is('used_at', null).gt('expires_at', new Date().toISOString()).order('created_at'); if (r.error) throw r.error; return r.data; } });
 const create = useMutation({ mutationFn: async () => { const r = await supabase.rpc('create_auth_link', { _hours: hours }); if (r.error) throw r.error; return `${window.location.origin}/login?key=${r.data}`; }, onSuccess: url => { setFresh(url); void cache.invalidateQueries({ queryKey: ['auth-links'] }); } });
 const remove = useMutation({ mutationFn: async (id: string) => { const r = await supabase.from('auth_links').delete().eq('id', id); if (r.error) throw r.error; }, onSuccess: () => cache.invalidateQueries({ queryKey: ['auth-links'] }) });
 return <div className="mt-10"><h2 className="font-display text-2xl">Login links</h2>
 <p className="mt-2 text-sm text-muted-foreground">Each link works once. Maximum 2 active links.</p>
 <label className="mt-4 block text-sm font-bold">Link duration<select aria-label="Link duration" value={hours} onChange={e => setHours(Number(e.target.value))} className="mt-2 block h-11 rounded-md border border-input bg-surface px-3">{loginDurations.map(d => <option key={d.hours} value={d.hours}>{d.label}</option>)}</select></label>
 <Button className="mt-4" disabled={create.isPending || links.length >= 2} onClick={() => create.mutate()}><Link2 />{links.length >= 2 ? '2 of 2 active' : 'Generate login link'}</Button>
 {create.error && <p role="alert" className="mt-2 text-sm text-destructive">{create.error.message}</p>}
 {fresh && <div className="mt-4 rounded-md border border-surface-border bg-surface p-3"><p className="text-xs font-bold">Copy now — it won't be shown again:</p><div className="mt-2 flex gap-2"><input readOnly value={fresh} aria-label="New login link" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs" onFocus={e => e.currentTarget.select()} /><Button type="button" variant="outline" aria-label="Copy login link" onClick={() => void navigator.clipboard.writeText(fresh)}><Copy /></Button></div></div>}
 <ul className="mt-4 space-y-2">{links.map(l => <li key={l.id} className="flex items-center gap-3 rounded-md border border-surface-border px-3 py-2 text-sm"><Link2 className="size-4" /><span className="flex-1">Expires {new Date(l.expires_at).toLocaleString()}</span><Button type="button" variant="ghost" aria-label="Remove login link" disabled={remove.isPending} onClick={() => remove.mutate(l.id)}><Trash2 /></Button></li>)}</ul></div>;
}
