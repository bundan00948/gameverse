import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { profileOptions } from '@/features/account/profile';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { Button } from '@/components/ui/button';
import { UserRound, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { applyTheme } from '@/lib/theme';
import { PageTitle } from '@/features/dashboard/page';
export const Route = createFileRoute('/_authenticated/settings')({ loader: async ({ context }) => { await context.queryClient.ensureQueryData(profileOptions()); }, head: () => ({ meta: [{ title: 'Settings — GameVerse' }, { name: 'description', content: 'Manage your GameVerse account settings.' }, { property: 'og:title', content: 'Settings — GameVerse' }, { property: 'og:description', content: 'Manage your GameVerse account settings.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Profile, errorComponent: ProfileError, notFoundComponent: () => <p>Profile not found.</p> });
function ProfileError() { const router = useRouter(); return <DashboardShell><h1 className="text-2xl">Could not load your profile</h1><Button className="mt-4" onClick={() => router.invalidate()}>Try again</Button></DashboardShell>; }
function Profile() {
 const { data } = useSuspenseQuery(profileOptions()); const cache = useQueryClient();
 const [bright, setBright] = useState(false);
 useEffect(() => { setBright(document.documentElement.classList.contains('bright')); }, []);
 const save = useMutation({ mutationFn: async (values: { username: string; display_name: string }) => { const { error } = await supabase.from('profiles').update(values).eq('id', data.id); if (error) throw error; }, onSuccess: () => cache.invalidateQueries({ queryKey: ['player-profile'] }) });
 return <DashboardShell><PageTitle kicker="Your account" title="Settings" />
 <div className="mt-8 grid gap-10 lg:grid-cols-2">
 <section className="min-w-0"><h2 className="font-display text-2xl">Profile</h2><div className="mt-5 flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-md bg-tile-a text-tile-fg"><UserRound className="size-6" /></span><div><p className="font-bold">{data.display_name || data.username || 'Player'}</p><p className="text-xs text-muted-foreground">Member since {data.created_at.slice(0, 10)}</p></div></div>
 <form className="mt-6 space-y-5" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); save.mutate({ username: String(form.get('username')).trim(), display_name: String(form.get('display_name')).trim() }); }}>
 <label className="block text-sm font-semibold">Username<input name="username" autoComplete="username" required maxLength={40} defaultValue={data.username} className="mt-2 h-12 w-full rounded-md border border-input bg-surface px-3" /></label>
 <label className="block text-sm font-semibold">Display name<input name="display_name" autoComplete="nickname" maxLength={80} defaultValue={data.display_name} className="mt-2 h-12 w-full rounded-md border border-input bg-surface px-3" /></label>
 <Button disabled={save.isPending} type="submit"><Save />{save.isPending ? 'Saving…' : 'Save profile'}</Button>{save.isSuccess && <p role="status" className="text-sm">Profile saved.</p>}{save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}</form></section>
 <section className="min-w-0 border-t border-surface-border pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><h2 className="font-display text-2xl">Appearance</h2>
 <div className="mt-6 flex items-center gap-4 border-y border-surface-border py-5"><span className="grid size-12 shrink-0 place-items-center rounded-md bg-secondary">{bright ? <Sun /> : <Moon />}</span><label htmlFor="bright-mode" className="flex-1 text-base font-bold">Bright mode</label><Switch id="bright-mode" checked={bright} onCheckedChange={next => { setBright(next); applyTheme(next ? 'bright' : 'dark'); }} /></div>
 <p role="status" className="mt-3 text-sm text-muted-foreground">{bright ? 'Bright' : 'Dark'} theme</p></section></div></DashboardShell>;
}
