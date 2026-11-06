import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Gamepad2, BarChart3, History, Store, Backpack, Target, MessageCircle, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PlanetLogo } from '@/components/planet-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePlayer } from './session';
import { isAdminOptions } from '@/features/dashboard/data';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/dashboard', label: 'Games', icon: Gamepad2 },
  { to: '/history', label: 'History', icon: History },
  { to: '/shop', label: 'Market', icon: Store },
  { to: '/inventory', label: 'Inventory', icon: Backpack },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

const navClass =
  'group flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-bold text-muted-foreground transition-colors hover:bg-glass-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const activeClass = 'bg-primary !text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.3)] hover:bg-primary';

export function DashboardShell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const cache = useQueryClient(); const navigate = useNavigate(); const user = usePlayer(); const { data: isAdmin } = useQuery(isAdminOptions());
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function logout() {
    setBusy(true); await cache.cancelQueries(); cache.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setError(error.message); setBusy(false); return; }
    await navigate({ to: '/login', replace: true });
  }
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  return (
    <main className="bg-tiles min-h-screen md:pl-52">
      <aside className="z-20 flex flex-col border-b border-surface-border bg-surface md:fixed md:inset-y-0 md:left-0 md:w-52 md:border-b-0 md:border-r">
        <Link to="/" reloadDocument className="flex items-center gap-2 px-4 py-4 font-display text-2xl tracking-wide">
          <PlanetLogo className="size-8" />GameVerse
        </Link>
        <nav className="flex flex-wrap gap-1 px-2 pb-2 md:flex-1 md:flex-col md:flex-nowrap md:overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} preload={false} reloadDocument className={navClass} activeProps={{ className: activeClass }}>
              <Icon className="size-5 shrink-0" />{label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" preload={false} reloadDocument className={cn(navClass, 'text-tile-d')} activeProps={{ className: activeClass }}><ShieldCheck className="size-5 shrink-0" />Admin Panel</Link>}
        </nav>
        <div className="hidden items-center gap-2 border-t border-surface-border p-3 md:flex">
          <span className="font-display grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-lg text-primary-foreground">{name[0]?.toUpperCase()}</span>
          <p className="min-w-0 flex-1 truncate text-sm font-bold">{name}</p>
          <ThemeToggle />
        </div>
        <button type="button" disabled={busy} onClick={logout} className={cn(navClass, 'mx-2 mb-3 hover:text-destructive disabled:opacity-60')}>
          <LogOut className="size-5" />{busy ? 'Signing out…' : 'Sign out'}
        </button>
        {error && <p role="alert" className="px-3 pb-2 text-xs text-destructive">{error}</p>}
      </aside>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">{bare ? children : <section className="rounded-xl border border-surface-border bg-surface p-5 shadow-tile">{children}</section>}</div>
    </main>
  );
}
