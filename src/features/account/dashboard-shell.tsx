import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Gamepad2, BarChart3, History, Store, Backpack, Target, MessageCircle, Settings, LogOut } from 'lucide-react';
const nav = [
  { to: '/dashboard', label: 'Games', icon: Gamepad2 },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/history', label: 'History', icon: History },
  { to: '/shop', label: 'Shop', icon: Store },
  { to: '/inventory', label: 'Inventory', icon: Backpack },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;
import { supabase } from '@/integrations/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { usePlayer } from './session';
import { cn } from '@/lib/utils';

const navClass =
  'flex items-center gap-2 rounded-md border-2 border-transparent px-2.5 py-1.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const activeClass = 'border-primary bg-primary text-primary-foreground hover:bg-primary';

export function DashboardShell({ children }: { children: ReactNode }) {
  const cache = useQueryClient(); const navigate = useNavigate(); const user = usePlayer();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function logout() {
    setBusy(true); await cache.cancelQueries(); cache.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setError(error.message); setBusy(false); return; }
    await navigate({ to: '/login', replace: true });
  }
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  return (
    <main className="bg-tiles min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 md:grid-cols-[176px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-2 self-start rounded-xl border border-surface-border bg-surface p-2.5 shadow-tile md:sticky md:top-4">
          <div className="flex items-center gap-2 border-b border-surface-border pb-2.5">
            <span className="font-display grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-base text-primary-foreground">{name[0]?.toUpperCase()}</span>
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in</p><p className="truncate text-sm font-bold">{name}</p></div>
          </div>
          <nav className="flex flex-wrap gap-1 md:flex-col">
            {nav.map(({ to, label, icon: Icon }) => <Link key={to} to={to} preload={false} reloadDocument className={navClass} activeProps={{ className: activeClass }}><Icon className="size-4" />{label}</Link>)}
          </nav>
          <button type="button" disabled={busy} onClick={logout} className={cn(navClass, 'border-t border-surface-border text-muted-foreground hover:text-foreground disabled:opacity-60 md:mt-1.5')}><LogOut className="size-4" />{busy ? 'Signing out…' : 'Sign out'}</button>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </aside>
        <section className="min-w-0 rounded-xl border border-surface-border bg-surface p-4 shadow-tile sm:p-5">{children}</section>
      </div>
    </main>
  );
}
