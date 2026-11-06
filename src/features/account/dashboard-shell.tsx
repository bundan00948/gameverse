import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Gamepad2, UserRound, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { usePlayer } from './session';
import { cn } from '@/lib/utils';

const navClass =
  'flex items-center gap-3 rounded-lg border-2 border-transparent px-4 py-3 text-lg font-bold transition-all hover:-translate-y-0.5 hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
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
  const name = (user?.user_metadata?.username as string | undefined) || user?.email?.split('@')[0] || 'Player';
  return (
    <main className="bg-tiles min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 self-start rounded-2xl border border-surface-border bg-surface p-4 shadow-tile backdrop-blur-md md:sticky md:top-6">
          <div className="flex items-center gap-3 border-b border-surface-border pb-4">
            <span className="font-display grid size-12 place-items-center rounded-xl bg-primary text-2xl text-primary-foreground">{name[0]?.toUpperCase()}</span>
            <div className="min-w-0"><p className="text-xs uppercase tracking-wider text-muted-foreground">Signed in as</p><p className="truncate text-lg font-bold">{name}</p></div>
          </div>
          <nav className="flex flex-wrap gap-2 md:flex-col">
            <Link to="/dashboard" preload={false} className={navClass} activeProps={{ className: activeClass }}><Gamepad2 className="size-5" />Games</Link>
            <Link to="/profile" preload={false} className={navClass} activeProps={{ className: activeClass }}><UserRound className="size-5" />Profile</Link>
          </nav>
          <button type="button" disabled={busy} onClick={logout} className={cn(navClass, 'border-t border-surface-border text-muted-foreground hover:text-foreground disabled:opacity-60 md:mt-4')}><LogOut className="size-5" />{busy ? 'Signing out…' : 'Sign out'}</button>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </aside>
        <section className="min-w-0 rounded-2xl border border-surface-border bg-surface p-6 shadow-tile backdrop-blur-md sm:p-8">{children}</section>
      </div>
    </main>
  );
}
